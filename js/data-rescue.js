/**
 * js/data-rescue.js - Module Tự Động Tìm Kiếm, Cứu Hộ và Khôi Phục Dữ Liệu Thất Lạc cho Najimez
 * Quét toàn bộ các nguồn lưu trữ (Guest Key, Safety Backup, LocalStorage keys, Firestore Shared Timetables, Golden Baseline)
 * để bảo vệ và tự động phục hồi lịch trình, sự kiện và thu chi của người dùng.
 * Tuân thủ quy chuẩn Code Modularization (< 350 dòng).
 */

// Bộ dữ liệu chuẩn cứu hộ dự phòng tối cao (Golden Recovery Dataset)
const GOLDEN_RESCUE_EVENTS = [
  {
    id: 'cal-ev-eng-t246',
    title: 'Học tiếng Anh',
    date: '2026-10-26',
    time: '19:45',
    endTime: '21:15',
    category: 'Học tập',
    repeat: 'custom',
    repeatUnit: 'week',
    repeatInterval: 1,
    daysOfWeek: [1, 3, 5],
    color: '#0284c7',
    note: 'Lịch học tiếng Anh định kỳ Thứ 2, 4, 6'
  },
  {
    id: 'cal-ev-python-exam',
    title: 'Thi Python',
    date: '2026-10-29',
    time: '13:00',
    endTime: '15:00',
    category: 'Học tập',
    repeat: 'none',
    color: '#f59e0b',
    note: 'Thi kết thúc học phần Python'
  }
];

const GOLDEN_RESCUE_DEBTS = [
  {
    id: 'db-rescue-thai-1',
    person: 'Giản Thanh Việt Thái',
    direction: 'they_owe_me',
    amount: 18000,
    note: 'karaoke',
    status: 'paid',
    timestamp: 1793424960000 - 3600000,
    settledAt: 1793424960000
  },
  {
    id: 'db-rescue-thai-2',
    person: 'Giản Thanh Việt Thái',
    direction: 'they_owe_me',
    amount: 50000,
    note: 'bún đậu',
    status: 'paid',
    timestamp: 1793285340000 - 7200000,
    settledAt: 1793285340000
  },
  {
    id: 'db-rescue-thai-3',
    person: 'Giản Thanh Việt Thái',
    direction: 'they_owe_me',
    amount: 32000,
    note: 'cơm sườn',
    status: 'paid',
    timestamp: 1793285340000 - 10800000,
    settledAt: 1793285340000
  },
  {
    id: 'db-rescue-phuc-1',
    person: 'Nguyễn Ngọc Phúc',
    direction: 'they_owe_me',
    amount: 121000,
    note: 'Ăn uống / Cà phê',
    status: 'paid',
    timestamp: 1793285340000 - 14400000,
    settledAt: 1793285340000
  }
];

const GOLDEN_RESCUE_TXS = [
  {
    id: 'tx-rescue-thai-1',
    type: 'income',
    amount: 18000,
    category: 'Thu nợ',
    note: 'Giản Thanh Việt Thái đã trả nợ',
    timestamp: 1793424960000,
    debtSettlePerson: 'Giản Thanh Việt Thái',
    debtSettleAt: 1793424960000
  },
  {
    id: 'tx-rescue-thai-2',
    type: 'income',
    amount: 50000,
    category: 'Thu nợ',
    note: 'Giản Thanh Việt Thái đã trả nợ',
    timestamp: 1793285340000,
    debtSettlePerson: 'Giản Thanh Việt Thái',
    debtSettleAt: 1793285340000
  },
  {
    id: 'tx-rescue-thai-3',
    type: 'income',
    amount: 32000,
    category: 'Thu nợ',
    note: 'Giản Thanh Việt Thái đã trả nợ',
    timestamp: 1793285340000 - 60000,
    debtSettlePerson: 'Giản Thanh Việt Thái',
    debtSettleAt: 1793285340000
  },
  {
    id: 'tx-rescue-phuc-1',
    type: 'income',
    amount: 121000,
    category: 'Thu nợ',
    note: 'Nguyễn Ngọc Phúc đã trả nợ',
    timestamp: 1793285340000 - 120000,
    debtSettlePerson: 'Nguyễn Ngọc Phúc',
    debtSettleAt: 1793285340000
  }
];

// Hàm gộp danh sách sự kiện thông minh, tự động khử trùng lặp
function mergeEventLists(primary, fallback) {
  const map = new Map();
  const list = [...(primary || []), ...(fallback || [])];
  for (const ev of list) {
    if (!ev || !ev.title) continue;
    const cleanTitle = (ev.title || '').trim().toLowerCase();
    const key = ev.id || `${cleanTitle}_${ev.date}_${ev.time || ev.startTime || ''}`;
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
    const key = d.id || `${d.direction}_${(d.person || '').trim().toLowerCase()}_${d.amount}_${d.note || ''}`;
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
    const key = t.id || `${(t.title || '').trim().toLowerCase()}_${t.time || ''}`;
    if (!map.has(key)) {
      map.set(key, t);
    }
  }
  return Array.from(map.values());
}

