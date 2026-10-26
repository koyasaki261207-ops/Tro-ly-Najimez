/**
 * js/bill-image.js - Quản lý hình ảnh tự động & đính kèm cho giao dịch / khoản nợ
 * 
 * Tính năng chính:
 * 1. Tự động nhận diện nội dung (tiền cơm, bún đậu, quán net, ăn vặt, mượn tiền...)
 *    và tự động dán/hiển thị hình ảnh tương ứng bên góc phải mà người dùng không cần động vào.
 * 2. Cung cấp fallback SVG vector siêu nét offline không bao giờ bị lỗi ảnh.
 * 3. Hỗ trợ xem ảnh phóng to, tải về máy hoặc thay đổi ảnh tùy ý.
 */

// ============================================================================
// 1. KHO HÌNH ẢNH THÔNG MINH TỰ ĐỘNG (AUTO SMART VISUALS)
// ============================================================================

/**
 * Tạo SVG vector dữ liệu trực tiếp (Data-URI) với gradient sang trọng, biểu tượng nổi bật và nhãn chữ
 */
function createAutoSvg(bgColor1, bgColor2, emojiOrIcon, title) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor1}" />
        <stop offset="100%" stop-color="${bgColor2}" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.45" />
      </filter>
    </defs>
    <rect width="240" height="240" rx="42" fill="url(#g)" />
    <circle cx="120" cy="98" r="56" fill="rgba(255,255,255,0.16)" />
    <text x="120" y="122" font-size="62" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', sans-serif" filter="url(#shadow)">${emojiOrIcon}</text>
    <rect x="24" y="174" width="192" height="34" rx="10" fill="rgba(0,0,0,0.38)" />
    <text x="120" y="197" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="0.8">${title}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Từ điển hình ảnh tương ứng theo chủ đề
const AUTO_SMART_VISUALS = {
  com: {
    key: 'com',
    label: 'Tiền cơm',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#f97316', '#ea580c', '🍚', 'TIỀN CƠM')
  },
  bun_dau: {
    key: 'bun_dau',
    label: 'Bún đậu',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#84cc16', '#65a30d', '🥢', 'BÚN ĐẬU')
  },
  net: {
    key: 'net',
    label: 'Quán net',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#6366f1', '#a855f7', '🖥️', 'QUÁN NET')
  },
  an_vat: {
    key: 'an_vat',
    label: 'Ăn vặt',
    url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#ec4899', '#f43f5e', '🍟', 'ĂN VẶT')
  },
  tien: {
    key: 'tien',
    label: 'Mượn tiền',
    url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#10b981', '#059669', '💵', 'TIỀN MẶT')
  },
  tra_sua: {
    key: 'tra_sua',
    label: 'Trà sữa',
    url: 'https://images.unsplash.com/photo-1558857563-b37cf05d8a58?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#f59e0b', '#d97706', '🧋', 'TRÀ SỮA')
  },
  ca_phe: {
    key: 'ca_phe',
    label: 'Cà phê',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#78350f', '#451a03', '☕', 'CÀ PHÊ')
  },
  pho_mi: {
    key: 'pho_mi',
    label: 'Phở / Mì',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#ef4444', '#dc2626', '🍜', 'PHỞ / MÌ')
  },
  lau_nuong: {
    key: 'lau_nuong',
    label: 'Lẩu nướng',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#f97316', '#dc2626', '🍲', 'LẨU NƯỚNG')
  },
  banh_mi: {
    key: 'banh_mi',
    label: 'Bánh mì',
    url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#eab308', '#ca8a04', '🥖', 'BÁNH MÌ')
  },
  xang_xe: {
    key: 'xang_xe',
    label: 'Xăng xe',
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#0ea5e9', '#0284c7', '⛽', 'XĂNG XE')
  },
  shopping: {
    key: 'shopping',
    label: 'Mua sắm',
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#ec4899', '#8b5cf6', '🛍️', 'MUA SẮM')
  },
  nha_tro: {
    key: 'nha_tro',
    label: 'Tiền trọ',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#3b82f6', '#1d4ed8', '🏠', 'TIỀN TRỌ')
  },
  hoc_tap: {
    key: 'hoc_tap',
    label: 'Học tập',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#8b5cf6', '#6d28d9', '📚', 'HỌC TẬP')
  },
  xem_phim: {
    key: 'xem_phim',
    label: 'Xem phim',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#8b5cf6', '#ec4899', '🎬', 'XEM PHIM')
  },
  luong: {
    key: 'luong',
    label: 'Lương / Thưởng',
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#10b981', '#3b82f6', '💰', 'LƯƠNG / THƯỞNG')
  },
  default_money: {
    key: 'default_money',
    label: 'Giao dịch',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#6366f1', '#4f46e5', '💸', 'GIAO DỊCH')
  }
};

