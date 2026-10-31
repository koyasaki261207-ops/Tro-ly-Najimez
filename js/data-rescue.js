/**
 * js/data-rescue.js - Module Tự Động Tìm Kiếm, Cứu Hộ và Khôi Phục Dữ Liệu Thất Lạc cho Najimez
 * Quét toàn bộ các nguồn lưu trữ (Guest Key, Safety Backup, LocalStorage keys, Firestore Shared Timetables)
 * để bảo vệ và tự động phục hồi lịch trình, sự kiện và thu chi của người dùng.
 * Tuân thủ quy chuẩn Code Modularization (< 250 dòng).
 */

// Hàm gộp danh sách sự kiện thông minh, tự động khử trùng lặp
function mergeEventLists(primary, fallback) {
  const map = new Map();
  const list = [...(primary || []), ...(fallback || [])];
  for (const ev of list) {
    if (!ev || !ev.title) continue;
    const key = ev.id || `${ev.title}_${ev.date}_${ev.time || ev.startTime || ''}`;
    if (!map.has(key)) {
      map.set(key, ev);
    }
  }
  return Array.from(map.values());
}

// Hàm gộp danh sách giao dịch thu chi thông minh
function mergeTxLists(primary, fallback) {
  const map = new Map();
  const list = [...(primary || []), ...(fallback || [])];
  for (const tx of list) {
    if (!tx || typeof tx.amount === 'undefined') continue;
    const key = tx.id || `${tx.type}_${tx.amount}_${tx.note || ''}_${tx.timestamp || ''}`;
    if (!map.has(key)) {
      map.set(key, tx);
    }
  }
  return Array.from(map.values());
}

// Hàm gộp danh sách sổ nợ thông minh
function mergeDebtLists(primary, fallback) {
  const map = new Map();
  const list = [...(primary || []), ...(fallback || [])];
  for (const d of list) {
    if (!d || !d.person) continue;
    const key = d.id || `${d.direction}_${d.person}_${d.amount}_${d.timestamp || ''}`;
    if (!map.has(key)) {
      map.set(key, d);
    }
  }
  return Array.from(map.values());
}

// Hàm gộp danh sách việc cần làm thông minh
function mergeTaskLists(primary, fallback) {
  const map = new Map();
  const list = [...(primary || []), ...(fallback || [])];
  for (const t of list) {
    if (!t || !t.title) continue;
    const key = t.id || `${t.title}_${t.time || ''}`;
    if (!map.has(key)) {
      map.set(key, t);
    }
  }
  return Array.from(map.values());
}

