/**
 * js/copilot-image.js - Quản lý gửi hình ảnh đa phương thức (Gemini Vision) cho Trợ lý Najimez
 * 
 * Tính năng chính:
 * 1. Đính kèm ảnh qua nút tải tệp (Camera / Thư viện), kéo thả (Drag & Drop), hoặc dán trực tiếp (Ctrl + V).
 * 2. Tự động nén ảnh qua Canvas Retina với chất lượng cao (sắc nét để giải bài tập, đọc hóa đơn rõ ràng).
 * 3. Khay xem trước ảnh (Preview Tray) sang trọng phía trên thanh chat kèm nút hủy ảnh.
 * 4. Trình xem ảnh phóng to toàn màn hình (Image Lightbox Modal) kèm nút tải ảnh về máy.
 * 5. Cung cấp API trích xuất base64 và mimeType cho Gemini API (callGeminiAPIStream).
 */

// Trạng thái ảnh đính kèm hiện tại
let copilotAttachedImage = null;

/**
 * Nén và chuyển đổi ảnh thành DataURL JPEG/PNG tối ưu cho Gemini Vision
 */
function compressImageForGemini(fileOrBlob, maxWidth = 1600, maxHeight = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!fileOrBlob) return reject(new Error('Không có tệp ảnh hợp lệ.'));

    // Kiểm tra định dạng
    const type = fileOrBlob.type || 'image/jpeg';
    if (!type.startsWith('image/')) {
      return reject(new Error('Tệp được chọn không phải là hình ảnh.'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

      // Giữ tỉ lệ co giãn
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

      // Nền trắng cho ảnh trong suốt nếu chuyển sang JPEG
      if (type === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Ưu tiên PNG nếu là PNG nhỏ, còn lại dùng JPEG cho dung lượng tối ưu
      const targetMime = (type === 'image/png' && fileOrBlob.size < 500 * 1024) ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(targetMime, quality);
      resolve({ dataUrl, mimeType: targetMime, width, height });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Gán và kích hoạt ảnh đính kèm vào khung chat
 */
async function setCopilotAttachedImage(fileOrBlob, customName = null) {
  try {
    const fileName = customName || fileOrBlob.name || 'anh-dinh-kem.jpg';
    const { dataUrl, mimeType } = await compressImageForGemini(fileOrBlob);

    const base64Part = dataUrl.split(',')[1] || '';
    const approxBytes = Math.round((base64Part.length * 3) / 4);
    const sizeStr = approxBytes > 1024 * 1024
      ? (approxBytes / (1024 * 1024)).toFixed(1) + ' MB'
      : Math.round(approxBytes / 1024) + ' KB';

    copilotAttachedImage = {
      dataUrl,
      mimeType,
      base64: base64Part,
      name: fileName,
      sizeStr
    };

    updateCopilotImageTrayUI();

    if (typeof showAppToast === 'function') {
      showAppToast(`Đã đính kèm ảnh: ${fileName} (${sizeStr})`, 'info');
    }

    // Tự động focus vào ô nhập lệnh để người dùng gõ câu hỏi
    const input = document.getElementById('copilotInput');
    if (input) input.focus();

    return copilotAttachedImage;
  } catch (err) {
    console.error('Lỗi khi xử lý ảnh gửi cho Najimez:', err);
    if (typeof showAppToast === 'function') {
      showAppToast('Không thể xử lý ảnh này: ' + (err.message || 'Lỗi không xác định'), 'error');
    }
    return null;
  }
}

/**
 * Lấy dữ liệu ảnh đính kèm hiện tại
 */
function getCopilotAttachedImage() {
  return copilotAttachedImage;
}

/**
 * Xóa bỏ ảnh đính kèm và reset giao diện khay
 */
function clearCopilotAttachedImage() {
  copilotAttachedImage = null;
  updateCopilotImageTrayUI();

  const fileInput = document.getElementById('copilotFileInput');
  if (fileInput) fileInput.value = '';
}

/**
 * Cập nhật giao diện khay ảnh đính kèm
 */
function updateCopilotImageTrayUI() {
  const tray = document.getElementById('copilotAttachPreviewTray');
  const previewImg = document.getElementById('copilotAttachPreviewImg');
  const nameEl = document.getElementById('copilotAttachFileName');
  const sizeEl = document.getElementById('copilotAttachFileSize');
  const btnAttach = document.getElementById('btnCopilotAttachImg');

  if (!tray) return;

  if (copilotAttachedImage) {
    if (previewImg) previewImg.src = copilotAttachedImage.dataUrl;
    if (nameEl) nameEl.textContent = copilotAttachedImage.name;
    if (sizeEl) sizeEl.textContent = copilotAttachedImage.sizeStr;
    tray.style.display = 'flex';
    if (btnAttach) btnAttach.classList.add('has-image');
  } else {
    tray.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (btnAttach) btnAttach.classList.remove('has-image');
  }
}

/**
 * Mở modal xem ảnh phóng to sắc nét toàn màn hình (Lightbox)
 */
function openImageViewerModal(imgSrc, title = 'Hình ảnh') {
  let modal = document.getElementById('copilotImgLightboxModal');
  if (!modal) return;

  const modalImg = modal.querySelector('#copilotLightboxImgTag');
  const modalTitle = modal.querySelector('#copilotLightboxTitle');
  const downloadLink = modal.querySelector('#btnDownloadLightboxImg');

  if (modalImg) modalImg.src = imgSrc;
  if (modalTitle) modalTitle.textContent = title;
  if (downloadLink) {
    downloadLink.href = imgSrc;
    downloadLink.download = (title.replace(/\s+/g, '_') || 'anh-najimez') + '.jpg';
  }

  modal.classList.add('active');
}

/**
 * Đóng modal xem ảnh
 */
function closeImageViewerModal() {
  const modal = document.getElementById('copilotImgLightboxModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Khởi tạo toàn bộ sự kiện gắn ảnh cho khung chat Najimez
 */
function initCopilotImageAttachment() {
  const btnAttach = document.getElementById('btnCopilotAttachImg');
  const fileInput = document.getElementById('copilotFileInput');
  const btnRemove = document.getElementById('btnRemoveCopilotAttachImg');
  const previewImg = document.getElementById('copilotAttachPreviewImg');
  const chatContainer = document.querySelector('.copilot-container');

  // 1. Nhấp nút ảnh để mở cửa sổ chọn tệp
  if (btnAttach && fileInput) {
    btnAttach.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        setCopilotAttachedImage(file);
      }
    });
  }

  // 2. Nhấp nút X để hủy ảnh
  if (btnRemove) {
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      clearCopilotAttachedImage();
    });
  }

  // 3. Nhấp vào ảnh thumbnail trên khay để phóng to xem trước
  if (previewImg) {
    previewImg.addEventListener('click', () => {
      if (copilotAttachedImage && copilotAttachedImage.dataUrl) {
        openImageViewerModal(copilotAttachedImage.dataUrl, copilotAttachedImage.name);
      }
    });
  }

  // 4. Hỗ trợ Dán ảnh trực tiếp từ Clipboard (Ctrl + V)
  window.addEventListener('paste', (e) => {
    // Chỉ bắt sự kiện dán ảnh khi đang ở Tab Najimez Copilot
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab && activeTab.id !== 'tab-copilot') return;

    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const now = new Date();
          const timestamp = `${now.getHours()}h${now.getMinutes()}p_${now.getDate()}-${now.getMonth() + 1}`;
          setCopilotAttachedImage(blob, `anh_dan_${timestamp}.jpg`);
          e.preventDefault();
          break;
        }
      }
    }
  });

  // 5. Hỗ trợ Kéo & Thả ảnh (Drag & Drop) vào khung chat
  if (chatContainer) {
    let dragCounter = 0;

    ['dragenter', 'dragover'].forEach(eventName => {
      chatContainer.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    chatContainer.addEventListener('dragenter', (e) => {
      dragCounter++;
      chatContainer.classList.add('copilot-drag-over');
    });

    chatContainer.addEventListener('dragleave', (e) => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        chatContainer.classList.remove('copilot-drag-over');
      }
    });

    chatContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      chatContainer.classList.remove('copilot-drag-over');

      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        const file = dt.files[0];
        if (file.type.startsWith('image/')) {
          setCopilotAttachedImage(file);
        } else {
          if (typeof showAppToast === 'function') {
            showAppToast('Vui lòng chỉ thả tệp định dạng hình ảnh (JPG, PNG, WEBP).', 'warning');
          }
        }
      }
    });
  }

  // 6. Xử lý sự kiện đóng Modal Lightbox xem ảnh
  const lightboxModal = document.getElementById('copilotImgLightboxModal');
  if (lightboxModal) {
    const btnClose = lightboxModal.querySelector('#btnCloseLightboxModal');
    if (btnClose) {
      btnClose.addEventListener('click', closeImageViewerModal);
    }

    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeImageViewerModal();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
        closeImageViewerModal();
      }
    });
  }
}

// Đăng ký toàn cục vào window
window.setCopilotAttachedImage = setCopilotAttachedImage;
window.getCopilotAttachedImage = getCopilotAttachedImage;
window.clearCopilotAttachedImage = clearCopilotAttachedImage;
window.openImageViewerModal = openImageViewerModal;
window.closeImageViewerModal = closeImageViewerModal;
window.initCopilotImageAttachment = initCopilotImageAttachment;