/**
 * Xóa dấu tiếng Việt và chuẩn hóa chữ để so khớp từ khóa
 */
function normalizeVisualText(str) {
  if (!str) return '';
  return str.toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/**
 * Lấy SVG vector fallback tương ứng theo key
 */
function getAutoSvgDataUri(key) {
  const item = AUTO_SMART_VISUALS[key] || AUTO_SMART_VISUALS.default_money;
  return item.fallbackSvg;
}

/**
 * Khắc phục lỗi khi ảnh trực tuyến không tải được (offline, chặn mạng...),
 * tự động thay thế bằng SVG vector cục bộ siêu nét
 */
function handleAutoImgError(imgEl, key) {
  if (!imgEl) return;
  if (imgEl.dataset.hasFallback === '1') return;
  imgEl.dataset.hasFallback = '1';
  imgEl.src = getAutoSvgDataUri(key);
}

/**
 * Nhận diện từ khóa từ ghi chú / danh mục và trả về đối tượng hình ảnh tương ứng
 */
function matchAutoImage(rawText) {
  const norm = normalizeVisualText(rawText);

  // 1. Tiền cơm, cơm tấm, cơm chiên, dĩa cơm...
  if (norm.includes('com') || norm.includes('dia com') || norm.includes('suat com')) {
    return AUTO_SMART_VISUALS.com;
  }
  // 2. Bún đậu
  if (norm.includes('bun dau') || norm.includes('mam tom')) {
    return AUTO_SMART_VISUALS.bun_dau;
  }
  // 3. Quán net, cyber, gaming, chơi net
  if (norm.includes('net') || norm.includes('cyber') || norm.includes('gaming') || norm.includes('quan net') || norm.includes('choi net') || norm.includes('nap net') || norm.includes('game')) {
    return AUTO_SMART_VISUALS.net;
  }
  // 4. Ăn vặt, bánh tráng, snack, khoai tây chiên, nem...
  if (norm.includes('an vat') || norm.includes('banh trang') || norm.includes('snack') || norm.includes('bim bim') || norm.includes('khoai tay') || norm.includes('nem chua') || norm.includes('xuc xich') || norm.includes('trai cay')) {
    return AUTO_SMART_VISUALS.an_vat;
  }
  // 5. Trà sữa, nước ngọt, sinh tố
  if (norm.includes('tra sua') || norm.includes('tra dao') || norm.includes('tra vai') || norm.includes('toco') || norm.includes('gongcha') || norm.includes('koi') || norm.includes('sting') || norm.includes('coca') || norm.includes('pepsi') || norm.includes('bo huc') || norm.includes('nuoc ngot')) {
    return AUTO_SMART_VISUALS.tra_sua;
  }
  // 6. Cà phê
  if (norm.includes('ca phe') || norm.includes('cafe') || norm.includes('coffee') || norm.includes('bac xiu') || norm.includes('highland') || norm.includes('starbuck') || norm.includes('den da') || norm.includes('sua da')) {
    return AUTO_SMART_VISUALS.ca_phe;
  }
  // 7. Phở, mì, bún bò, hủ tiếu
  if (norm.includes('pho') || norm.includes('bun bo') || norm.includes('hu tieu') || norm.includes('mi tom') || norm.includes('mi cay') || norm.includes('ramen') || norm.includes('mi quang')) {
    return AUTO_SMART_VISUALS.pho_mi;
  }
  // 8. Lẩu, nướng, bia, nhậu
  if (norm.includes('lau') || norm.includes('nuong') || norm.includes('bbq') || norm.includes('nhau') || norm.includes('bia') || norm.includes('ruou') || norm.includes('tiger') || norm.includes('heineken')) {
    return AUTO_SMART_VISUALS.lau_nuong;
  }
  // 9. Bánh mì, ăn sáng, xôi
  if (norm.includes('banh mi') || norm.includes('xoi') || norm.includes('an sang') || norm.includes('diem tam')) {
    return AUTO_SMART_VISUALS.banh_mi;
  }
  // 10. Xăng xe, xe cộ, grab, taxi
  if (norm.includes('xang') || norm.includes('xe') || norm.includes('grab') || norm.includes('be ') || norm.includes('taxi') || norm.includes('gui xe') || norm.includes('rua xe')) {
    return AUTO_SMART_VISUALS.xang_xe;
  }
  // 11. Mua sắm, áo quần, shopee, mỹ phẩm
  if (norm.includes('shopee') || norm.includes('lazada') || norm.includes('tiki') || norm.includes('mua sam') || norm.includes('quan ao') || norm.includes('giay') || norm.includes('my pham') || norm.includes('son ')) {
    return AUTO_SMART_VISUALS.shopping;
  }
  // 12. Nhà trọ, tiền phòng, điện nước
  if (norm.includes('nha tro') || norm.includes('phong tro') || norm.includes('tien tro') || norm.includes('dien nuoc') || norm.includes('wifi') || norm.includes('internet')) {
    return AUTO_SMART_VISUALS.nha_tro;
  }
  // 13. Học tập, sách vở, học phí
  if (norm.includes('hoc phi') || norm.includes('sach') || norm.includes('vo ') || norm.includes('tai lieu') || norm.includes('khoa hoc')) {
    return AUTO_SMART_VISUALS.hoc_tap;
  }
  // 14. Xem phim, cgv, cinema
  if (norm.includes('xem phim') || norm.includes('cgv') || norm.includes('cinema') || norm.includes('bhd') || norm.includes('lotte')) {
    return AUTO_SMART_VISUALS.xem_phim;
  }
  // 15. Lương, thưởng, thu nhập
  if (norm.includes('luong') || norm.includes('thuong') || norm.includes('bonus') || norm.includes('thu nhap')) {
    return AUTO_SMART_VISUALS.luong;
  }
  // 16. Mượn tiền, vay tiền, trả nợ
  if (norm.includes('muon tien') || norm.includes('vay tien') || norm.includes('tien mat') || norm.includes('chuyen khoan') || norm.includes('muon') || norm.includes('vay') || norm.includes('no tien') || norm.includes('tien')) {
    return AUTO_SMART_VISUALS.tien;
  }

  return AUTO_SMART_VISUALS.default_money;
}

/**
 * Trả về thông tin hình ảnh của một giao dịch hoặc khoản nợ:
 * - Nếu người dùng tải ảnh riêng (item.image), dùng ảnh đó.
 * - Nếu không, TỰ ĐỘNG nhận diện nội dung và gán hình ảnh đẹp mắt tương ứng.
 */
function resolveTransactionImage(item) {
  if (!item) {
    return {
      src: getAutoSvgDataUri('default_money'),
      label: 'Giao dịch',
      key: 'default_money',
      isAuto: true
    };
  }

  // 1. Ảnh tùy chỉnh do người dùng tự tải lên
  if (item.image && typeof item.image === 'string' && item.image.trim().length > 0) {
    return {
      src: item.image,
      label: item.note || 'Ảnh giao dịch',
      key: 'custom',
      isAuto: false
    };
  }

  // 2. Tự động nhận diện từ ghi chú, lý do, danh mục
  const combinedText = [
    item.note || '',
    item.category || '',
    item.reason || '',
    item.person ? `với ${item.person}` : ''
  ].join(' ');

  const visual = matchAutoImage(combinedText);

  return {
    src: visual.url,
    label: visual.label,
    key: visual.key,
    isAuto: true
  };
}

// ============================================================================
// 2. QUẢN LÝ MODAL PHÓNG TO & TÙY BIẾN ẢNH (#transactionImageModal)
// ============================================================================

let currentModalTargetId = null;
let currentModalTargetType = 'debt'; // 'debt' | 'tx'
let currentModalActiveImageUrl = null;
let currentPendingModalImage = null;

let formAttachedExpenseImage = null;
let formAttachedDebtImage = null;

/**
 * Nén ảnh tối ưu nhẹ nhàng
 */
function compressAttachmentImage(fileOrBlob, maxWidth = 900, maxHeight = 900, quality = 0.82) {
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

function safeEscape(str) {
  if (typeof escapeHTML === 'function') return escapeHTML(str);
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Mở modal ở chế độ XEM ẢNH (phóng to)
 */
function openViewImageModal(imageUrl, targetId, targetType = 'debt', title = '', resolvedInfo = null) {
  const modal = document.getElementById('transactionImageModal');
  const titleEl = document.getElementById('txImageModalTitle');
  const viewSec = document.getElementById('txImageViewSection');
  const editSec = document.getElementById('txImageEditSection');
  const largeImg = document.getElementById('txImageLargePreview');
  const downloadLink = document.getElementById('btnDownloadTxImage');
  const metaTitle = document.getElementById('txImageMetaTitle');
  const metaDate = document.getElementById('txImageMetaDate');

  if (!modal || !largeImg) return;

  currentModalTargetId = targetId;
  currentModalTargetType = targetType;
  currentModalActiveImageUrl = imageUrl;
  currentPendingModalImage = null;

  if (titleEl) titleEl.textContent = title || 'Chi Tiết Hình Ảnh';
  largeImg.src = imageUrl;

  const data = typeof getLedgerData === 'function' ? getLedgerData() : {};
  let targetItem = null;
  if (targetType === 'debt') {
    targetItem = (data.debts || []).find(d => String(d.id) === String(targetId));
  } else {
    targetItem = (data.transactions || []).find(t => String(t.id) === String(targetId));
  }

  const info = resolvedInfo || (targetItem ? resolveTransactionImage(targetItem) : null);

  largeImg.onerror = function() {
    if (info && info.key) {
      handleAutoImgError(this, info.key);
    }
  };

  if (downloadLink) {
    downloadLink.href = imageUrl;
    downloadLink.download = `najimez-${info ? info.key : 'anh'}-${targetId || 'khoan'}.jpg`;
  }

  if (targetItem) {
    const noteText = targetItem.note || (targetType === 'debt' ? (targetItem.person ? `Khoản nợ với ${targetItem.person}` : 'Khoản nợ') : 'Giao dịch thu chi');
    const badgeText = info && info.isAuto ? `✨ Tự động nhận diện: ${info.label}` : '📷 Ảnh tùy chỉnh';
    if (metaTitle) {
      metaTitle.innerHTML = `<strong>${safeEscape(noteText)}</strong> <span style="font-size:0.75rem; color:#c084fc; margin-left:8px;">${badgeText}</span>`;
    }
    if (metaDate) metaDate.textContent = targetItem.timestamp ? new Date(targetItem.timestamp).toLocaleDateString('vi-VN') : 'Gần đây';
  } else if (info) {
    if (metaTitle) metaTitle.innerHTML = `<strong>${safeEscape(info.label)}</strong>`;
  }

  if (viewSec) viewSec.style.display = 'block';
  if (editSec) editSec.style.display = 'none';

  modal.classList.add('active');
}

/**
 * Mở modal ở chế độ THAY ĐỔI ẢNH TÙY CHỌN
 */
function openAttachImageModal(targetId, targetType = 'debt') {
  const modal = document.getElementById('transactionImageModal');
  const titleEl = document.getElementById('txImageModalTitle');
  const viewSec = document.getElementById('txImageViewSection');
  const editSec = document.getElementById('txImageEditSection');
  const dropPrompt = document.getElementById('txImageDropzonePrompt');
  const previewBox = document.getElementById('txPreviewInDropzone');
  const previewImg = document.getElementById('txDropzonePreviewImg');
  const urlInput = document.getElementById('txImageUrlInput');
  const fileInput = document.getElementById('txImageFileInput');

  if (!modal) return;

  currentModalTargetId = targetId;
  currentModalTargetType = targetType;
  currentPendingModalImage = null;

  if (titleEl) titleEl.textContent = 'Tùy Biến Ảnh Riêng Cho Khoản Tiền';
  if (viewSec) viewSec.style.display = 'none';
  if (editSec) editSec.style.display = 'block';

  if (dropPrompt) dropPrompt.style.display = 'block';
  if (previewBox) previewBox.style.display = 'none';
  if (previewImg) previewImg.src = '';
  if (urlInput) urlInput.value = '';
  if (fileInput) fileInput.value = '';

  modal.classList.add('active');
}

function closeTransactionImageModal() {
  const modal = document.getElementById('transactionImageModal');
  if (modal) modal.classList.remove('active');
  currentModalTargetId = null;
  currentModalActiveImageUrl = null;
  currentPendingModalImage = null;
}

function setModalPendingPreview(dataUrl) {
  currentPendingModalImage = dataUrl;
  const dropPrompt = document.getElementById('txImageDropzonePrompt');
  const previewBox = document.getElementById('txPreviewInDropzone');
  const previewImg = document.getElementById('txDropzonePreviewImg');

  if (dropPrompt) dropPrompt.style.display = 'none';
  if (previewBox) previewBox.style.display = 'inline-block';
  if (previewImg) previewImg.src = dataUrl;
}

function clearModalPendingPreview() {
  currentPendingModalImage = null;
  const dropPrompt = document.getElementById('txImageDropzonePrompt');
  const previewBox = document.getElementById('txPreviewInDropzone');
  const previewImg = document.getElementById('txDropzonePreviewImg');
  const fileInput = document.getElementById('txImageFileInput');
  const urlInput = document.getElementById('txImageUrlInput');

  if (dropPrompt) dropPrompt.style.display = 'block';
  if (previewBox) previewBox.style.display = 'none';
  if (previewImg) previewImg.src = '';
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
}

/**
 * Khởi tạo toàn bộ module Bill Image & Image Attachment
 */
function initBillImageModule() {
  const modal = document.getElementById('transactionImageModal');
  const btnClose = document.getElementById('btnCloseTxImageModal');
  const btnCancelEdit = document.getElementById('btnCancelTxImageEdit');
  const btnSave = document.getElementById('btnSaveTxImage');
  const btnReplace = document.getElementById('btnReplaceTxImage');
  const btnDelete = document.getElementById('btnDeleteTxImage');
  const dropzone = document.getElementById('txImageDropzone');
  const fileInput = document.getElementById('txImageFileInput');
  const btnRemovePreview = document.getElementById('btnRemoveDropzonePreview');
  const btnPasteClip = document.getElementById('btnPasteTxImageClip');
  const btnApplyUrl = document.getElementById('btnApplyTxImageUrl');
  const urlInput = document.getElementById('txImageUrlInput');

  if (btnClose) btnClose.addEventListener('click', closeTransactionImageModal);
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeTransactionImageModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeTransactionImageModal();
    });
  }

  if (btnReplace) {
    btnReplace.addEventListener('click', () => {
      if (currentModalTargetId) {
        openAttachImageModal(currentModalTargetId, currentModalTargetType);
      }
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener('click', async () => {
      if (!currentModalTargetId) return;

      const confirmed = typeof showAppConfirm === 'function'
        ? await showAppConfirm('Khôi phục ảnh tự động cho khoản này (xóa ảnh tùy chỉnh đã tải lên)?', {
            title: 'Khôi phục ảnh',
            btnText: 'Xác nhận',
            btnIcon: 'fa-solid fa-rotate-left'
          })
        : confirm('Khôi phục ảnh tự động cho khoản này?');

      if (!confirmed) return;

      const data = getLedgerData();
      if (currentModalTargetType === 'debt') {
        const debt = (data.debts || []).find(d => String(d.id) === String(currentModalTargetId));
        if (debt) delete debt.image;
        (data.transactions || []).forEach(t => {
          if (String(t.debtId) === String(currentModalTargetId) || String(t.id) === 'tx-debt-' + currentModalTargetId) {
            delete t.image;
          }
        });
      } else {
        const tx = (data.transactions || []).find(t => String(t.id) === String(currentModalTargetId));
        if (tx) delete tx.image;
        if (tx && tx.debtId) {
          const debt = (data.debts || []).find(d => String(d.id) === String(tx.debtId));
          if (debt) delete debt.image;
        }
      }

      saveLedgerData(data);
      closeTransactionImageModal();
      if (typeof renderFinanceTab === 'function') renderFinanceTab();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('#btnRemoveDropzonePreview')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const compressed = await compressAttachmentImage(file);
        setModalPendingPreview(compressed);
      } catch (err) {
        alert('Không thể đọc tệp ảnh. Vui lòng chọn ảnh định dạng JPG, PNG hoặc WebP.');
      }
    });
  }

  if (btnRemovePreview) {
    btnRemovePreview.addEventListener('click', (e) => {
      e.stopPropagation();
      clearModalPendingPreview();
    });
  }

  if (btnPasteClip) {
    btnPasteClip.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.read) {
          alert('Hãy bấm phím Ctrl + V để dán ảnh trực tiếp từ bộ nhớ tạm.');
          return;
        }
        const items = await navigator.clipboard.read();
        let pastedBlob = null;
        for (const item of items) {
          const imgType = item.types.find(t => t.startsWith('image/'));
          if (imgType) {
            pastedBlob = await item.getType(imgType);
            break;
          }
        }
        if (pastedBlob) {
          const compressed = await compressAttachmentImage(pastedBlob);
          setModalPendingPreview(compressed);
        } else {
          alert('Không tìm thấy ảnh trong Clipboard. Bạn hãy sao chép một ảnh trước rồi nhấn Dán hoặc bấm Ctrl + V nhé!');
        }
      } catch (err) {
        alert('Trình duyệt chưa cấp quyền truy cập Clipboard. Bạn hãy bấm tổ hợp phím Ctrl + V để dán ảnh nhé!');
      }
    });
  }

  window.addEventListener('paste', async (e) => {
    if (!modal || !modal.classList.contains('active')) return;
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          try {
            const compressed = await compressAttachmentImage(blob);
            setModalPendingPreview(compressed);
          } catch (err) { }
          break;
        }
      }
    }
  });

  if (btnApplyUrl && urlInput) {
    btnApplyUrl.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) return;
      setModalPendingPreview(url);
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      if (!currentPendingModalImage) {
        alert('Vui lòng chọn ảnh từ thiết bị, dán ảnh từ clipboard hoặc nhập link URL trước khi lưu.');
        return;
      }
      if (!currentModalTargetId) return;

      const data = getLedgerData();
      if (currentModalTargetType === 'debt') {
        const debt = (data.debts || []).find(d => String(d.id) === String(currentModalTargetId));
        if (debt) debt.image = currentPendingModalImage;
        (data.transactions || []).forEach(t => {
          if (String(t.debtId) === String(currentModalTargetId) || String(t.id) === 'tx-debt-' + currentModalTargetId) {
            t.image = currentPendingModalImage;
          }
        });
      } else {
        const tx = (data.transactions || []).find(t => String(t.id) === String(currentModalTargetId));
        if (tx) tx.image = currentPendingModalImage;
        if (tx && tx.debtId) {
          const debt = (data.debts || []).find(d => String(d.id) === String(tx.debtId));
          if (debt) debt.image = currentPendingModalImage;
        }
      }

      saveLedgerData(data);
      closeTransactionImageModal();
      if (typeof renderFinanceTab === 'function') renderFinanceTab();
    });
  }

  initDrawerAttachmentHandlers();

  // Bắt sự kiện click vào ảnh phóng to trên bất kỳ hàng nào
  document.body.addEventListener('click', (e) => {
    // 1. Click thumbnail khoản nợ
    const viewDebtBtn = e.target.closest('[data-action="view-debt-img"]');
    if (viewDebtBtn) {
      e.stopPropagation();
      const id = viewDebtBtn.dataset.id;
      const data = getLedgerData();
      const debt = (data.debts || []).find(d => String(d.id) === String(id));
      if (debt) {
        const imgInfo = resolveTransactionImage(debt);
        openViewImageModal(imgInfo.src, id, 'debt', `Ảnh Khoản Nợ: ${debt.person} - ${debt.note || imgInfo.label}`, imgInfo);
      }
      return;
    }

    // 2. Click thumbnail giao dịch thu chi
    const viewTxBtn = e.target.closest('[data-action="view-tx-img"]');
    if (viewTxBtn) {
      e.stopPropagation();
      const id = viewTxBtn.dataset.id;
      const data = getLedgerData();
      const tx = (data.transactions || []).find(t => String(t.id) === String(id));
      if (tx) {
        const imgInfo = resolveTransactionImage(tx);
        openViewImageModal(imgInfo.src, id, 'tx', `Ảnh Giao Dịch: ${tx.note || imgInfo.label}`, imgInfo);
      }
      return;
    }
  });
}