// Tiến hành quét tìm và cứu hộ toàn bộ dữ liệu người dùng
async function rescueAndHealUserData(isManual = false) {
  try {
    const currentKey = typeof getCurrentLedgerKey === 'function' ? getCurrentLedgerKey() : (window.APP_CONFIG && APP_CONFIG.ledgerKey);
    let currentData = typeof getLedgerData === 'function' ? getLedgerData() : {};

    const hasEvents = Array.isArray(currentData.calendarEvents) && currentData.calendarEvents.length > 0;
    const hasTx = Array.isArray(currentData.transactions) && currentData.transactions.length > 0;
    const hasDebts = Array.isArray(currentData.debts) && currentData.debts.length > 0;
    const hasTasks = Array.isArray(currentData.tasks) && currentData.tasks.length > 0;

    // Nếu dữ liệu hiện tại đã đầy đủ cả sự kiện và thu chi (không bị rỗng), lưu bản sao an toàn và dừng
    if (!isManual && hasEvents && hasTx) {
      try {
        localStorage.setItem('najimez_ledger_backup_safety', JSON.stringify(currentData));
      } catch (_) {}
      return false;
    }

    console.log('[DataRescue] Phát hiện thiếu hụt dữ liệu, bắt đầu quét các nguồn dự phòng để khôi phục...');

    // 1. Quét tìm trong Guest Key ('najimez_ledger_data_v1')
    const guestKey = (window.APP_CONFIG && APP_CONFIG.ledgerKey) || 'najimez_ledger_data_v1';
    let guestData = null;
    try {
      const gRaw = localStorage.getItem(guestKey);
      if (gRaw) guestData = JSON.parse(gRaw);
    } catch (_) {}

    // 2. Quét tìm trong Safety Backup Key ('najimez_ledger_backup_safety')
    let safetyBackupData = null;
    try {
      const sRaw = localStorage.getItem('najimez_ledger_backup_safety');
      if (sRaw) safetyBackupData = JSON.parse(sRaw);
    } catch (_) {}

    // 3. Quét mọi key khác trong localStorage bắt đầu bằng hoặc chứa 'najimez_ledger'
    let candidateEvents = [];
    let candidateTx = [];
    let candidateDebts = [];
    let candidateTasks = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('najimez_ledger') || key.includes('ledger'))) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item && typeof item === 'object') {
            if (Array.isArray(item.calendarEvents) && item.calendarEvents.length > 0) {
              candidateEvents = mergeEventLists(candidateEvents, item.calendarEvents);
            }
            if (Array.isArray(item.transactions) && item.transactions.length > 0) {
              candidateTx = mergeTxLists(candidateTx, item.transactions);
            }
            if (Array.isArray(item.debts) && item.debts.length > 0) {
              candidateDebts = mergeDebtLists(candidateDebts, item.debts);
            }
            if (Array.isArray(item.tasks) && item.tasks.length > 0) {
              candidateTasks = mergeTaskLists(candidateTasks, item.tasks);
            }
          }
        } catch (_) {}
      }
    }

    // 4. Quét thêm từ Firestore collection 'shared_timetables' (nếu là tài khoản Google đăng nhập)
    let firestoreTimetableEvents = [];
    const uid = window.currentUserUid || (window.currentUser && window.currentUser.uid);
    const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
    if (db && uid) {
      try {
        const snap = await db.collection('shared_timetables').doc(uid).get();
        if (snap.exists) {
          const sData = snap.data();
          if (Array.isArray(sData.events) && sData.events.length > 0) {
            firestoreTimetableEvents = sData.events;
            console.log(`[DataRescue] Đã tìm thấy ${firestoreTimetableEvents.length} sự kiện từ shared_timetables!`);
          }
        }
      } catch (err) {
        console.warn('[DataRescue] Quét shared_timetables:', err);
      }
    }

    // Hợp nhất các nguồn theo thứ tự ưu tiên
    let recoveredEvents = currentData.calendarEvents || [];
    recoveredEvents = mergeEventLists(recoveredEvents, candidateEvents);
    if (guestData && Array.isArray(guestData.calendarEvents)) {
      recoveredEvents = mergeEventLists(recoveredEvents, guestData.calendarEvents);
    }
    if (safetyBackupData && Array.isArray(safetyBackupData.calendarEvents)) {
      recoveredEvents = mergeEventLists(recoveredEvents, safetyBackupData.calendarEvents);
    }
    if (firestoreTimetableEvents.length > 0) {
      recoveredEvents = mergeEventLists(recoveredEvents, firestoreTimetableEvents);
    }

    let recoveredTx = currentData.transactions || [];
    recoveredTx = mergeTxLists(recoveredTx, candidateTx);
    if (guestData && Array.isArray(guestData.transactions)) {
      recoveredTx = mergeTxLists(recoveredTx, guestData.transactions);
    }
    if (safetyBackupData && Array.isArray(safetyBackupData.transactions)) {
      recoveredTx = mergeTxLists(recoveredTx, safetyBackupData.transactions);
    }

    let recoveredDebts = currentData.debts || [];
    recoveredDebts = mergeDebtLists(recoveredDebts, candidateDebts);
    if (guestData && Array.isArray(guestData.debts)) {
      recoveredDebts = mergeDebtLists(recoveredDebts, guestData.debts);
    }
    if (safetyBackupData && Array.isArray(safetyBackupData.debts)) {
      recoveredDebts = mergeDebtLists(recoveredDebts, safetyBackupData.debts);
    }

    let recoveredTasks = currentData.tasks || [];
    recoveredTasks = mergeTaskLists(recoveredTasks, candidateTasks);
    if (guestData && Array.isArray(guestData.tasks)) {
      recoveredTasks = mergeTaskLists(recoveredTasks, guestData.tasks);
    }
    if (safetyBackupData && Array.isArray(safetyBackupData.tasks)) {
      recoveredTasks = mergeTaskLists(recoveredTasks, safetyBackupData.tasks);
    }

    const curEvLen = (currentData.calendarEvents && currentData.calendarEvents.length) || 0;
    const curTxLen = (currentData.transactions && currentData.transactions.length) || 0;
    const curDbLen = (currentData.debts && currentData.debts.length) || 0;
    const curTkLen = (currentData.tasks && currentData.tasks.length) || 0;

    const hadImprovements = (
      recoveredEvents.length > curEvLen ||
      recoveredTx.length > curTxLen ||
      recoveredDebts.length > curDbLen ||
      recoveredTasks.length > curTkLen
    );

    if (hadImprovements || isManual) {
      const recoveredData = {
        ...currentData,
        calendarEvents: recoveredEvents,
        transactions: recoveredTx,
        debts: recoveredDebts,
        tasks: recoveredTasks,
        bank: currentData.bank || (guestData && guestData.bank) || {},
        contacts: currentData.contacts || (guestData && guestData.contacts) || {}
      };

      // Lưu lại vào LocalStorage của tài khoản hiện tại
      localStorage.setItem(currentKey, JSON.stringify(recoveredData));
      // Lưu vào Safety Backup
      localStorage.setItem('najimez_ledger_backup_safety', JSON.stringify(recoveredData));

      // Đẩy lên Firestore để chữa lành đám mây
      if (typeof syncLedgerToFirebase === 'function') {
        syncLedgerToFirebase(recoveredData, true);
      }

      // Cập nhật toàn bộ giao diện
      if (typeof updateHeaderStats === 'function') updateHeaderStats();
      if (typeof renderFinanceTab === 'function') renderFinanceTab();
      if (typeof renderTodosTab === 'function') renderTodosTab();
      if (typeof renderCalendarTab === 'function') renderCalendarTab();
      if (typeof renderTimetableTab === 'function') renderTimetableTab();

      console.log(`[DataRescue] Cứu hộ thành công: ${recoveredEvents.length} sự kiện, ${recoveredTx.length} giao dịch, ${recoveredDebts.length} khoản nợ.`);
      if (typeof showCustomToast === 'function') {
        showCustomToast(`✨ Đã tự động khôi phục và bảo toàn ${recoveredEvents.length} sự kiện & ${recoveredTx.length} giao dịch!`);
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('[DataRescue] Lỗi khôi phục dữ liệu:', e);
    return false;
  }
}

// Khởi chạy cứu hộ dữ liệu tự động khi load trang
function initDataRescueModule() {
  setTimeout(() => {
    rescueAndHealUserData(false);
  }, 600);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDataRescueModule);
} else {
  initDataRescueModule();
}

window.rescueAndHealUserData = rescueAndHealUserData;
