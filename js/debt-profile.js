/**
 * js/debt-profile.js - Quản lý hồ sơ đối tượng sổ nợ: Đổi avatar (tải ảnh / dán ảnh clipboard / URL), đổi tên, ghi chú
 */

let currentProfileOriginalName = '';
let currentProfileAvatarData = null;

/**
 * Nén và thu nhỏ ảnh về kích thước tối ưu (max 360x360) để lưu trữ an toàn trong LocalStorage
 */
function compressAvatarImage(fileOrBlob, maxWidth = 360, maxHeight = 360, quality = 0.84) {
  return new Promise((resolve, reject) => {
    if (!fileOrBlob) return reject(new Error('Không có tệp ảnh'));

    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Hiển thị xem trước Avatar trong Modal
 */
function renderProfileAvatarPreview(name, avatarUrl) {
  const previewBox = document.getElementById('personInfoAvatarPreview');
  if (!previewBox) return;

  const displayName = name || currentProfileOriginalName || 'N';
  const initial = displayName.trim().charAt(0).toUpperCase();

  if (avatarUrl) {
    previewBox.innerHTML = `
      <img src="${escapeHTML(avatarUrl)}" alt="${escapeHTML(displayName)}" class="profile-avatar-preview-img" onerror="this.remove();" />
    `;
    previewBox.classList.add('has-custom-img');
    previewBox.style.background = 'transparent';
  } else {
    previewBox.innerHTML = `<span>${initial}</span>`;
    previewBox.classList.remove('has-custom-img');
    previewBox.style.background = typeof getAvatarGradient === 'function' ? getAvatarGradient(displayName) : 'linear-gradient(135deg, #6366f1, #8b5cf6)';
  }
}

/**
 * Mở modal chỉnh sửa thông tin đối tượng
 */
function openPersonInfoModal(personName) {
  const modal = document.getElementById('personInfoModal');
  const titleEl = document.getElementById('personInfoModalTitle');
  const nameInput = document.getElementById('personInfoNameInput');
  const noteInput = document.getElementById('personInfoNoteInput');
  const urlInput = document.getElementById('personAvatarUrlInput');
  const debtPill = document.getElementById('personInfoDebtPill');

  if (!modal) return;

  const data = getLedgerData();
  const debts = Array.isArray(data.debts) ? data.debts : [];
  const contacts = data.contacts || {};

  currentProfileOriginalName = personName;

  // Tìm hồ sơ đã lưu hoặc khớp tên
  const key = personName.toLowerCase().trim();
  const profile = contacts[key] || Object.values(contacts).find(c => matchPersonName(c.name, personName)) || null;

  currentProfileAvatarData = (profile && profile.avatar) || null;

  if (titleEl) {
    titleEl.textContent = `Hồ Sơ & Thông Tin - ${personName}`;
  }

  if (nameInput) {
    nameInput.value = (profile && profile.name) || personName;
  }

  if (noteInput) {
    noteInput.value = (profile && profile.note) || '';
  }

  if (urlInput) {
    urlInput.value = '';
  }

  // Tính số dư nợ hiện tại để hiển thị tóm tắt trực quan
  let activeLent = 0;
  let activeBorrowed = 0;
  debts.filter(d => matchPersonName(d.person, personName) && d.status !== 'paid').forEach(d => {
    const amt = Number(d.amount) || 0;
    if (d.direction === 'they_owe_me') activeLent += amt;
    else activeBorrowed += amt;
  });

  const net = activeLent - activeBorrowed;
  if (debtPill) {
    if (activeLent === 0 && activeBorrowed === 0) {
      debtPill.className = 'person-debt-mini-badge settled';
      debtPill.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Tình trạng: <strong>Đã thanh toán hết nợ</strong></span>';
    } else if (net > 0) {
      debtPill.className = 'person-debt-mini-badge lent';
      debtPill.innerHTML = `<i class="fa-solid fa-arrow-down-left"></i> <span>Họ đang nợ bạn: <strong>${formatCurrency(net)}</strong></span>`;
    } else if (net < 0) {
      debtPill.className = 'person-debt-mini-badge borrowed';
      debtPill.innerHTML = `<i class="fa-solid fa-arrow-up-right"></i> <span>Bạn đang nợ họ: <strong>${formatCurrency(Math.abs(net))}</strong></span>`;
    } else {
      debtPill.className = 'person-debt-mini-badge balanced';
      debtPill.innerHTML = '<i class="fa-solid fa-scale-balanced"></i> <span>Tình trạng: <strong>Cân bằng nợ đối ứng (0 đ)</strong></span>';
    }
  }

  // Hiển thị avatar xem trước
  renderProfileAvatarPreview(nameInput ? nameInput.value : personName, currentProfileAvatarData);

  modal.classList.add('active');
  if (nameInput) nameInput.focus();
}

/**
 * Đóng modal thông tin đối tượng
 */
function closePersonInfoModal() {
  const modal = document.getElementById('personInfoModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Khởi tạo toàn bộ các sự kiện cho Modal Thông Tin Đối Tượng
 */
function initPersonInfoModal() {
  const modal = document.getElementById('personInfoModal');
  if (!modal) return;

  const btnClose = document.getElementById('btnClosePersonInfoModal');
  const btnCancel = document.getElementById('btnCancelPersonInfoModal');
  const btnSave = document.getElementById('btnSavePersonInfoModal');

  const fileInput = document.getElementById('personAvatarFileInput');
  const btnUpload = document.getElementById('btnUploadPersonAvatar');
  const btnPaste = document.getElementById('btnPastePersonAvatar');
  const urlInput = document.getElementById('personAvatarUrlInput');
  const btnApplyUrl = document.getElementById('btnApplyAvatarUrl');
  const btnReset = document.getElementById('btnResetPersonAvatar');
  const nameInput = document.getElementById('personInfoNameInput');
  const noteInput = document.getElementById('personInfoNoteInput');

  // Đóng modal
  if (btnClose) btnClose.addEventListener('click', closePersonInfoModal);
  if (btnCancel) btnCancel.addEventListener('click', closePersonInfoModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePersonInfoModal();
  });

  // Cập nhật preview khi người dùng gõ đổi tên (nếu đang dùng avatar chữ cái)
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (!currentProfileAvatarData) {
        renderProfileAvatarPreview(nameInput.value, null);
      }
    });
  }

  // 1. Tải ảnh lên từ máy tính
  if (btnUpload && fileInput) {
    btnUpload.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      try {
        const compressed = await compressAvatarImage(file);
        currentProfileAvatarData = compressed;
        renderProfileAvatarPreview(nameInput ? nameInput.value : '', currentProfileAvatarData);
      } catch (err) {
        console.error('Lỗi tải ảnh:', err);
        alert('Không thể tải hoặc đọc tệp ảnh này. Vui lòng chọn ảnh định dạng JPG/PNG/WebP hợp lệ.');
      } finally {
        fileInput.value = '';
      }
    });
  }

  // 2. Dán ảnh trực tiếp từ Clipboard qua nút bấm
  if (btnPaste) {
    btnPaste.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.read) {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
              const blob = await item.getType(imageType);
              const compressed = await compressAvatarImage(blob);
              currentProfileAvatarData = compressed;
              renderProfileAvatarPreview(nameInput ? nameInput.value : '', currentProfileAvatarData);
              return;
            }
          }
        }
      } catch (err) {
        console.log('Clipboard direct read fallback:', err);
      }

      // Thử đọc chuỗi URL nếu có
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = (await navigator.clipboard.readText()).trim();
          if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
            currentProfileAvatarData = text;
            renderProfileAvatarPreview(nameInput ? nameInput.value : '', currentProfileAvatarData);
            if (urlInput) urlInput.value = text;
            return;
          }
        }
      } catch (err) { }

      // Hướng dẫn nếu trình duyệt chặn quyền đọc clipboard tự động
      alert('Hãy nhấn tổ hợp phím Ctrl + V trực tiếp để dán ảnh đã copy vào modal!');
    });
  }

  // Hỗ trợ lắng nghe sự kiện Paste (Ctrl + V) toàn diện trên Modal
  modal.addEventListener('paste', async (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        hasImage = true;
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          try {
            const compressed = await compressAvatarImage(file);
            currentProfileAvatarData = compressed;
            renderProfileAvatarPreview(nameInput ? nameInput.value : '', currentProfileAvatarData);
          } catch (err) {
            console.error('Lỗi xử lý ảnh dán:', err);
          }
        }
        break;
      }
    }

    // Nếu người dùng dán text link ảnh ra ngoài các ô input khác
    if (!hasImage && e.target !== nameInput && e.target !== noteInput) {
      const text = e.clipboardData.getData('text').trim();
      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
        e.preventDefault();
        currentProfileAvatarData = text;
        renderProfileAvatarPreview(nameInput ? nameInput.value : '', currentProfileAvatarData);
        if (urlInput) urlInput.value = text;
      }
    }
  });

  // 3. Áp dụng URL ảnh
  if (btnApplyUrl && urlInput) {
    btnApplyUrl.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) {
        alert('Vui lòng dán liên kết URL ảnh hợp lệ!');
        return;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
        alert('Đường dẫn ảnh phải bắt đầu bằng http:// hoặc https://');
        return;
      }
      currentProfileAvatarData = url;
      renderProfileAvatarPreview(nameInput ? nameInput.value : '', currentProfileAvatarData);
    });
  }

  // 4. Đặt lại Avatar chữ cái mặc định (Gỡ ảnh tùy chỉnh)
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      currentProfileAvatarData = null;
      if (urlInput) urlInput.value = '';
      renderProfileAvatarPreview(nameInput ? nameInput.value : '', null);
    });
  }

  // 5. Lưu Thông Tin Đối Tượng
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const newName = (nameInput ? nameInput.value : '').trim();
      const newNote = (noteInput ? noteInput.value : '').trim();

      if (!newName) {
        alert('Vui lòng nhập tên đối tượng!');
        if (nameInput) nameInput.focus();
        return;
      }

      const curData = getLedgerData();
      curData.debts = Array.isArray(curData.debts) ? curData.debts : [];
      curData.transactions = Array.isArray(curData.transactions) ? curData.transactions : [];
      curData.contacts = curData.contacts || {};

      const oldName = currentProfileOriginalName;
      const isNameChanged = newName.toLowerCase() !== oldName.toLowerCase();

      // 1. Cập nhật tên trong toàn bộ danh sách nợ nếu tên bị đổi
      if (isNameChanged) {
        curData.debts.forEach(d => {
          if (matchPersonName(d.person, oldName)) {
            d.person = newName;
          }
        });

        // Cập nhật tên trong các giao dịch thu chi liên quan
        curData.transactions.forEach(t => {
          if (t.note && matchPersonName(t.note, oldName)) {
            t.note = t.note.split(oldName).join(newName);
          }
        });
      }

      // 2. Cập nhật hoặc di chuyển key trong danh bạ contacts
      const oldKey = oldName.toLowerCase().trim();
      const newKey = newName.toLowerCase().trim();

      if (isNameChanged && curData.contacts[oldKey]) {
        delete curData.contacts[oldKey];
      }

      curData.contacts[newKey] = {
        name: newName,
        avatar: currentProfileAvatarData || null,
        note: newNote,
        updatedAt: Date.now()
      };

      // 3. Lưu trữ và cập nhật giao diện
      saveLedgerData(curData);

      if (typeof renderDebtsUI === 'function') renderDebtsUI();
      if (typeof renderFinanceTab === 'function') renderFinanceTab();

      closePersonInfoModal();
    });
  }
}
