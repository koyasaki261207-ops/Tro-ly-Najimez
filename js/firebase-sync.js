/**
 * js/firebase-sync.js - Module tích hợp và đồng bộ đám mây Firebase Cloud Firestore cho Najimez
 * Chuẩn kiến trúc Code Modularization
 */

const NAJIMEZ_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCj2aaZLEK1DyeuVMWiMU2yGaEJSQ9qZbM",
  authDomain: "najimez.firebaseapp.com",
  projectId: "najimez",
  storageBucket: "najimez.firebasestorage.app",
  messagingSenderId: "950936750630",
  appId: "1:950936750630:web:7b6f184504ee65c756f4e7",
  measurementId: "G-G1LVP5VM1L"
};

const FIREBASE_SYNC_KEY_STORAGE = 'najimez_firebase_sync_key';
const FIREBASE_LAST_SYNC_STORAGE = 'najimez_firebase_last_sync';
const DEFAULT_SYNC_KEY = 'najimez_primary';

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let cloudSyncUnsubscribe = null;
let isCloudSyncing = false;
let isApplyingRemoteUpdate = false;
let autoSyncTimer = null;

// Lấy mã đồng bộ hiện tại
function getFirebaseSyncKey() {
  return localStorage.getItem(FIREBASE_SYNC_KEY_STORAGE) || DEFAULT_SYNC_KEY;
}

// Cập nhật mã đồng bộ mới
function setFirebaseSyncKey(newKey) {
  const cleanKey = (newKey || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '');
  if (!cleanKey) return false;
  localStorage.setItem(FIREBASE_SYNC_KEY_STORAGE, cleanKey);
  // Huỷ lắng nghe tài liệu cũ và đăng ký tài liệu mới
  if (typeof subscribeToCloudChanges === 'function') {
    subscribeToCloudChanges();
  }
  return true;
}

// Khởi tạo Firebase SDK
function initFirebaseModule() {
  if (typeof firebase === 'undefined') {
    console.warn('[Firebase] Firebase SDK chưa được nạp từ CDN.');
    updateSyncStatusUI('offline', 'Firebase SDK chưa nạp');
    return false;
  }

  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebaseApp = firebase.initializeApp(NAJIMEZ_FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.app();
    }

    firestoreDb = firebase.firestore();
    firebaseAuth = firebase.auth();

    // Kích hoạt bộ nhớ đệm ngoại tuyến của Firestore
    firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(err => {
      if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
        console.warn('[Firebase] Offline persistence warning:', err);
      }
    });

    // Tự động đăng nhập ẩn danh để hỗ trợ Firestore Security Rules
    firebaseAuth.signInAnonymously().catch(authErr => {
      console.log('[Firebase] Anonymous Auth (tùy chọn):', authErr.message);
    });

    updateSyncStatusUI('online', 'Đã kết nối Firebase');
    console.log('[Firebase] Khởi tạo thành công cho dự án:', NAJIMEZ_FIREBASE_CONFIG.projectId);

    // Lắng nghe thay đổi thời gian thực từ đám mây
    subscribeToCloudChanges();
    return true;
  } catch (err) {
    console.error('[Firebase] Lỗi khởi tạo Firebase:', err);
    updateSyncStatusUI('error', 'Lỗi kết nối Firebase');
    return false;
  }
}

