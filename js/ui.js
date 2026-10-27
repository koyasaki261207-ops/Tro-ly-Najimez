/**
 * js/ui.js - Quản lý tương tác giao diện chung, sidebar, đồng hồ, header và tabs
 */

function initClock() {
  const clockTime = document.getElementById('sidebarLiveClock');
  const clockDate = document.getElementById('sidebarLiveDate');

  function update() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    if (clockTime) clockTime.textContent = `${hh}:${mm}:${ss}`;

    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayStr = days[now.getDay()];
    const dd = String(now.getDate()).padStart(2, '0');
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    if (clockDate) clockDate.textContent = `${dayStr}, ${dd}/${mo}/${yyyy}`;
  }

  update();
  setInterval(update, 1000);
}

function initSidebar() {
  const btnToggle = document.getElementById('btnToggleSidebar');
  const btnClose = document.getElementById('btnCloseSidebar');
  const sidebar = document.getElementById('omniSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  function toggleSidebar(forceState) {
    if (!sidebar) return;
    const isMobile = window.innerWidth <= 860;
    if (isMobile) {
      const willOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('mobile-open');
      sidebar.classList.toggle('mobile-open', willOpen);
      if (backdrop) backdrop.classList.toggle('active', willOpen);
    } else {
      const willCollapse = forceState !== undefined ? forceState : !sidebar.classList.contains('collapsed');
      sidebar.classList.toggle('collapsed', willCollapse);
    }
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }

  if (btnToggle) {
    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMobile = window.innerWidth <= 860;
      if (isMobile) {
        closeMobileSidebar();
      } else {
        toggleSidebar(false);
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMobileSidebar);
  }

  // Hỗ trợ thao tác vuốt sang trái để đóng sidebar trên màn hình cảm ứng
  let touchStartX = 0;
  let touchStartY = 0;
  if (sidebar) {
    sidebar.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    sidebar.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = Math.abs(touchStartY - e.changedTouches[0].clientY);
      const diffX = touchStartX - touchEndX;
      // Vuốt tay sang trái hơn 40px và không phải cuộn dọc
      if (diffX > 40 && diffX > touchEndY) {
        closeMobileSidebar();
      }
    }, { passive: true });
  }

  // Đóng sidebar khi nhấn phím Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('mobile-open')) {
      closeMobileSidebar();
    }
  });
}

function initTabNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const panes = document.querySelectorAll('.tab-pane');
  const sidebar = document.getElementById('omniSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTabId = item.dataset.tab;
      const quickPrompt = item.dataset.quickPrompt;

      if (targetTabId) {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        panes.forEach(pane => {
          if (pane.id === targetTabId) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });

        if (targetTabId === 'tab-finance') {
          if (typeof renderFinanceTab === 'function') renderFinanceTab();
        } else if (targetTabId === 'tab-todos') {
          if (typeof renderTodosTab === 'function') renderTodosTab();
        } else if (targetTabId === 'tab-calendar') {
          if (typeof renderCalendarTab === 'function') renderCalendarTab();
        } else if (targetTabId === 'tab-timetable') {
          if (typeof renderTimetableTab === 'function') renderTimetableTab();
          if (typeof autoScrollTimetableToCurrentTime === 'function') autoScrollTimetableToCurrentTime();
        } else if (targetTabId === 'tab-toolbox') {
          if (typeof renderToolboxTab === 'function') renderToolboxTab();
        }

        // Tự động gõ lời nhắc tắt nếu có
        if (quickPrompt && targetTabId === 'tab-copilot') {
          const input = document.getElementById('copilotInput');
          if (input) {
            input.value = quickPrompt;
            input.focus();
          }
        }

        // Tự động ẩn sidebar trên màn hình di động khi chuyển tab
        if (window.innerWidth <= 860) {
          if (sidebar) sidebar.classList.remove('mobile-open');
          if (backdrop) backdrop.classList.remove('active');
        }
      }
    });
  });
}

/**
 * Hệ thống lời chào phong phú, sống động và duyên dáng của Najimez theo từng khung giờ
 */
