/**
 * js/lucky-wheel.js - Vòng Quay May Mắn Najimez (Wheel of Fortune Engine)
 * Thiết kế theo chuẩn Code Modularization, Web Audio API, Canvas rendering và Confetti Physics.
 */

// 1. Dữ liệu các bộ mẫu (Presets)
const WHEEL_PRESETS = {
  an_gi: {
    id: 'an_gi',
    name: 'Hôm nay ăn gì?',
    icon: 'fa-solid fa-bowl-food',
    items: ['Cơm tấm', 'Bún bò Huế', 'Phở bò', 'Bún đậu', 'Gà rán', 'Cơm sườn', 'Mì cay', 'Lẩu Thái']
  },
  uong_gi: {
    id: 'uong_gi',
    name: 'Hôm nay uống gì?',
    icon: 'fa-solid fa-mug-hot',
    items: ['Trà sữa', 'Cà phê sữa', 'Bạc xỉu', 'Trà đào cam sả', 'Nước ép cam', 'Trà sen vàng', 'Matcha Latte']
  },
  todos: {
    id: 'todos',
    name: 'Việc cần làm trước',
    icon: 'fa-solid fa-list-check',
    items: [] // Nạp động từ getLedgerData().tasks
  },
  contacts: {
    id: 'contacts',
    name: 'Ai bao / Ai mời?',
    icon: 'fa-solid fa-users',
    items: [] // Nạp động từ getLedgerData().debts
  },
  custom: {
    id: 'custom',
    name: 'Tùy chỉnh riêng',
    icon: 'fa-solid fa-pen-to-square',
    items: ['Có', 'Không', 'Có lẽ', 'Làm ngay', 'Nghỉ ngơi', 'Để mai tính']
  }
};

// Bảng màu neon rực rỡ phong cách Cyber Midnight
const WHEEL_COLORS = [
  { bg: '#6366f1', text: '#ffffff' }, // Indigo
  { bg: '#ec4899', text: '#ffffff' }, // Pink
  { bg: '#06b6d4', text: '#021a24' }, // Cyan
  { bg: '#f59e0b', text: '#1f1300' }, // Amber
  { bg: '#10b981', text: '#022416' }, // Emerald
  { bg: '#8b5cf6', text: '#ffffff' }, // Purple
  { bg: '#f43f5e', text: '#ffffff' }, // Rose
  { bg: '#3b82f6', text: '#ffffff' }, // Blue
  { bg: '#14b8a6', text: '#02211d' }, // Teal
  { bg: '#d946ef', text: '#ffffff' }, // Fuchsia
  { bg: '#eab308', text: '#211a00' }, // Yellow
  { bg: '#84cc16', text: '#152402' }  // Lime
];

// Trạng thái vận hành của vòng quay
let wheelCurrentPreset = 'an_gi';
let wheelItems = [];
let wheelAngle = 0; // radian
let wheelSpinning = false;
let wheelAudioMuted = localStorage.getItem('najimez_wheel_muted') === 'true';
let audioCtx = null;
let lastTickIndex = -1;
let confettiParticles = [];
let confettiAnimId = null;

/**
 * Khởi tạo âm thanh qua Web Audio API (100% offline, không phụ thuộc mạng)
 */
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTickSound() {
  if (wheelAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (err) {
    // Bỏ qua lỗi audio trình duyệt
  }
}

function playWinnerFanfare() {
  if (wheelAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.09;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  } catch (err) {
    // Bỏ qua lỗi audio
  }
}

/**
 * Lấy danh sách các mục theo Preset đã chọn
 */
function loadItemsFromPreset(presetId) {
  wheelCurrentPreset = presetId;
  const data = typeof getLedgerData === 'function' ? getLedgerData() : {};

  if (presetId === 'todos') {
    const tasks = Array.isArray(data.tasks) ? data.tasks.filter(t => !t.done) : [];
    if (tasks.length > 0) {
      wheelItems = tasks.map(t => t.title.trim()).slice(0, 16);
    } else {
      wheelItems = ['Học bài', 'Đọc sách 30p', 'Tập thể dục', 'Dọn bàn làm việc', 'Nghỉ ngơi'];
    }
  } else if (presetId === 'contacts') {
    const namesSet = new Set();
    if (Array.isArray(data.debts)) {
      data.debts.forEach(d => { if (d.person) namesSet.add(d.person.trim()); });
    }
    if (data.contacts) {
      Object.keys(data.contacts).forEach(k => {
        const c = data.contacts[k];
        if (c && c.name) namesSet.add(c.name.trim());
      });
    }
    const names = Array.from(namesSet);
    if (names.length >= 2) {
      wheelItems = names.slice(0, 16);
    } else {
      wheelItems = ['Tôi', 'Bạn thân', 'Người ngồi cạnh', 'Najimez chọn người tiếp theo'];
    }
  } else if (presetId === 'custom') {
    const saved = localStorage.getItem('najimez_wheel_custom_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          wheelItems = parsed;
        } else {
          wheelItems = [...WHEEL_PRESETS.custom.items];
        }
      } catch (e) {
        wheelItems = [...WHEEL_PRESETS.custom.items];
      }
    } else {
      wheelItems = [...WHEEL_PRESETS.custom.items];
    }
  } else {
    const preset = WHEEL_PRESETS[presetId] || WHEEL_PRESETS.an_gi;
    wheelItems = [...preset.items];
  }

  renderWheelItemsUI();
  drawWheelCanvas();
}

