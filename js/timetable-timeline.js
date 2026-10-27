/**
 * js/timetable-timeline.js - Quản lý Thanh Timeline Chạy Ngang 24 Khung Giờ của Ngày
 * Mô hình Cyber Luxury: Hiển thị 24 mốc giờ, dải tiến độ thời gian thực, sự kiện theo % và kim chạy ngang.
 */

let timetableTimelineActiveDateKey = null;
let timetableTimelineCollapsed = localStorage.getItem('najimez_tt_timeline_collapsed') === '1';
let timetableTimelineClockTimer = null;

/**
 * Kiểm tra xem chế độ thu gọn ban đêm (0h - 6h) có đang bật hay không
 */
function isTimelineNightCollapsed() {
  if (typeof window.getTimetableNightCollapsed === 'function') {
    return window.getTimetableNightCollapsed();
  }
  return localStorage.getItem('najimez_tt_night_collapsed') !== '0';
}

/**
 * Chuyển đổi số phút trong ngày (0 - 1440) thành tọa độ phần trăm (%) trên thanh timeline
 * Hỗ trợ 2 chế độ:
 * 1. Chế độ thu gọn ban đêm (0h - 6h): 19 cột tương đương (1 cột đêm 0h-6h + 18 cột ngày 6h-24h)
 * 2. Chế độ 24 giờ đầy đủ: 24 cột tương đương
 */
function timeToTimelinePct(mins, nightCollapsed) {
  const clampedMin = Math.max(0, Math.min(1440, mins));
  if (!nightCollapsed) {
    return (clampedMin / 1440) * 100;
  }
  // 19 slots: slot đêm (0 - 360 phút) chiếm 1/19 (~5.263158%), 18 slot ngày (360 - 1440 phút) chiếm 18/19 (~94.736842%)
  const pNight = 100 / 19;
  if (clampedMin <= 360) {
    return (clampedMin / 360) * pNight;
  }
  return pNight + ((clampedMin - 360) / 1080) * (100 - pNight);
}

/**
 * Lấy ngày đang được chọn cho thanh timeline 24 giờ (mặc định hôm nay nếu có trong tuần)
 */
function getTimelineActiveDateKey(weekDays) {
  const todayKey = typeof getFormattedDateKey === 'function' 
    ? getFormattedDateKey(new Date()) 
    : '';

  if (timetableTimelineActiveDateKey && Array.isArray(weekDays)) {
    const exists = weekDays.some(d => d.dateKey === timetableTimelineActiveDateKey);
    if (exists) return timetableTimelineActiveDateKey;
  }

  // Nếu hôm nay có trong tuần thì ưu tiên hôm nay
  if (Array.isArray(weekDays)) {
    const todayInWeek = weekDays.find(d => d.dateKey === todayKey);
    if (todayInWeek) {
      timetableTimelineActiveDateKey = todayKey;
      return todayKey;
    }
    if (weekDays.length > 0) {
      timetableTimelineActiveDateKey = weekDays[0].dateKey;
      return timetableTimelineActiveDateKey;
    }
  }

  timetableTimelineActiveDateKey = todayKey;
  return todayKey;
}

/**
 * Đặt ngày đang xem cho timeline và đồng bộ giao diện
 */
function setTimelineActiveDateKey(dateKey) {
  timetableTimelineActiveDateKey = dateKey;
  const weekDays = typeof getWeekDays === 'function' ? getWeekDays(timetableSelectedDate) : [];
  renderTimetableDailyTimeline(dateKey, weekDays);
  syncTimetableActiveColumnHighlight(dateKey);
}

/**
 * Đồng bộ highlight cột ngày tương ứng trong lưới thời khóa biểu bên dưới
 */
function syncTimetableActiveColumnHighlight(activeDateKey) {
  document.querySelectorAll('.tt-col-header-cell').forEach(cell => {
    cell.classList.toggle('is-selected-day', cell.dataset.date === activeDateKey);
  });
  document.querySelectorAll('.tt-day-col').forEach(col => {
    col.classList.toggle('is-selected-day', col.dataset.date === activeDateKey);
  });
}

/**
 * Xử lý bố cục xếp tầng cho các sự kiện chồng chéo trên thanh timeline ngang
 */