const NAJIMEZ_GREETINGS = {
  dawn: [ // 05:00 - 08:30: Sáng sớm & Khởi đầu ngày mới
    "Hế lô ngày mới! Najimez đã thức dậy cùng bạn rồi đây, sẵn sàng đón ngày tuyệt vời chưa nào? ☀️",
    "Chào buổi sáng rạng rỡ! Bạn đã thưởng thức một ly cà phê ấm để nạp năng lượng chưa nè? ☕✨",
    "Ting ting! Nụ cười buổi sáng sẽ mang lại thật nhiều may mắn đấy, cùng Najimez lên dây cót nhé! 🌸",
    "Ngày mới ngập tràn năng lượng nhé bạn hiền! Hôm nay có mục tiêu thú vị nào cần Najimez đồng hành không? 🎯"
  ],
  morning: [ // 08:30 - 11:30: Giữa sáng, tập trung & năng suất cao
    "Đang chăm chỉ cày cuốc đúng không nè? Najimez luôn ở đây tiếp sức cho bạn 100% công lực nhé! 🚀",
    "Tập trung cao độ nào! Nếu gặp bài tập hóc búa hay tính toán nan giải, cứ gửi ngay cho Najimez xử lý nha! 💡",
    "Cố gắng làm việc thật hiệu quả nhé! Nhớ chớp mắt thư giãn và uống chút nước nha bạn ơi! 💧✨",
    "Najimez đã chuẩn bị sẵn sàng rồi nè! Cần ghi chép chi tiêu hay lên lịch trình công việc gì không bạn? 📑"
  ],
  noon: [ // 11:30 - 13:30: Buổi trưa, nghỉ ngơi, nạp năng lượng
    "Đến giờ sạc pin rồi! Bạn đã chọn được món gì ngon lành cho bữa trưa hôm nay chưa ta? 🍜🍱",
    "Tạm gác lại deadline một chút nha, ăn trưa thật ngon rồi chợp mắt chút xíu cho tỉnh táo nhé! 😋🍔",
    "Bụng đã réo rắt đòi ăn chưa nè? Nhớ ăn uống đầy đủ để giữ gìn sức khỏe cùng Najimez nha! 🥗✨",
    "Nghỉ trưa thảnh thơi nhé! Najimez vẫn ở đây, sẵn sàng khi bạn quay lại chiến tiếp buổi chiều! 🍵"
  ],
  afternoon: [ // 13:30 - 17:30: Buổi chiều, tăng tốc, nạp ngọt
    "Buổi chiều sảng khoái nhé! Một chút trà sữa hay đồ ngọt để 'xốc' lại tinh thần không bạn ơi? 🧋✨",
    "Tăng tốc về đích thôi nào! Hôm nay còn khoản thu chi hay công việc nào cần Najimez đối chiếu không nè? 📊🏃",
    "Najimez điểm danh buổi chiều! Cần trợ thủ tính toán, gỡ rối logic hay đơn giản là tán gẫu xả stress thì ới mình ngay nhé! 💬",
    "Giữ vững phong độ nào! Chỉ còn một chút nữa là hoàn thành kế hoạch hôm nay rồi, cố lên nha! 🌟"
  ],
  dusk: [ // 17:30 - 19:30: Tan ca, hoàng hôn, xả hơi
    "Gấp laptop lại thôi nào! Một ngày dài nỗ lực rồi, bạn đã tự thưởng cho mình bữa tối ngon lành gì chưa? 🌆🍲",
    "Hoàng hôn buông rồi, quẳng hết âu lo công việc qua một bên và thư giãn thôi bạn ơi! 🌇✨",
    "Tan làm về nhà an toàn nhé! Cần tổng kết ví tiền hay chốt sổ nợ hôm nay thì cứ để Najimez lo chu đáo! 🛵🏠",
    "Một ngày làm việc vất vả rồi! Najimez chúc bạn có một buổi tối thật ấm áp và dễ chịu nhé! 💜"
  ],
  evening: [ // 19:30 - 22:30: Tối ấm cúng, trò chuyện, tổng kết
    "Ghé thăm Najimez vào buổi tối thế này làm mình vui quá đi! Hôm nay của bạn thế nào rồi nè? 🌙✨",
    "Thời điểm vàng để thảnh thơi trò chuyện nè! Có chuyện gì vui hay tâm sự gì muốn kể cho Najimez nghe không? 📖🎧",
    "Một buổi tối bình yên nhé! Cần Najimez giải bài tập, cân đối chi tiêu hay lên kế hoạch cho ngày mai nào? 🍵✨",
    "Trời đêm mát mẻ, ngồi nhâm nhi trà và trò chuyện cùng Najimez là chuẩn bài luôn đó! 🌃💫"
  ],
  night: [ // 22:30 - 05:00: Đêm muộn, cú đêm, nhắc ngủ sớm
    "Cú đêm ơi, bạn vẫn còn thức sao? Nhớ đừng thức khuya quá kẻo mệt mỏi nhé, Najimez lo đấy! 🦉💤",
    "Khuya rồi mà vẫn chăm chỉ thế này sao? Làm nốt việc rồi đi ngủ sớm để giữ gìn sức khỏe nha bạn ơi! 🌌✨",
    "Không gian về đêm tĩnh lặng thật tuyệt! Nếu chưa ngủ được thì cứ trò chuyện với Najimez một lát nhé 🌠",
    "Đêm đã khuya rồi, thả lỏng tâm trí và chuẩn bị có giấc mơ đẹp bạn nhé! Najimez luôn ở đây trực cho bạn 🌙😴"
  ]
};

