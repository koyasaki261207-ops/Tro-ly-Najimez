/**
 * js/timetable.js - Quản lý Phân Hệ Thời Khóa Biểu & Lịch Trình Tuần 1 Màn Hình (Fit-Screen)
 * Phương án 2: Hiển thị trọn vẹn trong 1 khung hình, thu gọn khung giờ ngủ (00:00 - 06:00).
 */

let timetableSelectedDate = new Date();
let timetableRealtimeTimer = null;
// Thiết lập mặc định chế độ 24 giờ vừa khít 1 màn hình theo yêu cầu người dùng
if (localStorage.getItem('najimez_tt_default_24h') !== '2') {
  localStorage.setItem('najimez_tt_default_24h', '2');
  localStorage.setItem('najimez_tt_night_collapsed', '0');
  localStorage.setItem('najimez_tt_scroll_mode', '0');
}

let timetableNightCollapsed = localStorage.getItem('najimez_tt_night_collapsed') === '1'; // Mặc định false = 24 giờ đầy đủ
let timetableScrollMode = localStorage.getItem('najimez_tt_scroll_mode') === '1'; // Mặc định false = 1 Màn Hình (Fit-screen)

/**
 * Tìm ngày Thứ Hai của tuần chứa ngày d (chuẩn ISO / Việt Nam)
 */
function getMondayOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 là Chủ Nhật, 1 là Thứ Hai
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Trả về danh sách 7 ngày trong tuần từ Thứ Hai đến Chủ Nhật
 */
function getWeekDays(refDate) {
  const monday = getMondayOfWeek(refDate);
  const todayKey = typeof getFormattedDateKey === 'function' 
    ? getFormattedDateKey(new Date()) 
    : '';

  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const shortNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const days = [];

  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const dateKey = typeof getFormattedDateKey === 'function'
      ? getFormattedDateKey(dt)
      : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

    days.push({
      date: dt,
      dateKey,
      dayNum: dt.getDate(),
      monthNum: dt.getMonth() + 1,
      yearNum: dt.getFullYear(),
      dayOfWeek: dt.getDay(),
      dayName: dayNames[dt.getDay()],
      shortName: shortNames[dt.getDay()],
      isToday: dateKey === todayKey,
      isWeekend: dt.getDay() === 0 || dt.getDay() === 6
    });
  }
  return days;
}

/**
 * Chuyển chuỗi thời gian 'HH:mm' thành số phút từ đầu ngày (0 - 1440)
 */
function timeStrToMinutes(str) {
  if (!str || typeof str !== 'string') return null;
  const parts = str.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
}

/**
 * Chuyển số phút thành chuỗi 'HH:mm'
 */
function minutesToTimeStr(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Thuật toán sắp xếp sự kiện chồng chéo (Overlapping Events)
 * Chia các sự kiện giao nhau thành các cột phụ song song để không che khuất nhau
 */
function layoutDayTimedEvents(events) {
  if (!events || !events.length) return [];

  // Sắp xếp: giờ bắt đầu tăng dần, thời lượng giảm dần
  const sorted = [...events].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return (b.endMin - b.startMin) - (a.endMin - a.startMin);
  });

  const columns = [];
  sorted.forEach(ev => {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const lastInCol = columns[i][columns[i].length - 1];
      if (lastInCol.endMin <= ev.startMin) {
        columns[i].push(ev);
        ev.colIndex = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      ev.colIndex = columns.length;
      columns.push([ev]);
    }
  });

  sorted.forEach(ev => {
    const overlapping = sorted.filter(other => (
      ev.startMin < other.endMin && ev.endMin > other.startMin
    ));
    const maxCol = Math.max(...overlapping.map(o => o.colIndex));
    ev.totalCols = Math.max(overlapping.length, maxCol + 1);
  });

  return sorted;
}

/**
 * Render toàn bộ tab Thời Khóa Biểu (Vừa khít 1 khung hình)
 */