/**
 * Vẽ vòng quay trên Canvas với hiệu ứng sắc nét Retina
 */
function drawWheelCanvas() {
  const canvas = document.getElementById('luckyWheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 360;

  if (canvas.width !== size * dpr) {
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 8;
  const count = Math.max(1, wheelItems.length);
  const arc = (2 * Math.PI) / count;

  // 1. Vẽ vòng viền LED neon bên ngoài
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();

  // 2. Vẽ từng nan quạt (slices)
  for (let i = 0; i < count; i++) {
    const angleStart = wheelAngle + i * arc;
    const angleEnd = angleStart + arc;
    const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
    ctx.closePath();

    // Gradient nan quạt
    const grad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, radius);
    grad.addColorStop(0, color.bg);
    grad.addColorStop(1, adjustColor(color.bg, -25));
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();

    // 3. Vẽ chữ trên nan quạt
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angleStart + arc / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color.text;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;

    const fontSize = count > 10 ? 11 : (count > 6 ? 12 : 14);
    ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", sans-serif`;

    const text = wheelItems[i] || '';
    const maxLen = count > 10 ? 12 : 16;
    const shortText = text.length > maxLen ? text.substring(0, maxLen - 1) + '…' : text;
    ctx.fillText(shortText, radius - 20, 0);

    ctx.restore();
    ctx.restore();
  }

  // 4. Vẽ các chấm đèn LED trang trí xung quanh vành bánh xe
  const dotCount = Math.max(12, count * 2);
  for (let d = 0; d < dotCount; d++) {
    const dotAngle = (d * 2 * Math.PI) / dotCount + wheelAngle;
    const dx = centerX + (radius - 2) * Math.cos(dotAngle);
    const dy = centerY + (radius - 2) * Math.sin(dotAngle);

    ctx.beginPath();
    ctx.arc(dx, dy, 3.2, 0, 2 * Math.PI);
    ctx.fillStyle = d % 2 === 0 ? '#fef08a' : '#fff';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 6;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Hiệu ứng chỉnh tối/sáng màu hex
 */
function adjustColor(hex, percent) {
  let num = parseInt(hex.replace('#', ''), 16);
  let r = Math.min(255, Math.max(0, (num >> 16) + percent));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  let b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Bắt đầu quay may mắn
 */
function spinLuckyWheel() {
  if (wheelSpinning || wheelItems.length === 0) return;
  getAudioContext();

  wheelSpinning = true;
  toggleSpinControls(false);

  // Ẩn kết quả cũ
  const winnerCard = document.getElementById('luckyWheelWinnerCard');
  if (winnerCard) winnerCard.style.display = 'none';

  // Tính toán góc quay ngẫu nhiên: quay từ 5 đến 8 vòng đầy đủ
  const fullRotations = 5 + Math.random() * 3;
  const randomAdditionalAngle = Math.random() * 2 * Math.PI;
  const totalDeltaAngle = fullRotations * 2 * Math.PI + randomAdditionalAngle;

  const duration = 4800 + Math.random() * 1000; // ms
  const startAngle = wheelAngle;
  const startTime = performance.now();
  const pointerEl = document.getElementById('luckyWheelPointer');

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);

    // Easing decelerating curve: 1 - Math.pow(1 - progress, 3.2)
    const eased = 1 - Math.pow(1 - progress, 3.2);
    wheelAngle = startAngle + totalDeltaAngle * eased;

    // Tính toán kim chỉ để kích âm thanh "tích" và nảy kim
    const count = wheelItems.length;
    const arc = (2 * Math.PI) / count;
    // Kim chỉ đặt ở đỉnh trên cùng (Góc -PI/2)
    let pointerRelativeAngle = (-Math.PI / 2 - (wheelAngle % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI);
    let currentSliceIdx = Math.floor(pointerRelativeAngle / arc) % count;

    if (currentSliceIdx !== lastTickIndex) {
      lastTickIndex = currentSliceIdx;
      playTickSound();
      if (pointerEl) {
        pointerEl.classList.add('tick');
        setTimeout(() => { if (pointerEl) pointerEl.classList.remove('tick'); }, 80);
      }
    }

    drawWheelCanvas();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      wheelSpinning = false;
      toggleSpinControls(true);
      finishSpin(currentSliceIdx);
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Khi vòng quay dừng hẳn: vinh danh kết quả & bắn pháo hoa confetti
 */
function finishSpin(winnerIdx) {
  const winner = wheelItems[winnerIdx] || wheelItems[0];
  playWinnerFanfare();
  launchConfetti();

  const winnerCard = document.getElementById('luckyWheelWinnerCard');
  const winnerText = document.getElementById('luckyWheelWinnerText');
  const winnerLabel = document.getElementById('luckyWheelWinnerLabel');

  if (winnerCard && winnerText) {
    winnerText.textContent = winner;
    if (winnerLabel) {
      winnerLabel.textContent = `Najimez đã chọn cho bạn (${WHEEL_PRESETS[wheelCurrentPreset]?.name || 'Kết quả'}):`;
    }
    winnerCard.style.display = 'flex';
  }
}

/**
 * Bật/Tắt trạng thái nút khi đang quay
 */
function toggleSpinControls(enabled) {
  const centerBtn = document.getElementById('btnWheelCenterSpin');
  const mainBtn = document.getElementById('btnWheelSpinMain');
  if (centerBtn) centerBtn.disabled = !enabled;
  if (mainBtn) mainBtn.disabled = !enabled;
}

/**
 * Hiệu ứng pháo hoa giấy Confetti rực rỡ
 */
function launchConfetti() {
  const canvas = document.getElementById('luckyWheelConfettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 360;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  confettiParticles = [];
  const colors = ['#f59e0b', '#ec4899', '#6366f1', '#10b981', '#06b6d4', '#facc15', '#fff'];

  for (let i = 0; i < 70; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const speed = 2 + Math.random() * 6;
    confettiParticles.push({
      x: size / 2,
      y: size / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 15,
      gravity: 0.12
    });
  }

  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

  function renderConfetti() {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    let alive = 0;
    for (let p of confettiParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.vRot;
      p.alpha -= 0.012;

      if (p.alpha > 0) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }
    ctx.restore();

    if (alive > 0) {
      confettiAnimId = requestAnimationFrame(renderConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  renderConfetti();
}

/**
 * Hiển thị danh sách các ô trong bảng cài đặt bên phải
 */
function renderWheelItemsUI() {
  const container = document.getElementById('wheelItemsList');
  const countEl = document.getElementById('wheelItemsCount');
  if (countEl) countEl.textContent = `${wheelItems.length} mục`;
  if (!container) return;

  if (wheelItems.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 18px; color: #94a3b8; font-size: 0.85rem;">
        Chưa có lựa chọn nào. Hãy nhập thêm ô bên trên!
      </div>
    `;
    return;
  }

  container.innerHTML = wheelItems.map((item, idx) => {
    const color = WHEEL_COLORS[idx % WHEEL_COLORS.length];
    return `
      <div class="wheel-item-row" data-idx="${idx}">
        <div class="wheel-item-left">
          <span class="wheel-item-color" style="background: ${color.bg};"></span>
          <span class="wheel-item-name">${escapeHTML(item)}</span>
        </div>
        <button type="button" class="btn-wheel-item-del" data-action="del-item" data-idx="${idx}" title="Xóa ô này">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  }).join('');

  // Bắt sự kiện xóa ô
  container.querySelectorAll('[data-action="del-item"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (wheelSpinning) return;
      const idx = parseInt(btn.dataset.idx, 10);
      if (!isNaN(idx) && idx >= 0 && idx < wheelItems.length) {
        wheelItems.splice(idx, 1);
        saveCustomItemsIfApplicable();
        renderWheelItemsUI();
        drawWheelCanvas();
      }
    });
  });
}

function saveCustomItemsIfApplicable() {
  if (wheelCurrentPreset === 'custom') {
    localStorage.setItem('najimez_wheel_custom_items', JSON.stringify(wheelItems));
  }
}

/**
 * Mở hộp thoại Vòng Quay May Mắn
 */
function openLuckyWheel(preset = 'an_gi') {
  const modal = document.getElementById('luckyWheelModal');
  if (!modal) return;

  // Active chip tương ứng
  const presetChips = document.querySelectorAll('.btn-preset-chip');
  presetChips.forEach(chip => {
    chip.classList.toggle('active', chip.dataset.preset === preset);
  });

  loadItemsFromPreset(preset);
  modal.classList.add('active');

  // Trigger resize canvas sau khi hiển thị
  setTimeout(() => {
    drawWheelCanvas();
  }, 60);
}

/**
 * Đóng hộp thoại Vòng Quay May Mắn
 */
function closeLuckyWheel() {
  const modal = document.getElementById('luckyWheelModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Khởi tạo module Vòng Quay May Mắn
 */
function initLuckyWheel() {
  const modal = document.getElementById('luckyWheelModal');
  const btnClose = document.getElementById('btnCloseLuckyWheelModal');
  const btnCenter = document.getElementById('btnWheelCenterSpin');
  const btnMain = document.getElementById('btnWheelSpinMain');
  const btnMute = document.getElementById('btnWheelToggleMute');
  const btnAdd = document.getElementById('btnWheelAddItem');
  const inputAdd = document.getElementById('wheelAddItemInput');
  const btnReset = document.getElementById('btnWheelResetItems');
  const btnClear = document.getElementById('btnWheelClearItems');

  // Nút kích hoạt mở từ Sidebar & Header
  const sidebarBtn = document.getElementById('btnSidebarLuckyWheel');
  const headerBtn = document.getElementById('btnHeaderLuckyWheel');

  if (sidebarBtn) {
    sidebarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openLuckyWheel('an_gi');
    });
  }

  if (headerBtn) {
    headerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openLuckyWheel('an_gi');
    });
  }

  // Đóng modal
  if (btnClose) btnClose.addEventListener('click', closeLuckyWheel);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLuckyWheel();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeLuckyWheel();
    }
  });

  // Bắt đầu quay
  if (btnCenter) btnCenter.addEventListener('click', spinLuckyWheel);
  if (btnMain) btnMain.addEventListener('click', spinLuckyWheel);

  // Bật/tắt âm thanh
  if (btnMute) {
    updateMuteUI(btnMute);
    btnMute.addEventListener('click', () => {
      wheelAudioMuted = !wheelAudioMuted;
      localStorage.setItem('najimez_wheel_muted', wheelAudioMuted);
      updateMuteUI(btnMute);
    });
  }

  // Thêm ô mới
  function handleAddItem() {
    if (wheelSpinning || !inputAdd) return;
    const val = inputAdd.value.trim();
    if (val) {
      wheelItems.push(val);
      inputAdd.value = '';
      saveCustomItemsIfApplicable();
      renderWheelItemsUI();
      drawWheelCanvas();
    }
  }

  if (btnAdd) btnAdd.addEventListener('click', handleAddItem);
  if (inputAdd) {
    inputAdd.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddItem();
      }
    });
  }

  // Chuyển Preset
  document.querySelectorAll('.btn-preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (wheelSpinning) return;
      document.querySelectorAll('.btn-preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const presetId = chip.dataset.preset;
      loadItemsFromPreset(presetId);
    });
  });

  // Khôi phục mặc định
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (wheelSpinning) return;
      loadItemsFromPreset(wheelCurrentPreset);
    });
  }

  // Xóa hết
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (wheelSpinning) return;
      wheelItems = [];
      saveCustomItemsIfApplicable();
      renderWheelItemsUI();
      drawWheelCanvas();
    });
  }
}

function updateMuteUI(btn) {
  if (!btn) return;
  btn.innerHTML = wheelAudioMuted
    ? '<i class="fa-solid fa-volume-xmark"></i>'
    : '<i class="fa-solid fa-volume-high"></i>';
  btn.title = wheelAudioMuted ? 'Bật âm thanh vòng quay' : 'Tắt âm thanh vòng quay';
  btn.classList.toggle('active', !wheelAudioMuted);
}
