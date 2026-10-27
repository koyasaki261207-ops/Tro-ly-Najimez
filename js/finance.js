/**
 * js/finance.js - Quản lý thu chi cá nhân, biểu mẫu ghi sổ và bộ lọc tài chính
 */

function renderFinanceTab() {
  renderExpensesUI();
  if (typeof renderDebtsUI === 'function') renderDebtsUI();
}

function renderExpensesUI() {
  const container = document.getElementById('expenseHistoryList');
  const balEl = document.getElementById('summaryRemainingBalance');

  const data = getLedgerData();
  const txs = Array.isArray(data.transactions) ? data.transactions : [];

  let totalInc = 0;
  let totalExp = 0;

  txs.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') totalInc += amt;
    else totalExp += amt;
  });

  const balance = totalInc - totalExp;

  if (balEl) {
    balEl.textContent = formatCurrency(balance);
    balEl.style.color = balance >= 0 ? '#34d399' : '#fb7185';
  }

  if (!container) return;

  const filtered = txs.filter(t => {
    if (currentExpenseFilter === 'expense') return t.type === 'expense';
    if (currentExpenseFilter === 'income') return t.type === 'income';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <i class="fa-solid fa-receipt"></i>
        <p>Chưa có khoản thu chi nào ${currentExpenseFilter !== 'all' ? 'thuộc danh mục này' : ''}.<br/>
        <small>Nhấn <strong>"+ Ghi Thu / Chi"</strong> ở trên hoặc nhắn tin cho Najimez để tự động ghi sổ!</small></p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const isInc = t.type === 'income';
    const iconClass = getCategoryIcon(t.category, t.type);
    const amountStr = `${isInc ? '+' : '-'}${formatCurrency(t.amount)}`;
    const imgInfo = typeof resolveTransactionImage === 'function'
      ? resolveTransactionImage(t)
      : { src: t.image || '', label: t.note || '', key: 'com' };

    return `
      <div class="expense-row-item" data-id="${t.id}">
        <div class="expense-meta-left">
          <div class="category-icon-box ${isInc ? 'inc' : 'exp'}">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div class="expense-name-wrap">
            <div class="expense-header-line">
              <strong class="expense-note-title" title="${escapeHTML(t.note || (isInc ? 'Khoản thu' : 'Khoản chi'))}">${escapeHTML(t.note || (isInc ? 'Khoản thu' : 'Khoản chi'))}</strong>
            </div>
            <div class="expense-sub-line">
              <span class="cat-pill-badge ${isInc ? 'inc' : 'exp'}">${escapeHTML(t.category || (isInc ? 'Thu nhập' : 'Chi tiêu'))}</span>
              <span class="sep">&bull;</span>
              <span class="time"><i class="fa-regular fa-clock"></i> ${formatRelativeTime(t.timestamp)}</span>
            </div>
          </div>
        </div>
        <div class="expense-amount-right">
          <div class="history-item-thumb-wrap" data-action="view-tx-img" data-id="${t.id}" title="${escapeHTML(imgInfo.label)} (Nhấn để phóng to)">
            <img src="${escapeHTML(imgInfo.src)}" alt="${escapeHTML(imgInfo.label)}" class="history-item-thumb" onerror="if(typeof handleAutoImgError==='function') handleAutoImgError(this, '${imgInfo.key}')" />
            <span class="thumb-badge-zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></span>
          </div>
          <span class="amount-txt ${isInc ? 'inc' : 'exp'}">${amountStr}</span>
          <button type="button" class="btn-row-del" data-action="del-tx" data-id="${t.id}" title="Xóa giao dịch này">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-action="del-tx"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (!id) return;

      const confirmed = typeof showAppConfirm === 'function'
        ? await showAppConfirm('Bạn có chắc chắn muốn xóa giao dịch này khỏi sổ chi tiêu?', {
            title: 'Xóa giao dịch',
            btnText: 'Xác nhận xóa',
            btnIcon: 'fa-solid fa-trash-can'
          })
        : confirm('Bạn có chắc muốn xóa giao dịch này khỏi sổ chi tiêu?');

      if (confirmed) {
        const curData = getLedgerData();
        curData.transactions = (curData.transactions || []).filter(t => String(t.id) !== String(id));
        saveLedgerData(curData);
      }
    });
  });
}

function initFinanceTab() {
  // Form Ghi Thu Chi
  const btnToggleExpense = document.getElementById('btnToggleAddExpense');
  const boxExpense = document.getElementById('expenseRecordFormBox');
  const btnCloseExpense = document.getElementById('btnCloseExpenseRecord');
  const btnCancelExpense = document.getElementById('btnCancelExpenseRecord');
  const btnSaveExpense = document.getElementById('btnSaveExpenseItem');

  const expTypeSelect = document.getElementById('expenseTypeSelect');
  const expAmountInput = document.getElementById('expenseAmountInput');
  const expCatInput = document.getElementById('expenseCategoryInput');
  const expNoteInput = document.getElementById('expenseNoteInput');

  function openExpenseForm() {
    if (boxExpense) {
      boxExpense.style.display = 'flex';
      if (expAmountInput) expAmountInput.focus();
    }
  }

  function closeExpenseForm() {
    if (boxExpense) boxExpense.style.display = 'none';
    if (expAmountInput) expAmountInput.value = '';
    if (expCatInput) expCatInput.value = '';
    if (expNoteInput) expNoteInput.value = '';
    if (typeof resetFormAttachedExpenseImage === 'function') resetFormAttachedExpenseImage();
  }

  if (btnToggleExpense) btnToggleExpense.addEventListener('click', openExpenseForm);
  if (btnCloseExpense) btnCloseExpense.addEventListener('click', closeExpenseForm);
  if (btnCancelExpense) btnCancelExpense.addEventListener('click', closeExpenseForm);

  if (btnSaveExpense) {
    btnSaveExpense.addEventListener('click', () => {
      const type = expTypeSelect ? expTypeSelect.value : 'expense';
      const rawAmt = expAmountInput ? expAmountInput.value.trim() : '';
      const cat = expCatInput ? expCatInput.value.trim() : '';
      const note = expNoteInput ? expNoteInput.value.trim() : '';

      if (!rawAmt) {
        alert('Vui lòng nhập số tiền.');
        if (expAmountInput) expAmountInput.focus();
        return;
      }

      const amount = parseAmount(rawAmt);
      if (amount <= 0) {
        alert('Số tiền không hợp lệ.');
        return;
      }

      const attachedImg = typeof getFormAttachedExpenseImage === 'function' ? getFormAttachedExpenseImage() : null;
      const data = getLedgerData();
      const newTx = {
        id: 'tx-' + Date.now(),
        type: type,
        amount: amount,
        category: cat || (type === 'income' ? 'Thu nhập' : 'Ăn uống / Sinh hoạt'),
        note: note || (type === 'income' ? 'Khoản thu' : 'Chi tiêu cá nhân'),
        timestamp: Date.now(),
        image: attachedImg || null
      };

      data.transactions.unshift(newTx);
      if (!attachedImg && typeof autoFetchAndAssignWebImageForItem === 'function') {
        autoFetchAndAssignWebImageForItem(newTx);
      }

      // Tự động đồng bộ gạch nợ trong Sổ Nợ nếu là trả nợ hoặc thu nợ
      const isPayDebt = type === 'expense' && (/(?:trả\s+nợ|thanh\s+toán\s+nợ)/i.test(newTx.category || '') || /(?:trả\s+nợ|thanh\s+toán\s+nợ|trả\s+tiền\s+cho)/i.test(newTx.note || ''));
      if (isPayDebt) {
        const matchDebts = (data.debts || []).filter(d => d.status !== 'paid' && d.direction === 'i_owe_them' && matchPersonName(newTx.note, d.person));
        matchDebts.forEach(d => {
          d.status = 'paid';
          d.settledAt = Date.now();
        });
        if (typeof renderDebtsUI === 'function') renderDebtsUI();
      }
      const isRecDebt = type === 'income' && (/(?:thu\s+nợ|thu\s+hồi\s+nợ)/i.test(newTx.category || '') || /(?:trả\s+nợ|thu\s+nợ|thanh\s+toán)/i.test(newTx.note || ''));
      if (isRecDebt) {
        const matchDebts = (data.debts || []).filter(d => d.status !== 'paid' && d.direction === 'they_owe_me' && matchPersonName(newTx.note, d.person));
        matchDebts.forEach(d => {
          d.status = 'paid';
          d.settledAt = Date.now();
        });
        if (typeof renderDebtsUI === 'function') renderDebtsUI();
      }

      saveLedgerData(data);
      closeExpenseForm();
    });
  }

  // Form Ghi Nợ Mới
  const btnToggleDebt = document.getElementById('btnToggleAddDebt');
  const boxDebt = document.getElementById('debtRecordFormBox');
  const btnCloseDebt = document.getElementById('btnCloseDebtRecord');
  const btnCancelDebt = document.getElementById('btnCancelDebtRecord');
  const btnSaveDebt = document.getElementById('btnSaveDebtItem');

  const debtDirSelect = document.getElementById('debtDirectionSelect');
  const debtPersonInput = document.getElementById('debtPersonInput');
  const debtAmountInput = document.getElementById('debtAmountInput');
  const debtNoteInput = document.getElementById('debtNoteInput');

  function openDebtForm() {
    if (boxDebt) {
      boxDebt.style.display = 'flex';
      if (debtPersonInput) debtPersonInput.focus();
    }
  }

  function closeDebtForm() {
    if (boxDebt) boxDebt.style.display = 'none';
    if (debtPersonInput) debtPersonInput.value = '';
    if (debtAmountInput) debtAmountInput.value = '';
    if (debtNoteInput) debtNoteInput.value = '';
    if (typeof resetFormAttachedDebtImage === 'function') resetFormAttachedDebtImage();
  }

  if (btnToggleDebt) btnToggleDebt.addEventListener('click', openDebtForm);
  if (btnCloseDebt) btnCloseDebt.addEventListener('click', closeDebtForm);
  if (btnCancelDebt) btnCancelDebt.addEventListener('click', closeDebtForm);

  if (btnSaveDebt) {
    btnSaveDebt.addEventListener('click', () => {
      const direction = debtDirSelect ? debtDirSelect.value : 'they_owe_me';
      const person = debtPersonInput ? debtPersonInput.value.trim() : '';
      const rawAmt = debtAmountInput ? debtAmountInput.value.trim() : '';
      const note = debtNoteInput ? debtNoteInput.value.trim() : '';

      if (!person) {
        alert('Vui lòng nhập tên đối tượng nợ (VD: Tuấn, Nam, Lan...).');
        if (debtPersonInput) debtPersonInput.focus();
        return;
      }

      if (!rawAmt) {
        alert('Vui lòng nhập số tiền nợ.');
        if (debtAmountInput) debtAmountInput.focus();
        return;
      }

      const amount = parseAmount(rawAmt);
      if (amount <= 0) {
        alert('Số tiền nợ không hợp lệ.');
        return;
      }

      const attachedImg = typeof getFormAttachedDebtImage === 'function' ? getFormAttachedDebtImage() : null;
      const data = getLedgerData();
      const newDebt = {
        id: 'db-' + Date.now(),
        direction: direction,
        person: person,
        amount: amount,
        note: note || 'Khoản vay mượn',
        status: 'pending',
        timestamp: Date.now(),
        image: attachedImg || null
      };

      data.debts.unshift(newDebt);
      if (!attachedImg && typeof autoFetchAndAssignWebImageForItem === 'function') {
        autoFetchAndAssignWebImageForItem(newDebt);
      }

      // Tự động ghi nhận vào Sổ Thu Chi Cá Nhân
      const isTheyOwe = direction === 'they_owe_me';
      data.transactions.unshift({
        id: 'tx-debt-' + newDebt.id,
        debtId: newDebt.id,
        type: isTheyOwe ? 'expense' : 'income',
        amount: amount,
        category: isTheyOwe ? 'Cho mượn' : 'Vay mượn',
        note: isTheyOwe ? `Cho ${person} mượn tiền${note ? ': ' + note : ''}` : `Vay tiền từ ${person}${note ? ': ' + note : ''}`,
        timestamp: newDebt.timestamp,
        image: attachedImg || null
      });

      saveLedgerData(data);
      closeDebtForm();
    });
  }

  // Bộ lọc Thu chi
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentExpenseFilter = btn.dataset.filter || 'all';
      renderExpensesUI();
    });
  });

  // Chuyển đổi chế độ xem Sổ nợ (Người / Lịch sử giao dịch)
  document.querySelectorAll('.filter-chip-debt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip-debt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDebtView = btn.dataset.view || 'contacts';
      if (typeof renderDebtsUI === 'function') renderDebtsUI();
    });
  });
}

function removeTransaction(id, cardEl) {
  const data = getLedgerData();
  data.transactions = data.transactions.filter(t => t.id !== id);
  saveLedgerData(data);
  cardEl.style.opacity = '0';
  cardEl.style.transform = 'scale(0.95)';
  setTimeout(() => cardEl.remove(), 200);
}
