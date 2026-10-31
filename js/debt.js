/**
 * js/debt.js - Quản lý sổ nợ, gom nhóm theo từng đối tượng (Person-Centric Net Debt)
 */

function renderDebtsUI() {
  const container = document.getElementById('debtContactsList');
  const countBadge = document.getElementById('debtContactsCount');
  const recEl = document.getElementById('debtTotalReceivable');
  const payEl = document.getElementById('debtTotalPayable');

  const data = getLedgerData();
  const debts = Array.isArray(data.debts) ? data.debts : [];
  const contactsMap = data.contacts || {};

  // Nhóm nợ theo từng đối tượng (Person-Centric Net Aggregation)
  const personMap = new Map();

  debts.forEach(d => {
    const name = (d.person || 'Người quen').trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (!personMap.has(key)) {
      const profile = contactsMap[key] || Object.values(contactsMap).find(c => matchPersonName(c.name, name)) || null;
      personMap.set(key, {
        name: (profile && profile.name) || name,
        avatar: (profile && profile.avatar) || null,
        personNote: (profile && profile.note) || '',
        theyOweMe: 0,
        iOweThem: 0,
        items: [],
        latestTimestamp: 0
      });
    }
    const p = personMap.get(key);
    p.items.push(d);
    if (d.timestamp > p.latestTimestamp) {
      p.latestTimestamp = d.timestamp;
    }
    if (d.status !== 'paid') {
      const amt = Number(d.amount) || 0;
      if (d.direction === 'they_owe_me') {
        p.theyOweMe += amt;
      } else {
        p.iOweThem += amt;
      }
    }
  });

  // Tính số dư nợ ròng (Net Debt) cho từng người
  const contactsList = Array.from(personMap.values()).map(p => {
    const net = p.theyOweMe - p.iOweThem; // > 0: họ nợ tôi, < 0: tôi nợ họ, == 0: đã hết nợ
    const hasUnpaid = p.theyOweMe > 0 || p.iOweThem > 0;
    let status = 'paid';
    let badgeClass = 'paid';
    let badgeIcon = 'fa-circle-check';
    let badgeText = 'Đã thanh toán hết';
    let amountStr = '0 đ';

    if (hasUnpaid) {
      if (net > 0) {
        status = 'they_owe_me';
        badgeClass = 'they_owe_me';
        badgeIcon = 'fa-arrow-down-left';
        badgeText = 'Họ nợ bạn';
        amountStr = formatCurrency(net);
      } else if (net < 0) {
        status = 'i_owe_them';
        badgeClass = 'i_owe_them';
        badgeIcon = 'fa-arrow-up-right';
        badgeText = 'Bạn nợ họ';
        amountStr = formatCurrency(Math.abs(net));
      } else {
        status = 'paid';
        badgeClass = 'paid';
        badgeIcon = 'fa-scale-balanced';
        badgeText = 'Cân bằng nợ';
        amountStr = '0 đ';
      }
    }

    // Chi tiết ghi chú phụ
    let subDetail = '';
    if (p.theyOweMe > 0 && p.iOweThem > 0) {
      subDetail = `Chi tiết: Họ nợ ${formatCurrency(p.theyOweMe)} • Bạn nợ ${formatCurrency(p.iOweThem)}`;
    } else {
      const activeNotes = p.items.filter(i => i.status !== 'paid').map(i => i.note).filter(Boolean);
      subDetail = activeNotes.length > 0 ? activeNotes.slice(0, 2).join(' • ') : (p.items[0]?.note || 'Giao dịch nợ');
    }

    return {
      ...p,
      net,
      status,
      badgeClass,
      badgeIcon,
      badgeText,
      amountStr,
      subDetail,
      netAmount: Math.abs(net),
      isPaid: !hasUnpaid || net === 0
    };
  });

  // Thống kê tổng quan nợ ròng
  let totalRecNet = 0;
  let totalPayNet = 0;

  contactsList.forEach(c => {
    if (c.net > 0) totalRecNet += c.net;
    else if (c.net < 0) totalPayNet += Math.abs(c.net);
  });

  if (currentDebtView === 'history') {
    const timelineEvents = buildDebtTimelineEvents(debts);
    if (countBadge) countBadge.textContent = `${timelineEvents.length} giao dịch`;
    if (recEl) recEl.textContent = formatCurrency(totalRecNet);
    if (payEl) payEl.textContent = formatCurrency(totalPayNet);
    if (!container) return;
    renderAllDebtHistoryUI(container, debts, contactsMap);
    return;
  }

  if (countBadge) countBadge.textContent = `${contactsList.length} người`;
  if (recEl) recEl.textContent = formatCurrency(totalRecNet);
  if (payEl) payEl.textContent = formatCurrency(totalPayNet);

  if (!container) return;

  if (contactsList.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <i class="fa-solid fa-users"></i>
        <p>Chưa có người nào trong sổ nợ.<br/>
        <small>Nhấn <strong>"+ Ghi Nợ Mới"</strong> hoặc chat với Najimez để ghi nhận nợ!</small></p>
      </div>
    `;
    return;
  }

  // Render thẻ theo từng người dùng (Không lặp lại dòng lịch sử)
  container.innerHTML = contactsList.map(c => {
    const initial = (c.name || 'N').trim().charAt(0).toUpperCase();

    return `
      <div class="debt-contact-entry ${c.isPaid ? 'paid' : ''}" data-person="${escapeHTML(c.name)}">
        <div class="avatar-initial ${c.avatar ? 'has-avatar' : ''}" style="background: ${c.avatar ? 'transparent' : getAvatarGradient(c.name)}">
          ${c.avatar ? `<img src="${escapeHTML(c.avatar)}" alt="${escapeHTML(c.name)}" class="avatar-contact-img" onerror="this.parentElement.classList.remove('has-avatar'); this.remove();" />` : initial}
        </div>
        <div class="debt-entry-main">
          <div class="debt-header-line">
            <div class="debt-person-meta-wrap">
              <strong class="debt-person-name" title="${escapeHTML(c.name)}">${escapeHTML(c.name)}</strong>
              ${c.personNote ? `<span class="debt-person-custom-note" title="${escapeHTML(c.personNote)}"><i class="fa-regular fa-note-sticky"></i> ${escapeHTML(c.personNote)}</span>` : ''}
            </div>
            <span class="debt-amount-val ${c.badgeClass}">${c.amountStr}</span>
          </div>
          <div class="debt-sub-line">
            <div class="debt-sub-left">
              <span class="direction-badge ${c.badgeClass}">
                <i class="fa-solid ${c.badgeIcon || 'fa-circle-check'}"></i>
                <span>${c.badgeText}</span>
              </span>
            </div>
            <div class="debt-actions-group">
              <button type="button" class="btn-debt-history" data-action="view-history" data-person="${escapeHTML(c.name)}" title="Xem lịch sử giao dịch với ${escapeHTML(c.name)}">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>Lịch sử</span>
              </button>
              <div class="debt-menu-wrapper">
                <button type="button" class="btn-debt-menu-trigger" data-action="toggle-debt-menu" title="Chi tiết &amp; tùy chọn">
                  <i class="fa-solid fa-ellipsis"></i>
                  <span>Chi tiết</span>
                </button>
                <div class="debt-menu-popup">
                  <button type="button" class="debt-menu-item info" data-action="info-person" data-person="${escapeHTML(c.name)}" title="Xem &amp; chỉnh sửa thông tin">
                    <i class="fa-solid fa-user-pen"></i>
                    <span>Thông tin</span>
                  </button>
                  <div class="debt-menu-divider"></div>
                  ${!c.isPaid ? `
                    <button type="button" class="debt-menu-item qr" data-action="qr-person" data-person="${escapeHTML(c.name)}" title="Tạo mã VietQR chuyển khoản">
                      <i class="fa-solid fa-qrcode"></i>
                      <span>Tạo mã VietQR</span>
                    </button>
                    <button type="button" class="debt-menu-item check" data-action="settle-person" data-person="${escapeHTML(c.name)}" title="${c.status === 'they_owe_me' ? 'Đã thu hồi được nợ' : 'Đã hoàn tất thanh toán trả nợ'}">
                      <i class="fa-solid fa-check"></i>
                      <span>${c.status === 'they_owe_me' ? 'Đã thu nợ' : 'Đã trả nợ'}</span>
                    </button>
                  ` : `
                    <button type="button" class="debt-menu-item check is-paid" data-action="unsettle-person" data-person="${escapeHTML(c.name)}" title="Đánh dấu chưa thanh toán">
                      <i class="fa-solid fa-rotate-left"></i>
                      <span>Khôi phục chưa trả</span>
                    </button>
                  `}
                  <div class="debt-menu-divider"></div>
                  <button type="button" class="debt-menu-item del" data-action="del-person" data-person="${escapeHTML(c.name)}" title="Xóa đối tượng này">
                    <i class="fa-regular fa-trash-can"></i>
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Hàm tiện ích đóng toàn bộ menu đang mở và trả lại z-index bình thường cho các card
  const closeAllDebtMenus = () => {
    document.querySelectorAll('.debt-menu-popup.show').forEach(p => p.classList.remove('show'));
    document.querySelectorAll('.debt-contact-entry.menu-open').forEach(c => c.classList.remove('menu-open'));
  };

  // 0. Toggle menu Thao Tác bên góc phải dưới
  container.querySelectorAll('[data-action="toggle-debt-menu"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.debt-contact-entry');
      const wrapper = btn.closest('.debt-menu-wrapper');
      if (!wrapper) return;
      const popup = wrapper.querySelector('.debt-menu-popup');
      if (!popup) return;

      const isShown = popup.classList.contains('show');

      // Đóng tất cả menu khác
      document.querySelectorAll('.debt-menu-popup.show').forEach(p => {
        if (p !== popup) p.classList.remove('show');
      });
      document.querySelectorAll('.debt-contact-entry.menu-open').forEach(c => {
        if (c !== card) c.classList.remove('menu-open');
      });

      if (!isShown) {
        // Tự động căn chỉnh hướng mở (drop-up hoặc drop-down) để không bị che khuất
        const btnRect = btn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (btnRect.bottom + 140 > containerRect.bottom && btnRect.top - containerRect.top > 120) {
          popup.classList.add('drop-up');
          popup.classList.remove('drop-down');
        } else {
          popup.classList.add('drop-down');
          popup.classList.remove('drop-up');
        }
        popup.classList.add('show');
        if (card) card.classList.add('menu-open');
      } else {
        popup.classList.remove('show');
        if (card) card.classList.remove('menu-open');
      }
    });
  });

  // Đóng menu khi click ra ngoài (đảm bảo chỉ gắn 1 lần trên document)
  if (!window._debtMenuGlobalListenerAttached) {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.debt-menu-wrapper')) {
        closeAllDebtMenus();
      }
    });
    window._debtMenuGlobalListenerAttached = true;
  }

  // 1. Thao tác tạo mã VietQR theo đối tượng
  container.querySelectorAll('[data-action="qr-person"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDebtMenus();
      const personName = btn.dataset.person;
      const contact = contactsList.find(c => matchPersonName(c.name, personName));
      if (contact) {
        const qrDebtObj = {
          person: contact.name,
          amount: contact.netAmount || 50000,
          direction: contact.status,
          note: contact.status === 'they_owe_me' ? `${contact.name} trả nợ` : `Trả nợ cho ${contact.name}`
        };
        if (typeof openVietQrModal === 'function') openVietQrModal(qrDebtObj);
      }
    });
  });

  // 2. Thao tác tất toán nợ cho đối tượng (Đã trả nợ / Đã thu nợ)
  container.querySelectorAll('[data-action="settle-person"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDebtMenus();
      const personName = btn.dataset.person;
      const curData = getLedgerData();
      const contact = contactsList.find(c => matchPersonName(c.name, personName));
      const personDebts = curData.debts.filter(d => matchPersonName(d.person, personName) && d.status !== 'paid');
      const settleTime = Date.now();
      personDebts.forEach(d => {
        d.status = 'paid';
        d.settledAt = settleTime;
      });

      // Tự động ghi vào Sổ Thu Chi
      if (contact && contact.netAmount > 0) {
        const isExpense = contact.status === 'i_owe_them';
        curData.transactions.unshift({
          id: 'tx-' + settleTime + '-' + Math.floor(Math.random() * 1000),
          type: isExpense ? 'expense' : 'income',
          amount: contact.netAmount,
          category: isExpense ? 'Trả nợ' : 'Thu nợ',
          note: isExpense ? `Trả nợ cho ${contact.name}` : `${contact.name} trả nợ`,
          timestamp: settleTime,
          debtSettlePerson: contact.name,
          debtSettleAt: settleTime
        });
      }
      saveLedgerData(curData);
    });
  });

  // 3. Khôi phục trạng thái chưa trả
  container.querySelectorAll('[data-action="unsettle-person"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDebtMenus();
      const personName = btn.dataset.person;
      const curData = getLedgerData();
      // Chỉ khôi phục các khoản có settledAt và không đụng bản ghi "(Đã trả một phần)"
      const personDebts = (curData.debts || []).filter(d =>
        matchPersonName(d.person, personName) &&
        d.settledAt &&
        !String(d.note || '').includes('(Đã trả một phần)')
      );

      if (personDebts.length === 0) return;

      const settledTimestamps = new Set(personDebts.map(d => Number(d.settledAt)).filter(Boolean));

      // Xóa giao dịch thu/chi tương ứng đã tạo khi tất toán
      if (Array.isArray(curData.transactions)) {
        curData.transactions = curData.transactions.filter(tx => {
          if (tx.debtSettlePerson && matchPersonName(tx.debtSettlePerson, personName)) {
            return false;
          }
          const isSettleTx = (tx.category === 'Trả nợ' || tx.category === 'Thu nợ') &&
            matchPersonName(tx.note || '', personName);
          if (isSettleTx) {
            const matchesTime = Array.from(settledTimestamps).some(st => Math.abs((tx.timestamp || 0) - st) < 5000);
            if (matchesTime) return false;
          }
          return true;
        });
      }

      // Khôi phục trạng thái chưa trả cho các khoản này
      personDebts.forEach(d => {
        d.status = 'pending';
        delete d.settledAt;
      });

      saveLedgerData(curData);
    });
  });

  // 4. Xóa người này khỏi sổ nợ (Bảo toàn nguyên vẹn các giao dịch trong Sổ Thu Chi Cá Nhân)
  container.querySelectorAll('[data-action="del-person"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      closeAllDebtMenus();
      const personName = btn.dataset.person;
      if (!personName) return;

      const confirmed = typeof showAppConfirm === 'function'
        ? await showAppConfirm(`Bạn có chắc muốn xóa ${personName} khỏi sổ nợ? (Toàn bộ giao dịch trong Sổ Thu Chi Cá Nhân vẫn sẽ được giữ nguyên)`, {
            title: 'Xóa đối tượng khỏi sổ nợ',
            btnText: 'Xác nhận xóa',
            btnIcon: 'fa-solid fa-trash-can'
          })
        : confirm(`Bạn có chắc muốn xóa ${personName} khỏi sổ nợ? (Toàn bộ giao dịch trong Sổ Thu Chi Cá Nhân vẫn sẽ được giữ nguyên)`);

      if (confirmed) {
        const curData = getLedgerData();
        curData.debts = (curData.debts || []).filter(d => !matchPersonName(d.person, personName));
        if (curData.contacts) {
          const key = personName.toLowerCase().trim();
          delete curData.contacts[key];
        }
        saveLedgerData(curData);
      }
    });
  });

  // 5. Thao tác xem lịch sử giao dịch với đối tượng
  container.querySelectorAll('[data-action="view-history"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDebtMenus();
      const personName = btn.dataset.person;
      if (personName) {
        openPersonHistoryModal(personName);
      }
    });
  });

  // 6. Thao tác xem & sửa thông tin đối tượng (Avatar, đổi tên, ghi chú)
  container.querySelectorAll('[data-action="info-person"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDebtMenus();
      const personName = btn.dataset.person;
      if (personName && typeof openPersonInfoModal === 'function') {
        openPersonInfoModal(personName);
      }
    });
  });
}

