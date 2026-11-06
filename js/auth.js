/**
 * js/auth.js - Module xác thực tài khoản Google (Firebase Authentication) cho Najimez
 * Quản lý phiên đăng nhập và định danh tài khoản để phân tách dữ liệu riêng biệt.
 * Tuân thủ quy chuẩn Code Modularization (< 500 dòng).
 */

window.currentUser = null;
window.currentUserUid = null;

// Lấy UID tài khoản đang đăng nhập
function getCurrentUserUid() {
  return window.currentUserUid || (window.currentUser && window.currentUser.uid) || null;
}

// Khởi tạo và lắng nghe trạng thái đăng nhập Firebase Auth
function initAuthModule() {
  if (typeof firebase === 'undefined') {
    console.warn('[Auth] Firebase SDK chưa sẵn sàng');
    return;
  }

  // Đảm bảo Firebase App đã được khởi tạo
  if (!firebase.apps || !firebase.apps.length) {
    if (typeof initFirebaseModule === 'function') {
      initFirebaseModule();
    }
  }
  if (!firebase.apps || !firebase.apps.length) {
    console.warn('[Auth] Chưa thể khởi tạo Firebase App');
    return;
  }

  try {
    const auth = firebase.auth();

    // Lắng nghe thay đổi trạng thái phiên đăng nhập
    auth.onAuthStateChanged(async (user) => {
      await handleAuthStateChanged(user);
    });

    // Gắn sự kiện các nút đăng nhập / đăng xuất
    const btnGoogleLogin = document.getElementById('btnSidebarGoogleLogin');
    const btnLogout = document.getElementById('btnSidebarLogout');
    const btnHeaderUser = document.getElementById('btnHeaderUserProfile');

    if (btnGoogleLogin) {
      btnGoogleLogin.addEventListener('click', loginWithGoogle);
    }
    if (btnLogout) {
      btnLogout.addEventListener('click', logoutGoogleUser);
    }
    if (btnHeaderUser) {
      btnHeaderUser.addEventListener('click', () => {
        if (window.currentUser) {
          logoutGoogleUser();
        } else {
          loginWithGoogle();
        }
      });
    }
  } catch (err) {
    console.error('[Auth] Lỗi khởi tạo Auth:', err);
  }
}

// Xử lý khi trạng thái tài khoản thay đổi (Đăng nhập / Đăng xuất)
async function handleAuthStateChanged(user) {
  if (user && !user.isAnonymous) {
    window.currentUser = user;
    window.currentUserUid = user.uid;
    console.log('[Auth] Đã đăng nhập tài khoản Google:', user.displayName, user.email);
  } else {
    window.currentUser = null;
    window.currentUserUid = null;
    console.log('[Auth] Đang ở chế độ Khách (Offline)');
  }

  // Cập nhật giao diện thẻ người dùng
  updateUserAuthUI();

  // Đăng ký lại lắng nghe dữ liệu đám mây cho tài khoản này
  if (typeof subscribeToCloudChanges === 'function') {
    subscribeToCloudChanges();
  }

  // Nếu là tài khoản Google, tự động nạp từ Cloud hoặc di chuyển dữ liệu
  if (window.currentUserUid && typeof syncOrMigrateUserData === 'function') {
    await syncOrMigrateUserData();
  }

  // Làm mới giao diện theo kho dữ liệu của tài khoản hiện tại
  if (typeof updateHeaderStats === 'function') updateHeaderStats();
  if (typeof renderFinanceTab === 'function') renderFinanceTab();
  if (typeof renderTodosTab === 'function') renderTodosTab();
  if (typeof renderCalendarTab === 'function') renderCalendarTab();
  if (typeof renderTimetableTab === 'function') renderTimetableTab();
  if (typeof updateNotebookBadge === 'function') updateNotebookBadge();
  if (typeof renderNotebookUI === 'function') renderNotebookUI();
  if (typeof renderFlashcardUI === 'function') renderFlashcardUI();
  if (typeof initFriendsForUser === 'function') initFriendsForUser(user);
}

// Đăng nhập bằng Google
async function loginWithGoogle() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    alert('Firebase Auth chưa sẵn sàng, vui lòng kiểm tra kết nối mạng!');
    return;
  }

  const auth = firebase.auth();
  try {
    // Đảm bảo duy trì đăng nhập sau khi tắt mở lại trình duyệt
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  } catch (e) {}

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await auth.signInWithPopup(provider);
    if (result && result.user) {
      if (typeof showCustomToast === 'function') {
        showCustomToast(`👋 Chào mừng ${result.user.displayName || 'bạn'}! Mọi dữ liệu đã được tự động đồng bộ.`);
      }
    }
  } catch (err) {
    console.error('[Auth] Lỗi đăng nhập Google:', err);
    if (err.code === 'auth/popup-blocked') {
      auth.signInWithRedirect(provider);
      return;
    }
    if (err.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      alert(`⚠️ Tên miền "${currentDomain}" chưa được cấp quyền đăng nhập trong Firebase!\n\nCách khắc phục (chỉ mất 30 giây):\n1. Mở Firebase Console > Dự án najimez\n2. Vào mục Authentication > Settings (Cài đặt) > Authorized domains\n3. Bấm "Add domain" (Thêm miền) và dán: ${currentDomain}\n4. Bấm "Add" rồi quay lại đây đăng nhập là được ngay!`);
    } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
      alert('Vui lòng bật Google Provider trong Firebase Console > Authentication > Sign-in method!');
    } else if (err.code !== 'auth/popup-closed-by-user') {
      alert('Lỗi đăng nhập Google: ' + (err.message || 'Không thể đăng nhập'));
    }
    if (typeof updateSyncStatusUI === 'function') {
      updateSyncStatusUI('online', 'Sẵn sàng');
    }
  }
}