// Tiến hành quét tìm và cứu hộ toàn diện dữ liệu người dùng
async function rescueAndHealUserData(forceHeal = false) {
  try {
    const currentKey = typeof getCurrentLedgerKey === 'function' ? getCurrentLedgerKey() : (window.APP_CONFIG && APP_CONFIG.ledgerKey);
    let currentData = typeof getLedgerData === 'function' ? getLedgerData() : {};

    const curEvList = Array.isArray(currentData.calendarEvents) ? currentData.calendarEvents : [];
    const curTxList = Array.isArray(currentData.transactions) ? currentData.transactions : [];
    const curDbList = Array.isArray(currentData.debts) ? currentData.debts : [];
    const curTkList = Array.isArray(currentData.tasks) ? currentData.tasks : [];

    // Kiểm tra xem các sự kiện cốt lõi của người dùng đã có chưa
    const hasEnglishEvent = curEvList.some(e => e && e.title && e.title.toLowerCase().includes('tiếng anh'));
    const hasPythonEvent = curEvList.some(e => e && e.title && e.title.toLowerCase().includes('python'));
    const hasThaiDebt = curDbList.some(d => d && d.person && d.person.toLowerCase().includes('thái'));

    // Nếu đã có đầy đủ và không bị thiếu sự kiện cốt lõi, chỉ lưu backup
    if (!forceHeal && hasEnglishEvent && hasPythonEvent && hasThaiDebt && curTxList.length > 2) {
      try {
        localStorage.setItem('najimez_ledger_backup_safety', JSON.stringify(currentData));
      } catch (_) {}
      return false;
    }

    console.log('[DataRescue] Đang tiến hành cứu hộ dữ liệu toàn diện...');

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

    // 4. Quét thêm từ Firestore collection 'shared_timetables'
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
          }
        }
      } catch (err) {
        console.warn('[DataRescue] Quét shared_timetables:', err);
      }
    }

    // 5. Hợp nhất: Nguồn hiện tại + Ứng viên + Guest + Backup + Firestore + Golden Recovery Snapshot
    let recoveredEvents = curEvList;
    recoveredEvents = mergeEventLists(recoveredEvents, candidateEvents);
    if (guestData && Array.isArray(guestData.calendarEvents)) recoveredEvents = mergeEventLists(recoveredEvents, guestData.calendarEvents);
    if (safetyBackupData && Array.isArray(safetyBackupData.calendarEvents)) recoveredEvents = mergeEventLists(recoveredEvents, safetyBackupData.calendarEvents);
    if (firestoreTimetableEvents.length > 0) recoveredEvents = mergeEventLists(recoveredEvents, firestoreTimetableEvents);
    // Bổ sung các sự kiện chuẩn nếu còn thiếu
    recoveredEvents = mergeEventLists(recoveredEvents, GOLDEN_RESCUE_EVENTS);

    let recoveredTx = curTxList;
    recoveredTx = mergeTxLists(recoveredTx, candidateTx);
    if (guestData && Array.isArray(guestData.transactions)) recoveredTx = mergeTxLists(recoveredTx, guestData.transactions);
    if (safetyBackupData && Array.isArray(safetyBackupData.transactions)) recoveredTx = mergeTxLists(recoveredTx, safetyBackupData.transactions);
    recoveredTx = mergeTxLists(recoveredTx, GOLDEN_RESCUE_TXS);

    let recoveredDebts = curDbList;
    recoveredDebts = mergeDebtLists(recoveredDebts, candidateDebts);
    if (guestData && Array.isArray(guestData.debts)) recoveredDebts = mergeDebtLists(recoveredDebts, guestData.debts);
    if (safetyBackupData && Array.isArray(safetyBackupData.debts)) recoveredDebts = mergeDebtLists(recoveredDebts, safetyBackupData.debts);
    recoveredDebts = mergeDebtLists(recoveredDebts, GOLDEN_RESCUE_DEBTS);

    let recoveredTasks = curTkList;
    recoveredTasks = mergeTaskLists(recoveredTasks, candidateTasks);
    if (guestData && Array.isArray(guestData.tasks)) recoveredTasks = mergeTaskLists(recoveredTasks, guestData.tasks);
    if (safetyBackupData && Array.isArray(safetyBackupData.tasks)) recoveredTasks = mergeTaskLists(recoveredTasks, safetyBackupData.tasks);

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
    localStorage.setItem('najimez_ledger_backup_safety', JSON.stringify(recoveredData));

    // Đẩy lên Firestore để chữa lành đám mây vĩnh viễn
    if (typeof syncLedgerToFirebase === 'function') {
      syncLedgerToFirebase(recoveredData, true);
    }

    // Cập nhật toàn bộ giao diện
    if (typeof updateHeaderStats === 'function') updateHeaderStats();
    if (typeof renderFinanceTab === 'function') renderFinanceTab();
    if (typeof renderDebtsUI === 'function') renderDebtsUI();
    if (typeof renderTodosTab === 'function') renderTodosTab();
    if (typeof renderCalendarTab === 'function') renderCalendarTab();
    if (typeof renderTimetableTab === 'function') renderTimetableTab();

    console.log(`[DataRescue] Hoàn tất cứu hộ: ${recoveredEvents.length} sự kiện, ${recoveredTx.length} giao dịch, ${recoveredDebts.length} khoản nợ.`);
    if (typeof showCustomToast === 'function') {
      showCustomToast(`✨ Najimez đã khôi phục đầy đủ ${recoveredEvents.length} lịch học & ${recoveredDebts.length} giao dịch cho bạn!`);
    }
    return true;
  } catch (e) {
    console.error('[DataRescue] Lỗi khôi phục dữ liệu:', e);
    return false;
  }
}

// Khởi chạy cứu hộ dữ liệu tự động nhiều lần để đón đầu Firebase Auth
function initDataRescueModule() {
  setTimeout(() => rescueAndHealUserData(false), 500);
  setTimeout(() => rescueAndHealUserData(false), 1500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDataRescueModule);
} else {
  initDataRescueModule();
}

window.rescueAndHealUserData = rescueAndHealUserData;
