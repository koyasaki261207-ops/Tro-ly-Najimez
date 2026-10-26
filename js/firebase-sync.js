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

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let cloudSyncUnsubscribe = null;
let isCloudSyncing = false;
let isApplyingRemoteUpdate = false;
let autoSyncTimer = null;
let pendingSyncData = null;

// Lấy mã đồng bộ hiện tại (Chỉ đồng bộ khi đã đăng nhập tài khoản Google với UID hợp lệ)
function getFirebaseSyncKey() {
  const uid = window.currentUserUid || (window.currentUser && window.currentUser.uid);
  if (uid) {
    return `user_${uid}`;
  }
  // Khi chưa đăng nhập Google, không dùng mã chung mà trả về null để chỉ lưu localStorage
  return null;
}

// Cập nhật mã đồng bộ mới (Chỉ áp dụng thông báo khi đã cố định theo Google UID)
function setFirebaseSyncKey(newKey) {
  const uid = window.currentUserUid || (window.currentUser && window.currentUser.uid);
  if (uid) {
    console.warn('[Firebase] Tài khoản đã đăng nhập, mã đồng bộ cố định là user_' + uid);
    return false;
  }
  return false;
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

    // Khởi tạo module xác thực Google (js/auth.js)
    if (typeof initAuthModule === 'function') {
      initAuthModule();
    }

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
  if (!syncKey) {
    // Chưa đăng nhập Google, không lắng nghe Firestore
    updateSyncStatusUI('offline', 'Chưa đăng nhập (Lưu cục bộ)');
    return;
  }

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

// Trả về định danh phiên trình duyệt hiện tại (Lưu vào localStorage thay vì sessionStorage)
function getClientSourceId() {
  let id = localStorage.getItem('najimez_client_source_id');
  if (!id) {
    id = 'src-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    localStorage.setItem('najimez_client_source_id', id);
  }
  return id;
}

// Hàm gộp danh sách bản ghi theo ID và timestamp/updatedAt (ưu tiên bản ghi mới nhất)
function mergeArrayByIdAndTime(localArr = [], cloudArr = []) {
  const map = new Map();

  (localArr || []).forEach(item => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });

  (cloudArr || []).forEach(cloudItem => {
    if (!cloudItem || !cloudItem.id) return;
    if (!map.has(cloudItem.id)) {
      map.set(cloudItem.id, cloudItem);
    } else {
      const localItem = map.get(cloudItem.id);
      const localTime = Number(localItem.updatedAt || localItem.timestamp || localItem.settledAt || 0);
      const cloudTime = Number(cloudItem.updatedAt || cloudItem.timestamp || cloudItem.settledAt || 0);
      if (cloudTime >= localTime) {
        map.set(cloudItem.id, { ...localItem, ...cloudItem });
      }
    }
  });

  return Array.from(map.values());
}

// Cập nhật dữ liệu từ đám mây vào LocalStorage và làm mới giao diện
function applyRemoteCloudData(cloudData) {
  if (isApplyingRemoteUpdate) return;
  try {
    isApplyingRemoteUpdate = true;
    const currentLocal = typeof getLedgerData === 'function' ? getLedgerData() : {};

    // Hợp nhất dữ liệu thông minh theo id + updatedAt/timestamp thay vì ghi đè toàn bộ
    const mergedData = {
      transactions: mergeArrayByIdAndTime(currentLocal.transactions, cloudData.transactions),
      debts: mergeArrayByIdAndTime(currentLocal.debts, cloudData.debts),
      tasks: mergeArrayByIdAndTime(currentLocal.tasks, cloudData.tasks),
      calendarEvents: mergeArrayByIdAndTime(currentLocal.calendarEvents, cloudData.calendarEvents),
      bank: { ...(currentLocal.bank || {}), ...(cloudData.bank || {}) },
      contacts: { ...(currentLocal.contacts || {}), ...(cloudData.contacts || {}) }
    };

    const beforeHealStr = JSON.stringify(mergedData);
    // Tự động chuẩn hóa dữ liệu
    const healed = typeof healLedgerData === 'function' ? healLedgerData(mergedData) : mergedData;
    const afterHealStr = JSON.stringify(healed);
    const hasHealedChanges = beforeHealStr !== afterHealStr;

    // Lưu vào LocalStorage riêng biệt theo tài khoản
    const targetKey = typeof getCurrentLedgerKey === 'function' ? getCurrentLedgerKey() : APP_CONFIG.ledgerKey;
    localStorage.setItem(targetKey, JSON.stringify(healed));
    localStorage.setItem(FIREBASE_LAST_SYNC_STORAGE, Date.now().toString());

    // Cập nhật giao diện
    if (typeof updateHeaderStats === 'function') updateHeaderStats();
    if (typeof renderFinanceTab === 'function') renderFinanceTab();
    if (typeof renderTodosTab === 'function') renderTodosTab();
    if (typeof renderCalendarTab === 'function') renderCalendarTab();
    if (typeof renderTimetableTab === 'function') renderTimetableTab();

    updateSyncStatusUI('online', 'Đã đồng bộ từ Cloud');
    updateModalStatsUI();

    // Sau healLedgerData nếu có thay đổi thì đẩy lại lên cloud
    if (hasHealedChanges) {
      setTimeout(() => {
        syncLedgerToFirebase(healed, false);
      }, 500);
    }
  } catch (e) {
    console.error('[Firebase] Lỗi áp dụng dữ liệu đám mây:', e);
  } finally {
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 400);
  }
}

