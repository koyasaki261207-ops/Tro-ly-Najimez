/**
 * js/vietqr.js - Quản lý cấu hình tài khoản ngân hàng và hiển thị mã VietQR Napas
 */

function initBankSettingsModal() {
  const modal = document.getElementById('bankSettingsModal');
  const btnOpen = document.getElementById('btnOpenBankSettings');
  const btnClose = document.getElementById('btnCloseBankSettingsModal');
  const btnSave = document.getElementById('btnSaveBankSettings');
  const bankSelect = document.getElementById('bankSelect');
  const accNoInput = document.getElementById('bankAccountNo');
  const accNameInput = document.getElementById('bankAccountName');

  if (!modal) return;

  function loadSettings() {
    const data = getLedgerData();
    if (data.bank) {
      if (bankSelect && data.bank.bankId) bankSelect.value = data.bank.bankId;
      if (accNoInput && data.bank.accountNo) accNoInput.value = data.bank.accountNo;
      if (accNameInput && data.bank.accountName) accNameInput.value = data.bank.accountName;
    }
  }

  function open() {
    loadSettings();
    modal.classList.add('active');
  }

  function close() {
    modal.classList.remove('active');
  }

  if (btnOpen) btnOpen.addEventListener('click', open);
  if (btnClose) btnClose.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const data = getLedgerData();
      data.bank = {
        bankId: bankSelect ? bankSelect.value : 'MB',
        accountNo: accNoInput ? accNoInput.value.trim() : '',
        accountName: accNameInput ? accNameInput.value.trim().toUpperCase() : ''
      };
      saveLedgerData(data);
      close();
      notifyChat(`Đã lưu tài khoản ngân hàng **${data.bank.bankId}** (${data.bank.accountNo || 'Chưa nhập STK'})! Giờ bạn có thể tạo mã VietQR chuyển khoản bất kỳ lúc nào.`);
    });
  }

  const btnTest = document.getElementById('btnTestBankQR');
  const testSection = document.getElementById('bankTestQRSection');
  const testStatus = document.getElementById('bankTestStatus');
  const qrPreview = document.getElementById('bankQRPreview');
  const qrImg = document.getElementById('bankTestQRImg');
  const qrLabel = document.getElementById('bankQRLabel');

  if (btnTest) {
    btnTest.addEventListener('click', () => {
      const bid = bankSelect ? bankSelect.value : 'MB';
      const accNo = accNoInput ? accNoInput.value.trim() : '';
      const accName = accNameInput ? accNameInput.value.trim().toUpperCase() : '';

      if (!accNo) {
        alert('⚠️ Vui lòng nhập Số tài khoản trước khi kiểm tra!');
        return;
      }

      // Show section, reset state
      testSection.style.display = 'block';
      testStatus.style.display = 'flex';
      testStatus.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Đang kết nối tới VietQR...</span>';
      testStatus.className = 'bank-test-status loading';
      qrPreview.style.display = 'none';

      const bankLabel = bankSelect ? bankSelect.options[bankSelect.selectedIndex].text : bid;
      const testUrl = `https://img.vietqr.io/image/${bid}-${accNo}-compact2.jpg?amount=1000&addInfo=Kiem+tra+ket+noi+Najimez&accountName=${encodeURIComponent(accName || 'CHU_TAI_KHOAN')}`;

      // Try to load the QR image
      const tmpImg = new Image();
      tmpImg.onload = () => {
        testStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>Kết nối thành công! Ngân hàng đã nhận diện tài khoản.</span>';
        testStatus.className = 'bank-test-status success';
        qrImg.src = testUrl;
        qrLabel.innerHTML = `<strong>${bankLabel}</strong> &bull; ${accNo}${accName ? ' &bull; ' + accName : ''}`;
        qrPreview.style.display = 'flex';
      };
      tmpImg.onerror = () => {
        testStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i><span>Không thể kết nối. Kiểm tra lại số tài khoản hoặc thử lại sau.</span>';
        testStatus.className = 'bank-test-status error';
        qrPreview.style.display = 'none';
      };
      tmpImg.src = testUrl;
      testSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}

function initVietQrModal() {
  const modal = document.getElementById('vietQrModal');
  const btnClose = document.getElementById('btnCloseVietQrModal');
  const btnConfirm = document.getElementById('btnConfirmQrPaid');

  if (!modal) return;
  function close() { modal.classList.remove('active'); }
  if (btnClose) btnClose.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      if (currentViewingDebt) {
        const data = getLedgerData();
        const pName = (currentViewingDebt.person || '').trim();
        const curAmount = Math.abs(Number(currentViewingDebt.amount) || 0);
        const curDir = currentViewingDebt.direction || 'they_owe_me';

        // 1. Tìm các khoản nợ tương ứng theo ID hoặc theo tên đối tượng
        let matchedDebts = [];
        if (currentViewingDebt.id) {
          const byId = data.debts.find(d => d.id === currentViewingDebt.id);
          if (byId) matchedDebts.push(byId);
        }

        if (matchedDebts.length === 0 && pName) {
          matchedDebts = data.debts.filter(d =>
            d.status !== 'paid' &&
            matchPersonName(d.person, pName) &&
            (!curDir || d.direction === curDir)
          );
          if (matchedDebts.length === 0) {
            matchedDebts = data.debts.filter(d =>
              d.status !== 'paid' &&
              matchPersonName(d.person, pName)
            );
          }
        }

        // 2. Đánh dấu tất toán các khoản nợ tìm thấy
        let totalSettled = 0;
        matchedDebts.forEach(d => {
          d.status = 'paid';
          d.settledAt = Date.now();
          totalSettled += (Number(d.amount) || 0);
        });

        const settleAmount = curAmount > 0 ? curAmount : totalSettled;
        const isExpense = curDir === 'i_owe_them';

        // 3. Tự động ghi vào Sổ Thu Chi Cá Nhân
        if (settleAmount > 0) {
          data.transactions.unshift({
            id: 'tx-settle-' + Date.now(),
            type: isExpense ? 'expense' : 'income',
            amount: settleAmount,
            category: isExpense ? 'Trả nợ' : 'Thu hồi nợ',
            note: isExpense ? `Trả nợ cho ${pName || 'người quen'}` : `${pName || 'Người quen'} trả nợ`,
            timestamp: Date.now()
          });
        }

        saveLedgerData(data);
        notifyChat(`Đã đánh dấu hoàn tất thanh toán cho **${pName || 'khoản nợ'}** (${formatCurrency(settleAmount)}) & cập nhật Sổ Thu Chi! 🎉`);
      }
      close();
    });
  }
}

