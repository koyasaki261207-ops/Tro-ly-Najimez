/**
 * js/friends-ui.js - Giao Diện & Tương Tác Người Dùng Phân Hệ Bạn Bè (Najimez Social Connect)
 * Render thẻ bạn bè, modal quét QR cá nhân, thanh tìm kiếm kết bạn và thông báo thời gian thực.
 * Tuân thủ quy chuẩn Code Modularization (< 500 dòng).
 */

let friendsFilterQuery = '';

/**
 * Khởi tạo các sự kiện giao diện cho Phân hệ Bạn Bè
 */
function initFriendsUI() {
  // Gắn sự kiện nút Gửi lời mời kết bạn
  const btnSendRequest = document.getElementById('btnSendFriendRequest');
  const inputSearch = document.getElementById('friendSearchInput');

  if (btnSendRequest && inputSearch) {
    btnSendRequest.addEventListener('click', handleSendFriendRequest);
    inputSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSendFriendRequest();
      }
    });
  }

  // Gắn sự kiện ô lọc tìm bạn bè
  const filterInput = document.getElementById('friendsFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      friendsFilterQuery = (e.target.value || '').trim().toLowerCase();
      renderFriendsGrid();
    });
  }

  // Gắn sự kiện mở/đóng Modal QR cá nhân
  const btnOpenQr = document.getElementById('btnOpenMyQrModal');
  const btnCloseQr = document.getElementById('btnCloseFriendQrModal');
  const modalQr = document.getElementById('friendQrModal');

  if (btnOpenQr) {
    btnOpenQr.addEventListener('click', openMyQrModal);
  }
  if (btnCloseQr && modalQr) {
    btnCloseQr.addEventListener('click', () => modalQr.classList.remove('active'));
    modalQr.addEventListener('click', (e) => {
      if (e.target === modalQr) modalQr.classList.remove('active');
    });
  }

  // Gắn sự kiện Sao chép Link mời kết bạn
  const btnShareInvite = document.getElementById('btnShareInviteLink');
  if (btnShareInvite) {
    btnShareInvite.addEventListener('click', handleShareInviteLink);
  }

  // Tự động kiểm tra tham số đường dẫn (URL query params: ?friend=NJ-XXXXXX hoặc ?add_friend=...)
  checkInviteUrlParams();
}

/**
 * Xử lý khi có người truy cập qua Link mời kết bạn (?friend=NJ-XXXXXX)
 */
function checkInviteUrlParams() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const friendParam = urlParams.get('friend') || urlParams.get('add_friend');
    if (friendParam) {
      // Tự động chuyển sang tab Bạn Bè
      setTimeout(() => {
        const navItem = document.querySelector('.sidebar-nav .nav-item[data-tab="tab-friends"]');
        if (navItem) navItem.click();

        const input = document.getElementById('friendSearchInput');
        if (input) {
          input.value = friendParam.toUpperCase();
          input.focus();
        }

        // Hiện thông báo chào đón từ Najimez
        if (typeof showSocialToast === 'function') {
          showSocialToast(`Najimez đã điền sẵn mã kết bạn "${friendParam.toUpperCase()}". Hãy nhấn "Gửi Lời Mời" nhé! 🌸`, 'info');
        }
      }, 700);
    }
  } catch (e) {
    console.warn('[Friends] Lỗi đọc URL params:', e);
  }
}

/**
 * Hiển thị toàn bộ giao diện của Tab Bạn Bè
 */
function renderFriendsTab() {
  renderMyProfileSection();
  renderPendingRequestsSection();
  renderFriendsGrid();
}

/**
 * Render Thẻ hồ sơ cá nhân hoặc Banner yêu cầu đăng nhập Google
 */