const NAJIMEZ_HEADER_TITLES = {
  dawn: [
    { title: "Bình minh rực rỡ, ngày mới khởi sắc! ☀️", sub: "Najimez đồng hành cùng bạn chinh phục mọi mục tiêu hôm nay" },
    { title: "Chào ngày mới tràn đầy năng lượng! ☕", sub: "Nạp trọn niềm vui và bắt đầu ngày làm việc thật hiệu quả nhé" }
  ],
  morning: [
    { title: "Tập trung cao độ, bứt phá năng suất! 🚀", sub: "Trợ lý ảo Najimez luôn sẵn sàng tiếp sức cho bạn 24/7" },
    { title: "Hôm nay của bạn đang diễn ra tuyệt vời chứ? 🎯", sub: "Cần tính toán thu chi hay xử lý bài vở, cứ giao cho Najimez" }
  ],
  noon: [
    { title: "Nghỉ trưa nạp năng lượng thôi bạn ơi! 🍱", sub: "Thưởng thức bữa trưa ngon miệng và nghỉ ngơi một chút nhé" },
    { title: "Buổi trưa thanh thản và ngon miệng nha! 🍜", sub: "Najimez luôn túc trực, thảnh thơi nạp lại pin nào" }
  ],
  afternoon: [
    { title: "Buổi chiều sảng khoái, vững bước về đích! 🧋", sub: "Thêm chút ngọt ngào để tinh thần luôn hào hứng làm việc nhé" },
    { title: "Tăng tốc năng suất cùng Najimez! 📊", sub: "Kiểm tra sổ nợ, cân đối chi tiêu và xử lý công việc thần tốc" }
  ],
  dusk: [
    { title: "Hoàng hôn buông rồi, gác lại âu lo nhé! 🌆", sub: "Một ngày nỗ lực tuyệt vời, bạn đã làm rất tốt hôm nay" },
    { title: "Tan làm về nhà an toàn và ấm áp nha! 🛵", sub: "Trợ lý thông minh Najimez chúc bạn buổi chiều tối an lành" }
  ],
  evening: [
    { title: "Buổi tối ấm cúng và thảnh thơi cùng Najimez! 🌙", sub: "Không gian lý tưởng để tổng kết ngày dài và chia sẻ tâm sự" },
    { title: "Rất vui được gặp lại bạn tối nay! 💜", sub: "Có chuyện gì thú vị hay cần lên kế hoạch, Najimez lắng nghe bạn" }
  ],
  night: [
    { title: "Đêm đã về khuya, giữ gìn sức khỏe bạn nhé! 🦉", sub: "Đừng thức quá khuya nha, Najimez chúc bạn ngủ ngon giấc" },
    { title: "Không gian tĩnh lặng, Najimez vẫn bên bạn 🌌", sub: "Thả lỏng tinh thần và chuẩn bị cho giấc ngủ ngọt ngào nhé" }
  ]
};

function getTimeSlot() {
  const now = new Date();
  const timeVal = now.getHours() + now.getMinutes() / 60;
  if (timeVal >= 5 && timeVal < 8.5) return 'dawn';
  if (timeVal >= 8.5 && timeVal < 11.5) return 'morning';
  if (timeVal >= 11.5 && timeVal < 13.5) return 'noon';
  if (timeVal >= 13.5 && timeVal < 17.5) return 'afternoon';
  if (timeVal >= 17.5 && timeVal < 19.5) return 'dusk';
  if (timeVal >= 19.5 && timeVal < 22.5) return 'evening';
  return 'night';
}

function getDynamicGreeting() {
  const slot = getTimeSlot();
  const list = NAJIMEZ_GREETINGS[slot] || NAJIMEZ_GREETINGS.evening;
  return list[Math.floor(Math.random() * list.length)];
}

function updateHeaderGreeting() {
  const titleEl = document.getElementById('headerGreetingText');
  const subEl = document.querySelector('.header-greeting .header-sub');
  const slot = getTimeSlot();
  const list = NAJIMEZ_HEADER_TITLES[slot] || NAJIMEZ_HEADER_TITLES.evening;
  const picked = list[Math.floor(Math.random() * list.length)];

  if (titleEl && picked && picked.title) titleEl.textContent = picked.title;
  if (subEl && picked && picked.sub) subEl.textContent = picked.sub;
}