function layoutTimelineHorizontalRows(events) {
  if (!events || !events.length) return { events: [], maxRows: 1 };

  const sorted = [...events].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return (b.endMin - b.startMin) - (a.endMin - a.startMin);
  });

  const rowEnds = [];
  sorted.forEach(ev => {
    let placedRow = -1;
    for (let r = 0; r < rowEnds.length; r++) {
      if (rowEnds[r] <= ev.startMin) {
        placedRow = r;
        rowEnds[r] = ev.endMin;
        break;
      }
    }
    if (placedRow === -1) {
      placedRow = rowEnds.length;
      rowEnds.push(ev.endMin);
    }
    ev.timelineRow = placedRow;
  });

  return { events: sorted, maxRows: Math.max(1, rowEnds.length) };
}

/**
 * Render thanh timeline chạy ngang 24 khung giờ
 */
function renderTimetableDailyTimeline(activeDateKey, weekDays) {
  const card = document.getElementById('ttDayTimelineCard');
  if (!card) return;

  if (!weekDays || !weekDays.length) {
    weekDays = typeof getWeekDays === 'function' ? getWeekDays(timetableSelectedDate) : [];
  }

  const effectiveDateKey = activeDateKey || getTimelineActiveDateKey(weekDays);
  timetableTimelineActiveDateKey = effectiveDateKey;

  // Trạng thái thu gọn
  card.classList.toggle('is-collapsed', timetableTimelineCollapsed);

  // 1. Tìm thông tin ngày
  let activeDay = weekDays.find(d => d.dateKey === effectiveDateKey);
  if (!activeDay) {
    const parts = effectiveDateKey.split('-').map(Number);
    const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const shortNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const todayKey = typeof getFormattedDateKey === 'function' ? getFormattedDateKey(new Date()) : '';
    activeDay = {
      date: dObj,
      dateKey: effectiveDateKey,
      dayNum: dObj.getDate(),
      monthNum: dObj.getMonth() + 1,
      yearNum: dObj.getFullYear(),
      dayOfWeek: dObj.getDay(),
      dayName: dayNames[dObj.getDay()],
      shortName: shortNames[dObj.getDay()],
      isToday: effectiveDateKey === todayKey,
      isWeekend: dObj.getDay() === 0 || dObj.getDay() === 6
    };
  }

  // 2. Lấy danh sách sự kiện của ngày này
  const curData = typeof getLedgerData === 'function' ? getLedgerData() : {};
  const allEvents = Array.isArray(curData.calendarEvents) ? curData.calendarEvents : [];
  const dayEvents = allEvents.filter(ev => {
    if (typeof isEventOccurringOnDate === 'function') {
      return isEventOccurringOnDate(ev, effectiveDateKey);
    }
    return ev.date === effectiveDateKey;
  });

  const alldayList = [];
  const timedList = [];

  dayEvents.forEach(ev => {
    const t = ev.startTime || ev.time || '';
    if (!t) {
      alldayList.push(ev);
    } else {
      const startMin = timeStrToMinutes(t) || 0;
      let endMin = ev.endTime ? timeStrToMinutes(ev.endTime) : (startMin + 60);
      if (endMin <= startMin) endMin = Math.min(1440, startMin + 60);
      timedList.push({
        ...ev,
        startMin,
        endMin,
        color: ev.color || '#a855f7'
      });
    }
  });

  // 3. Cập nhật Tiêu đề Header & Badge
  const titleEl = document.getElementById('ttDtlDateTitle');
  const todayBadgeEl = document.getElementById('ttDtlTodayBadge');
  const countEl = document.getElementById('ttDtlEventsCount');
  const subEl = document.getElementById('ttDtlDateSub');

  if (titleEl) {
    titleEl.textContent = `${activeDay.dayName}, ${activeDay.dayNum}/${activeDay.monthNum}/${activeDay.yearNum}`;
  }
  if (todayBadgeEl) {
    todayBadgeEl.style.display = activeDay.isToday ? 'inline-block' : 'none';
  }
  if (countEl) {
    countEl.textContent = `${dayEvents.length} sự kiện`;
  }
  const nightCollapsed = isTimelineNightCollapsed();

  if (subEl) {
    let lunarStr = '';
    if (typeof convertSolar2Lunar === 'function') {
      const lunar = convertSolar2Lunar(activeDay.dayNum, activeDay.monthNum, activeDay.yearNum);
      if (lunar) lunarStr = ` • ${lunar.day}/${lunar.month} ÂL`;
    }
    const modeLabel = nightCollapsed ? 'Dòng thời gian (6h – 24h Gọn)' : 'Dòng thời gian 24 giờ';
    subEl.textContent = `${modeLabel}${lunarStr}`;
  }

  // Cập nhật trạng thái nút chuyển đổi thu gọn ban đêm trên header timeline
  const dtlToggleNightBtn = document.getElementById('btnTtDtlToggleNight');
  if (dtlToggleNightBtn) {
    if (nightCollapsed) {
      dtlToggleNightBtn.innerHTML = '<i class="fa-solid fa-moon" style="color: #c084fc;"></i> <span id="ttDtlToggleNightText" class="hide-mobile">6h – 24h (Gọn)</span>';
      dtlToggleNightBtn.title = 'Đang thu gọn ban đêm (6h - 24h). Bấm để xem đầy đủ 24 giờ';
    } else {
      dtlToggleNightBtn.innerHTML = '<i class="fa-solid fa-sun" style="color: #fbbf24;"></i> <span id="ttDtlToggleNightText" class="hide-mobile">0h – 24h (Đầy đủ)</span>';
      dtlToggleNightBtn.title = 'Đang hiển thị đủ 24 giờ. Bấm để thu gọn ban đêm 0h-6h';
    }
  }

  // 4. Render Bộ Nút Chọn Nhanh 7 Ngày Trong Tuần
  const pickerEl = document.getElementById('ttDtlDaysPicker');
  if (pickerEl) {
    pickerEl.innerHTML = weekDays.map(d => `
      <button type="button" 
        class="btn-dtl-day-pill ${d.dateKey === effectiveDateKey ? 'active' : ''} ${d.isToday ? 'is-today' : ''} ${d.isWeekend ? 'weekend' : ''}" 
        data-date="${d.dateKey}"
        title="${d.dayName}, ${d.dayNum}/${d.monthNum}">
        <span class="dtl-pill-name">${d.shortName}</span>
        <span class="dtl-pill-num">${d.dayNum}</span>
      </button>
    `).join('');

    pickerEl.querySelectorAll('.btn-dtl-day-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const dKey = btn.dataset.date;
        setTimelineActiveDateKey(dKey);
      });
    });
  }

  // 5. Render Hàng Sự Kiện Cả Ngày (nếu có)
  const alldayRowEl = document.getElementById('ttDtlAllDayRow');
  if (alldayRowEl) {
    if (alldayList.length > 0) {
      alldayRowEl.style.display = 'flex';
      alldayRowEl.innerHTML = `
        <div class="tt-dtl-allday-label"><i class="fa-solid fa-sun"></i> Cả ngày:</div>
        ${alldayList.map(ev => {
          const theme = (typeof getSmartEventTheme === 'function') ? getSmartEventTheme(ev) : { color: ev.color || '#a855f7' };
          return `
            <div class="tt-dtl-allday-pill" style="background: ${theme.color};" data-id="${ev.id}" title="${escapeHTML(ev.title)}">
              ${theme.icon ? `<i class="${theme.icon}"></i>` : ''} ${escapeHTML(ev.title)}
            </div>
          `;
        }).join('')}
      `;
      alldayRowEl.querySelectorAll('.tt-dtl-allday-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          const ev = allEvents.find(x => x.id === pill.dataset.id);
          if (ev && typeof openCalendarEventModal === 'function') {
            openCalendarEventModal(ev.date, ev);
          }
        });
      });
    } else {
      alldayRowEl.style.display = 'none';
    }
  }

  // 6. Render Mốc Giờ Trục Hoành (19 mốc khi thu gọn hoặc 24 mốc khi đầy đủ)
  const axisEl = document.getElementById('ttDtlHoursAxis');
  const axisMode = nightCollapsed ? 'collapsed' : 'full';
  if (axisEl && axisEl.dataset.renderedMode !== axisMode) {
    axisEl.dataset.renderedMode = axisMode;
    axisEl.classList.toggle('is-night-collapsed', nightCollapsed);

    let axisHtml = '';
    if (nightCollapsed) {
      // Cột 0: Mốc 0h–6h thu gọn ban đêm
      axisHtml += `
        <div class="tt-dtl-hour-mark is-night-mark" title="Khung giờ ban đêm: 00:00 – 06:00">
          <span><i class="fa-solid fa-moon"></i> 0h–6h</span>
        </div>
      `;
      // 18 mốc giờ ban ngày: 06:00 -> 23:00
      for (let h = 6; h < 24; h++) {
        const isMajor = (h % 3 === 0);
        const hStr = `${String(h).padStart(2, '0')}:00`;
        axisHtml += `
          <div class="tt-dtl-hour-mark ${isMajor ? 'is-major-hour' : ''}">
            <span>${hStr}</span>
          </div>
        `;
      }
    } else {
      // 24 mốc giờ đầy đủ: 00:00 -> 23:00
      for (let h = 0; h < 24; h++) {
        const isMajor = (h % 3 === 0);
        const hStr = `${String(h).padStart(2, '0')}:00`;
        axisHtml += `
          <div class="tt-dtl-hour-mark ${isMajor ? 'is-major-hour' : ''}">
            <span>${hStr}</span>
          </div>
        `;
      }
    }
    // Mốc kết thúc 24:00 ở ngoài cùng bên phải
    axisHtml += `<div class="tt-dtl-hour-end-mark">24:00</div>`;
    axisEl.innerHTML = axisHtml;
  }

  // 7. Render Các Ô Giờ Nền (Background Slots Layer)
  const slotsLayerEl = document.getElementById('ttDtlSlotsLayer');
  if (slotsLayerEl && slotsLayerEl.dataset.renderedMode !== axisMode) {
    slotsLayerEl.dataset.renderedMode = axisMode;
    slotsLayerEl.classList.toggle('is-night-collapsed', nightCollapsed);

    let slotsHtml = '';
    if (nightCollapsed) {
      // Ô ban đêm thu gọn (0h - 6h)
      slotsHtml += `
        <div class="tt-dtl-slot is-night-collapsed" data-hour="night" title="Khung giờ ban đêm: 00:00 – 06:00">
          <div class="tt-dtl-night-collapsed-content">
            <i class="fa-solid fa-moon tt-dtl-night-moon-icon"></i>
            <span class="tt-dtl-night-collapsed-tag">0h–6h</span>
          </div>
        </div>
      `;
      // 18 ô giờ ban ngày: 6h -> 23h
      for (let h = 6; h < 24; h++) {
        let periodClass = 'is-morning';
        let icon = '';
        if (h < 12) {
          periodClass = 'is-morning';
          if (h === 9) icon = '<i class="fa-solid fa-cloud-sun tt-dtl-period-icon" title="Buổi sáng"></i>';
        } else if (h < 18) {
          periodClass = 'is-afternoon';
          if (h === 14) icon = '<i class="fa-solid fa-sun tt-dtl-period-icon" title="Buổi chiều"></i>';
        } else {
          periodClass = 'is-evening';
          if (h === 21) icon = '<i class="fa-solid fa-moon-stars tt-dtl-period-icon" title="Buổi tối"></i>';
        }

        const nextH = Math.min(24, h + 1);
        const titleSlot = `${String(h).padStart(2, '0')}:00 – ${String(nextH).padStart(2, '0')}:00`;
        slotsHtml += `
          <div class="tt-dtl-slot ${periodClass}" data-hour="${h}" title="${titleSlot}">
            ${icon}
          </div>
        `;
      }
    } else {
      // 24 ô giờ đầy đủ: 0h -> 23h
      for (let h = 0; h < 24; h++) {
        let periodClass = 'is-night';
        let icon = '';
        if (h >= 6 && h < 12) {
          periodClass = 'is-morning';
          if (h === 9) icon = '<i class="fa-solid fa-cloud-sun tt-dtl-period-icon" title="Buổi sáng"></i>';
        } else if (h >= 12 && h < 18) {
          periodClass = 'is-afternoon';
          if (h === 14) icon = '<i class="fa-solid fa-sun tt-dtl-period-icon" title="Buổi chiều"></i>';
        } else if (h >= 18) {
          periodClass = 'is-evening';
          if (h === 21) icon = '<i class="fa-solid fa-moon-stars tt-dtl-period-icon" title="Buổi tối"></i>';
        } else {
          if (h === 3) icon = '<i class="fa-solid fa-moon tt-dtl-period-icon" title="Ban đêm"></i>';
        }

        const nextH = Math.min(24, h + 1);
        const titleSlot = `${String(h).padStart(2, '0')}:00 – ${String(nextH).padStart(2, '0')}:00`;
        slotsHtml += `
          <div class="tt-dtl-slot ${periodClass}" data-hour="${h}" title="${titleSlot}">
            ${icon}
          </div>
        `;
      }
    }
    slotsLayerEl.innerHTML = slotsHtml;
    // Không gán sự kiện click vào ô giờ nền/thanh chứa để tránh mở giao diện tạo sự kiện
  }

  // 8. Render Dải Tiến Độ Thời Gian Đã Qua (Past Progress) & Kim Thời Gian Thực
  const progressEl = document.getElementById('ttDtlPastProgress');
  const needleEl = document.getElementById('ttDtlNowNeedle');
  const badgeEl = document.getElementById('ttDtlNowBadge');
  const clockTextEl = document.getElementById('ttDtlLiveClockText');

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct = timeToTimelinePct(nowMin, nightCollapsed);
  const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (clockTextEl) clockTextEl.textContent = nowTimeStr;

  if (activeDay.isToday) {
    if (progressEl) {
      progressEl.style.width = `${nowPct}%`;
      progressEl.style.display = 'block';
    }
    if (needleEl) {
      needleEl.style.left = `${nowPct}%`;
      needleEl.style.display = 'block';
      if (badgeEl) badgeEl.textContent = nowTimeStr;
    }
  } else {
    // So sánh ngày quá khứ hay tương lai
    const todayKey = typeof getFormattedDateKey === 'function' ? getFormattedDateKey(new Date()) : '';
    if (progressEl) {
      if (effectiveDateKey < todayKey) {
        progressEl.style.width = '100%';
        progressEl.style.display = 'block';
      } else {
        progressEl.style.width = '0%';
        progressEl.style.display = 'none';
      }
    }
    if (needleEl) {
      needleEl.style.display = 'none';
    }
  }

  // 9. Render Lớp Sự Kiện Định Vị Theo Tỉ Lệ % (Events Layer)
  const eventsLayerEl = document.getElementById('ttDtlEventsLayer');
  const trackBodyEl = document.getElementById('ttDtlTrackBody');
  if (eventsLayerEl && trackBodyEl) {
    eventsLayerEl.innerHTML = '';
    const { events: arrangedEvents, maxRows } = layoutTimelineHorizontalRows(timedList);

    // Điều chỉnh độ cao track theo số lượng hàng chồng chéo
    const baseTrackHeight = maxRows > 1 ? Math.max(38, maxRows * 20 + 6) : 38;
    trackBodyEl.style.height = `${baseTrackHeight}px`;

    const rowHeight = maxRows > 1 ? 18 : 30;

    arrangedEvents.forEach(ev => {
      const leftPct = timeToTimelinePct(ev.startMin, nightCollapsed);
      const rightPct = timeToTimelinePct(ev.endMin, nightCollapsed);
      const isNightEvent = nightCollapsed && (ev.endMin <= 360);
      const minW = isNightEvent ? 2.2 : 2.8;
      let widthPct = Math.max(minW, rightPct - leftPct);
      if (leftPct + widthPct > 100) {
        widthPct = Math.max(1.5, 100 - leftPct);
      }
      const topOffset = maxRows > 1 ? (ev.timelineRow * 20 + 3) : 3;

      const blockEl = document.createElement('div');
      blockEl.className = 'tt-dtl-event-capsule' + (isNightEvent ? ' is-night-event' : '');
      blockEl.style.left = `${leftPct}%`;
      blockEl.style.width = `calc(${widthPct}% - 2px)`;
      blockEl.style.top = `${topOffset}px`;
      blockEl.style.height = `${rowHeight}px`;

      const theme = (typeof getSmartEventTheme === 'function')
        ? getSmartEventTheme(ev)
        : { color: ev.color || '#a855f7', bgGradient: `linear-gradient(135deg, ${ev.color || '#a855f7'}99, ${ev.color || '#a855f7'}66)` };

      const timeLabel = `${minutesToTimeStr(ev.startMin)} – ${minutesToTimeStr(ev.endMin)}`;

      blockEl.style.background = theme.bgGradient || `linear-gradient(135deg, ${theme.color}dd, ${theme.color}99)`;
      blockEl.style.border = `1px solid ${theme.border || theme.color}`;
      blockEl.style.boxShadow = `0 2px 8px rgba(0, 0, 0, 0.4), inset 0 0 6px ${theme.color}44`;

      blockEl.innerHTML = `
        ${theme.icon ? `<i class="${theme.icon} tt-dtl-event-icon"></i>` : ''}
        <span class="tt-dtl-event-title">${escapeHTML(ev.title)}</span>
        <span class="tt-dtl-event-time">${minutesToTimeStr(ev.startMin)}</span>
      `;

      // Hover Tooltip
      blockEl.addEventListener('mouseenter', (e) => {
        if (typeof showEventHoverTooltip === 'function') {
          showEventHoverTooltip(e, ev, timeLabel);
        }
      });
      blockEl.addEventListener('mousemove', (e) => {
        if (typeof positionEventHoverTooltip === 'function') {
          positionEventHoverTooltip(e);
        }
      });
      blockEl.addEventListener('mouseleave', () => {
        if (typeof hideEventHoverTooltip === 'function') {
          hideEventHoverTooltip();
        }
      });

      // Click chỉnh sửa sự kiện
      blockEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof hideEventHoverTooltip === 'function') hideEventHoverTooltip();
        if (typeof openCalendarEventModal === 'function') {
          openCalendarEventModal(effectiveDateKey, ev);
        }
      });

      eventsLayerEl.appendChild(blockEl);
    });
  }

  // 10. Đã loại bỏ cuộn ngang để thanh timeline vừa vặn trọn vẹn 100% khung nhìn

  // Đồng bộ highlight cột bên dưới
  syncTimetableActiveColumnHighlight(effectiveDateKey);
}

