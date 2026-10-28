/**
 * js/storage.js - Quản lý lưu trữ LocalStorage, dữ liệu sổ cái và các tiện ích định dạng
 */

// Helper: Khớp tên đối tượng thông minh (chính xác theo từ, không phân biệt hoa thường/dấu tiếng Việt)
// Ngăn chặn hoàn toàn lỗi nuốt chuỗi con (VD: "An" KHÔNG được khớp nhầm với "Tuấn", "Lan", "Hoàng"...)
function matchPersonName(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const a = nameA.toLowerCase().trim();
  const b = nameB.toLowerCase().trim();
  if (a === b) return true;

  const strip = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const sa = strip(a);
  const sb = strip(b);
  if (sa === sb) return true;

  // Tách thành các từ trọn vẹn để so khớp theo ranh giới từ (không dùng includes bừa bãi)
  const wordsA = sa.split(/\s+/).filter(Boolean);
  const wordsB = sb.split(/\s+/).filter(Boolean);

  // Nếu một bên là 1 từ duy nhất (VD: "An") thì bên kia phải chứa đúng từ đó (VD: "Nguyễn Văn An")
  if (wordsA.length === 1 && wordsB.includes(wordsA[0])) return true;
  if (wordsB.length === 1 && wordsA.includes(wordsB[0])) return true;

  // Nếu cả 2 đều là cụm nhiều từ (VD: "Nguyễn Văn Tuấn" và "Văn Tuấn")
  if (wordsA.length > 1 && wordsB.length > 1) {
    if (sa.startsWith(sb + ' ') || sa.endsWith(' ' + sb) || sa.includes(' ' + sb + ' ')) return true;
    if (sb.startsWith(sa + ' ') || sb.endsWith(' ' + sa) || sb.includes(' ' + sa + ' ')) return true;
  }

  return false;
}

// Đồng bộ các khoản nợ vào Sổ Thu Chi Cá Nhân nếu chưa có giao dịch tương ứng
function syncDebtsWithTransactions(data) {
  if (!data || !Array.isArray(data.debts) || !Array.isArray(data.transactions)) return false;
  let changed = false;

  data.debts.forEach(d => {
    // Tìm giao dịch tương ứng với khoản nợ này
    const existingTx = data.transactions.find(t =>
      t.debtId === d.id ||
      t.id === 'tx-debt-' + d.id ||
      (Math.abs(Number(t.amount) - Number(d.amount)) < 1 &&
        matchPersonName(t.note || '', d.person) && (
          (d.direction === 'they_owe_me' && t.type === 'expense') ||
          (d.direction === 'i_owe_them' && t.type === 'income')
        )
      )
    );

    if (!existingTx) {
      const isTheyOwe = d.direction === 'they_owe_me';
      const newTx = {
        id: 'tx-debt-' + d.id,
        debtId: d.id,
        type: isTheyOwe ? 'expense' : 'income',
        amount: Number(d.amount) || 0,
        category: isTheyOwe ? 'Cho mượn' : 'Vay mượn',
        note: isTheyOwe ? `Cho ${d.person} mượn tiền${d.note ? ': ' + d.note : ''}` : `Vay tiền từ ${d.person}${d.note ? ': ' + d.note : ''}`,
        timestamp: d.timestamp || Date.now()
      };
      data.transactions.push(newTx);
      changed = true;
    }
  });

  if (changed) {
    // Sắp xếp lại danh sách giao dịch theo thời gian mới nhất lên đầu
    data.transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }
  return changed;
}