function initDrawerAttachmentHandlers() {
  const btnExpPick = document.getElementById('btnExpenseFormPickImg');
  const fileExp = document.getElementById('expenseFormFileInput');
  const btnExpPaste = document.getElementById('btnExpenseFormPasteImg');
  const previewBoxExp = document.getElementById('expenseFormImgPreview');
  const previewImgExp = document.getElementById('expenseFormPreviewImgTag');
  const btnExpRemove = document.getElementById('btnExpenseFormRemoveImg');

  if (btnExpPick && fileExp) {
    btnExpPick.addEventListener('click', () => fileExp.click());
    fileExp.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const compressed = await compressAttachmentImage(file);
        formAttachedExpenseImage = compressed;
        if (previewImgExp) previewImgExp.src = compressed;
        if (previewBoxExp) previewBoxExp.style.display = 'flex';
      } catch (err) { }
    });
  }

  if (btnExpPaste) {
    btnExpPaste.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.read) return;
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find(t => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            const compressed = await compressAttachmentImage(blob);
            formAttachedExpenseImage = compressed;
            if (previewImgExp) previewImgExp.src = compressed;
            if (previewBoxExp) previewBoxExp.style.display = 'flex';
            return;
          }
        }
      } catch (e) { }
    });
  }

  if (btnExpRemove) {
    btnExpRemove.addEventListener('click', resetFormAttachedExpenseImage);
  }

  const btnDebtPick = document.getElementById('btnDebtFormPickImg');
  const fileDebt = document.getElementById('debtFormFileInput');
  const btnDebtPaste = document.getElementById('btnDebtFormPasteImg');
  const previewBoxDebt = document.getElementById('debtFormImgPreview');
  const previewImgDebt = document.getElementById('debtFormPreviewImgTag');
  const btnDebtRemove = document.getElementById('btnDebtFormRemoveImg');

  if (btnDebtPick && fileDebt) {
    btnDebtPick.addEventListener('click', () => fileDebt.click());
    fileDebt.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const compressed = await compressAttachmentImage(file);
        formAttachedDebtImage = compressed;
        if (previewImgDebt) previewImgDebt.src = compressed;
        if (previewBoxDebt) previewBoxDebt.style.display = 'flex';
      } catch (err) { }
    });
  }

  if (btnDebtPaste) {
    btnDebtPaste.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.read) return;
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find(t => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            const compressed = await compressAttachmentImage(blob);
            formAttachedDebtImage = compressed;
            if (previewImgDebt) previewImgDebt.src = compressed;
            if (previewBoxDebt) previewBoxDebt.style.display = 'flex';
            return;
          }
        }
      } catch (e) { }
    });
  }

  if (btnDebtRemove) {
    btnDebtRemove.addEventListener('click', resetFormAttachedDebtImage);
  }
}