function renderTimetableTab() {
  const weekDays = getWeekDays(timetableSelectedDate);
  const monday = weekDays[0];
  const sunday = weekDays[6];

  // 1. Cập nhật tiêu đề tuần & tháng
  const titleEl = document.getElementById('ttWeekTitle');
  const monthYearEl = document.getElementById('ttMonthYear');
  const eventsCountEl = document.getElementById('ttWeekEventsCount');
  const toggleBtnText = document.getElementById('ttToggleNightText');
  const toggleBtn = document.getElementById('btnTtToggleNight');

  if (titleEl) {
    titleEl.textContent = `Tuần: ${monday.dayNum}/${monday.monthNum} – ${sunday.dayNum}/${sunday.monthNum}/${sunday.yearNum}`;
  }
  if (monthYearEl) {
    if (monday.monthNum === sunday.monthNum) {
      monthYearEl.textContent = `Tháng ${monday.monthNum}, ${sunday.yearNum}`;
    } else {
      monthYearEl.textContent = `Tháng ${monday.monthNum} – Tháng ${sunday.monthNum}, ${sunday.yearNum}`;
    }
  }

  if (toggleBtnText && toggleBtn) {
    if (timetableNightCollapsed) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-moon" style="color: #c084fc;"></i> <span id="ttToggleNightText">6h – 24h (Gọn)</span>';
      toggleBtn.title = 'Đang thu gọn ban đêm (6h - 24h). Bấm để xem đầy đủ 24 giờ';
    } else {
      toggleBtn.innerHTML = '<i class="fa-solid fa-sun" style="color: #fbbf24;"></i> <span id="ttToggleNightText">0h – 24h (Đầy đủ)</span>';
      toggleBtn.title = 'Đang hiển thị đủ 24 giờ. Bấm để thu gọn ban đêm vừa vặn 1 màn hình';
    }
  }

  // Cập nhật trạng thái nút chuyển chế độ xem 1 màn hình / cuộn thoải mái
  const toggleViewBtn = document.getElementById('btnTtToggleViewMode');
  if (toggleViewBtn) {
    if (timetableScrollMode) {
      toggleViewBtn.innerHTML = '<i class="fa-solid fa-arrows-up-down" style="color: #38bdf8;"></i> <span id="ttToggleViewModeText">Cuộn Thoải Mái</span>';
      toggleViewBtn.title = 'Đang ở chế độ Cuộn Thoải Mái (56px/giờ). Bấm để chuyển về Vừa Khít 1 Màn Hình';
    } else {
      toggleViewBtn.innerHTML = '<i class="fa-solid fa-table-cells" style="color: #a855f7;"></i> <span id="ttToggleViewModeText">1 Màn Hình</span>';
      toggleViewBtn.title = 'Đang ở chế độ Vừa Khít 1 Màn Hình (100% không cuộn bên trong). Bấm để chuyển sang Cuộn Thoải Mái';
    }
  }

  const gridCard = document.querySelector('.timetable-grid-card');
  if (gridCard) {
    gridCard.classList.toggle('mode-scroll', timetableScrollMode);
    gridCard.style.setProperty('--tt-active-hours', timetableNightCollapsed ? 18 : 24);
    gridCard.style.setProperty('--tt-slot-height', '52px');
  }

  // 2. Lấy dữ liệu sự kiện từ Storage
  const curData = typeof getLedgerData === 'function' ? getLedgerData() : {};
  const allEvents = Array.isArray(curData.calendarEvents) ? curData.calendarEvents : [];

  let totalWeekEvents = 0;
  const dayEventsMap = {};
  const alldayEventsMap = {};
  const nightEventsMap = {};

  const baseMinutes = timetableNightCollapsed ? 360 : 0; // 06:00 = 360 phút
  const totalActiveMinutes = timetableNightCollapsed ? 1080 : 1440; // 18 tiếng = 1080 phút hoặc 24 tiếng = 1440 phút

  weekDays.forEach(day => {
    // Lọc sự kiện diễn ra vào ngày này
    const occurrences = allEvents.filter(ev => {
      if (typeof isEventOccurringOnDate === 'function') {
        return isEventOccurringOnDate(ev, day.dateKey);
      }
      return ev.date === day.dateKey;
    });

    totalWeekEvents += occurrences.length;

    const allday = [];
    const daytime = [];
    const night = [];

    occurrences.forEach(ev => {
      const t = ev.startTime || ev.time || '';
      if (!t) {
        allday.push(ev);
      } else {
        const startMin = timeStrToMinutes(t) || 0;
        let endMin = ev.endTime ? timeStrToMinutes(ev.endTime) : null;
        if (endMin === null || endMin <= startMin) {
          endMin = Math.min(1440, startMin + 60); // Mặc định 1 tiếng nếu không có giờ kết thúc
        }
        if (endMin - startMin < 25) {
          endMin = Math.min(1440, startMin + 25);
        }

        const evObj = {
          ...ev,
          startMin,
          endMin,
          color: ev.color || '#a855f7'
        };

        if (timetableNightCollapsed) {
          // Khung giờ đêm: 00:00 - 06:00 (0 - 360 phút)
          if (startMin < 360) {
            night.push(evObj);
          }
          // Nếu sự kiện kéo dài qua hoặc diễn ra trong ban ngày (endMin > 360)
          if (endMin > 360) {
            daytime.push(evObj);
          }
        } else {
          daytime.push(evObj);
        }
      }
    });

    alldayEventsMap[day.dateKey] = allday;
    nightEventsMap[day.dateKey] = night;
    dayEventsMap[day.dateKey] = layoutDayTimedEvents(daytime);
  });

  if (eventsCountEl) {
    eventsCountEl.textContent = `${totalWeekEvents} sự kiện tuần này`;
  }

  // 3. Render hàng tiêu đề 7 cột ngày
  const colHeadersContainer = document.getElementById('ttColHeaders');
  if (colHeadersContainer) {
    let headersHtml = `
      <div class="tt-time-corner">
        <i class="fa-regular fa-clock"></i>
        <span>${timetableNightCollapsed ? '18 Giờ' : '24 Giờ'}</span>
      </div>
    `;

    weekDays.forEach(day => {
      let lunarStr = '';
      if (typeof convertSolar2Lunar === 'function') {
        const lunar = convertSolar2Lunar(day.dayNum, day.monthNum, day.yearNum);
        if (lunar) lunarStr = `${lunar.day}/${lunar.month} ÂL`;
      }

      headersHtml += `
        <div class="tt-col-header-cell ${day.isWeekend ? 'weekend' : ''} ${day.isToday ? 'is-today' : ''}" data-date="${day.dateKey}">
          <div class="tt-col-header-top">
            <span class="tt-day-name">${day.shortName}</span>
            ${day.isToday ? `<span class="tt-today-pill">Hôm nay</span>` : ''}
          </div>
          <div class="tt-day-date-wrap">
            <span class="tt-day-number">${day.dayNum}</span>
            ${lunarStr ? `<span class="tt-day-lunar">${lunarStr}</span>` : ''}
          </div>
        </div>
      `;
    });

    colHeadersContainer.innerHTML = headersHtml;

    const timeCorner = colHeadersContainer.querySelector('.tt-time-corner');
    if (timeCorner) {
      timeCorner.title = 'Bấm để cuộn lên trên cùng / Timeline Ngày';
      timeCorner.addEventListener('click', () => {
        const layout = document.querySelector('.timetable-workspace-layout');
        if (layout) layout.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    colHeadersContainer.querySelectorAll('.tt-col-header-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const dKey = cell.dataset.date;
        if (dKey && typeof setTimelineActiveDateKey === 'function') {
          setTimelineActiveDateKey(dKey);
        }
      });
    });
  }

  // 4. Render hàng sự kiện Cả Ngày (All-Day Row) nếu có
  const allDayRowEl = document.getElementById('ttAllDayRow');
  const allDayColsEl = document.getElementById('ttAllDayCols');
  const hasAnyAllDay = weekDays.some(d => (alldayEventsMap[d.dateKey] || []).length > 0);

  if (allDayRowEl) {
    if (hasAnyAllDay) {
      allDayRowEl.style.display = 'grid';
      if (allDayColsEl) {
        allDayColsEl.innerHTML = weekDays.map(day => {
          const list = alldayEventsMap[day.dateKey] || [];
          return `
            <div class="tt-allday-cell" data-date="${day.dateKey}">
              ${list.map(ev => {
                const theme = (typeof getSmartEventTheme === 'function') ? getSmartEventTheme(ev) : { color: ev.color || '#a855f7' };
                return `
                  <div class="tt-allday-pill" style="background: ${theme.color};" data-id="${ev.id}" title="${escapeHTML(ev.title)}">
                    ${theme.icon ? `<i class="${theme.icon}"></i> ` : ''}${escapeHTML(ev.title)}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('');

        allDayColsEl.querySelectorAll('.tt-allday-pill').forEach(pill => {
          pill.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = pill.dataset.id;
            const ev = allEvents.find(x => x.id === id);
            if (ev && typeof openCalendarEventModal === 'function') {
              openCalendarEventModal(ev.date, ev);
            }
          });
        });
      }
    } else {
      allDayRowEl.style.display = 'none';
    }
  }

  // 5. Render Hàng Thu Gọn Ban Đêm (00:00 - 06:00)
  const nightStripRow = document.getElementById('ttNightStripRow');
  const nightColsEl = document.getElementById('ttNightCols');

  if (nightStripRow) {
    if (timetableNightCollapsed) {
      nightStripRow.style.display = 'grid';
      if (nightColsEl) {
        nightColsEl.innerHTML = weekDays.map(day => {
          const nightList = nightEventsMap[day.dateKey] || [];
          const now = new Date();
          const isToday = day.isToday;
          const isCurrentNight = isToday && (now.getHours() < 6);

          return `
            <div class="tt-night-cell" data-date="${day.dateKey}" title="Khung giờ 00:00 - 06:00">
              ${isCurrentNight ? `
                <span class="tt-night-event-capsule" style="background: #f43f5e; box-shadow: 0 0 8px #f43f5e;">
                  <i class="fa-regular fa-clock"></i> ${minutesToTimeStr(now.getHours() * 60 + now.getMinutes())}
                </span>
              ` : ''}
              ${nightList.map(ev => {
                const theme = (typeof getSmartEventTheme === 'function') ? getSmartEventTheme(ev) : { color: ev.color || '#a855f7' };
                return `
                  <span class="tt-night-event-capsule" style="background: ${theme.color}; box-shadow: 0 0 8px ${theme.color}66;" data-id="${ev.id}" title="${escapeHTML(ev.title)} (${minutesToTimeStr(ev.startMin)} - ${minutesToTimeStr(ev.endMin)})">
                    ${theme.icon ? `<i class="${theme.icon}"></i>` : '🌙'} ${escapeHTML(ev.title)}
                  </span>
                `;
              }).join('')}
            </div>
          `;
        }).join('');

        // Bắt sự kiện click vào capsule sự kiện đêm để xem/chỉnh sửa (không tạo sự kiện khi bấm ô trống)
        nightColsEl.querySelectorAll('.tt-night-event-capsule').forEach(capsule => {
          capsule.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = capsule.dataset.id;
            const ev = allEvents.find(x => x.id === id);
            if (ev && typeof openCalendarEventModal === 'function') {
              openCalendarEventModal(ev.date, ev);
            }
          });
        });
      }
    } else {
      nightStripRow.style.display = 'none';
    }
  }

  // 6. Render Cột Mốc Giờ Bên Trái (Time Axis)
  const timeAxisContainer = document.getElementById('ttTimeAxis');
  if (timeAxisContainer) {
    let axisHtml = '';
    const startHour = timetableNightCollapsed ? 6 : 0;
    const endHour = 24;

    for (let h = startHour; h < endHour; h++) {
      const hStr = `${String(h).padStart(2, '0')}:00`;
      axisHtml += `
        <div class="tt-time-axis-hour">
          <span class="tt-time-label">${hStr}</span>
        </div>
      `;
    }
    timeAxisContainer.innerHTML = axisHtml;
  }

  // 7. Render 7 Cột Ngày & Khối Sự Kiện Định Vị Theo Tỉ Lệ Phần Trăm (%)
  const daysColumnsContainer = document.getElementById('ttDaysColumns');
  if (daysColumnsContainer) {
    daysColumnsContainer.innerHTML = '';

    const now = new Date();
    const currentTotalMin = now.getHours() * 60 + now.getMinutes();

    weekDays.forEach(day => {
      const colEl = document.createElement('div');
      colEl.className = `tt-day-col ${day.isToday ? 'is-today' : ''}`;
      colEl.dataset.date = day.dateKey;

      // Render các ô giờ chia đều bằng flex (chỉ hiển thị đường lưới, không click tạo sự kiện)
      const startH = timetableNightCollapsed ? 6 : 0;
      for (let h = startH; h < 24; h++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'tt-hour-slot';
        slotEl.dataset.hour = h;
        colEl.appendChild(slotEl);
      }

      // Render các khối sự kiện định vị theo %
      const timedList = dayEventsMap[day.dateKey] || [];
      timedList.forEach(ev => {
        const blockEl = document.createElement('div');
        blockEl.className = 'tt-event-block';

        // Giới hạn trong khoảng hiển thị
        const effStart = Math.max(baseMinutes, ev.startMin);
        const effEnd = Math.min(1440, ev.endMin);

        // Tính vị trí top và height theo %
        const topPct = ((effStart - baseMinutes) / totalActiveMinutes) * 100;
        const durMin = effEnd - effStart;
        const heightPct = Math.max(2.2, (durMin / totalActiveMinutes) * 100);

        blockEl.style.top = `${topPct}%`;
        blockEl.style.height = `${heightPct}%`;

        const colWidthPct = 100 / ev.totalCols;
        blockEl.style.left = `calc(${ev.colIndex * colWidthPct}% + 1px)`;
        blockEl.style.width = `calc(${colWidthPct}% - 2px)`;

        const theme = (typeof getSmartEventTheme === 'function')
          ? getSmartEventTheme(ev)
          : {
              color: ev.color || '#a855f7',
              bgGradient: `linear-gradient(135deg, ${ev.color || '#a855f7'}35, ${ev.color || '#a855f7'}18)`,
              border: `${ev.color || '#a855f7'}55`,
              tagBg: 'rgba(0, 0, 0, 0.3)',
              tagColor: 'rgba(255, 255, 255, 0.9)',
              icon: 'fa-regular fa-calendar-check',
              tagText: ev.category || 'Sự kiện'
            };

        const color = theme.color;
        blockEl.style.borderLeft = `3.5px solid ${color}`;
        blockEl.style.background = theme.bgGradient;
        blockEl.style.borderTop = `1px solid ${theme.border}`;
        blockEl.style.borderRight = `1px solid ${theme.border}`;
        blockEl.style.borderBottom = `1px solid ${theme.border}`;
        blockEl.style.boxShadow = `0 3px 12px rgba(0, 0, 0, 0.45), inset 0 0 10px ${theme.glow || (color + '22')}`;

        const timeLabel = `${minutesToTimeStr(ev.startMin)} – ${minutesToTimeStr(ev.endMin)}`;
        const displayTag = ev.category || theme.tagText || '';
        const iconHtml = theme.icon ? `<i class="${theme.icon} tt-event-icon" style="color: ${color};"></i>` : '';

        // Phân cấp bố cục thông minh theo thời lượng sự kiện chống đè chữ
        if (durMin < 45) {
          // Siêu ngắn (< 45 phút): 1 dòng inline compact, icon + tên + giờ bắt đầu
          blockEl.classList.add('is-compact-single');
          blockEl.innerHTML = `
            <div class="tt-event-inline">
              ${iconHtml}
              <span class="tt-event-inline-title">${escapeHTML(ev.title)}</span>
              <span class="tt-event-inline-time">${minutesToTimeStr(ev.startMin)}</span>
            </div>
          `;
        } else if (durMin < 85 && !timetableScrollMode) {
          // Ngắn (45 - 85 phút ở chế độ 1 màn hình): 2 dòng rõ nét, dòng 1 tiêu đề, dòng 2 giờ (ẩn tag để không đè chữ)
          blockEl.classList.add('is-compact-double');
          blockEl.innerHTML = `
            <div class="tt-event-title">
              ${iconHtml}
              <span class="tt-event-title-text">${escapeHTML(ev.title)}</span>
            </div>
            <div class="tt-event-time">
              <i class="fa-regular fa-clock"></i> ${timeLabel}
            </div>
          `;
        } else {
          // Đủ rộng (Scroll Mode >= 45p hoặc 1 Màn Hình >= 85p)
          const showTag = displayTag && (timetableScrollMode ? durMin >= 65 : durMin >= 95);
          const showNote = ev.note && (timetableScrollMode ? durMin >= 100 : durMin >= 140);

          blockEl.innerHTML = `
            <div class="tt-event-title">
              ${iconHtml}
              <span class="tt-event-title-text">${escapeHTML(ev.title)}</span>
            </div>
            <div class="tt-event-time">
              <i class="fa-regular fa-clock"></i> ${timeLabel}
            </div>
            ${showTag ? `
              <span class="tt-event-meta-tag" style="background: ${theme.tagBg}; color: ${theme.tagColor}; border: 1px solid ${theme.border};">
                ${escapeHTML(displayTag)}
              </span>
            ` : ''}
            ${showNote ? `
              <div class="tt-event-note">
                <i class="fa-regular fa-note-sticky" style="font-size: 0.6rem; opacity: 0.8;"></i> ${escapeHTML(ev.note)}
              </div>
            ` : ''}
          `;
        }

        // Bắt sự kiện hover hiển thị thẻ nổi (Hover Tooltip Card)
        blockEl.addEventListener('mouseenter', (e) => showEventHoverTooltip(e, ev, timeLabel));
        blockEl.addEventListener('mousemove', (e) => positionEventHoverTooltip(e));
        blockEl.addEventListener('mouseleave', hideEventHoverTooltip);

        // Bắt sự kiện click chỉnh sửa
        blockEl.addEventListener('click', (e) => {
          e.stopPropagation();
          hideEventHoverTooltip();
          if (typeof openCalendarEventModal === 'function') {
            openCalendarEventModal(day.dateKey, ev);
          }
        });

        colEl.appendChild(blockEl);
      });

      // Vạch chỉ thị thời gian thực nếu là ngày hôm nay và trong khung giờ hoạt động
      if (day.isToday && currentTotalMin >= baseMinutes && currentTotalMin <= 1440) {
        const timeLineEl = document.createElement('div');
        timeLineEl.className = 'tt-current-time-line';
        const topPct = ((currentTotalMin - baseMinutes) / totalActiveMinutes) * 100;
        timeLineEl.style.top = `${topPct}%`;
        timeLineEl.id = 'ttCurrentTimeIndicator';

        const timeBadge = document.createElement('span');
        timeBadge.className = 'tt-current-time-badge';
        timeBadge.textContent = minutesToTimeStr(currentTotalMin);
        timeBadge.id = 'ttCurrentTimeBadge';

        timeLineEl.appendChild(timeBadge);
        colEl.appendChild(timeLineEl);
      }

      colEl.addEventListener('click', (e) => {
        if (!e.target.closest('.tt-event-block')) {
          if (typeof setTimelineActiveDateKey === 'function') {
            setTimelineActiveDateKey(day.dateKey);
          }
        }
      });

      daysColumnsContainer.appendChild(colEl);
    });
  }

  // 8. Render Thanh Timeline Chạy Ngang 24 Khung Giờ của Ngày
  if (typeof renderTimetableDailyTimeline === 'function') {
    renderTimetableDailyTimeline(null, weekDays);
  }
}