// Đăng ký lắng nghe thay đổi thời gian thực từ Firestore
function subscribeToCloudChanges() {
  if (!firestoreDb) return;

  if (typeof cloudSyncUnsubscribe === 'function') {
    cloudSyncUnsubscribe();
    cloudSyncUnsubscribe = null;
  }

  const syncKey = getFirebaseSyncKey();
  const docRef = firestoreDb.collection('najimez_vault').doc(syncKey);

  cloudSyncUnsubscribe = docRef.onSnapshot((docSnap) => {
    if (!docSnap.exists) {
      // Nếu chưa có dữ liệu trên đám mây cho mã này, đẩy dữ liệu máy lên khởi tạo
      const localData = typeof getLedgerData === 'function' ? getLedgerData() : null;
      if (localData) {
        syncLedgerToFirebase(localData, false);
      }
      return;
    }

    const cloudData = docSnap.data();
    if (!cloudData) return;

    // Bỏ qua nếu dữ liệu vừa được chính máy này đẩy lên
    if (cloudData.clientSourceId === getClientSourceId()) {
      return;
    }

    applyRemoteCloudData(cloudData);
  }, (err) => {
    console.warn('[Firebase] Lỗi lắng nghe realtime:', err);
    if (err.code === 'permission-denied') {
      updateSyncStatusUI('error', 'Quyền truy cập Firestore bị từ chối');
      showFirestoreRulesHint(true);
    } else {
      updateSyncStatusUI('offline', 'Mất kết nối đám mây');
    }
  });
}

// Trả về định danh phiên trình duyệt hiện tại
function getClientSourceId() {
  let id = sessionStorage.getItem('najimez_client_source_id');
  if (!id) {
    id = 'src-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    sessionStorage.setItem('najimez_client_source_id', id);
  }
  return id;
}

// Cập nhật dữ liệu từ đám mây vào LocalStorage và làm mới giao diện
function applyRemoteCloudData(cloudData) {
  if (isApplyingRemoteUpdate) return;
  try {
    isApplyingRemoteUpdate = true;
    const currentLocal = typeof getLedgerData === 'function' ? getLedgerData() : {};

    // Hợp nhất dữ liệu thông minh
    const mergedData = {
      transactions: Array.isArray(cloudData.transactions) ? cloudData.transactions : (currentLocal.transactions || []),
      debts: Array.isArray(cloudData.debts) ? cloudData.debts : (currentLocal.debts || []),
      tasks: Array.isArray(cloudData.tasks) ? cloudData.tasks : (currentLocal.tasks || []),
      calendarEvents: Array.isArray(cloudData.calendarEvents) ? cloudData.calendarEvents : (currentLocal.calendarEvents || []),
      bank: cloudData.bank || currentLocal.bank || {},
      contacts: cloudData.contacts || currentLocal.contacts || {}
    };

    // Tự động chuẩn hóa dữ liệu
    const healed = typeof healLedgerData === 'function' ? healLedgerData(mergedData) : mergedData;

    // Lưu vào LocalStorage
    localStorage.setItem(APP_CONFIG.ledgerKey, JSON.stringify(healed));
    localStorage.setItem(FIREBASE_LAST_SYNC_STORAGE, Date.now().toString());

    // Cập nhật giao diện
    if (typeof updateHeaderStats === 'function') updateHeaderStats();
    if (typeof renderFinanceTab === 'function') renderFinanceTab();
    if (typeof renderTodosTab === 'function') renderTodosTab();
    if (typeof renderCalendarTab === 'function') renderCalendarTab();
    if (typeof renderTimetableTab === 'function') renderTimetableTab();

    updateSyncStatusUI('online', 'Đã đồng bộ từ Cloud');
    updateModalStatsUI();
  } catch (e) {
    console.error('[Firebase] Lỗi áp dụng dữ liệu đám mây:', e);
  } finally {
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 400);
  }
}