function openVietQrModal(debt) {
  currentViewingDebt = debt;
  const modal = document.getElementById('vietQrModal');
  const imgEl = document.getElementById('vietQrImage');
  const loadingEl = document.getElementById('vietQrLoading');
  const infoEl = document.getElementById('vietQrInfoText');
  const titleEl = document.getElementById('vietQrModalTitle');
  const downloadBtn = document.getElementById('btnDownloadQr');

  if (!modal) return;

  const data = getLedgerData();
  const bank = data.bank || { bankId: 'MB', accountNo: '0987654321', accountName: 'NGUYEN VAN A' };
  const bankId = bank.bankId || 'MB';
  const accountNo = bank.accountNo || '0987654321';
  const accountName = bank.accountName || 'CHỦ TÀI KHOẢN';

  const isTheyOwe = debt.direction === 'they_owe_me';
  if (titleEl) {
    titleEl.textContent = isTheyOwe ? `Đòi tiền từ ${debt.person}` : `Thanh toán cho ${debt.person}`;
  }

  if (infoEl) {
    infoEl.innerHTML = `<strong>${escapeHTML(debt.person)}</strong>: ${formatCurrency(debt.amount)}<br/><small>${escapeHTML(debt.note || 'Thanh toan VietQR')}</small>`;
  }

  if (loadingEl) loadingEl.style.display = 'flex';
  if (imgEl) imgEl.style.display = 'none';

  const desc = encodeURIComponent(`${debt.person} tra tien ${debt.note || ''}`.trim());
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg?amount=${debt.amount}&addInfo=${desc}&accountName=${encodeURIComponent(accountName)}`;

  if (imgEl) {
    imgEl.onload = () => {
      if (loadingEl) loadingEl.style.display = 'none';
      imgEl.style.display = 'block';
    };
    imgEl.onerror = () => {
      if (loadingEl) {
        loadingEl.innerHTML = '<span style="color:#fb7185">Không thể tải mã VietQR. Vui lòng vào Cài STK VietQR ở Sidebar để kiểm tra lại.</span>';
      }
    };
    imgEl.src = qrUrl;
  }

  if (downloadBtn) downloadBtn.href = qrUrl;
  modal.classList.add('active');
}