function updateHeaderStats() {
  const data = typeof getLedgerData === 'function' ? getLedgerData() : {};
  const netEl = document.getElementById('headerNetCashflow');
  const eventEl = document.getElementById('headerTodayEvents') || document.getElementById('headerPendingTasks');

  let net = 0;
  if (Array.isArray(data.transactions)) {
    data.transactions.forEach(t => {
      if (t.type === 'income') net += Number(t.amount) || 0;
      else if (t.type === 'expense') net -= Number(t.amount) || 0;
    });
  }

  if (netEl) {
    const sign = net > 0 ? '+' : '';
    netEl.textContent = `${sign}${formatCurrency(net)}`;
    const bubble = netEl.closest('.stat-bubble');
    if (bubble) {
      if (net >= 0) {
        bubble.className = 'stat-bubble green';
      } else {
        bubble.className = 'stat-bubble purple';
      }
    }
  }

  // Đếm số sự kiện trong ngày hôm nay ở Lịch
  if (eventEl) {
    const events = Array.isArray(data.calendarEvents) ? data.calendarEvents : [];
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayKey = `${yyyy}-${mm}-${dd}`;

    let todayEventsCount = 0;
    if (typeof isEventOccurringOnDate === 'function') {
      todayEventsCount = events.filter(e => isEventOccurringOnDate(e, todayKey)).length;
    } else {
      todayEventsCount = events.filter(e => {
        if (!e) return false;
        if (e.date === todayKey) return true;
        if (e.endDate && todayKey >= e.date && todayKey <= e.endDate) return true;
        return false;
      }).length;
    }

    eventEl.textContent = `${todayEventsCount} sự kiện`;
  }
}

function initLedgerAndStats() {
  updateHeaderGreeting();
  updateHeaderStats();
  if (typeof renderFinanceTab === 'function') renderFinanceTab();
  if (typeof renderTodosTab === 'function') renderTodosTab();

  // Nhấp vào ô Sự Kiện Hôm Nay để chuyển nhanh đến tab Lịch & Sự Kiện
  const btnTodayEvents = document.getElementById('btnHeaderTodayEvents');
  if (btnTodayEvents && !btnTodayEvents.dataset.bound) {
    btnTodayEvents.dataset.bound = 'true';
    btnTodayEvents.addEventListener('click', () => {
      const calTabBtn = document.querySelector('.sidebar-nav .nav-item[data-tab="tab-calendar"]');
      if (calTabBtn) calTabBtn.click();
    });
  }
}

function notifyChat(markdownText) {
  const feed = document.getElementById('copilotFeed');
  if (!feed) return;
  const msg = document.createElement('div');
  msg.className = 'chat-msg ai';
  msg.innerHTML = `
    <div class="msg-avt"><img src="assets/najimez.jpg" alt="Najimez" class="ai-avatar-img" /></div>
    <div class="msg-text-bubble">${typeof renderMarkdown === 'function' ? renderMarkdown(markdownText) : markdownText}</div>
  `;
  feed.appendChild(msg);
  feed.scrollTop = feed.scrollHeight;
}

let appConfirmResolve = null;

function showAppConfirm(message, options = {}) {
  const modal = document.getElementById('appConfirmModal');
  const msgEl = document.getElementById('appConfirmMessage');
  const titleEl = document.getElementById('appConfirmTitle');
  const acceptBtn = document.getElementById('btnAppConfirmAccept');
  const cancelBtn = document.getElementById('btnAppConfirmCancel');
  const closeBtn = document.getElementById('btnCloseAppConfirmModal');

  if (!modal || !msgEl || !acceptBtn || !cancelBtn) {
    return Promise.resolve(window.confirm(message));
  }

  if (titleEl) titleEl.textContent = options.title || 'Xác nhận';
  msgEl.textContent = message;

  if (options.btnText) {
    const icon = options.btnIcon ? `<i class="${options.btnIcon}"></i> ` : '';
    acceptBtn.innerHTML = `${icon}${typeof escapeHTML === 'function' ? escapeHTML(options.btnText) : options.btnText}`;
  } else {
    acceptBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Xác nhận xóa`;
  }

  modal.classList.add('active');

  return new Promise((resolve) => {
    appConfirmResolve = resolve;

    function cleanup(result) {
      modal.classList.remove('active');
      acceptBtn.removeEventListener('click', onAccept);
      cancelBtn.removeEventListener('click', onCancel);
      if (closeBtn) closeBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      window.removeEventListener('keydown', onKeyDown);
      if (appConfirmResolve) {
        appConfirmResolve(result);
        appConfirmResolve = null;
      }
    }

    function onAccept() { cleanup(true); }
    function onCancel() { cleanup(false); }
    function onBackdrop(e) {
      if (e.target === modal) cleanup(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') cleanup(false);
    }

    acceptBtn.addEventListener('click', onAccept);
    cancelBtn.addEventListener('click', onCancel);
    if (closeBtn) closeBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    window.addEventListener('keydown', onKeyDown);
  });
}

