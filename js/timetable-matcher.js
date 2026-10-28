/**
 * js/timetable-matcher.js - Module So Khớp Thời Khóa Biểu Cùng Bạn Bè (Najimez Timetable Matcher)
 * Tự động phân tích lịch biểu 2 bên, tìm khung giờ rảnh chung và lên lịch hẹn học tập/gặp gỡ.
 * Tuân thủ quy chuẩn Code Modularization (< 500 dòng).
 */

const TT_MATCHER_START_MIN = 420; // 07:00 sáng
const TT_MATCHER_END_MIN = 1320;  // 22:00 tối

let matcherCurrentFriend = null;
let matcherFriendEvents = [];
let matcherSelectedDate = new Date();
let matcherMode = 'day'; // 'day' | 'week'
let matcherCachedFriendsMap = {};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/**
 * Tạo dữ liệu lịch học/sinh hoạt mẫu cho Bạn Học (Demo Mode)
 */
function generateDemoFriendSchedule() {
  const today = new Date();
  const monday = typeof getMondayOfWeek === 'function' ? getMondayOfWeek(today) : new Date(today);
  const events = [];
  const add = (offset, title, time, endTime, cat, color) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    const dateStr = typeof getFormattedDateKey === 'function' ? getFormattedDateKey(d) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    events.push({ id: 'demo_' + Math.random().toString(36).substr(2, 7), title, date: dateStr, time, endTime, category: cat, color: color || '#38bdf8' });
  };
  add(0, 'Học Giải Tích 2', '07:30', '10:30', 'Học tập', '#38bdf8');
  add(1, 'Thực hành Tin học', '13:30', '16:30', 'Thực hành', '#06b6d4');
  add(2, 'Triết học Mác-Lênin', '08:00', '11:00', 'Học tập', '#38bdf8');
  add(2, 'Tiếng Anh Giao Tiếp', '18:00', '19:30', 'Ngoại ngữ', '#ec4899');
  add(3, 'Cấu Trúc Dữ Liệu', '08:30', '11:30', 'Học tập', '#6366f1');
  add(4, 'Xác Suất Thống Kê', '09:00', '11:30', 'Học tập', '#38bdf8');
  add(4, 'Thể Dục / Thể Thao', '15:00', '17:00', 'Sức khỏe', '#10b981');
  add(5, 'Họp Nhóm Đồ Án', '14:00', '16:30', 'Đồ án', '#f59e0b');
  return events;
}

/**
 * Đẩy thời khóa biểu của chính mình lên Firestore để bạn bè có thể so khớp
 */