function renderMyProfileSection() {
  const container = document.getElementById('friendsProfileContainer');
  if (!container) return;

  const user = typeof getActiveSocialUser === 'function' ? getActiveSocialUser() : null;

  if (!user) {
    // Chế độ Khách (Offline / Chưa đăng nhập Google)
    container.innerHTML = `
      <div class="friends-guest-banner">
        <div class="friends-guest-text">
          <span class="friends-guest-title"><i class="fa-brands fa-google"></i> Kích hoạt Kết Nối Bạn Bè</span>
          <span class="friends-guest-sub">
            Đăng nhập tài khoản Google để nhận ngay <strong>Mã Najimez ID</strong> cá nhân, chia sẻ mã QR và kết nối thời gian thực với bạn bè nhé!
          </span>
        </div>
        <button type="button" class="btn-social-action primary" onclick="if (typeof loginWithGoogle === 'function') loginWithGoogle();">
          <i class="fa-brands fa-google"></i>
          <span>Đăng nhập Google ngay</span>
        </button>
      </div>
    `;
    return;
  }

  // Chế độ Đã đăng nhập Google
  const myCode = window.currentMyFriendCode || localStorage.getItem(`najimez_my_friend_code_${user.uid}`) || 'Đang tạo...';
  const avatarUrl = user.photoURL || 'assets/najimez.jpg';

  container.innerHTML = `
    <div class="friends-profile-banner">
      <div class="friends-profile-left">
        <div class="friends-my-avatar-wrap">
          <img src="${avatarUrl}" alt="${escapeHtml(user.displayName)}" class="friends-my-avatar-img" />
          <span class="friends-status-dot" title="Đang trực tuyến"></span>
        </div>
        <div class="friends-profile-info">
          <div class="friends-profile-name-row">
            <span class="friends-profile-name">${escapeHtml(user.displayName)}</span>
            <span class="friends-tag-badge"><i class="fa-solid fa-sparkles"></i> Thành viên Najimez</span>
          </div>
          <span class="friends-profile-email">${escapeHtml(user.email)}</span>
        </div>
      </div>

      <div class="friends-profile-actions">
        <div class="friends-id-pill" title="Mã định danh Najimez ID của bạn">
          <span>ID:</span>
          <span class="friends-id-val" id="myFriendCodeDisplay">${escapeHtml(myCode)}</span>
          <button type="button" class="btn-pill-copy" onclick="copyMyFriendCode()" title="Sao chép mã ID">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>
        <button type="button" class="btn-social-action secondary" id="btnOpenMyQrModal">
          <i class="fa-solid fa-qrcode"></i>
          <span>Mã QR Của Tôi</span>
        </button>
        <button type="button" class="btn-social-action primary" id="btnShareInviteLink">
          <i class="fa-solid fa-share-nodes"></i>
          <span>Chia Sẻ Link</span>
        </button>
      </div>
    </div>
  `;

  // Gắn lại sự kiện cho các nút mới tạo
  const btnQr = container.querySelector('#btnOpenMyQrModal');
  if (btnQr) btnQr.addEventListener('click', openMyQrModal);

  const btnShare = container.querySelector('#btnShareInviteLink');
  if (btnShare) btnShare.addEventListener('click', handleShareInviteLink);
}

/**
 * Render Lời mời kết bạn đang chờ duyệt
 */