function getFormAttachedExpenseImage() { return formAttachedExpenseImage; }
function resetFormAttachedExpenseImage() {
  formAttachedExpenseImage = null;
  const previewBox = document.getElementById('expenseFormImgPreview');
  const previewImg = document.getElementById('expenseFormPreviewImgTag');
  const fileInput = document.getElementById('expenseFormFileInput');
  if (previewBox) previewBox.style.display = 'none';
  if (previewImg) previewImg.src = '';
  if (fileInput) fileInput.value = '';
}

function getFormAttachedDebtImage() { return formAttachedDebtImage; }
function resetFormAttachedDebtImage() {
  formAttachedDebtImage = null;
  const previewBox = document.getElementById('debtFormImgPreview');
  const previewImg = document.getElementById('debtFormPreviewImgTag');
  const fileInput = document.getElementById('debtFormFileInput');
  if (previewBox) previewBox.style.display = 'none';
  if (previewImg) previewImg.src = '';
  if (fileInput) fileInput.value = '';
}

// Xuất hàm toàn cục cho các module khác
window.AUTO_SMART_VISUALS = AUTO_SMART_VISUALS;
window.getAutoSvgDataUri = getAutoSvgDataUri;
window.handleAutoImgError = handleAutoImgError;
window.matchAutoImage = matchAutoImage;
window.resolveTransactionImage = resolveTransactionImage;
window.openViewImageModal = openViewImageModal;
window.openAttachImageModal = openAttachImageModal;
window.closeTransactionImageModal = closeTransactionImageModal;
window.initBillImageModule = initBillImageModule;
window.getFormAttachedExpenseImage = getFormAttachedExpenseImage;
window.resetFormAttachedExpenseImage = resetFormAttachedExpenseImage;
window.getFormAttachedDebtImage = getFormAttachedDebtImage;
window.resetFormAttachedDebtImage = resetFormAttachedDebtImage;