// Đẩy dữ liệu Sổ cái lên Firebase Cloud Firestore (có Debounce)
function syncLedgerToFirebase(data, isManual = false) {
  if (isApplyingRemoteUpdate) return;
  if (!firestoreDb) return;

  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
    autoSyncTimer = null;
  }

  const doPush = async () => {
    if (isCloudSyncing) return;
    try {
      isCloudSyncing = true;
      updateSyncStatusUI('syncing', 'Đang tải lên Đám mây...');

      const syncKey = getFirebaseSyncKey();
      const docRef = firestoreDb.collection('najimez_vault').doc(syncKey);

      const payload = {
        transactions: data.transactions || [],
        debts: data.debts || [],
        tasks: data.tasks || [],
        calendarEvents: data.calendarEvents || [],
        bank: data.bank || {},
        contacts: data.contacts || {},
        clientSourceId: getClientSourceId(),
        clientUpdatedAt: Date.now(),
        serverUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await docRef.set(payload, { merge: true });

      localStorage.setItem(FIREBASE_LAST_SYNC_STORAGE, Date.now().toString());
      updateSyncStatusUI('online', 'Đã đồng bộ lên Cloud');
      showFirestoreRulesHint(false);
      updateModalStatsUI();

      if (isManual && typeof showCustomToast === 'function') {
        showCustomToast('☁️ Đã sao lưu dữ liệu lên Firebase thành công!');
      }
    } catch (err) {
      console.warn('[Firebase] Lỗi đẩy dữ liệu lên Firestore:', err);
      if (err.code === 'permission-denied') {
        updateSyncStatusUI('error', 'Cần cấp quyền Firestore Rules');
        showFirestoreRulesHint(true);
      } else {
        updateSyncStatusUI('offline', 'Chế độ Ngoại tuyến');
      }
      if (isManual && typeof showCustomToast === 'function') {
        showCustomToast('⚠️ Không thể đồng bộ: ' + (err.message || 'Lỗi mạng'), 'warning');
      }
    } finally {
      isCloudSyncing = false;
    }
  };

  if (isManual) {
    doPush();
  } else {
    // Tự động đẩy sau 1000ms khi người dùng ngừng thao tác
    autoSyncTimer = setTimeout(doPush, 1000);
  }
}

// Kéo dữ liệu từ Cloud về máy (Khôi phục)
async function pullLedgerFromFirebase() {
  if (!firestoreDb) {
    if (typeof showCustomToast === 'function') showCustomToast('Firebase chưa sẵn sàng', 'warning');
    return;
  }

  try {
    updateSyncStatusUI('syncing', 'Đang tải về từ Cloud...');
    const syncKey = getFirebaseSyncKey();
    const docRef = firestoreDb.collection('najimez_vault').doc(syncKey);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      if (typeof showCustomToast === 'function') {
        showCustomToast('Không tìm thấy dữ liệu trên Cloud với mã: ' + syncKey, 'info');
      }
      updateSyncStatusUI('online', 'Đã kết nối');
      return;
    }

    applyRemoteCloudData(docSnap.data());
    if (typeof showCustomToast === 'function') {
      showCustomToast('✅ Đã khôi phục dữ liệu từ Firebase thành công!');
    }
  } catch (err) {
    console.error('[Firebase] Lỗi kéo dữ liệu:', err);
    if (err.code === 'permission-denied') {
      updateSyncStatusUI('error', 'Cần cấu hình Firestore Rules');
      showFirestoreRulesHint(true);
    }
    if (typeof showCustomToast === 'function') {
      showCustomToast('Lỗi tải dữ liệu: ' + err.message, 'warning');
    }
  }
}