async function publishMyTimetableForFriends() {
  const user = typeof getActiveSocialUser === 'function' ? getActiveSocialUser() : null;
  const db = typeof getFirestoreDb === 'function' ? getFirestoreDb() : null;
  if (!user || !user.uid || !db) return false;

  try {
    const data = typeof getLedgerData === 'function' ? getLedgerData() : {};
    const events = (Array.isArray(data.calendarEvents) ? data.calendarEvents : []).map(ev => ({
      id: ev.id, title: ev.title, date: ev.date,
      time: ev.time || ev.startTime || '', endTime: ev.endTime || '',
      category: ev.category || 'Chung', repeat: ev.repeat || 'none',
      repeatInterval: ev.repeatInterval || 1, repeatUnit: ev.repeatUnit || '',
      daysOfWeek: ev.daysOfWeek || null, color: ev.color || '#a855f7'
    }));

    await db.collection('shared_timetables').doc(user.uid).set({
      uid: user.uid, displayName: user.displayName, photoURL: user.photoURL,
      events, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[TimetableMatcher] Không thể đẩy shared_timetables:', err);
    return false;
  }
}

/**
 * Tải thời khóa biểu bạn bè từ Firestore
 */
async function fetchFriendTimetable(friendUid) {
  if (!friendUid || friendUid === 'demo_friend') return generateDemoFriendSchedule();
  const db = typeof getFirestoreDb === 'function' ? getFirestoreDb() : null;
  if (!db) return generateDemoFriendSchedule();

  try {
    const docSnap = await db.collection('shared_timetables').doc(friendUid).get();
    if (docSnap.exists && Array.isArray(docSnap.data().events)) {
      return docSnap.data().events;
    }
  } catch (err) {
    console.warn('[TimetableMatcher] Lỗi tải TKB bạn bè:', err);
  }
  return generateDemoFriendSchedule();
}

/**
 * Hợp nhất các khoảng thời gian bận chồng chéo
 */
function mergeIntervals(intervals) {
  if (!intervals || !intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [{ start: sorted[0].start, end: sorted[0].end }];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end) {
      last.end = Math.max(last.end, sorted[i].end);
    } else {
      merged.push({ start: sorted[i].start, end: sorted[i].end });
    }
  }
  return merged;
}

function eventsToIntervals(events) {
  return (events || []).filter(e => e.time || e.startTime).map(e => {
    const s = timeStrToMinutes(e.time || e.startTime) || 0;
    let end = e.endTime ? (timeStrToMinutes(e.endTime) || (s + 60)) : (s + 60);
    if (end <= s) end = s + 60;
    return { start: s, end, title: e.title, event: e };
  });
}

/**
 * So sánh lịch trình 1 ngày và tìm các khoảng rảnh chung
 */
function computeDayComparison(myEvents, friendEvents, dateKey) {
  const checkOccur = typeof isEventOccurringOnDate === 'function' ? isEventOccurringOnDate : ((ev, d) => ev.date === d);
  const dayMyEvents = (myEvents || []).filter(e => checkOccur(e, dateKey));
  const dayFriendEvents = (friendEvents || []).filter(e => checkOccur(e, dateKey));

  const myIntervals = eventsToIntervals(dayMyEvents);
  const friendIntervals = eventsToIntervals(dayFriendEvents);
  const combinedBusy = mergeIntervals([...myIntervals, ...friendIntervals]);

  const freeSlots = [];
  let cur = TT_MATCHER_START_MIN;

  combinedBusy.forEach(busy => {
    const bStart = Math.max(TT_MATCHER_START_MIN, Math.min(TT_MATCHER_END_MIN, busy.start));
    const bEnd = Math.max(TT_MATCHER_START_MIN, Math.min(TT_MATCHER_END_MIN, busy.end));
    if (bStart > cur && (bStart - cur) >= 30) {
      freeSlots.push({ start: cur, end: bStart, duration: bStart - cur, isGolden: (bStart - cur) >= 150 });
    }
    cur = Math.max(cur, bEnd);
  });

  if (cur < TT_MATCHER_END_MIN && (TT_MATCHER_END_MIN - cur) >= 30) {
    freeSlots.push({ start: cur, end: TT_MATCHER_END_MIN, duration: TT_MATCHER_END_MIN - cur, isGolden: (TT_MATCHER_END_MIN - cur) >= 150 });
  }

  const totalFreeMins = freeSlots.reduce((acc, s) => acc + s.duration, 0);
  return { dateKey, dayMyEvents, dayFriendEvents, myIntervals, friendIntervals, freeSlots, totalFreeMins };
}

/**
 * Lời khuyên phân tích từ Trợ Lý Najimez
 */
function generateNajimezAdvice(dayComparison, friendName) {
  const slots = dayComparison.freeSlots;
  const name = friendName || 'bạn bè';

  if (!slots || slots.length === 0) {
    return `Hôm nay lịch trình của bạn và <strong>${escapeHtml(name)}</strong> khá kín, chưa có khoảng trống chung phù hợp. Hãy kiểm tra ngày mai hoặc chuyển sang tab "Tổng Quan Cả Tuần" nhé! 🌸`;
  }
  const golden = slots.find(s => s.isGolden);
  const hours = (dayComparison.totalFreeMins / 60).toFixed(1).replace('.0', '');
  if (golden) {
    return `Tuyệt vời! Hôm nay hai bạn có <strong>${slots.length} khung giờ rảnh chung</strong> (tổng ${hours} tiếng). Nổi bật nhất là <strong>${minutesToTimeStr(golden.start)} – ${minutesToTimeStr(golden.end)}</strong>. Najimez gợi ý lên lịch cùng học bài hoặc cà phê nè! ✨`;
  }
  const first = slots[0];
  return `Hai bạn có <strong>${slots.length} khung giờ rảnh chung</strong> vào hôm nay (tổng ${hours} giờ). Khoảng thời gian từ <strong>${minutesToTimeStr(first.start)} đến ${minutesToTimeStr(first.end)}</strong> rất thích hợp để trò chuyện hoặc hẹn gặp! 🌸`;
}

/**
 * Mở Modal So Khớp Thời Khóa Biểu
 */
async function openTimetableMatcherModal(friendUid = null, friendName = '') {
  const modal = document.getElementById('timetableMatcherModal');
  if (!modal) return;

  publishMyTimetableForFriends();
  const select = document.getElementById('ttMatcherFriendSelect');
  const friends = typeof getActiveFriendsList === 'function' ? getActiveFriendsList() : [];
  matcherCachedFriendsMap = {};

  let optionsHtml = `<option value="demo_friend">✨ Bạn Cùng Tiến (Lịch Mẫu)</option>`;
  friends.forEach(f => {
    matcherCachedFriendsMap[f.uid] = f;
    const isSelected = (friendUid && f.uid === friendUid) || (!friendUid && f.displayName === friendName);
    optionsHtml += `<option value="${f.uid}" ${isSelected ? 'selected' : ''}>👤 ${escapeHtml(f.displayName)} (${escapeHtml(f.friendCode || 'ID')})</option>`;
  });

  if (select) {
    select.innerHTML = optionsHtml;
    if (friendUid && matcherCachedFriendsMap[friendUid]) {
      select.value = friendUid;
      matcherCurrentFriend = matcherCachedFriendsMap[friendUid];
    } else if (friends.length > 0 && !friendUid) {
      matcherCurrentFriend = friends[0];
      select.value = friends[0].uid;
    } else {
      matcherCurrentFriend = { uid: 'demo_friend', displayName: friendName || 'Bạn Cùng Tiến' };
      select.value = 'demo_friend';
    }
  }

  await loadFriendTimetableData(select ? select.value : 'demo_friend');
  initMatcherEventListeners();
  modal.classList.add('active');
  renderMatcherUI();
}

async function loadFriendTimetableData(friendUid) {
  const aiText = document.getElementById('ttMatcherAiText');
  if (aiText) aiText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang so khớp thời khóa biểu cùng bạn bè...';

  matcherFriendEvents = await fetchFriendTimetable(friendUid);
  if (friendUid !== 'demo_friend' && matcherCachedFriendsMap[friendUid]) {
    matcherCurrentFriend = matcherCachedFriendsMap[friendUid];
  } else {
    matcherCurrentFriend = { uid: 'demo_friend', displayName: 'Bạn Cùng Tiến' };
  }
}

function initMatcherEventListeners() {
  const btnClose = document.getElementById('btnCloseTimetableMatcherModal');
  const modal = document.getElementById('timetableMatcherModal');
  if (btnClose && modal) btnClose.onclick = () => modal.classList.remove('active');

  const select = document.getElementById('ttMatcherFriendSelect');
  if (select) {
    select.onchange = async () => {
      await loadFriendTimetableData(select.value);
      renderMatcherUI();
    };
  }

  const btnDay = document.getElementById('btnTtMatchModeDay');
  const btnWeek = document.getElementById('btnTtMatchModeWeek');
  if (btnDay && btnWeek) {
    btnDay.onclick = () => {
      matcherMode = 'day';
      btnDay.classList.add('active');
      btnWeek.classList.remove('active');
      const nav = document.getElementById('ttMatcherDateNav');
      if (nav) nav.style.display = 'flex';
      renderMatcherUI();
    };
    btnWeek.onclick = () => {
      matcherMode = 'week';
      btnWeek.classList.add('active');
      btnDay.classList.remove('active');
      const nav = document.getElementById('ttMatcherDateNav');
      if (nav) nav.style.display = 'none';
      renderMatcherUI();
    };
  }

  const btnPrev = document.getElementById('btnTtMatchPrevDate');
  const btnNext = document.getElementById('btnTtMatchNextDate');
  const btnToday = document.getElementById('btnTtMatchToday');
  if (btnPrev) btnPrev.onclick = () => { matcherSelectedDate.setDate(matcherSelectedDate.getDate() - 1); renderMatcherUI(); };
  if (btnNext) btnNext.onclick = () => { matcherSelectedDate.setDate(matcherSelectedDate.getDate() + 1); renderMatcherUI(); };
  if (btnToday) btnToday.onclick = () => { matcherSelectedDate = new Date(); renderMatcherUI(); };
}

function renderMatcherUI() {
  const container = document.getElementById('ttMatcherDynamicContent');
  const dateDisplay = document.getElementById('ttMatcherDateDisplay');
  const aiText = document.getElementById('ttMatcherAiText');
  if (!container) return;

  const myData = typeof getLedgerData === 'function' ? getLedgerData() : {};
  const myEvents = Array.isArray(myData.calendarEvents) ? myData.calendarEvents : [];
  const friendName = matcherCurrentFriend ? matcherCurrentFriend.displayName : 'Bạn bè';
  const dateKey = typeof getFormattedDateKey === 'function' ? getFormattedDateKey(matcherSelectedDate) : `${matcherSelectedDate.getFullYear()}-${String(matcherSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(matcherSelectedDate.getDate()).padStart(2, '0')}`;

  if (dateDisplay) {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    dateDisplay.textContent = `${dayNames[matcherSelectedDate.getDay()]}, ${matcherSelectedDate.getDate()}/${matcherSelectedDate.getMonth() + 1}`;
  }

  if (matcherMode === 'day') {
    const dayComp = computeDayComparison(myEvents, matcherFriendEvents, dateKey);
    if (aiText) aiText.innerHTML = generateNajimezAdvice(dayComp, friendName);
    container.innerHTML = renderDayComparisonHTML(dayComp, friendName);
  } else {
    const weekDays = typeof getWeekDays === 'function' ? getWeekDays(matcherSelectedDate) : [];
    let totalWeekFree = 0;
    const daysSummary = weekDays.map(day => {
      const comp = computeDayComparison(myEvents, matcherFriendEvents, day.dateKey);
      totalWeekFree += comp.totalFreeMins;
      return { day, comp };
    });
    const totalHours = (totalWeekFree / 60).toFixed(1).replace('.0', '');
    if (aiText) {
      aiText.innerHTML = `Trong tuần này, bạn và <strong>${escapeHtml(friendName)}</strong> có tổng cộng <strong>${totalHours} giờ rảnh chung</strong>! Nhấn vào bất kỳ ngày nào bên dưới để xem timeline chi tiết và lên lịch hẹn nhé! 🌸`;
    }
    container.innerHTML = renderWeekOverviewHTML(daysSummary, friendName);
  }
}

function renderDayComparisonHTML(comp, friendName) {
  const dateKey = comp.dateKey;
  let slotsHtml = '';

  if (comp.freeSlots.length > 0) {
    slotsHtml = `
      <div class="tt-free-slots-section">
        <div class="tt-free-slots-header">
          <div class="tt-free-slots-title"><i class="fa-solid fa-sparkles"></i> <span>Khung Giờ Rảnh Cả Hai Đều Trống (${comp.freeSlots.length})</span></div>
          <span class="tt-free-slots-count">${(comp.totalFreeMins / 60).toFixed(1)} giờ rảnh</span>
        </div>
        <div class="tt-free-slots-grid">
          ${comp.freeSlots.map(slot => {
            const sTime = minutesToTimeStr(slot.start), eTime = minutesToTimeStr(slot.end);
            const durHours = (slot.duration / 60).toFixed(1).replace('.0', '');
            const badge = slot.isGolden ? '🌟 Giờ vàng học tập' : (slot.duration >= 90 ? '☕ Thích hợp cà phê' : '⚡ Rảnh ngắn');
            return `
              <div class="tt-free-slot-card">
                <div class="tt-slot-info">
                  <span class="tt-slot-time"><i class="fa-regular fa-clock"></i> ${sTime} – ${eTime}</span>
                  <span class="tt-slot-badge ${slot.isGolden ? 'golden' : ''}">${badge} (${durHours}h)</span>
                </div>
                <button type="button" class="btn-book-slot" onclick="bookAppointmentFromSlot('${dateKey}', '${sTime}', '${eTime}')">
                  <i class="fa-solid fa-calendar-plus"></i> Lên Lịch Hẹn
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    slotsHtml = `<div class="tt-slots-empty"><i class="fa-regular fa-calendar-xmark" style="font-size: 1.4rem; color: #f59e0b; margin-bottom: 6px;"></i><div>Không có khoảng rảnh chung nào trong khung giờ 07:00 – 22:00 của ngày này.</div></div>`;
  }

  const pxPerMin = 1.0;
  const myBlocks = comp.myIntervals.map(ev => {
    const top = Math.max(0, ev.start - TT_MATCHER_START_MIN) * pxPerMin, height = Math.max(26, (ev.end - ev.start) * pxPerMin);
    return `<div class="tt-event-block my-event" style="top: ${top}px; height: ${height}px;" title="${escapeHtml(ev.title)}"><div class="tt-ev-title">${escapeHtml(ev.title)}</div><div class="tt-ev-time">${minutesToTimeStr(ev.start)} – ${minutesToTimeStr(ev.end)}</div></div>`;
  }).join('');

  const friendBlocks = comp.friendIntervals.map(ev => {
    const top = Math.max(0, ev.start - TT_MATCHER_START_MIN) * pxPerMin, height = Math.max(26, (ev.end - ev.start) * pxPerMin);
    return `<div class="tt-event-block friend-event" style="top: ${top}px; height: ${height}px;" title="${escapeHtml(ev.title)}"><div class="tt-ev-title">${escapeHtml(ev.title)}</div><div class="tt-ev-time">${minutesToTimeStr(ev.start)} – ${minutesToTimeStr(ev.end)}</div></div>`;
  }).join('');

  const ribbons = comp.freeSlots.map(s => {
    const top = Math.max(0, s.start - TT_MATCHER_START_MIN) * pxPerMin, height = s.duration * pxPerMin;
    return `<div class="tt-mutual-free-ribbon" style="top: ${top}px; height: ${height}px;"><span class="tt-free-ribbon-tag">🌸 Rảnh chung (${minutesToTimeStr(s.start)} - ${minutesToTimeStr(s.end)})</span></div>`;
  }).join('');

  let ruler = '', lines = '';
  for (let h = 7; h <= 22; h++) {
    const top = (h * 60 - TT_MATCHER_START_MIN) * pxPerMin;
    ruler += `<div class="tt-ruler-hour" style="top: ${top}px;">${String(h).padStart(2, '0')}:00</div>`;
    lines += `<div class="tt-canvas-grid-line" style="top: ${top}px;"></div>`;
  }

  const timelineHtml = `
    <div class="tt-day-parallel-wrapper">
      <div class="tt-parallel-header">
        <div class="tt-col-title"><i class="fa-regular fa-clock"></i> Giờ</div>
        <div class="tt-col-title my-col"><i class="fa-solid fa-user"></i> Lịch Của Bạn</div>
        <div class="tt-col-title friend-col"><i class="fa-solid fa-user-group"></i> Lịch Của ${escapeHtml(friendName)}</div>
      </div>
      <div class="tt-parallel-canvas">
        <div class="tt-canvas-inner">
          <div class="tt-canvas-ruler">${ruler}</div>
          <div class="tt-canvas-grid-lines">${lines}</div>
          ${ribbons}
          <div class="tt-canvas-lane">${myBlocks}</div>
          <div class="tt-canvas-lane">${friendBlocks}</div>
        </div>
      </div>
    </div>
  `;
  return slotsHtml + timelineHtml;
}

function renderWeekOverviewHTML(daysSummary, friendName) {
  return `
    <div class="tt-week-overview-grid">
      ${daysSummary.map(({ day, comp }) => {
        const freeH = (comp.totalFreeMins / 60).toFixed(1).replace('.0', '');
        const hasFree = comp.freeSlots.length > 0;
        return `
          <div class="tt-week-day-card ${hasFree ? 'has-free' : ''} ${day.isToday ? 'today' : ''}" onclick="selectMatcherDay('${day.dateKey}')">
            <div class="tt-wd-header">
              <span class="tt-wd-day-name">${day.dayName}</span>
              <span class="tt-wd-date">${day.dayNum}/${day.monthNum}</span>
            </div>
            <div class="tt-wd-hours">
              <i class="fa-solid ${hasFree ? 'fa-sparkles' : 'fa-circle-xmark'}" style="color: ${hasFree ? '#34d399' : '#94a3b8'};"></i>
              <span>${hasFree ? `${freeH}h rảnh chung` : 'Bận cả ngày'}</span>
            </div>
            <div class="tt-wd-slots-list">
              ${comp.freeSlots.slice(0, 3).map(s => `
                <div class="tt-wd-slot-pill">${minutesToTimeStr(s.start)} - ${minutesToTimeStr(s.end)} (${(s.duration / 60).toFixed(1)}h)</div>
              `).join('')}
              ${comp.freeSlots.length > 3 ? `<div class="tt-wd-slot-pill">+${comp.freeSlots.length - 3} khung nữa...</div>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function selectMatcherDay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  matcherSelectedDate = new Date(y, m - 1, d);
  const btnDay = document.getElementById('btnTtMatchModeDay');
  if (btnDay) btnDay.click();
}

function bookAppointmentFromSlot(dateKey, startTime, endTime) {
  const friendName = matcherCurrentFriend ? matcherCurrentFriend.displayName : 'Bạn bè';
  const modal = document.getElementById('timetableMatcherModal');
  if (modal) modal.classList.remove('active');

  if (typeof openCalendarEventModal === 'function') {
    openCalendarEventModal(dateKey, null, startTime, endTime);
    setTimeout(() => {
      const titleInput = document.getElementById('calEventTitleInput');
      if (titleInput) {
        titleInput.value = `Hẹn cùng ${friendName}: Học tập / Gặp gỡ 🌸`;
        titleInput.focus();
      }
      const catSelect = document.getElementById('calEventCategorySelect');
      if (catSelect) catSelect.value = 'Học tập';
    }, 150);
  }
}

function initTimetableMatcherButton() {
  const btnHeader = document.getElementById('btnTtOpenMatcher');
  if (btnHeader) {
    btnHeader.onclick = () => openTimetableMatcherModal();
  }
}

document.addEventListener('DOMContentLoaded', initTimetableMatcherButton);

// Xuất các hàm ra phạm vi toàn cục
window.openTimetableMatcherModal = openTimetableMatcherModal;
window.bookAppointmentFromSlot = bookAppointmentFromSlot;
window.selectMatcherDay = selectMatcherDay;
window.publishMyTimetableForFriends = publishMyTimetableForFriends;