// Tự động chữa lành dữ liệu sổ nợ & đồng bộ các khoản nợ vào sổ thu chi
function healLedgerData(data) {
  if (!data || !Array.isArray(data.debts)) return data;
  let changed = false;

  const bogusPaidEntries = data.debts.filter(d =>
    d.status !== 'paid' &&
    /(?:đã\s+trả|trả\s+nợ|thanh\s+toán\s+nợ|tất\s+toán)/i.test(d.note || '')
  );

  bogusPaidEntries.forEach(bogus => {
    // Tìm khoản nợ gốc thực sự cùng đối tượng và cùng chiều
    const original = data.debts.find(d =>
      d.id !== bogus.id &&
      d.status !== 'paid' &&
      matchPersonName(d.person, bogus.person) &&
      d.direction === bogus.direction &&
      Math.abs(Number(d.amount) - Number(bogus.amount)) < 1
    );

    if (original) {
      original.status = 'paid';
      original.settledAt = bogus.timestamp || Date.now();
      // Xóa khoản nợ "rác" tạo nhầm
      data.debts = data.debts.filter(d => d.id !== bogus.id);
      changed = true;
    } else {
      // Đánh dấu khoản này thành đã trả để không bị cộng dồn số dư
      bogus.status = 'paid';
      changed = true;
    }
  });

  // Sửa chữa nếu khoản nợ "Bạn nợ họ" (i_owe_them) bị gạch nợ nhầm thành thu hồi nợ (income)
  const erroneousIncomeSettlements = (data.transactions || []).filter(t =>
    t.type === 'income' &&
    /(?:trả\s+nợ|thu\s+nợ|thu\s+hồi)/i.test(t.category || t.note || '') &&
    data.debts.some(d => matchPersonName(t.note || '', d.person) && d.direction === 'i_owe_them')
  );

  erroneousIncomeSettlements.forEach(errTx => {
    const targetDebt = data.debts.find(d => matchPersonName(errTx.note || '', d.person) && d.direction === 'i_owe_them');
    if (targetDebt && targetDebt.status === 'paid') {
      targetDebt.status = 'pending';
      delete targetDebt.settledAt;
      data.transactions = data.transactions.filter(t => t.id !== errTx.id);
      changed = true;
    }
  });

  // Đã bỏ bước tự động quét lại mọi giao dịch cũ sang Sổ Nợ để tránh gạch oan các khoản nợ mới thêm

  // Đảm bảo mỗi giao dịch có mã định danh id duy nhất
  if (Array.isArray(data.transactions)) {
    data.transactions.forEach((t, idx) => {
      if (!t.id) {
        t.id = 'tx-' + (t.timestamp || Date.now()) + '-' + idx;
        changed = true;
      }
    });
  }

  // Tự động dọn dẹp các sự kiện trùng lặp (Deduplication) và loại bỏ các bản ghi thừa
  if (Array.isArray(data.calendarEvents)) {
    const initialLen = data.calendarEvents.length;

    // 1. Xóa các sự kiện healed tạm thời trước đây nếu có
    let cleanedList = data.calendarEvents.filter(e => {
      if (!e) return false;
      if (typeof e.id === 'string' && (e.id.startsWith('cal-healed-wed-') || e.id.startsWith('cal-healed-fri-'))) {
        return false;
      }
      return true;
    });

    // 1b. Tự động chuẩn hóa & giải quyết xung đột giữa sự kiện gộp nhiều thứ và sự kiện tách từng thứ có ghi chú riêng
    const singleDayMap = new Map();
    cleanedList.forEach(e => {
      const rawDays = e.daysOfWeek || e.repeatDays;
      if (Array.isArray(rawDays) && rawDays.length === 1) {
        const normTitle = (e.title || '').trim().toLowerCase();
        const normTime = (e.time || e.startTime || '').trim();
        const key = `${normTitle}|${normTime}`;
        if (!singleDayMap.has(key)) singleDayMap.set(key, new Set());
        singleDayMap.get(key).add(Number(rawDays[0]));
      }
    });

    if (singleDayMap.size > 0) {
      cleanedList = cleanedList.filter(e => {
        const rawDays = e.daysOfWeek || e.repeatDays;
        if (!Array.isArray(rawDays) || rawDays.length <= 1) return true;
        const normTitle = (e.title || '').trim().toLowerCase();
        const normTime = (e.time || e.startTime || '').trim();
        const key = `${normTitle}|${normTime}`;
        const separatedDays = singleDayMap.get(key);
        if (!separatedDays) return true;

        const numDays = rawDays.map(Number);
        const remainingDays = numDays.filter(d => !separatedDays.has(d));
        if (remainingDays.length === 0) {
          changed = true;
          return false;
        }
        if (remainingDays.length !== numDays.length) {
          e.daysOfWeek = remainingDays;
          if (e.repeatDays) e.repeatDays = remainingDays;
          changed = true;
        }
        return true;
      });
    }

    // 2. Lọc trùng lặp thông minh (Deduplication)
    const recurringMap = new Map();
    const singleSet = new Set();
    const uniqueEvents = [];

    cleanedList.forEach(e => {
      if (!e) return;
      const normTitle = (e.title || '').trim().toLowerCase();
      const normTime = (e.time || e.startTime || '').trim();
      const normEndTime = (e.endTime || '').trim();
      const rawDays = e.daysOfWeek || e.repeatDays;
      let daysKey = '';
      if (Array.isArray(rawDays) && rawDays.length > 0) {
        daysKey = [...rawDays].map(Number).sort((a, b) => a - b).join(',');
      }
      const isRecurringWeeklyWithDays = Boolean(daysKey);

      if (isRecurringWeeklyWithDays) {
        // Sự kiện lặp theo thứ trong tuần: chỉ cần duy nhất 1 sự kiện cho cùng nội dung, giờ giấc và danh sách thứ
        const recKey = `${normTitle}|${normTime}|${normEndTime}|${daysKey}`;
        if (recurringMap.has(recKey)) {
          const existing = recurringMap.get(recKey);
          // Giữ ngày bắt đầu là ngày sớm nhất
          if (e.date && (!existing.date || e.date < existing.date)) {
            existing.date = e.date;
          }
          if (e.note && !existing.note) {
            existing.note = e.note;
            changed = true;
          }
          if (e.repeatUntil && !existing.repeatUntil) {
            existing.repeatUntil = e.repeatUntil;
            changed = true;
          }
          return;
        }
        // Đảm bảo thiết lập chuẩn lặp lại
        e.repeat = e.repeat || 'custom';
        e.repeatUnit = 'week';
        e.repeatInterval = Math.max(1, parseInt(e.repeatInterval, 10) || 1);
        recurringMap.set(recKey, e);
        uniqueEvents.push(e);
      } else {
        // Sự kiện đơn lẻ: lọc theo tiêu đề, ngày, giờ
        const singleKey = `${normTitle}|${e.date}|${normTime}|${normEndTime}|${e.repeat || 'none'}`;
        if (singleSet.has(singleKey)) {
          const existingSingle = uniqueEvents.find(u => {
            const uDays = u.daysOfWeek || u.repeatDays;
            if (Array.isArray(uDays) && uDays.length > 0) return false;
            const uTitle = (u.title || '').trim().toLowerCase();
            const uTime = (u.time || u.startTime || '').trim();
            const uEndTime = (u.endTime || '').trim();
            return uTitle === normTitle && u.date === e.date && uTime === normTime && uEndTime === normEndTime;
          });
          if (existingSingle && e.note && !existingSingle.note) {
            existingSingle.note = e.note;
            changed = true;
          }
          return;
        }
        singleSet.add(singleKey);
        uniqueEvents.push(e);
      }
    });

    if (uniqueEvents.length !== initialLen || changed) {
      data.calendarEvents = uniqueEvents;
      changed = true;
    }
  }

  if (changed) {
    try {
      localStorage.setItem(getCurrentLedgerKey(), JSON.stringify(data));
    } catch (e) { }
  }
  return data;
}