// Cập nhật giao diện trạng thái đồng bộ
function updateSyncStatusUI(status, label) {
  const dot = document.getElementById('cloudSyncStatusDot');
  const btn = document.getElementById('btnCloudSync');
  const title = document.getElementById('firebaseStatusTitle');
  const desc = document.getElementById('firebaseStatusDesc');
  const iconWrap = document.getElementById('syncStatusIconWrap');

  if (dot) {
    dot.className = 'cloud-sync-status-dot ' + status;
  }

  if (btn) {
    btn.title = `Đồng bộ Đám mây Firebase: ${label}`;
  }

  if (title) {
    if (status === 'online') title.textContent = 'Đã kết nối Firebase (Sẵn sàng)';
    else if (status === 'syncing') title.textContent = 'Đang đồng bộ Đám mây...';
    else if (status === 'error') title.textContent = 'Lỗi kết nối / Quyền Firestore';
    else title.textContent = 'Chế độ Ngoại tuyến';
  }

  if (desc) {
    desc.textContent = `Dự án: ${NAJIMEZ_FIREBASE_CONFIG.projectId} • Trạng thái: ${label}`;
  }

  if (iconWrap) {
    iconWrap.className = 'sync-status-icon-wrap ' + status;
    if (status === 'online') {
      iconWrap.innerHTML = '<i class="fa-solid fa-cloud-check"></i>';
    } else if (status === 'syncing') {
      iconWrap.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i>';
    } else if (status === 'error') {
      iconWrap.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else {
      iconWrap.innerHTML = '<i class="fa-solid fa-cloud"></i>';
    }
  }
}

// Cập nhật số liệu thống kê trong Modal
function updateModalStatsUI() {
  const lastSyncEl = document.getElementById('firebaseLastSyncTime');
  const recordsEl = document.getElementById('firebaseRecordCounts');
  const syncKeyInput = document.getElementById('firebaseSyncKeyInput');

  if (syncKeyInput && document.activeElement !== syncKeyInput) {
    syncKeyInput.value = getFirebaseSyncKey();
  }

  if (lastSyncEl) {
    const raw = localStorage.getItem(FIREBASE_LAST_SYNC_STORAGE);
    if (!raw) {
      lastSyncEl.textContent = 'Chưa đồng bộ';
    } else {
      const d = new Date(parseInt(raw, 10));
      lastSyncEl.textContent = d.toLocaleTimeString('vi-VN') + ' ' + d.toLocaleDateString('vi-VN');
    }
  }

  if (recordsEl && typeof getLedgerData === 'function') {
    const d = getLedgerData();
    const txCount = (d.transactions || []).length;
    const debtCount = (d.debts || []).length;
    const taskCount = (d.tasks || []).length;
    const calCount = (d.calendarEvents || []).length;
    recordsEl.textContent = `${txCount} thu chi, ${debtCount} nợ, ${taskCount} việc, ${calCount} lịch`;
  }
}

// Hiện / ẩn gợi ý cấu hình Firestore Rules
function showFirestoreRulesHint(show) {
  const hint = document.getElementById('firebaseRulesHint');
  if (hint) {
    hint.style.display = show ? 'flex' : 'none';
  }
}

// Khởi tạo các sự kiện cho Modal Đồng Bộ Firebase
function initFirebaseSyncModule() {
  const btnOpen = document.getElementById('btnCloudSync');
  const modal = document.getElementById('firebaseSyncModal');
  const btnClose = document.getElementById('btnCloseFirebaseSyncModal');
  const btnSyncNow = document.getElementById('btnFirebaseSyncNow');
  const btnPullCloud = document.getElementById('btnFirebasePullCloud');
  const btnSaveKey = document.getElementById('btnSaveFirebaseSyncKey');
  const syncKeyInput = document.getElementById('firebaseSyncKeyInput');

  // Khởi động Firebase
  initFirebaseModule();

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      updateModalStatsUI();
      modal.classList.add('active');
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', () => {
      const data = typeof getLedgerData === 'function' ? getLedgerData() : null;
      if (data) {
        syncLedgerToFirebase(data, true);
      }
    });
  }

  if (btnPullCloud) {
    btnPullCloud.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn tải dữ liệu từ Đám mây về đè lên máy không?')) {
        pullLedgerFromFirebase();
      }
    });
  }

  if (btnSaveKey && syncKeyInput) {
    btnSaveKey.addEventListener('click', () => {
      const val = syncKeyInput.value.trim();
      if (!val) {
        alert('Vui lòng nhập mã hồ sơ đồng bộ hợp lệ (chữ và số)!');
        return;
      }
      setFirebaseSyncKey(val);
      updateModalStatsUI();
      if (typeof showCustomToast === 'function') {
        showCustomToast(`🔑 Đã chuyển sang mã hồ sơ: ${val}`);
      }
      // Tải dữ liệu của hồ sơ mới về máy
      pullLedgerFromFirebase();
    });
  }
}

// Xuất các hàm ra phạm vi toàn cục
window.initFirebaseSyncModule = initFirebaseSyncModule;
window.syncLedgerToFirebase = syncLedgerToFirebase;
window.pullLedgerFromFirebase = pullLedgerFromFirebase;
window.getFirebaseSyncKey = getFirebaseSyncKey;
window.setFirebaseSyncKey = setFirebaseSyncKey;