/**
 * Cập nhật kim chạy ngang và đồng hồ thời gian thực mỗi phút
 */
function updateTimelineRealtimeNeedle() {
  const needleEl = document.getElementById('ttDtlNowNeedle');
  const badgeEl = document.getElementById('ttDtlNowBadge');
  const progressEl = document.getElementById('ttDtlPastProgress');
  const clockTextEl = document.getElementById('ttDtlLiveClockText');

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nightCollapsed = isTimelineNightCollapsed();
  const nowPct = timeToTimelinePct(nowMin, nightCollapsed);
  const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (clockTextEl) clockTextEl.textContent = nowTimeStr;

  const todayKey = typeof getFormattedDateKey === 'function' ? getFormattedDateKey(new Date()) : '';
  const isViewingToday = (timetableTimelineActiveDateKey === todayKey);

  if (isViewingToday) {
    if (needleEl) {
      needleEl.style.left = `${nowPct}%`;
      needleEl.style.display = 'block';
      if (badgeEl) badgeEl.textContent = nowTimeStr;
    }
    if (progressEl) {
      progressEl.style.width = `${nowPct}%`;
      progressEl.style.display = 'block';
    }
  }
}

/**
 * Khởi tạo phân hệ Thanh Timeline 24 Khung Giờ
 */