// Lấy mã khóa lưu trữ riêng biệt theo tài khoản người dùng
function getCurrentLedgerKey() {
  const uid = window.currentUserUid || (window.currentUser && window.currentUser.uid);
  if (uid) {
    return `${APP_CONFIG.ledgerKey}_user_${uid}`;
  }
  return APP_CONFIG.ledgerKey;
}
window.getCurrentLedgerKey = getCurrentLedgerKey;

function getLedgerData() {
  const isGuest = !window.currentUserUid;
  const defaultData = isGuest ? {
    transactions: [
      { id: 'tx-1', type: 'expense', amount: 45000, category: 'Ăn uống', note: 'Cà phê sáng', timestamp: Date.now() - 3600000 },
      { id: 'tx-2', type: 'expense', amount: 50000, category: 'Di chuyển', note: 'Đổ xăng xe máy', timestamp: Date.now() - 86400000 }
    ],
    debts: [
      { id: 'db-1', direction: 'they_owe_me', person: 'Tuấn', amount: 50000, note: 'Trà sữa GongCha', status: 'pending', timestamp: Date.now() - 7200000 }
    ],
    tasks: [
      { id: 'tk-1', title: 'Hoàn thiện kế hoạch tài chính tháng', time: 'Hôm nay', done: false, timestamp: Date.now() },
      { id: 'tk-2', title: 'Kiểm tra và đối chiếu các khoản nợ', time: 'Hôm nay', done: false, timestamp: Date.now() - 3600000 }
    ],
    bank: {
      bankId: 'MB',
      accountNo: '',
      accountName: ''
    },
    contacts: {},
    calendarEvents: []
  } : {
    transactions: [],
    debts: [],
    tasks: [],
    bank: {
      bankId: 'MB',
      accountNo: '',
      accountName: ''
    },
    contacts: {},
    calendarEvents: []
  };

  try {
    const raw = localStorage.getItem(getCurrentLedgerKey());
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    const merged = { ...defaultData, ...parsed };
    if (!merged.contacts || typeof merged.contacts !== 'object') {
      merged.contacts = {};
    }
    if (!Array.isArray(merged.calendarEvents)) {
      merged.calendarEvents = [];
    }
    return healLedgerData(merged);
  } catch (e) {
    console.error('[Storage] Lỗi đọc hoặc chữa lành dữ liệu sổ cái:', e);
    return defaultData;
  }
}

