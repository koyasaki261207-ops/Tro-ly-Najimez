/**
 * js/firebase-sync.js - Module Tự Động Đồng Bộ Đám Mây Firebase Cloud Firestore cho Najimez
 * Dữ liệu luôn luôn tự động đồng bộ theo tài khoản Google thời gian thực, không cần thao tác thủ công.
 * Tuân thủ quy chuẩn Code Modularization (< 500 dòng).
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

const FIREBASE_LAST_SYNC_STORAGE = 'najimez_firebase_last_sync';

let firebaseApp = null;
let firestoreDb = null;
let cloudSyncUnsubscribe = null;
let isCloudSyncing = false;
let isApplyingRemoteUpdate = false;
let autoSyncTimer = null;
let pendingSyncData = null;

// Lấy mã đồng bộ tài khoản Google hiện tại
function getFirebaseSyncKey() {
  const uid = window.currentUserUid || (window.currentUser && window.currentUser.uid);
  return uid ? `user_${uid}` : null;
}

// Định danh duy nhất cho từng tab/phiên làm việc
function getClientSourceId() {
  if (!window.__najimezClientSourceId) {
    try {
      let id = sessionStorage.getItem('najimez_client_source_id');
      if (!id) {
        id = 'src-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
        sessionStorage.setItem('najimez_client_source_id', id);
      }
      window.__najimezClientSourceId = id;
    } catch (e) {
      window.__najimezClientSourceId = 'src-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    }
  }
  return window.__najimezClientSourceId;
}

// Khởi tạo Firebase SDK & Firestore
function initFirebaseModule() {
  if (typeof firebase === 'undefined') {
    console.warn('[Firebase] Firebase SDK chưa được nạp từ CDN.');
    return false;
  }

  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebaseApp = firebase.initializeApp(NAJIMEZ_FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.app();
    }

    firestoreDb = firebase.firestore();

    // Kích hoạt bộ nhớ đệm ngoại tuyến (Offline persistence)
    firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(err => {
      if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
        console.warn('[Firebase] Offline persistence:', err);
      }
    });

    // Khởi tạo module xác thực Google (js/auth.js)
    if (typeof initAuthModule === 'function') {
      initAuthModule();
    }

    console.log('[Firebase] Tự động đồng bộ sẵn sàng cho dự án:', NAJIMEZ_FIREBASE_CONFIG.projectId);

    // Lắng nghe thay đổi thời gian thực nếu đã đăng nhập
    subscribeToCloudChanges();
    return true;
  } catch (err) {
    console.error('[Firebase] Lỗi khởi tạo Firebase:', err);
    return false;
  }
}

// Lắng nghe thay đổi dữ liệu thời gian thực từ Firestore
function subscribeToCloudChanges() {
  if (!firestoreDb) return;

  if (typeof cloudSyncUnsubscribe === 'function') {
    cloudSyncUnsubscribe();
    cloudSyncUnsubscribe = null;
  }

  const syncKey = getFirebaseSyncKey();
  if (!syncKey) {
    return;
  }

  const docRef = firestoreDb.collection('najimez_vault').doc(syncKey);

  cloudSyncUnsubscribe = docRef.onSnapshot((docSnap) => {
    if (!docSnap.exists) {
      // Nếu Cloud chưa có dữ liệu cho tài khoản này, tự động đẩy dữ liệu máy lên
      const localData = typeof getLedgerData === 'function' ? getLedgerData() : null;
      if (localData) {
        syncLedgerToFirebase(localData, false);
      }
      return;
    }

    // Bỏ qua nếu là bản ghi cục bộ đang chờ commit từ chính máy này
    if (docSnap.metadata && docSnap.metadata.hasPendingWrites) {
      return;
    }

    const cloudData = docSnap.data();
    if (!cloudData) return;

    // Bỏ qua nếu snapshot là kết quả từ chính tab này vừa đẩy lên
    if (cloudData.clientSourceId === getClientSourceId()) {
      return;
    }

    // Tự động áp dụng dữ liệu mới nhất từ đám mây
    applyRemoteCloudData(cloudData);
  }, (err) => {
    console.warn('[Firebase] Realtime snapshot listener warning:', err);
  });
}

// Cập nhật dữ liệu từ Đám mây vào LocalStorage và làm mới toàn bộ giao diện
function applyRemoteCloudData(cloudData) {
  if (isApplyingRemoteUpdate) return;
  try {
    isApplyingRemoteUpdate = true;
    const currentLocal = typeof getLedgerData === 'function' ? getLedgerData() : {};

    let guestFallback = null;
    try {
      const gRaw = localStorage.getItem(APP_CONFIG.ledgerKey);
      if (gRaw) guestFallback = JSON.parse(gRaw);
    } catch (_) {}

    const resolveSafeList = (cloudArr, localArr, guestArr) => {
      if (Array.isArray(cloudArr) && cloudArr.length > 0) return cloudArr;
      if (Array.isArray(localArr) && localArr.length > 0) return localArr;
      if (Array.isArray(guestArr) && guestArr.length > 0) return guestArr;
      return [];
    };

    const safeTx = resolveSafeList(cloudData.transactions, currentLocal.transactions, guestFallback && guestFallback.transactions);
    const safeDebts = resolveSafeList(cloudData.debts, currentLocal.debts, guestFallback && guestFallback.debts);
    const safeTasks = resolveSafeList(cloudData.tasks, currentLocal.tasks, guestFallback && guestFallback.tasks);
    const safeEvents = resolveSafeList(cloudData.calendarEvents, currentLocal.calendarEvents, guestFallback && guestFallback.calendarEvents);

    const mergedData = {
      transactions: safeTx,
      debts: safeDebts,
      tasks: safeTasks,
      calendarEvents: safeEvents,
      bank: { ...(guestFallback && guestFallback.bank), ...(currentLocal.bank || {}), ...(cloudData.bank || {}) },
      contacts: { ...(guestFallback && guestFallback.contacts), ...(currentLocal.contacts || {}), ...(cloudData.contacts || {}) }
    };

    if (
      ((!Array.isArray(cloudData.transactions) || cloudData.transactions.length === 0) && safeTx.length > 0) ||
      ((!Array.isArray(cloudData.calendarEvents) || cloudData.calendarEvents.length === 0) && safeEvents.length > 0)
    ) {
      if (window.currentUserUid) {
        setTimeout(() => { if (typeof triggerAutoSyncToCloud === 'function') triggerAutoSyncToCloud(); }, 1000);
      }
    }

    // Đồng bộ cài đặt vòng quay may mắn nếu có
    if (Array.isArray(cloudData.wheelItems) && cloudData.wheelItems.length >= 2) {
      try {
        localStorage.setItem('najimez_wheel_custom_items', JSON.stringify(cloudData.wheelItems));
      } catch (e) {}
    }

    // Đồng bộ cài đặt giọng nói nếu có
    if (cloudData.voiceSettings && typeof cloudData.voiceSettings === 'object') {
      try {
        localStorage.setItem('najimez_voice_settings', JSON.stringify(cloudData.voiceSettings));
        if (typeof loadVoiceSettings === 'function') loadVoiceSettings();
      } catch (e) {}
    }

    // Đồng bộ Google Gemini API Key nếu máy hiện tại chưa có
    if (cloudData.geminiApiKey && typeof cloudData.geminiApiKey === 'string') {
      const curKey = localStorage.getItem(APP_CONFIG.storageKey) || '';
      if (!curKey && cloudData.geminiApiKey.trim()) {
        localStorage.setItem(APP_CONFIG.storageKey, cloudData.geminiApiKey.trim());
        if (typeof updateApiKeyUI === 'function') updateApiKeyUI();
      }
    }

    // Tự động chuẩn hóa & chữa lành dữ liệu
    const healed = typeof healLedgerData === 'function' ? healLedgerData(mergedData) : mergedData;

    // Lưu vào LocalStorage riêng biệt theo tài khoản
    const targetKey = typeof getCurrentLedgerKey === 'function' ? getCurrentLedgerKey() : APP_CONFIG.ledgerKey;
    localStorage.setItem(targetKey, JSON.stringify(healed));
    localStorage.setItem(FIREBASE_LAST_SYNC_STORAGE, Date.now().toString());

    // Đồng bộ Sổ từ vựng ngoại ngữ cá nhân
    try {
      const curNbRaw = localStorage.getItem('NAJIMEZ_VOCAB_NOTEBOOK_V1');
      const curNb = curNbRaw ? JSON.parse(curNbRaw) : [];
      if (Array.isArray(cloudData.vocabNotebook) && cloudData.vocabNotebook.length > 0) {
        let mergedVocab = cloudData.vocabNotebook;
        if (curNb.length > 0) {
          const cloudKeys = new Set(cloudData.vocabNotebook.map(x => ((x.word || '') + '_' + (x.lang || 'en')).toLowerCase().trim()));
          const missing = curNb.filter(x => !cloudKeys.has(((x.word || '') + '_' + (x.lang || 'en')).toLowerCase().trim()));
          if (missing.length > 0) {
            mergedVocab = [...cloudData.vocabNotebook, ...missing];
            setTimeout(() => { if (typeof triggerAutoSyncToCloud === 'function') triggerAutoSyncToCloud(); }, 600);
          }
        }
        localStorage.setItem('NAJIMEZ_VOCAB_NOTEBOOK_V1', JSON.stringify(mergedVocab));
      } else if (curNb.length > 0 && window.currentUserUid) {
        setTimeout(() => { if (typeof triggerAutoSyncToCloud === 'function') triggerAutoSyncToCloud(); }, 600);
      }
    } catch (e) {}

    if (Array.isArray(cloudData.vocabMasteredIds)) {
      try {
        localStorage.setItem('NAJIMEZ_VOCAB_MASTERED_V1', JSON.stringify(cloudData.vocabMasteredIds));
      } catch (e) {}
    }

    if (cloudData.homeLocation) {
      try {
        localStorage.setItem('najimez_home_location', JSON.stringify(cloudData.homeLocation));
        if (typeof updateHomeLocationUI === 'function') updateHomeLocationUI();
        if (typeof updateMainMapWorkspaceUI === 'function') updateMainMapWorkspaceUI();
        if (typeof setMainMapPickedLocation === 'function' && cloudData.homeLocation.lat && cloudData.homeLocation.lng) {
          setMainMapPickedLocation(cloudData.homeLocation.lat, cloudData.homeLocation.lng, cloudData.homeLocation.address, true, false);
        }
      } catch (e) {}
    }

    // Làm mới giao diện từ vựng & flashcard
    if (typeof sanitizeVocabNotebook === 'function') sanitizeVocabNotebook();
    if (typeof updateNotebookBadge === 'function') updateNotebookBadge();
    if (typeof renderNotebookUI === 'function') renderNotebookUI();
    if (typeof renderFlashcardUI === 'function') renderFlashcardUI();

    // Cập nhật tất cả các giao diện đang mở
    if (typeof updateHeaderStats === 'function') updateHeaderStats();
    if (typeof renderFinanceTab === 'function') renderFinanceTab();
    if (typeof renderTodosTab === 'function') renderTodosTab();
    if (typeof renderCalendarTab === 'function') renderCalendarTab();
    if (typeof renderTimetableTab === 'function') renderTimetableTab();

    console.log('[Firebase] Đã tự động cập nhật dữ liệu mới nhất từ đám mây');
  } catch (e) {
    console.error('[Firebase] Lỗi áp dụng dữ liệu đám mây:', e);
  } finally {
    setTimeout(() => {
      isApplyingRemoteUpdate = false;
    }, 300);
  }
}

// Tự động đẩy dữ liệu lên Firebase Cloud Firestore (Debounce 500ms & Queue thông minh)
function syncLedgerToFirebase(data, isImmediate = false) {
  if (isApplyingRemoteUpdate) return;
  if (!firestoreDb) return;

  const syncKey = getFirebaseSyncKey();
  if (!syncKey) {
    // Chưa đăng nhập Google, dữ liệu chỉ lưu an toàn trong localStorage
    return;
  }

  // Nếu đang có tiến trình đẩy lên mạng, xếp hàng để gửi tiếp ngay sau đó
  if (isCloudSyncing) {
    pendingSyncData = { data, isImmediate: isImmediate || (pendingSyncData && pendingSyncData.isImmediate) };
    return;
  }

  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
    autoSyncTimer = null;
  }

  const doPush = async () => {
    if (isCloudSyncing) {
      pendingSyncData = { data, isImmediate };
      return;
    }
    try {
      isCloudSyncing = true;
      const currentSyncKey = getFirebaseSyncKey();
      if (!currentSyncKey) return;
      const docRef = firestoreDb.collection('najimez_vault').doc(currentSyncKey);

      const getJson = (key, fallback) => {
        try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch (_) { return fallback; }
      };
      const customWheel = getJson('najimez_wheel_custom_items', null);
      const customVoice = getJson('najimez_voice_settings', null);
      const vocabNotebook = getJson('NAJIMEZ_VOCAB_NOTEBOOK_V1', []);
      const vocabMasteredIds = getJson('NAJIMEZ_VOCAB_MASTERED_V1', []);
      const homeLoc = getJson('najimez_home_location', null);

      const apiKey = localStorage.getItem(APP_CONFIG.storageKey) || '';

      let src = (data && typeof data === 'object') ? data : null;
      if (!src || (!src.transactions && !src.calendarEvents)) {
        src = typeof getLedgerData === 'function' ? getLedgerData() : {};
      }
      let gData = null;
      try {
        const gRaw = localStorage.getItem(APP_CONFIG.ledgerKey);
        if (gRaw) gData = JSON.parse(gRaw);
      } catch (_) {}

      const pickSafe = (a, b) => (Array.isArray(a) && a.length > 0) ? a : ((Array.isArray(b) && b.length > 0) ? b : []);

      const payload = {
        transactions: pickSafe(src.transactions, gData && gData.transactions),
        debts: pickSafe(src.debts, gData && gData.debts),
        tasks: pickSafe(src.tasks, gData && gData.tasks),
        calendarEvents: pickSafe(src.calendarEvents, gData && gData.calendarEvents),
        bank: (src && src.bank) || (gData && gData.bank) || {},
        contacts: (src && src.contacts) || (gData && gData.contacts) || {},
        wheelItems: customWheel,
        voiceSettings: customVoice,
        geminiApiKey: apiKey ? apiKey.trim() : '',
        vocabNotebook: vocabNotebook,
        vocabMasteredIds: vocabMasteredIds,
        homeLocation: homeLoc,
        clientSourceId: getClientSourceId(),
        clientUpdatedAt: Date.now(),
        serverUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await docRef.set(payload, { merge: true });
      localStorage.setItem(FIREBASE_LAST_SYNC_STORAGE, Date.now().toString());
    } catch (err) {
      console.warn('[Firebase] Tự động đồng bộ lỗi (sẽ thử lại khi có mạng):', err.message || err);
    } finally {
      isCloudSyncing = false;
      if (pendingSyncData) {
        const next = pendingSyncData;
        pendingSyncData = null;
        syncLedgerToFirebase(next.data, next.isImmediate);
      }
    }
  };

  if (isImmediate) {
    doPush();
  } else {
    // Tự động đẩy sau 500ms
    autoSyncTimer = setTimeout(doPush, 500);
  }
}

// Xả ngay hàng đợi đồng bộ khi chuyển trang hoặc đóng tab
function flushPendingCloudSync() {
  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
    autoSyncTimer = null;
    const curData = typeof getLedgerData === 'function' ? getLedgerData() : null;
    if (curData) {
      syncLedgerToFirebase(curData, true);
    }
  }
}

// Tự động đồng bộ hoặc di chuyển dữ liệu khi đăng nhập Google
async function syncOrMigrateUserData() {
  if (!firestoreDb || !window.currentUserUid) return;
  const syncKey = getFirebaseSyncKey();
  if (!syncKey) return;

  try {
    const docRef = firestoreDb.collection('najimez_vault').doc(syncKey);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      // Đã có dữ liệu trên Cloud cho tài khoản Google này -> Nạp về máy
      applyRemoteCloudData(docSnap.data());
      if (typeof rescueAndHealUserData === 'function') {
        setTimeout(rescueAndHealUserData, 300);
      }
    } else {
      // Tài khoản Google mới -> Kiểm tra và di chuyển dữ liệu từ Khách sang
      const guestKey = APP_CONFIG.ledgerKey;
      const userKey = getCurrentLedgerKey();
      let localData = null;

      try {
        const rawUser = localStorage.getItem(userKey);
        if (rawUser) localData = JSON.parse(rawUser);
      } catch (e) {}

      const isUserEmpty = !localData || (
        (!localData.transactions || localData.transactions.length === 0) &&
        (!localData.debts || localData.debts.length === 0) &&
        (!localData.tasks || localData.tasks.length === 0) &&
        (!localData.calendarEvents || localData.calendarEvents.length === 0)
      );

      if (isUserEmpty) {
        try {
          const rawGuest = localStorage.getItem(guestKey);
          if (rawGuest) {
            const guestData = JSON.parse(rawGuest);
            if (guestData && (
              (guestData.transactions && guestData.transactions.length > 0) ||
              (guestData.debts && guestData.debts.length > 0) ||
              (guestData.tasks && guestData.tasks.length > 0) ||
              (guestData.calendarEvents && guestData.calendarEvents.length > 0)
            )) {
              localStorage.setItem(userKey, JSON.stringify(guestData));
              localData = guestData;
            }
          }
        } catch (e) {}
      }

      if (localData) {
        await syncLedgerToFirebase(localData, true);
      }
    }
  } catch (err) {
    console.warn('[Firebase] Lỗi đồng bộ khi đăng nhập:', err);
  }
}

// Kích hoạt đồng bộ khi có thay đổi từ các module khác (API key, Giọng nói, Vòng quay, Từ vựng)
function triggerAutoSyncToCloud() {
  const data = typeof getLedgerData === 'function' ? getLedgerData() : {};
  if (window.currentUserUid) {
    syncLedgerToFirebase(data || {}, false);
  }
}

// Khởi tạo các bộ lắng nghe toàn cục cho module đồng bộ đám mây
function initFirebaseSyncModule() {
  initFirebaseModule();

  if (typeof rescueAndHealUserData === 'function') {
    setTimeout(rescueAndHealUserData, 500);
  }

  // Đảm bảo dữ liệu luôn được đẩy lên trước khi người dùng tắt hoặc ẩn tab
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingCloudSync();
    }
  });

  window.addEventListener('beforeunload', () => {
    flushPendingCloudSync();
  });

  // Tự động đồng bộ ngay khi kết nối Internet phục hồi
  window.addEventListener('online', () => {
    const curData = typeof getLedgerData === 'function' ? getLedgerData() : null;
    if (curData && window.currentUserUid) {
      syncLedgerToFirebase(curData, true);
    }
  });
}

// Hàm tương thích ngược (không làm gì nếu gọi từ code cũ)
function updateSyncStatusUI() {}
function pullLedgerFromFirebase() {
  return syncOrMigrateUserData();
}

// Xuất các hàm ra phạm vi toàn cục
window.initFirebaseModule = initFirebaseModule;
window.initFirebaseSyncModule = initFirebaseSyncModule;
window.syncLedgerToFirebase = syncLedgerToFirebase;
window.pullLedgerFromFirebase = pullLedgerFromFirebase;
window.getFirebaseSyncKey = getFirebaseSyncKey;
window.syncOrMigrateUserData = syncOrMigrateUserData;
window.triggerAutoSyncToCloud = triggerAutoSyncToCloud;
window.updateSyncStatusUI = updateSyncStatusUI;