function initTimetableDailyTimeline() {
  const btnToggle = document.getElementById('btnTtDtlToggle');
  const btnAdd = document.getElementById('btnTtDtlAddEvent');
  const btnNight = document.getElementById('btnTtDtlToggleNight');

  if (btnNight) {
    btnNight.addEventListener('click', () => {
      const current = isTimelineNightCollapsed();
      const nextVal = !current;
      if (typeof window.setTimetableNightCollapsed === 'function') {
        window.setTimetableNightCollapsed(nextVal);
      } else {
        localStorage.setItem('najimez_tt_night_collapsed', nextVal ? '1' : '0');
      }
      if (typeof renderTimetableTab === 'function') {
        renderTimetableTab();
      } else {
        renderTimetableDailyTimeline();
      }
    });
  }

  if (btnToggle) {
    btnToggle.innerHTML = timetableTimelineCollapsed 
      ? '<i class="fa-solid fa-chevron-down"></i>' 
      : '<i class="fa-solid fa-chevron-up"></i>';

    btnToggle.addEventListener('click', () => {
      timetableTimelineCollapsed = !timetableTimelineCollapsed;
      localStorage.setItem('najimez_tt_timeline_collapsed', timetableTimelineCollapsed ? '1' : '0');
      const card = document.getElementById('ttDayTimelineCard');
      if (card) card.classList.toggle('is-collapsed', timetableTimelineCollapsed);
      btnToggle.innerHTML = timetableTimelineCollapsed 
        ? '<i class="fa-solid fa-chevron-down"></i>' 
        : '<i class="fa-solid fa-chevron-up"></i>';
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      if (typeof openCalendarEventModal === 'function') {
        openCalendarEventModal(timetableTimelineActiveDateKey || null);
      }
    });
  }

  if (timetableTimelineClockTimer) clearInterval(timetableTimelineClockTimer);
  timetableTimelineClockTimer = setInterval(updateTimelineRealtimeNeedle, 30000); // 30s
}

window.renderTimetableDailyTimeline = renderTimetableDailyTimeline;
window.setTimelineActiveDateKey = setTimelineActiveDateKey;
window.initTimetableDailyTimeline = initTimetableDailyTimeline;