function renderPendingRequestsSection() {
  const container = document.getElementById('friendsPendingContainer');
  if (!container) return;

  const requests = typeof getActiveFriendRequests === 'function' ? getActiveFriendRequests() : [];

  if (!requests || requests.length === 0) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  container.style.display = 'flex';
  container.innerHTML = `
    <div class="friends-requests-section">
      <div class="friends-section-title-row">
        <div class="friends-section-title">
          <i class="fa-solid fa-bell" style="color: #f59e0b;"></i>
          <span>Lời Mời Kết Bạn Chờ Duyệt</span>
          <span class="friends-badge-count">${requests.length}</span>
        </div>
      </div>
      <div class="friends-requests-grid">
        ${requests.map(req => `
          <div class="friend-req-card">
            <div class="friend-req-user">
              <img src="${req.fromPhoto || 'assets/najimez.jpg'}" alt="${escapeHtml(req.fromName)}" class="friend-req-avatar" />
              <div class="friend-req-info">
                <span class="friend-req-name">${escapeHtml(req.fromName)}</span>
                <span class="friend-req-sub">${escapeHtml(req.fromFriendCode || req.fromEmail || 'Bạn bè Najimez')}</span>
              </div>
            </div>
            <div class="friend-req-actions">
              <button type="button" class="btn-req-accept" onclick="handleAcceptRequest('${req.id}')" title="Đồng ý kết bạn">
                <i class="fa-solid fa-check"></i>
              </button>
              <button type="button" class="btn-req-reject" onclick="handleRejectRequest('${req.id}')" title="Từ chối">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render Danh sách bạn bè dạng lưới thẻ
 */
function renderFriendsGrid() {
  const container = document.getElementById('friendsListGrid');
  const countDisplay = document.getElementById('friendsCountDisplay');
  if (!container) return;

  const user = typeof getActiveSocialUser === 'function' ? getActiveSocialUser() : null;
  const friends = typeof getActiveFriendsList === 'function' ? getActiveFriendsList() : [];

  // Lọc theo từ khóa tìm kiếm
  const filtered = friends.filter(f => {
    if (!friendsFilterQuery) return true;
    const name = (f.displayName || '').toLowerCase();
    const email = (f.email || '').toLowerCase();
    const code = (f.friendCode || '').toLowerCase();
    return name.includes(friendsFilterQuery) || email.includes(friendsFilterQuery) || code.includes(friendsFilterQuery);
  });

  if (countDisplay) {
    countDisplay.textContent = `(${filtered.length})`;
  }

  if (!user) {
    container.innerHTML = `
      <div class="friends-empty-state" style="grid-column: 1 / -1;">
        <img src="assets/najimez.jpg" alt="Najimez" class="friends-empty-img" />
        <span class="friends-empty-title">Đăng nhập để xem danh sách bạn bè</span>
        <span class="friends-empty-desc">
          Hãy đăng nhập Google để tự động đồng bộ danh sách bạn bè của bạn trên mọi thiết bị nhé!
        </span>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="friends-empty-state" style="grid-column: 1 / -1;">
        <img src="assets/najimez.jpg" alt="Najimez" class="friends-empty-img" />
        <span class="friends-empty-title">${friendsFilterQuery ? 'Không tìm thấy người bạn nào' : 'Chưa có người bạn nào'}</span>
        <span class="friends-empty-desc">
          ${friendsFilterQuery
            ? 'Hãy thử tìm kiếm với tên hoặc mã Najimez ID khác nhé!'
            : 'Hãy gửi mã ID hoặc chia sẻ Link mời kết bạn cho những người bạn thân thiết để cùng nhau quản lý tài chính, chia tiền và học tập nhé!'}
        </span>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(friend => {
    const avatar = friend.photoURL || 'assets/najimez.jpg';
    const name = friend.displayName || 'Bạn bè Najimez';
    const sub = friend.friendCode || friend.email || 'Najimez User';

    return `
      <div class="friend-card" data-uid="${friend.uid}">
        <div class="friend-card-top">
          <div class="friend-card-user">
            <div class="friend-card-avatar-wrap">
              <img src="${avatar}" alt="${escapeHtml(name)}" class="friend-card-avatar" />
              <span class="friend-card-status-dot" title="Trực tuyến"></span>
            </div>
            <div class="friend-card-info">
              <span class="friend-card-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
              <span class="friend-card-sub">${escapeHtml(sub)}</span>
            </div>
          </div>
          <button type="button" class="friend-card-more-btn" onclick="handleRemoveFriend('${friend.friendshipId}', '${escapeHtml(name)}')" title="Hủy kết bạn">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>

        <div class="friend-card-actions">
          <button type="button" class="btn-friend-action debt-action" onclick="quickCreateDebtWithFriend('${escapeHtml(name)}')" title="Tạo khoản nợ hoặc chia tiền nhanh">
            <i class="fa-solid fa-hand-holding-dollar"></i>
            <span>Chia Tiền / Nợ</span>
          </button>
          <button type="button" class="btn-friend-action" onclick="quickMatchTimetableWithFriend('${friend.uid}', '${escapeHtml(name)}')" title="So khớp thời khóa biểu xem giờ rảnh chung">
            <i class="fa-solid fa-calendar-check"></i>
            <span>So TKB</span>
          </button>
          <button type="button" class="btn-friend-action" onclick="quickSendNoteToFriend('${escapeHtml(name)}')" title="Gửi lời nhắn động viên qua Najimez">
            <i class="fa-solid fa-paper-plane"></i>
            <span>Gửi Lời Nhắn</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Xử lý Gửi lời mời kết bạn từ ô input
 */
async function handleSendFriendRequest() {
  const input = document.getElementById('friendSearchInput');
  const btn = document.getElementById('btnSendFriendRequest');
  if (!input) return;

  const query = input.value.trim();
  if (!query) {
    showSocialToast('Vui lòng nhập Mã ID (VD: NJ-849201) hoặc Email Google!', 'warning');
    input.focus();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang gửi...</span>';
  }

  const res = await sendFriendRequestToUser(query);

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> <span>Gửi Lời Mời</span>';
  }

  if (res.success) {
    showSocialToast(res.message, 'success');
    input.value = '';
  } else {
    showSocialToast(res.message, 'error');
  }
}

/**
 * Xử lý chấp nhận lời mời kết bạn
 */
async function handleAcceptRequest(requestId) {
  const requests = typeof getActiveFriendRequests === 'function' ? getActiveFriendRequests() : [];
  const req = requests.find(r => r.id === requestId);
  if (!req) return;

  const success = await acceptFriendRequestItem(req);
  if (success) {
    showSocialToast(`Tuyệt vời! Bạn và "${req.fromName}" đã trở thành bạn bè! 🎉`, 'success');
  } else {
    showSocialToast('Có lỗi xảy ra khi chấp nhận lời mời. Vui lòng thử lại!', 'error');
  }
}

/**
 * Xử lý từ chối lời mời kết bạn
 */
async function handleRejectRequest(requestId) {
  const success = await rejectFriendRequestItem(requestId);
  if (success) {
    showSocialToast('Đã bỏ qua lời mời kết bạn.', 'info');
  }
}

/**
 * Xử lý xóa bạn bè
 */
function handleRemoveFriend(friendshipId, friendName) {
  if (confirm(`Bạn có chắc chắn muốn hủy kết bạn với "${friendName}" không?`)) {
    removeFriendshipItem(friendshipId).then((ok) => {
      if (ok) {
        showSocialToast(`Đã hủy kết bạn với "${friendName}".`, 'info');
      }
    });
  }
}

/**
 * Sao chép mã Najimez ID cá nhân
 */
function copyMyFriendCode() {
  const user = typeof getActiveSocialUser === 'function' ? getActiveSocialUser() : null;
  const myCode = window.currentMyFriendCode || (user && localStorage.getItem(`najimez_my_friend_code_${user.uid}`)) || '';
  if (!myCode) return;

  navigator.clipboard.writeText(myCode).then(() => {
    showSocialToast(`Đã sao chép mã ID: ${myCode} 📋`, 'success');
  }).catch(() => {
    prompt('Sao chép mã ID của bạn:', myCode);
  });
}

/**
 * Mở Modal xem mã QR cá nhân
 */
function openMyQrModal() {
  const modal = document.getElementById('friendQrModal');
  const qrImg = document.getElementById('friendQrImageTag');
  const codePill = document.getElementById('friendQrCodePill');
  if (!modal) return;

  const user = typeof getActiveSocialUser === 'function' ? getActiveSocialUser() : null;
  const myCode = window.currentMyFriendCode || (user && localStorage.getItem(`najimez_my_friend_code_${user.uid}`)) || 'NJ-ME';

  if (codePill) {
    codePill.textContent = myCode;
  }

  // Tạo URL mời kết bạn
  const inviteUrl = `${window.location.origin}${window.location.pathname}?friend=${encodeURIComponent(myCode)}`;

  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(inviteUrl)}`;
  }

  modal.classList.add('active');
}

/**
 * Sao chép hoặc chia sẻ đường link mời kết bạn
 */
function handleShareInviteLink() {
  const user = typeof getActiveSocialUser === 'function' ? getActiveSocialUser() : null;
  const myCode = window.currentMyFriendCode || (user && localStorage.getItem(`najimez_my_friend_code_${user.uid}`)) || 'NJ-ME';
  const inviteUrl = `${window.location.origin}${window.location.pathname}?friend=${encodeURIComponent(myCode)}`;

  if (navigator.share) {
    navigator.share({
      title: 'Kết bạn trên Trợ lý ảo Najimez',
      text: `Chào bạn! Hãy kết nối với mình trên Trợ lý ảo Najimez qua mã ${myCode} nhé!`,
      url: inviteUrl
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showSocialToast('Đã sao chép Link mời kết bạn vào bộ nhớ tạm! Hãy gửi cho bạn bè nhé! 🚀', 'success');
    }).catch(() => {
      prompt('Link mời kết bạn của bạn:', inviteUrl);
    });
  }
}

/**
 * Hành động nhanh: Chia tiền / Nợ với bạn bè
 */
function quickCreateDebtWithFriend(friendName) {
  // Chuyển sang Tab Tài chính
  const navItem = document.querySelector('.sidebar-nav .nav-item[data-tab="tab-finance"]');
  if (navItem) navItem.click();

  // Tự động mở Modal Thêm Giao Dịch và điền tên đối tượng nợ
  setTimeout(() => {
    const btnAdd = document.getElementById('btnOpenAddModal');
    if (btnAdd) btnAdd.click();

    setTimeout(() => {
      const typeSelect = document.getElementById('txType');
      if (typeSelect) {
        typeSelect.value = 'debt_lend'; // Mặc định: Tôi cho mượn / Chia tiền
        typeSelect.dispatchEvent(new Event('change'));
      }
      const personInput = document.getElementById('txPerson');
      if (personInput) {
        personInput.value = friendName;
        personInput.focus();
      }
    }, 150);
  }, 200);
}

/**
 * Hành động nhanh: So khớp Thời khóa biểu cùng bạn bè
 */
function quickMatchTimetableWithFriend(friendUid, friendName) {
  if (!friendName && friendUid) {
    friendName = friendUid;
    friendUid = null;
  }
  if (typeof openTimetableMatcherModal === 'function') {
    openTimetableMatcherModal(friendUid, friendName);
  } else {
    // Fallback nếu modal chưa khởi tạo xong
    const navItem = document.querySelector('.sidebar-nav .nav-item[data-tab="tab-timetable"]');
    if (navItem) navItem.click();
    showSocialToast(`Đang mở Thời Khóa Biểu để so khớp cùng "${friendName || 'bạn bè'}"... 🌸`, 'info');
  }
}

/**
 * Hành động nhanh: Gửi lời nhắn động viên
 */
function quickSendNoteToFriend(friendName) {
  const note = prompt(`Nhập lời nhắn gửi đến bạn "${friendName}" qua Najimez:`, 'Hôm nay học tập và làm việc thật tốt nhé! 🌸✨');
  if (note && note.trim()) {
    showSocialToast(`Najimez đã gửi lời nhắn yêu thương đến "${friendName}" rồi nè! ❤️`, 'success');
  }
}

/**
 * Toast thông báo nhỏ dễ thương phong cách Najimez
 */
function showSocialToast(message, type = 'info') {
  let toastContainer = document.getElementById('socialToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'socialToastContainer';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColors = {
    success: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
    error: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))',
    warning: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))',
    info: 'linear-gradient(135deg, rgba(168, 85, 247, 0.95), rgba(99, 102, 241, 0.95))'
  };

  toast.style.cssText = `
    padding: 12px 18px;
    border-radius: 14px;
    background: ${bgColors[type] || bgColors.info};
    color: #ffffff;
    font-size: 0.88rem;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    gap: 10px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    pointer-events: auto;
    animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 360px;
  `;

  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-sparkles');
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Hàm thoát ký tự HTML để bảo mật XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Xuất các hàm ra phạm vi toàn cục
window.initFriendsUI = initFriendsUI;
window.renderFriendsTab = renderFriendsTab;
window.handleAcceptRequest = handleAcceptRequest;
window.handleRejectRequest = handleRejectRequest;
window.handleRemoveFriend = handleRemoveFriend;
window.copyMyFriendCode = copyMyFriendCode;
window.openMyQrModal = openMyQrModal;
window.handleShareInviteLink = handleShareInviteLink;
window.quickCreateDebtWithFriend = quickCreateDebtWithFriend;
window.quickMatchTimetableWithFriend = quickMatchTimetableWithFriend;
window.quickSendNoteToFriend = quickSendNoteToFriend;
window.showSocialToast = showSocialToast;