/**
 * Chuyển đổi danh sách nợ thành Dòng thời gian giao dịch chi tiết (Timeline Events):
 * 1. Khoản nợ gốc: Ghi rõ "X nợ bạn" hoặc "Bạn nợ X" kèm số tiền và lý do
 * 2. Khoản trả nợ: Gom các khoản trả nợ trong cùng đợt thành duy nhất 1 giao dịch "... đã trả nợ : xx.xxxđ",
 *    không ghi rườm rà tất toán cho từng khoản lẻ làm dài lịch sử giao dịch.
 */
function buildDebtTimelineEvents(debtsList) {
  const events = [];
  const paidDebts = [];

  (debtsList || []).forEach(d => {
    if (!d) return;
    const personName = (d.person || 'Người quen').trim();
    const isRec = d.direction === 'they_owe_me';
    const isPaid = d.status === 'paid';
    const debtTime = Number(d.timestamp) || Date.now();

    // 1. GIAO DỊCH PHÁT SINH NỢ GỐC
    events.push({
      id: d.id,
      debtId: d.id,
      isSettlementEvent: false,
      person: personName,
      // Hiển thị rõ ràng: "Khang nợ bạn" hoặc "Bạn nợ Khang"
      displayTitle: isRec ? `${personName} nợ bạn` : `Bạn nợ ${personName}`,
      dirTagText: isRec ? 'Họ nợ bạn' : 'Bạn nợ họ',
      dirClass: isRec ? 'rec' : 'pay',
      dirIcon: isRec ? 'fa-arrow-down-left' : 'fa-arrow-up-right',
      note: d.note || (isRec ? 'Cho mượn tiền' : 'Vay mượn tiền'),
      amount: Number(d.amount) || 0,
      amountStr: formatCurrency(d.amount),
      amountClass: isRec ? 'rec' : 'pay',
      isPaid: isPaid,
      statusBadgeText: isPaid ? 'Đã tất toán' : 'Chưa thanh toán',
      statusBadgeClass: isPaid ? 'settled-origin' : 'pending',
      timestamp: debtTime,
      image: d.image || null,
      rawDebt: d
    });

    if (isPaid) {
      paidDebts.push(d);
    }
  });

  // 2. GIAO DỊCH THANH TOÁN / TRẢ NỢ: GOM CÁC KHOẢN TRẢ CÙNG ĐỢT THÀNH ĐÚNG 1 GIAO DỊCH DUY NHẤT
  // Gom các khoản trả nợ theo: cùng người, cùng chiều giao dịch, cùng đợt thời gian tất toán
  const paidGroups = {};
  paidDebts.forEach(d => {
    const personName = (d.person || 'Người quen').trim();
    const debtTime = Number(d.timestamp) || Date.now();
    const settleTime = Number(d.settledAt) || (debtTime + 1000);
    const groupKey = `${personName.toLowerCase()}__${d.direction}`;
    if (!paidGroups[groupKey]) {
      paidGroups[groupKey] = [];
    }
    paidGroups[groupKey].push({ debt: d, settleTime });
  });

  Object.values(paidGroups).forEach(groupItems => {
    // Sắp xếp các khoản trả theo thời gian giảm dần
    groupItems.sort((a, b) => b.settleTime - a.settleTime);

    // Gom các khoản có thời gian thanh toán gần nhau (trong vòng 3 phút = 180.000ms) thành 1 đợt thanh toán
    const batches = [];
    groupItems.forEach(item => {
      let matchedBatch = batches.find(b => Math.abs(b.settleTime - item.settleTime) <= 180000);
      if (matchedBatch) {
        matchedBatch.items.push(item.debt);
        matchedBatch.settleTime = Math.max(matchedBatch.settleTime, item.settleTime);
      } else {
        batches.push({
          settleTime: item.settleTime,
          items: [item.debt]
        });
      }
    });

    // Tạo duy nhất 1 giao dịch cho mỗi đợt trả nợ
    batches.forEach(b => {
      const firstDebt = b.items[0];
      const personName = (firstDebt.person || 'Người quen').trim();
      const isRec = firstDebt.direction === 'they_owe_me';
      const totalAmount = b.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      const debtIds = b.items.map(it => it.id);

      // Thu hồi nợ / trả nợ luôn dùng hình TIỀN MẶT theo yêu cầu người dùng
      const moneyVisual = (typeof AUTO_SMART_VISUALS !== 'undefined' && AUTO_SMART_VISUALS.tien) || {
        key: 'tien',
        label: isRec ? 'Đã thu hồi nợ (Tiền mặt)' : 'Đã thanh toán nợ (Tiền mặt)',
        url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=400&q=80'
      };
      const moneyImg = moneyVisual.url;

      events.push({
        id: 'settle-batch-' + firstDebt.id + '-' + b.settleTime,
        debtId: firstDebt.id,
        debtIds: debtIds,
        isSettlementEvent: true,
        person: personName,
        // Hiển thị chuẩn theo đúng yêu cầu: "[Tên người] đã trả nợ : xx.xxxđ"
        displayTitle: isRec ? `${personName} đã trả nợ : ${formatCurrency(totalAmount)}` : `Bạn đã trả nợ cho ${personName} : ${formatCurrency(totalAmount)}`,
        dirTagText: isRec ? 'Đã thu hồi nợ' : 'Đã thanh toán nợ',
        dirClass: isRec ? 'settle-rec' : 'settle-pay',
        dirIcon: isRec ? 'fa-circle-check' : 'fa-check-double',
        note: isRec ? 'Đã thu hồi nợ thành công' : 'Đã hoàn tất thanh toán trả nợ',
        amount: totalAmount,
        amountStr: `${isRec ? '+' : '-'}${formatCurrency(totalAmount)}`,
        amountClass: isRec ? 'settle-income' : 'settle-expense',
        isPaid: true,
        statusBadgeText: 'Đã hoàn tất',
        statusBadgeClass: 'paid-complete',
        timestamp: b.settleTime,
        image: moneyImg,
        rawDebt: {
          id: 'settle-' + firstDebt.id,
          person: personName,
          note: isRec ? 'Thu hồi nợ (Tiền mặt)' : 'Trả nợ (Tiền mặt)',
          amount: totalAmount,
          image: moneyImg
        }
      });
    });
  });

  // Sắp xếp các sự kiện mới nhất lên đầu dòng thời gian
  events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return events;
}