function saveLedgerData(data) {
  try {
    localStorage.setItem(getCurrentLedgerKey(), JSON.stringify(data));
    if (typeof updateHeaderStats === 'function') updateHeaderStats();
    if (typeof renderFinanceTab === 'function') renderFinanceTab();
    if (typeof renderTodosTab === 'function') renderTodosTab();
    if (typeof renderCalendarTab === 'function') renderCalendarTab();
    if (typeof renderTimetableTab === 'function') renderTimetableTab();
    if (typeof window.syncLedgerToFirebase === 'function') {
      window.syncLedgerToFirebase(data);
    }
  } catch (e) {
    console.warn('Lỗi lưu sổ cái:', e);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'đ');
}

function formatRelativeTime(ts) {
  if (!ts) return 'Gần đây';
  const now = new Date();
  const d = new Date(ts);
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const isToday = d.getDate() === now.getDate() &&
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear();
  if (isToday) {
    return `Hôm nay, ${timeStr}`;
  }

  const yesterday = new Date(now.getTime() - 86400000);
  const isYesterday = d.getDate() === yesterday.getDate() &&
                      d.getMonth() === yesterday.getMonth() &&
                      d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) {
    return `Hôm qua, ${timeStr}`;
  }

  if (d.getFullYear() === now.getFullYear()) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getCategoryIcon(cat, type) {
  const c = (cat || '').toLowerCase();
  if (c.includes('cho mượn') || c.includes('cho vay')) return 'fa-hand-holding-dollar';
  if (c.includes('vay mượn') || c.includes('đi vay') || c.includes('vay tiền')) return 'fa-money-bill-wave';
  if (c.includes('thu nợ') || c.includes('thu hồi')) return 'fa-circle-dollar-to-slot';
  if (c.includes('trả nợ') || c.includes('thanh toán nợ')) return 'fa-money-bill-transfer';
  if (type === 'income') return 'fa-arrow-down';
  if (c.includes('ăn') || c.includes('uống') || c.includes('phở') || c.includes('cà phê') || c.includes('trà') || c.includes('lẩu')) return 'fa-utensils';
  if (c.includes('xăng') || c.includes('xe') || c.includes('grab') || c.includes('di chuyển')) return 'fa-gas-pump';
  if (c.includes('mua') || c.includes('sắm') || c.includes('áo') || c.includes('quần') || c.includes('sách')) return 'fa-bag-shopping';
  if (c.includes('nhà') || c.includes('điện') || c.includes('nước') || c.includes('mạng')) return 'fa-bolt';
  if (c.includes('học') || c.includes('khoá')) return 'fa-graduation-cap';
  if (c.includes('chơi') || c.includes('game') || c.includes('giải trí') || c.includes('tài xỉu')) return 'fa-gamepad';
  if (c.includes('lương') || c.includes('thưởng')) return 'fa-sack-dollar';
  return 'fa-basket-shopping';
}

function getAvatarGradient(name) {
  const gradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #0ea5e9, #2563eb)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #8b5cf6, #d946ef)',
    'linear-gradient(135deg, #14b8a6, #0284c7)'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseAmount(str) {
  if (str === null || str === undefined) return 0;
  let clean = String(str).toLowerCase().replace(/đ|vnd/g, '').trim();
  if (!clean) return 0;

  const isMillion = clean.includes('tr') || clean.includes('triệu');
  const isThousand = clean.includes('k') || clean.includes('nghìn') || clean.includes('ngàn');

  // Loại bỏ các từ đơn vị để xử lý phần số
  clean = clean.replace(/(?:triệu|tr|nghìn|ngàn|k)/g, '').trim();

  // Nhận diện dấu phân cách hàng nghìn:
  // 1. Dạng có từ 2 dấu chấm hoặc 2 dấu phẩy trở lên (vd: 1.000.000 hoặc 1,500,000)
  if (/(?:\.\d{3}){2,}/.test(clean) || /(?:,\d{3}){2,}/.test(clean)) {
    clean = clean.replace(/[.,]/g, '');
  }
  // 2. Dạng có đúng 1 dấu chấm hoặc phẩy và theo sau là đúng 3 chữ số kết thúc chuỗi (vd: 50.000 hoặc 50,000 hoặc 1.500)
  else if (/^\d{1,3}[.,]\d{3}$/.test(clean)) {
    clean = clean.replace(/[.,]/g, '');
  }
  // 3. Dạng số thập phân thông thường (vd: 1,5 hoặc 2,5)
  else if (/^\d+,\d+$/.test(clean)) {
    clean = clean.replace(',', '.');
  }

  let num = parseFloat(clean);
  if (isNaN(num) || num <= 0) return 0;

  if (isMillion) return Math.round(num * 1000000);
  if (isThousand) return Math.round(num * 1000);

  // Nếu người dùng chỉ nói số tắt < 1000 không đơn vị trong hội thoại (vd: 50 hay 35), quy về nghìn
  if (num < 1000) return num * 1000;

  return Math.round(num);
}