// Đăng xuất Google
async function logoutGoogleUser() {
  if (typeof firebase === 'undefined' || !firebase.auth) return;
  const confirmed = typeof showAppConfirm === 'function'
    ? await showAppConfirm('Bạn có chắc muốn đăng xuất khỏi tài khoản Google này?', {
        title: 'Đăng xuất tài khoản',
        btnText: 'Đăng xuất',
        btnIcon: 'fa-solid fa-arrow-right-from-bracket'
      })
    : confirm('Bạn có chắc muốn đăng xuất khỏi tài khoản Google này?');
  if (!confirmed) return;

  try {
    await firebase.auth().signOut();
    if (typeof showCustomToast === 'function') {
      showCustomToast('Đã đăng xuất tài khoản Google');
    }
  } catch (err) {
    console.error('[Auth] Lỗi đăng xuất:', err);
  }
}

// Cập nhật giao diện thẻ tài khoản người dùng (Sidebar & Header)
function updateUserAuthUI() {
  const user = window.currentUser;
  const guestView = document.getElementById('userGuestView');
  const loggedView = document.getElementById('userLoggedView');
  const avatarImg = document.getElementById('sidebarUserAvatarImg');
  const nameEl = document.getElementById('sidebarUserName');
  const emailEl = document.getElementById('sidebarUserEmail');
  const headerBtn = document.getElementById('btnHeaderUserProfile');
  const headerAvatar = document.getElementById('headerUserAvatarImg');
  const headerGuestIcon = document.getElementById('headerUserGuestIcon');

  if (user && !user.isAnonymous) {
    if (guestView) guestView.style.display = 'none';
    if (loggedView) loggedView.style.display = 'flex';
    if (avatarImg) {
      avatarImg.src = user.photoURL || 'assets/najimez.jpg';
      avatarImg.alt = user.displayName || 'User';
    }
    if (nameEl) nameEl.textContent = user.displayName || 'Tài khoản Google';
    if (emailEl) emailEl.textContent = user.email || '';

    if (headerBtn) {
      headerBtn.classList.add('logged-in');
      headerBtn.title = `Tài khoản: ${user.displayName || user.email} (Dữ liệu luôn tự động đồng bộ • Bấm để đăng xuất)`;
    }
    if (headerAvatar) {
      headerAvatar.src = user.photoURL || 'assets/najimez.jpg';
      headerAvatar.style.display = 'block';
    }
    if (headerGuestIcon) {
      headerGuestIcon.style.display = 'none';
    }
  } else {
    if (guestView) guestView.style.display = 'flex';
    if (loggedView) loggedView.style.display = 'none';

    if (headerBtn) {
      headerBtn.classList.remove('logged-in');
      headerBtn.title = 'Đăng nhập Google (Tự động đồng bộ mọi dữ liệu lên Đám mây)';
    }
    if (headerAvatar) {
      headerAvatar.style.display = 'none';
    }
    if (headerGuestIcon) {
      headerGuestIcon.style.display = 'inline-block';
    }
  }

  // Đồng bộ cập nhật ảnh đại diện người dùng trong toàn bộ bong bóng chat
  updateUserChatAvatars();
}

// Lấy URL ảnh đại diện của người dùng (Google Photo URL hoặc header avatar)
function getUserAvatarUrl() {
  const user = window.currentUser;
  if (user && user.photoURL) {
    return user.photoURL;
  }
  const headerAvatar = document.getElementById('headerUserAvatarImg');
  if (headerAvatar && headerAvatar.style.display !== 'none' && headerAvatar.src && !headerAvatar.src.endsWith('assets/najimez.jpg')) {
    return headerAvatar.src;
  }
  const sidebarAvatar = document.getElementById('sidebarUserAvatarImg');
  if (sidebarAvatar && sidebarAvatar.src && !sidebarAvatar.src.endsWith('assets/najimez.jpg')) {
    return sidebarAvatar.src;
  }
  return null;
}

// Cập nhật lại avatar của các tin nhắn người dùng trong khung chat
function updateUserChatAvatars() {
  const photo = getUserAvatarUrl();
  const userAvatars = document.querySelectorAll('.chat-msg.user .msg-avt');
  userAvatars.forEach(avt => {
    if (photo) {
      avt.innerHTML = `<img src="${escapeHTML(photo)}" alt="User" class="user-avatar-img" onerror="this.parentElement.innerHTML = '<i class=\\'fa-solid fa-user\\'></i>';" />`;
    } else {
      avt.innerHTML = '<i class="fa-solid fa-user"></i>';
    }
  });
}

// Xuất các hàm ra phạm vi toàn cục
window.getCurrentUserUid = getCurrentUserUid;
window.initAuthModule = initAuthModule;
window.loginWithGoogle = loginWithGoogle;
window.logoutGoogleUser = logoutGoogleUser;
window.updateUserAuthUI = updateUserAuthUI;
window.getUserAvatarUrl = getUserAvatarUrl;
window.updateUserChatAvatars = updateUserChatAvatars;