/**
 * Mở hộp thoại xem toàn bộ lịch sử giao dịch với một người cụ thể
 */
function openPersonHistoryModal(personName) {
  const modal = document.getElementById('personHistoryModal');
  const titleEl = document.getElementById('personHistoryModalTitle');
  const summaryEl = document.getElementById('personHistorySummary');
  const listEl = document.getElementById('personHistoryList');

  if (!modal) return;

  const curData = getLedgerData();
  const debts = Array.isArray(curData.debts) ? curData.debts : [];
  const personDebts = debts.filter(d => matchPersonName(d.person, personName));

  if (titleEl) {
    titleEl.textContent = `Lịch Sử Giao Dịch - ${personName}`;
  }

  // Thống kê nợ của người này
  let activeLent = 0;
  let activeBorrowed = 0;

  personDebts.forEach(d => {
    const amt = Number(d.amount) || 0;
    if (d.status !== 'paid') {
      if (d.direction === 'they_owe_me') activeLent += amt;
      else activeBorrowed += amt;
    }
  });

  const netBalance = activeLent - activeBorrowed;

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="history-stat-box">
        <span class="history-stat-label">Họ Nợ Bạn</span>
        <strong class="history-stat-val green">${formatCurrency(activeLent)}</strong>
      </div>
      <div class="history-stat-box">
        <span class="history-stat-label">Bạn Nợ Họ</span>
        <strong class="history-stat-val red">${formatCurrency(activeBorrowed)}</strong>
      </div>
      <div class="history-stat-box">
        <span class="history-stat-label">Số Dư Ròng</span>
        <strong class="history-stat-val ${netBalance > 0 ? 'green' : (netBalance < 0 ? 'red' : 'purple')}">
          ${netBalance > 0 ? '+' : (netBalance < 0 ? '-' : '')}${formatCurrency(Math.abs(netBalance))}
        </strong>
      </div>
    `;
  }

  if (listEl) {
    const timelineEvents = buildDebtTimelineEvents(personDebts);
    if (timelineEvents.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state-box" style="padding: 28px 0;">
          <i class="fa-solid fa-receipt"></i>
          <p>Chưa có giao dịch nợ nào với <strong>${escapeHTML(personName)}</strong>.</p>
        </div>
      `;
    } else {
      listEl.innerHTML = timelineEvents.map(ev => {
        const dateStr = ev.timestamp ? new Date(ev.timestamp).toLocaleString('vi-VN', {
          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
        }) : 'Vừa xong';

        const moneyUrl = (typeof AUTO_SMART_VISUALS !== 'undefined' && AUTO_SMART_VISUALS.tien && AUTO_SMART_VISUALS.tien.url)
          ? AUTO_SMART_VISUALS.tien.url
          : 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=400&q=80';

        const imgInfo = ev.isSettlementEvent
          ? {
              src: moneyUrl,
              label: ev.dirTagText || 'Tiền mặt',
              key: 'tien',
              isAuto: true
            }
          : (typeof resolveTransactionImage === 'function'
              ? resolveTransactionImage(ev.rawDebt)
              : { src: ev.image || '', label: ev.note || '', key: 'com' });

        return `
          <div class="history-timeline-item ${ev.isSettlementEvent ? 'settlement-event-item' : ''}">
            <div class="history-item-left">
              <div class="history-item-icon ${ev.dirClass}">
                <i class="fa-solid ${ev.dirIcon}"></i>
              </div>
              <div class="history-item-info">
                <div class="history-person-header">
                  <strong class="history-person-name" style="${ev.isSettlementEvent ? 'color: #34d399;' : ''}">${escapeHTML(ev.displayTitle)}</strong>
                  <span class="history-dir-tag ${ev.dirClass}">
                    <i class="fa-solid ${ev.dirIcon}"></i>
                    ${escapeHTML(ev.dirTagText)}
                  </span>
                </div>
                <span class="history-item-note" title="${escapeHTML(ev.note)}">
                  ${escapeHTML(ev.note)}
                </span>
                <span class="history-item-meta">
                  <i class="fa-regular fa-clock"></i> ${dateStr}
                </span>
              </div>
            </div>
            <div class="history-item-right">
              <div class="history-item-amount-group">
                <span class="history-item-amount ${ev.amountClass}">
                  ${ev.amountStr}
                </span>
                <span class="history-item-status ${ev.statusBadgeClass}">
                  ${escapeHTML(ev.statusBadgeText)}
                </span>
              </div>
              <div class="history-item-thumb-wrap" data-action="${ev.isSettlementEvent ? 'view-settle-img' : 'view-debt-img'}" data-id="${ev.debtId}" data-img="${escapeHTML(imgInfo.src)}" data-label="${escapeHTML(ev.displayTitle)}" title="${escapeHTML(imgInfo.label)} (Nhấn để phóng to)">
                <img src="${escapeHTML(imgInfo.src)}" alt="${escapeHTML(imgInfo.label)}" class="history-item-thumb" onerror="if(typeof handleAutoImgError==='function') handleAutoImgError(this, 'tien')" />
                <span class="thumb-badge-zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
              </div>
              ${ev.isSettlementEvent ? `
                <button type="button" class="btn-debt-item-del" data-action="unsettle-debt-item" data-id="${ev.debtId}" data-ids="${(ev.debtIds || [ev.debtId]).join(',')}" data-person="${escapeHTML(personName)}" title="Hoàn tác thanh toán (chuyển lại Chưa thanh toán)">
                  <i class="fa-solid fa-rotate-left" style="color: #fbbf24;"></i>
                </button>
              ` : `
                <button type="button" class="btn-debt-item-del" data-action="del-debt-item" data-id="${ev.debtId}" data-note="${escapeHTML(ev.note)}" data-person="${escapeHTML(personName)}" title="Xóa giao dịch này khỏi sổ nợ">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              `}
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('[data-action="del-debt-item"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const note = btn.dataset.note || 'Giao dịch nợ';
          const person = btn.dataset.person || personName;
          if (!id) return;

          const confirmed = typeof showAppConfirm === 'function'
            ? await showAppConfirm(`Bạn có chắc muốn xóa giao dịch "${note}"? (Mọi khoản chi tiêu trong Sổ Thu Chi Cá Nhân vẫn được bảo toàn)`, {
                title: 'Xóa giao dịch nợ',
                btnText: 'Xác nhận xóa',
                btnIcon: 'fa-solid fa-trash-can'
              })
            : confirm(`Bạn có chắc muốn xóa giao dịch "${note}"? (Mọi khoản chi tiêu trong Sổ Thu Chi Cá Nhân vẫn được bảo toàn)`);

          if (confirmed) {
            const curData = getLedgerData();
            curData.debts = (curData.debts || []).filter(x => x.id !== id);
            saveLedgerData(curData);
            if (typeof renderDebtsUI === 'function') renderDebtsUI();
            openPersonHistoryModal(person);
          }
        });
      });

      listEl.querySelectorAll('[data-action="unsettle-debt-item"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const idsStr = btn.dataset.ids || btn.dataset.id || '';
          const ids = idsStr.split(',').filter(Boolean);
          const person = btn.dataset.person || personName;
          if (ids.length === 0) return;

          const confirmed = typeof showAppConfirm === 'function'
            ? await showAppConfirm(`Bạn có muốn hoàn tác việc trả nợ này và chuyển lại trạng thái Chưa thanh toán không?`, {
                title: 'Hoàn tác thanh toán',
                btnText: 'Xác nhận hoàn tác',
                btnIcon: 'fa-solid fa-rotate-left'
              })
            : confirm(`Bạn có muốn hoàn tác việc trả nợ này và chuyển lại trạng thái Chưa thanh toán không?`);

          if (confirmed) {
            const curData = getLedgerData();
            ids.forEach(targetId => {
              const target = (curData.debts || []).find(x => x.id === targetId);
              if (target) {
                target.status = 'pending';
                delete target.settledAt;
              }
            });
            saveLedgerData(curData);
            if (typeof renderDebtsUI === 'function') renderDebtsUI();
            openPersonHistoryModal(person);
          }
        });
      });
    }
  }

  modal.classList.add('active');
}

/**
 * Khởi tạo sự kiện đóng hộp thoại Lịch sử giao dịch
 */
function initPersonHistoryModal() {
  const modal = document.getElementById('personHistoryModal');
  const btnClose = document.getElementById('btnClosePersonHistoryModal');

  if (!modal) return;
  function close() { modal.classList.remove('active'); }
  if (btnClose) btnClose.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
}

/**
 * Hiển thị danh sách toàn bộ lịch sử các cuộc giao dịch nợ/trả của mọi người với tôi
 */
function renderAllDebtHistoryUI(container, debts, contactsMap) {
  const timelineEvents = buildDebtTimelineEvents(debts);
  if (!timelineEvents || timelineEvents.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <p>Chưa có giao dịch nợ nào được ghi nhận.<br/>
        <small>Nhấn <strong>"+ Ghi Nợ Mới"</strong> hoặc chat với Najimez để tạo giao dịch nợ đầu tiên!</small></p>
      </div>
    `;
    return;
  }

  container.innerHTML = timelineEvents.map(ev => {
    const personName = ev.person;
    const profile = contactsMap[personName.toLowerCase()] || Object.values(contactsMap).find(c => matchPersonName(c.name, personName)) || null;
    const avatar = profile && profile.avatar;
    const initial = (personName || 'N').charAt(0).toUpperCase();
    const dateStr = ev.timestamp ? new Date(ev.timestamp).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    }) : 'Gần đây';

    const moneyUrl = (typeof AUTO_SMART_VISUALS !== 'undefined' && AUTO_SMART_VISUALS.tien && AUTO_SMART_VISUALS.tien.url)
      ? AUTO_SMART_VISUALS.tien.url
      : 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=400&q=80';

    const imgInfo = ev.isSettlementEvent
      ? {
          src: moneyUrl,
          label: ev.dirTagText || 'Tiền mặt',
          key: 'tien',
          isAuto: true
        }
      : (typeof resolveTransactionImage === 'function'
          ? resolveTransactionImage(ev.rawDebt)
          : { src: ev.image || '', label: ev.note || '', key: 'com' });

    return `
      <div class="history-timeline-item all-history-item ${ev.isSettlementEvent ? 'settlement-event-item' : ''}" data-person="${escapeHTML(personName)}">
        <div class="history-item-left">
          <div class="history-person-avatar ${avatar ? 'has-avatar' : ''}" style="background: ${avatar ? 'transparent' : (ev.isSettlementEvent ? 'rgba(16, 185, 129, 0.2)' : getAvatarGradient(personName))}">
            ${avatar && !ev.isSettlementEvent ? `<img src="${escapeHTML(avatar)}" alt="${escapeHTML(personName)}" class="history-avatar-img" onerror="this.parentElement.classList.remove('has-avatar'); this.remove();" />` : (ev.isSettlementEvent ? '<i class="fa-solid fa-check" style="color:#10b981;"></i>' : initial)}
          </div>
          <div class="history-item-info">
            <div class="history-person-header">
              <strong class="history-person-name-link" data-action="view-person-history" data-person="${escapeHTML(personName)}" style="${ev.isSettlementEvent ? 'color: #34d399;' : ''}" title="Xem chi tiết lịch sử với ${escapeHTML(personName)}">
                ${escapeHTML(ev.displayTitle)}
              </strong>
              <span class="history-dir-tag ${ev.dirClass}">
                <i class="fa-solid ${ev.dirIcon}"></i>
                ${escapeHTML(ev.dirTagText)}
              </span>
            </div>
            <span class="history-item-note" title="${escapeHTML(ev.note)}">
              ${escapeHTML(ev.note)}
            </span>
            <span class="history-item-meta">
              <i class="fa-regular fa-clock"></i> ${dateStr}
            </span>
          </div>
        </div>
        <div class="history-item-right">
          <div class="history-item-amount-group">
            <span class="history-item-amount ${ev.amountClass}">
              ${ev.amountStr}
            </span>
            <span class="history-item-status ${ev.statusBadgeClass}">
              ${escapeHTML(ev.statusBadgeText)}
            </span>
          </div>
          <div class="history-item-thumb-wrap" data-action="${ev.isSettlementEvent ? 'view-settle-img' : 'view-debt-img'}" data-id="${ev.debtId}" data-img="${escapeHTML(imgInfo.src)}" data-label="${escapeHTML(ev.displayTitle)}" title="${escapeHTML(imgInfo.label)} (Nhấn để phóng to)">
            <img src="${escapeHTML(imgInfo.src)}" alt="${escapeHTML(imgInfo.label)}" class="history-item-thumb" onerror="if(typeof handleAutoImgError==='function') handleAutoImgError(this, 'tien')" />
            <span class="thumb-badge-zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
          </div>
          ${ev.isSettlementEvent ? `
            <button type="button" class="btn-debt-item-del" data-action="unsettle-debt-item" data-id="${ev.debtId}" data-ids="${(ev.debtIds || [ev.debtId]).join(',')}" data-person="${escapeHTML(personName)}" title="Hoàn tác thanh toán (chuyển lại Chưa thanh toán)">
              <i class="fa-solid fa-rotate-left" style="color: #fbbf24;"></i>
            </button>
          ` : `
            <button type="button" class="btn-debt-item-del" data-action="del-debt-item" data-id="${ev.debtId}" data-note="${escapeHTML(ev.note)}" data-person="${escapeHTML(personName)}" title="Xóa giao dịch này khỏi sổ nợ">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  // Gắn sự kiện xóa từng giao dịch trong danh sách toàn bộ lịch sử
  container.querySelectorAll('[data-action="del-debt-item"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const note = btn.dataset.note || 'Giao dịch nợ';
      const person = btn.dataset.person || '';
      if (!id) return;

      const confirmed = typeof showAppConfirm === 'function'
        ? await showAppConfirm(`Bạn có chắc muốn xóa giao dịch nợ "${note}"${person ? ' của ' + person : ''}? (Mọi khoản chi tiêu trong Sổ Thu Chi Cá Nhân vẫn được bảo toàn)`, {
            title: 'Xóa giao dịch nợ',
            btnText: 'Xác nhận xóa',
            btnIcon: 'fa-solid fa-trash-can'
          })
        : confirm(`Bạn có chắc muốn xóa giao dịch nợ "${note}"? (Mọi khoản chi tiêu trong Sổ Thu Chi Cá Nhân vẫn được bảo toàn)`);

      if (confirmed) {
        const curData = getLedgerData();
        curData.debts = (curData.debts || []).filter(x => x.id !== id);
        saveLedgerData(curData);
        if (typeof renderDebtsUI === 'function') renderDebtsUI();
      }
    });
  });

  // Gắn sự kiện hoàn tác thanh toán trả nợ
  container.querySelectorAll('[data-action="unsettle-debt-item"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const idsStr = btn.dataset.ids || btn.dataset.id || '';
      const ids = idsStr.split(',').filter(Boolean);
      const person = btn.dataset.person || '';
      if (ids.length === 0) return;

      const confirmed = typeof showAppConfirm === 'function'
        ? await showAppConfirm(`Bạn có muốn hoàn tác việc trả nợ này và chuyển lại trạng thái Chưa thanh toán không?`, {
            title: 'Hoàn tác thanh toán',
            btnText: 'Xác nhận hoàn tác',
            btnIcon: 'fa-solid fa-rotate-left'
          })
        : confirm(`Bạn có muốn hoàn tác việc trả nợ này và chuyển lại trạng thái Chưa thanh toán không?`);

      if (confirmed) {
        const curData = getLedgerData();
        ids.forEach(targetId => {
          const target = (curData.debts || []).find(x => x.id === targetId);
          if (target) {
            target.status = 'pending';
            delete target.settledAt;
          }
        });
        saveLedgerData(curData);
        if (typeof renderDebtsUI === 'function') renderDebtsUI();
      }
    });
  });

  // Gắn sự kiện click vào tên người để mở popup chi tiết với người đó
  container.querySelectorAll('[data-action="view-person-history"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const personName = btn.dataset.person;
      if (personName && typeof openPersonHistoryModal === 'function') {
        openPersonHistoryModal(personName);
      }
    });
  });
}