// Đẩy dữ liệu Sổ cái lên Firebase Cloud Firestore (có Debounce & Pending queue)
function syncLedgerToFirebase(data, isManual = false) {
  if (isApplyingRemoteUpdate) return;
  if (!firestoreDb) return;

  const syncKey = getFirebaseSyncKey();
  if (!syncKey) {
    if (isManual && typeof showCustomToast === 'function') {
      showCustomToast('⚠️ Bạn chưa đăng nhập Google. Dữ liệu chỉ được lưu trên trình duyệt.', 'info');
    }
    updateSyncStatusUI('offline', 'Chưa đăng nhập (Lưu cục bộ)');
    return;
  }

  // Nếu đang trong tiến trình đồng bộ, đặt cờ pending để đẩy lại sau khi xong (không bỏ qua)
  if (isCloudSyncing) {
    pendingSyncData = { data, isManual: isManual || (pendingSyncData && pendingSyncData.isManual) };
    return;
  }

  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
    autoSyncTimer = null;
  }

  const doPush = async () => {
    if (isCloudSyncing) {
      pendingSyncData = { data, isManual: isManual || (pendingSyncData && pendingSyncData.isManual) };
      return;
    }
    try {
      isCloudSyncing = true;
      updateSyncStatusUI('syncing', 'Đang tải lên Đám mây...');

      const currentSyncKey = getFirebaseSyncKey();
      if (!currentSyncKey) return;
      const docRef = firestoreDb.collection('najimez_vault').doc(currentSyncKey);

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
      // Nếu có thay đổi mới trong lúc đang sync, đẩy lại ngay
      if (pendingSyncData) {
        const next = pendingSyncData;
        pendingSyncData = null;
        syncLedgerToFirebase(next.data, next.isManual);
      }
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

  const syncKey = getFirebaseSyncKey();
  if (!syncKey) {
    if (typeof showCustomToast === 'function') {
      showCustomToast('⚠️ Vui lòng đăng nhập Google để tải dữ liệu từ Cloud!', 'warning');
    }
    return;
  }

  try {
    updateSyncStatusUI('syncing', 'Đang tải về từ Cloud...');
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
  const btnSaveKey = document.getElementById('btnSaveFirebaseSyncKey');
  const syncHelpEl = document.getElementById('firebaseSyncKeyHelp');

  const syncKey = getFirebaseSyncKey();

  if (syncKeyInput) {
    if (syncKey) {
      syncKeyInput.value = syncKey;
      syncKeyInput.readOnly = true;
      syncKeyInput.disabled = true;
      if (btnSaveKey) btnSaveKey.style.display = 'none';
      if (syncHelpEl) {
        syncHelpEl.textContent = '🔒 Dữ liệu được bảo mật riêng biệt theo tài khoản Google của bạn (không áp dụng đổi mã tùy ý).';
      }
    } else {
      syncKeyInput.value = 'Chưa đăng nhập (Chỉ lưu cục bộ)';
      syncKeyInput.readOnly = true;
      syncKeyInput.disabled = true;
      if (btnSaveKey) btnSaveKey.style.display = 'none';
      if (syncHelpEl) {
        syncHelpEl.textContent = '💡 Vui lòng đăng nhập Google để tự động sao lưu và bảo mật dữ liệu trên Đám mây.';
      }
    }
  }

  if (lastSyncEl) {
    const raw = localStorage.getItem(FIREBASE_LAST_SYNC_STORAGE);
    if (!raw || !syncKey) {
      lastSyncEl.textContent = syncKey ? 'Chưa đồng bộ' : 'Chưa đăng nhập Google';
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
    btnPullCloud.addEventListener('click', async () => {
      const confirmed = typeof showAppConfirm === 'function'
        ? await showAppConfirm('Bạn có chắc muốn tải dữ liệu từ Đám mây về để đồng bộ và cập nhật với máy không?', {
            title: 'Tải dữ liệu Đám mây',
            btnText: 'Tải về',
            btnIcon: 'fa-solid fa-cloud-arrow-down'
          })
        : confirm('Bạn có chắc muốn tải dữ liệu từ Đám mây về đè lên máy không?');
      if (confirmed) {
        pullLedgerFromFirebase();
      }
    });
  }

  if (btnSaveKey && syncKeyInput) {
    btnSaveKey.addEventListener('click', () => {
      const syncKey = getFirebaseSyncKey();
      if (syncKey) {
        if (typeof showCustomToast === 'function') {
          showCustomToast('Mã đồng bộ được liên kết cố định theo tài khoản Google cá nhân, không áp dụng đổi mã tùy ý.', 'info');
        }
      } else {
        if (typeof showCustomToast === 'function') {
          showCustomToast('Vui lòng đăng nhập Google để sử dụng tính năng đồng bộ đám mây.', 'warning');
        }
      }
    });
  }
}

// Xuất các hàm ra phạm vi toàn cục
window.initFirebaseModule = initFirebaseModule;
window.initFirebaseSyncModule = initFirebaseSyncModule;
window.syncLedgerToFirebase = syncLedgerToFirebase;
window.pullLedgerFromFirebase = pullLedgerFromFirebase;
window.getFirebaseSyncKey = getFirebaseSyncKey;
window.setFirebaseSyncKey = setFirebaseSyncKey;
