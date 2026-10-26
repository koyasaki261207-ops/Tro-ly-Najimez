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

  // Nếu là tài khoản Google và trên máy chưa có dữ liệu, tự động kéo từ Firestore về
  if (window.currentUserUid && typeof getLedgerData === 'function') {
    const localData = getLedgerData();
    const isLocalEmpty = !localData || (
      (localData.transactions || []).length === 0 &&
      (localData.debts || []).length === 0 &&
      (localData.tasks || []).length === 0
    );
    if (isLocalEmpty && typeof pullLedgerFromFirebase === 'function') {
      await pullLedgerFromFirebase();
    }
  }

  // Làm mới giao diện theo kho dữ liệu của tài khoản hiện tại
  if (typeof updateHeaderStats === 'function') updateHeaderStats();
  if (typeof renderFinanceTab === 'function') renderFinanceTab();
  if (typeof renderTodosTab === 'function') renderTodosTab();
  if (typeof renderCalendarTab === 'function') renderCalendarTab();
  if (typeof renderTimetableTab === 'function') renderTimetableTab();
  if (typeof updateModalStatsUI === 'function') updateModalStatsUI();
}

// Đăng nhập bằng Google
async function loginWithGoogle() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    alert('Firebase Auth chưa sẵn sàng, vui lòng kiểm tra kết nối mạng!');
    return;
  }

  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    if (typeof updateSyncStatusUI === 'function') {
      updateSyncStatusUI('syncing', 'Đang đăng nhập Google...');
    }

    const result = await auth.signInWithPopup(provider);
    if (result && result.user) {
      if (typeof showCustomToast === 'function') {
        showCustomToast(`👋 Chào mừng ${result.user.displayName || 'bạn'}!`);
      }
    }
  } catch (err) {
    console.error('[Auth] Lỗi đăng nhập Google:', err);
    if (err.code === 'auth/popup-blocked') {
      auth.signInWithRedirect(provider);
      return;
    }
    if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
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
  if (!confirm('Bạn có chắc muốn đăng xuất khỏi tài khoản Google này?')) return;

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
      headerBtn.title = `Tài khoản: ${user.displayName || user.email} (Nhấn để đăng xuất)`;
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
      headerBtn.title = 'Đăng nhập Google (Tách biệt dữ liệu riêng)';
    }
    if (headerAvatar) {
      headerAvatar.style.display = 'none';
    }
    if (headerGuestIcon) {
      headerGuestIcon.style.display = 'inline-block';
    }
  }
}

// Xuất các hàm ra phạm vi toàn cục
window.getCurrentUserUid = getCurrentUserUid;
window.initAuthModule = initAuthModule;
window.loginWithGoogle = loginWithGoogle;
window.logoutGoogleUser = logoutGoogleUser;
window.updateUserAuthUI = updateUserAuthUI;