/**
 * Hiển thị thẻ nổi chi tiết khi rê chuột vào sự kiện
 */
function showEventHoverTooltip(e, ev, timeLabel) {
  const tooltip = document.getElementById('ttEventHoverTooltip');
  const titleEl = document.getElementById('ttTooltipTitle');
  const timeEl = document.getElementById('ttTooltipTime');
  const catEl = document.getElementById('ttTooltipCategory');
  const noteEl = document.getElementById('ttTooltipNote');

  if (!tooltip || !titleEl || !timeEl) return;

  const theme = (typeof getSmartEventTheme === 'function')
    ? getSmartEventTheme(ev)
    : { color: ev.color || '#a855f7', icon: 'fa-regular fa-calendar-check', tagText: ev.category || 'Sự kiện' };

  titleEl.innerHTML = `<i class="${theme.icon || 'fa-regular fa-calendar-check'}" style="color: ${theme.color};"></i> ${escapeHTML(ev.title)}`;
  timeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${escapeHTML(timeLabel)}`;

  if (catEl) {
    const displayCat = ev.category || theme.tagText || '';
    if (displayCat) {
      catEl.textContent = displayCat;
      catEl.style.background = theme.tagBg || 'rgba(255, 255, 255, 0.08)';
      catEl.style.color = theme.tagColor || '#e2e8f0';
      catEl.style.border = `1px solid ${theme.border || 'transparent'}`;
      catEl.style.display = 'inline-block';
    } else {
      catEl.style.display = 'none';
    }
  }

  if (noteEl) {
    if (ev.note) {
      noteEl.innerHTML = `<i class="fa-regular fa-note-sticky"></i> ${escapeHTML(ev.note)}`;
      noteEl.style.display = 'block';
    } else {
      noteEl.style.display = 'none';
    }
  }

  tooltip.style.display = 'flex';
  positionEventHoverTooltip(e);
}

function positionEventHoverTooltip(e) {
  const tooltip = document.getElementById('ttEventHoverTooltip');
  if (!tooltip || tooltip.style.display !== 'flex') return;

  const pad = 14;
  let x = e.clientX + pad;
  let y = e.clientY + pad;

  const tooltipWidth = tooltip.offsetWidth || 240;
  const tooltipHeight = tooltip.offsetHeight || 100;

  if (x + tooltipWidth > window.innerWidth - 10) {
    x = e.clientX - tooltipWidth - pad;
  }
  if (y + tooltipHeight > window.innerHeight - 10) {
    y = e.clientY - tooltipHeight - pad;
  }

  tooltip.style.left = `${Math.max(10, x)}px`;
  tooltip.style.top = `${Math.max(10, y)}px`;
}

function hideEventHoverTooltip() {
  const tooltip = document.getElementById('ttEventHoverTooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

/**
 * Cập nhật vị trí vạch giờ thực tế mỗi phút
 */
function updateRealtimeIndicator() {
  const indicator = document.getElementById('ttCurrentTimeIndicator');
  const badge = document.getElementById('ttCurrentTimeBadge');
  if (!indicator) return;

  const now = new Date();
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();
  const baseMinutes = timetableNightCollapsed ? 360 : 0;
  const totalActiveMinutes = timetableNightCollapsed ? 1080 : 1440;

  if (currentTotalMin >= baseMinutes && currentTotalMin <= 1440) {
    const topPct = ((currentTotalMin - baseMinutes) / totalActiveMinutes) * 100;
    indicator.style.top = `${topPct}%`;
    indicator.style.display = 'block';
    if (badge) badge.textContent = minutesToTimeStr(currentTotalMin);
  } else {
    indicator.style.display = 'none';
  }

  if (typeof updateTimelineRealtimeNeedle === 'function') {
    updateTimelineRealtimeNeedle();
  }
}

/**
 * Tự động cuộn đến vạch thời gian hiện tại trong chế độ cuộn thoải mái
 */
function autoScrollTimetableToCurrentTime() {
  const gridBody = document.getElementById('ttGridBody');
  if (!gridBody) return;
  if (!timetableScrollMode) return; // Chế độ 1 Màn Hình đã hiển thị trọn vẹn 100% không cần cuộn bên trong

  const indicator = document.getElementById('ttCurrentTimeIndicator');
  if (indicator && indicator.offsetParent !== null) {
    const top = indicator.offsetTop;
    gridBody.scrollTo({
      top: Math.max(0, top - 140),
      behavior: 'smooth'
    });
  } else {
    const now = new Date();
    const curHour = now.getHours();
    const startH = timetableNightCollapsed ? 6 : 0;
    const targetH = Math.max(startH, Math.min(22, curHour - 1));
    const slotHeight = 56;
    gridBody.scrollTo({
      top: Math.max(0, (targetH - startH) * slotHeight),
      behavior: 'smooth'
    });
  }
}

/**
 * Khởi tạo phân hệ Thời Khóa Biểu
 */
function initTimetable() {
  const btnPrev = document.getElementById('btnTtPrevWeek');
  const btnNext = document.getElementById('btnTtNextWeek');
  const btnCurrent = document.getElementById('btnTtCurrentWeek');
  const btnAdd = document.getElementById('btnTtAddEvent');
  const btnToggleNight = document.getElementById('btnTtToggleNight');
  const btnToggleView = document.getElementById('btnTtToggleViewMode');

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      timetableSelectedDate.setDate(timetableSelectedDate.getDate() - 7);
      renderTimetableTab();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      timetableSelectedDate.setDate(timetableSelectedDate.getDate() + 7);
      renderTimetableTab();
    });
  }

  if (btnCurrent) {
    btnCurrent.addEventListener('click', () => {
      timetableSelectedDate = new Date();
      if (typeof getFormattedDateKey === 'function' && typeof setTimelineActiveDateKey === 'function') {
        setTimelineActiveDateKey(getFormattedDateKey(new Date()));
      }
      renderTimetableTab();
      setTimeout(autoScrollTimetableToCurrentTime, 80);
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const todayKey = typeof getFormattedDateKey === 'function' ? getFormattedDateKey(timetableSelectedDate) : null;
      if (typeof openCalendarEventModal === 'function') {
        openCalendarEventModal(todayKey);
      }
    });
  }

  // Nút chuyển chế độ thu gọn ban đêm
  if (btnToggleNight) {
    btnToggleNight.addEventListener('click', () => {
      timetableNightCollapsed = !timetableNightCollapsed;
      localStorage.setItem('najimez_tt_night_collapsed', timetableNightCollapsed ? '1' : '0');
      renderTimetableTab();
    });
  }

  // Nút chuyển đổi giữa 1 màn hình và cuộn thoải mái
  if (btnToggleView) {
    btnToggleView.addEventListener('click', () => {
      timetableScrollMode = !timetableScrollMode;
      localStorage.setItem('najimez_tt_scroll_mode', timetableScrollMode ? '1' : '0');
      renderTimetableTab();
      if (timetableScrollMode) {
        setTimeout(autoScrollTimetableToCurrentTime, 80);
      }
    });
  }

  // Nút cuộn nhanh giữa Timeline Ngày và Thời khóa biểu Tuần
  const btnScrollToWeek = document.getElementById('btnTtScrollToGrid') || document.getElementById('btnTtScrollToWeek');
  if (btnScrollToWeek) {
    btnScrollToWeek.addEventListener('click', () => {
      const section = document.getElementById('ttWeeklySection');
      const layout = document.querySelector('.timetable-workspace-layout');
      if (section && layout) {
        layout.scrollTo({ top: section.offsetTop - 8, behavior: 'smooth' });
      } else if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const btnScrollToTimeline = document.getElementById('btnTtScrollToTimeline');
  if (btnScrollToTimeline) {
    btnScrollToTimeline.addEventListener('click', () => {
      const layout = document.querySelector('.timetable-workspace-layout');
      if (layout) layout.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Khởi động đồng hồ thời gian thực mỗi 60 giây
  if (timetableRealtimeTimer) clearInterval(timetableRealtimeTimer);
  timetableRealtimeTimer = setInterval(updateRealtimeIndicator, 60000);

  // Khởi tạo thanh timeline 24 giờ của ngày
  if (typeof initTimetableDailyTimeline === 'function') {
    initTimetableDailyTimeline();
  }

  // Render lần đầu
  renderTimetableTab();
  if (timetableScrollMode) {
    setTimeout(autoScrollTimetableToCurrentTime, 120);
  }
}

window.initTimetable = initTimetable;
window.renderTimetableTab = renderTimetableTab;
window.autoScrollTimetableToCurrentTime = autoScrollTimetableToCurrentTime;
window.getTimetableNightCollapsed = function() {
  return timetableNightCollapsed;
};
window.setTimetableNightCollapsed = function(val) {
  timetableNightCollapsed = !!val;
  localStorage.setItem('najimez_tt_night_collapsed', timetableNightCollapsed ? '1' : '0');
};
