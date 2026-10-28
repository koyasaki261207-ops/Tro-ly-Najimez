/**
 * js/toolbox.js - Hộp Dụng Cụ & Tiện Ích Đa Năng Najimez
 * Quản lý các công cụ:
 *  1. Vòng Quay May Mắn (Lucky Wheel)
 *  2. Tung Xúc Xắc 3D & Lật Đồng Xu (Dice & Coin)
 *  3. Đồng Hồ Pomodoro & Bấm Giờ (Focus Timer)
 *  4. Máy Tính Nhanh (Pocket Calculator)
 */

// ============================================================================
// 1. QUẢN LÝ CHUYỂN CÔNG CỤ TRONG HỘP DỤNG CỤ
// ============================================================================
let currentToolboxSubtool = 'all';

/**
 * Chuyển đổi giữa chế độ Lưới 4 phần và phóng to 1 công cụ
 * @param {string} toolId - 'all' | 'wheel' | 'dice-coin' | 'pomodoro' | 'calculator'
 */
function switchToolboxTool(toolId) {
  currentToolboxSubtool = toolId;

  // Cập nhật trạng thái các nút tab
  const tabBtns = document.querySelectorAll('.btn-toolbox-tab');
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtool === toolId);
  });

  const quadCards = document.querySelectorAll('.toolbox-quad-card');
  const maximizeBtns = document.querySelectorAll('.btn-quad-maximize');

  if (toolId === 'all') {
    // Hiển thị đầy đủ cả 4 phần màn hình (2x2 grid)
    quadCards.forEach(card => {
      card.classList.remove('maximized', 'hidden');
    });
    maximizeBtns.forEach(btn => {
      btn.innerHTML = '<i class="fa-solid fa-up-right-and-down-left-from-center"></i>';
      btn.title = 'Phóng to công cụ này';
    });
  } else {
    // Phóng to công cụ được chọn, ẩn tạm 3 công cụ còn lại
    const targetMap = {
      'wheel': 'quadWheel',
      'dice-coin': 'quadDiceCoin',
      'pomodoro': 'quadPomodoro',
      'calculator': 'quadCalculator',
      'currency': 'quadCurrency',
      'hyper': 'quadHyper'
    };
    const targetId = targetMap[toolId];

    quadCards.forEach(card => {
      if (card.id === targetId) {
        card.classList.add('maximized');
        card.classList.remove('hidden');
      } else {
        card.classList.remove('maximized');
        card.classList.add('hidden');
      }
    });

    maximizeBtns.forEach(btn => {
      if (btn.dataset.tool === toolId) {
        btn.innerHTML = '<i class="fa-solid fa-down-left-and-up-right-to-center"></i>';
        btn.title = 'Thu nhỏ về lưới 4 ô';
      } else {
        btn.innerHTML = '<i class="fa-solid fa-up-right-and-down-left-from-center"></i>';
        btn.title = 'Phóng to công cụ này';
      }
    });
  }

  // Luôn vẽ lại canvas sau khi DOM cập nhật kích thước
  setTimeout(() => {
    if (typeof drawWheelCanvas === 'function') drawWheelCanvas();
  }, 60);

  if (toolId === 'calculator' || toolId === 'all') {
    updateCalcDisplay();
  }
}

/**
 * Được gọi khi chuyển sang tab 'tab-toolbox' từ Sidebar
 */
function renderToolboxTab() {
  switchToolboxTool(currentToolboxSubtool || 'all');
  if (typeof checkAutoRefreshCurrencyRates === 'function') {
    checkAutoRefreshCurrencyRates();
  }
}

// ============================================================================
// 2. WEB AUDIO SYNTHESIZER TIỆN ÍCH (OFFLINE 100%)
// ============================================================================
let toolboxAudioCtx = null;

function getToolboxAudioContext() {
  if (!toolboxAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) toolboxAudioCtx = new AudioContext();
  }
  if (toolboxAudioCtx && toolboxAudioCtx.state === 'suspended') {
    toolboxAudioCtx.resume();
  }
  return toolboxAudioCtx;
}

/**
 * Âm thanh leng keng khi tung đồng xu kim loại
 */
function playCoinSound() {
  try {
    const ctx = getToolboxAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(2600, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {
    // Không làm gián đoạn UI nếu trình duyệt chặn âm thanh
  }
}

/**
 * Âm thanh lọc cọc khi lắc xúc xắc
 */
function playDiceSound() {
  try {
    const ctx = getToolboxAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const clickTime = now + i * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 240, clickTime);

      gain.gain.setValueAtTime(0.18, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(clickTime);
      osc.stop(clickTime + 0.06);
    }
  } catch (e) {}
}

/**
 * Chuông ngân thư thái khi hoàn thành hiệp Pomodoro
 */
function playPomodoroChime() {
  try {
    const ctx = getToolboxAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Hợp âm Đô trưởng)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 1.25);
    });
  } catch (e) {}
}

// ============================================================================
// 3. TIỆN ÍCH: TUNG ĐỒNG XU (COIN FLIPPER)
// ============================================================================
let coinStats = { heads: 0, tails: 0 };
let coinIsFlipping = false;
let coinCurrentRot = 0;

function initCoinFlipper() {
  const coin = document.getElementById('coin3d');
  const btnFlip = document.getElementById('btnFlipCoin');
  const btnReset = document.getElementById('btnResetCoinStats');

  if (btnFlip) {
    btnFlip.addEventListener('click', flipCoin);
  }
  if (coin) {
    coin.addEventListener('click', flipCoin);
  }
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      coinStats = { heads: 0, tails: 0 };
      updateCoinStatsUI();
      const banner = document.getElementById('coinResultBanner');
      if (banner) banner.innerHTML = 'Nhấn hoặc chạm đồng xu để lật!';
    });
  }
}

function flipCoin() {
  if (coinIsFlipping) return;
  coinIsFlipping = true;

  const coin = document.getElementById('coin3d');
  const banner = document.getElementById('coinResultBanner');
  const btnFlip = document.getElementById('btnFlipCoin');

  if (btnFlip) btnFlip.disabled = true;
  if (banner) banner.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lật đồng xu...';

  playCoinSound();

  // Xác định kết quả ngẫu nhiên: 0 = Ngửa (Heads), 1 = Sấp (Tails)
  const isHeads = Math.random() < 0.5;

  // Tính số vòng quay ngẫu nhiên: tối thiểu 5 vòng (1800deg)
  const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
  coinCurrentRot += extraSpins + (isHeads ? 0 : 180);

  if (coin) {
    coin.style.setProperty('--coin-target-rot', `${coinCurrentRot}deg`);
    coin.classList.remove('flipping');
    // Force reflow
    void coin.offsetWidth;
    coin.classList.add('flipping');
  }

  setTimeout(() => {
    coinIsFlipping = false;
    if (btnFlip) btnFlip.disabled = false;

    if (isHeads) {
      coinStats.heads++;
      if (banner) {
        banner.innerHTML = '<i class="fa-solid fa-sparkles" style="color:#fde047;"></i> MẶT NGỬA (KIM NGÂN)!';
      }
    } else {
      coinStats.tails++;
      if (banner) {
        banner.innerHTML = '<i class="fa-solid fa-crown" style="color:#cbd5e1;"></i> MẶT SẤP (KIM QUY)!';
      }
    }
    updateCoinStatsUI();
  }, 1400);
}

function updateCoinStatsUI() {
  const headsEl = document.getElementById('coinStatHeads');
  const tailsEl = document.getElementById('coinStatTails');
  const rateEl = document.getElementById('coinStatRate');

  if (headsEl) headsEl.textContent = coinStats.heads;
  if (tailsEl) tailsEl.textContent = coinStats.tails;

  const total = coinStats.heads + coinStats.tails;
  if (rateEl) {
    if (total === 0) {
      rateEl.textContent = '0%';
    } else {
      const pct = Math.round((coinStats.heads / total) * 100);
      rateEl.textContent = `${pct}% Ngửa`;
    }
  }
}

// ============================================================================
// 4. TIỆN ÍCH: ĐỔ XÚC XẮC 3D (DICE ROLLER)
// ============================================================================
let diceCount = 2;
let diceIsRolling = false;

// Cấu trúc 9 ô (grid 3x3) biểu diễn các chấm xúc xắc
// [0, 1, 2]
// [3, 4, 5]
// [6, 7, 8]
const DICE_PIP_MAP = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

function initDiceRoller() {
  const btnRoll = document.getElementById('btnRollDice');
  const countBtns = document.querySelectorAll('.btn-dice-count');

  countBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      countBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      diceCount = parseInt(btn.dataset.count, 10) || 2;
      renderDiceCubes();
    });
  });

  if (btnRoll) {
    btnRoll.addEventListener('click', rollDice);
  }

  renderDiceCubes();
}

function renderDiceCubes(values = null) {
  const container = document.getElementById('diceStage');
  if (!container) return;

  container.innerHTML = '';
  for (let i = 0; i < diceCount; i++) {
    const val = values ? values[i] : (i === 0 ? 3 : (i === 1 ? 5 : 6));
    const cube = createDiceCubeElement(val);
    cube.addEventListener('click', rollDice);
    container.appendChild(cube);
  }
}

function createDiceCubeElement(val) {
  const cube = document.createElement('div');
  cube.className = 'dice-cube';
  cube.title = 'Nhấn để lắc xúc xắc';

  const grid = document.createElement('div');
  grid.className = 'dice-dots-grid';

  const filledPips = DICE_PIP_MAP[val] || [4];

  for (let idx = 0; idx < 9; idx++) {
    const pip = document.createElement('div');
    pip.className = 'dice-pip';
    if (filledPips.includes(idx)) {
      pip.classList.add('filled');
      if (val === 1 && idx === 4) {
        pip.classList.add('center-red');
      }
    }
    grid.appendChild(pip);
  }

  cube.appendChild(grid);
  return cube;
}

function rollDice() {
  if (diceIsRolling) return;
  diceIsRolling = true;

  const btnRoll = document.getElementById('btnRollDice');
  const banner = document.getElementById('diceResultBanner');
  const cubes = document.querySelectorAll('.dice-cube');

  if (btnRoll) btnRoll.disabled = true;
  if (banner) banner.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lắc xúc xắc...';

  playDiceSound();

  cubes.forEach(c => c.classList.add('rolling'));

  setTimeout(() => {
    const results = [];
    for (let i = 0; i < diceCount; i++) {
      results.push(Math.floor(Math.random() * 6) + 1);
    }

    renderDiceCubes(results);

    const sum = results.reduce((a, b) => a + b, 0);
    const detailStr = results.join(' + ');

    let evaluation = '';
    if (diceCount === 2) {
      evaluation = sum >= 7 ? '• Tài' : '• Xỉu';
      if (results[0] === results[1]) evaluation += ' (Đôi!)';
    } else if (diceCount === 3) {
      evaluation = sum >= 11 ? '• Tài' : '• Xỉu';
      if (results[0] === results[1] && results[1] === results[2]) evaluation += ' (Bão!)';
    }

    if (banner) {
      banner.innerHTML = `<i class="fa-solid fa-dice-d6"></i> Tổng điểm: <strong>${sum}</strong> (${detailStr}) ${evaluation}`;
    }

    diceIsRolling = false;
    if (btnRoll) btnRoll.disabled = false;
  }, 750);
}

// ============================================================================
// 5. TIỆN ÍCH: ĐỒNG HỒ POMODORO & BẤM GIỜ (FOCUS TIMER)
// ============================================================================
const POMO_CONFIGS = {
  pomodoro: { label: 'Tập Trung Sâu', minutes: 25, color: '#f43f5e' },
  shortBreak: { label: 'Nghỉ Ngắn', minutes: 5, color: '#38bdf8' },
  longBreak: { label: 'Nghỉ Dài', minutes: 15, color: '#34d399' }
};

let pomoCurrentMode = 'pomodoro';
let pomoTimeLeft = 25 * 60; // giây
let pomoTotalTime = 25 * 60;
let pomoIsRunning = false;
let pomoTimerInterval = null;
let pomoLastTimestamp = null;
let pomoCompletedCount = parseInt(localStorage.getItem('najimez_pomo_count') || '0', 10);

function initPomodoro() {
  const modeBtns = document.querySelectorAll('.btn-pomo-mode');
  const btnToggle = document.getElementById('btnPomodoroToggle');
  const btnReset = document.getElementById('btnPomodoroReset');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (pomoIsRunning) pausePomodoro();
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setPomodoroMode(btn.dataset.mode);
    });
  });

  if (btnToggle) {
    btnToggle.addEventListener('click', togglePomodoro);
  }
  if (btnReset) {
    btnReset.addEventListener('click', resetPomodoro);
  }

  updatePomodoroUI();
  updatePomoCountDisplay();
}

function setPomodoroMode(modeKey) {
  if (!POMO_CONFIGS[modeKey]) return;
  pomoCurrentMode = modeKey;
  pomoTotalTime = POMO_CONFIGS[modeKey].minutes * 60;
  pomoTimeLeft = pomoTotalTime;
  updatePomodoroUI();
}

function togglePomodoro() {
  if (pomoIsRunning) {
    pausePomodoro();
  } else {
    startPomodoro();
  }
}

function startPomodoro() {
  pomoIsRunning = true;
  pomoLastTimestamp = Date.now();

  const btnToggle = document.getElementById('btnPomodoroToggle');
  if (btnToggle) {
    btnToggle.innerHTML = '<i class="fa-solid fa-pause"></i> Tạm Dừng';
  }

  clearInterval(pomoTimerInterval);
  pomoTimerInterval = setInterval(() => {
    const now = Date.now();
    const delta = Math.floor((now - pomoLastTimestamp) / 1000);

    if (delta >= 1) {
      pomoTimeLeft -= delta;
      pomoLastTimestamp = now;

      if (pomoTimeLeft <= 0) {
        pomoTimeLeft = 0;
        completePomodoroSession();
      }
      updatePomodoroUI();
    }
  }, 250);
}

function pausePomodoro() {
  pomoIsRunning = false;
  clearInterval(pomoTimerInterval);
  const btnToggle = document.getElementById('btnPomodoroToggle');
  if (btnToggle) {
    btnToggle.innerHTML = '<i class="fa-solid fa-play"></i> Tiếp Tục';
  }
}

function resetPomodoro() {
  pausePomodoro();
  pomoTimeLeft = pomoTotalTime;
  const btnToggle = document.getElementById('btnPomodoroToggle');
  if (btnToggle) {
    btnToggle.innerHTML = '<i class="fa-solid fa-play"></i> Bắt Đầu';
  }
  updatePomodoroUI();
}

function completePomodoroSession() {
  pausePomodoro();
  playPomodoroChime();

  if (pomoCurrentMode === 'pomodoro') {
    pomoCompletedCount++;
    localStorage.setItem('najimez_pomo_count', pomoCompletedCount.toString());
    updatePomoCountDisplay();

    // Tự động chuyển sang nghỉ ngắn
    setTimeout(() => {
      const shortBtn = document.querySelector('.btn-pomo-mode[data-mode="shortBreak"]');
      if (shortBtn) shortBtn.click();
    }, 1500);
  }
}

function updatePomodoroUI() {
  const display = document.getElementById('pomodoroTimeDisplay');
  const tag = document.getElementById('pomodoroStatusTag');
  const progressRing = document.getElementById('pomodoroProgressRing');

  const m = Math.floor(pomoTimeLeft / 60);
  const s = pomoTimeLeft % 60;
  const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  if (display) display.textContent = timeStr;
  if (tag) tag.textContent = POMO_CONFIGS[pomoCurrentMode]?.label || 'Tập trung';

  // Cập nhật vòng tròn SVG
  if (progressRing) {
    const circumference = 490; // 2 * PI * 78 = 490.1
    const ratio = pomoTotalTime > 0 ? (pomoTimeLeft / pomoTotalTime) : 0;
    const offset = circumference * (1 - ratio);
    progressRing.style.strokeDashoffset = offset;
  }
}

function updatePomoCountDisplay() {
  const el = document.getElementById('pomoCompletedCount');
  if (el) el.textContent = `${pomoCompletedCount} hiệp`;
}

// ============================================================================
// 6. TIỆN ÍCH: MÁY TÍNH NHANH (POCKET CALCULATOR)
// ============================================================================
let calcExpression = '';
let calcCurrentVal = '0';
let calcPrevVal = null;
let calcOperator = null;
let calcOverwrite = false;

function initMiniCalculator() {
  const keys = document.querySelectorAll('.btn-calc-key');
  const quickBtns = document.querySelectorAll('.btn-calc-quick');
  const btnCopy = document.getElementById('btnCopyCalcResult');

  keys.forEach(k => {
    k.addEventListener('click', () => {
      const action = k.dataset.action;
      const val = k.dataset.val;

      if (val !== undefined) {
        handleCalcInput(val);
      } else if (action) {
        handleCalcAction(action);
      }
    });
  });

  quickBtns.forEach(q => {
    q.addEventListener('click', () => {
      const add = parseInt(q.dataset.add, 10);
      if (add) {
        addQuickAmount(add);
      }
    });
  });

  if (btnCopy) {
    btnCopy.addEventListener('click', copyCalcResult);
  }

  // Lắng nghe bàn phím khi đang ở tab Calculator
  document.addEventListener('keydown', handleCalcKeyboard);
  updateCalcDisplay();
}

function handleCalcInput(digit) {
  if (digit === '.') {
    if (calcOverwrite) {
      calcCurrentVal = '0.';
      calcOverwrite = false;
    } else if (!calcCurrentVal.includes('.')) {
      calcCurrentVal += '.';
    }
  } else if (digit === '000') {
    if (calcOverwrite || calcCurrentVal === '0') {
      calcCurrentVal = '0';
    } else {
      calcCurrentVal += '000';
    }
  } else {
    if (calcOverwrite || calcCurrentVal === '0') {
      calcCurrentVal = digit;
      calcOverwrite = false;
    } else {
      calcCurrentVal += digit;
    }
  }
  updateCalcDisplay();
}

function handleCalcAction(action) {
  switch (action) {
    case 'clear':
      calcExpression = '';
      calcCurrentVal = '0';
      calcPrevVal = null;
      calcOperator = null;
      calcOverwrite = false;
      break;

    case 'clear-entry':
      calcCurrentVal = '0';
      break;

    case 'backspace':
      if (calcOverwrite) {
        calcCurrentVal = '0';
        calcOverwrite = false;
      } else if (calcCurrentVal.length > 1) {
        calcCurrentVal = calcCurrentVal.slice(0, -1);
      } else {
        calcCurrentVal = '0';
      }
      break;

    case 'negate':
      if (calcCurrentVal !== '0') {
        calcCurrentVal = calcCurrentVal.startsWith('-')
          ? calcCurrentVal.substring(1)
          : '-' + calcCurrentVal;
      }
      break;

    case 'percent':
      const num = parseFloat(calcCurrentVal) || 0;
      calcCurrentVal = String(num / 100);
      break;

    case 'add':
    case 'subtract':
    case 'multiply':
    case 'divide':
      handleCalcOperator(action);
      break;

    case 'equals':
      computeCalcResult();
      break;
  }
  updateCalcDisplay();
}

function getOperatorSymbol(op) {
  switch (op) {
    case 'add': return '+';
    case 'subtract': return '−';
    case 'multiply': return '×';
    case 'divide': return '÷';
    default: return '';
  }
}

function handleCalcOperator(op) {
  const currentNum = parseFloat(calcCurrentVal) || 0;

  if (calcOperator && !calcOverwrite) {
    computeCalcResult();
  }

  calcPrevVal = parseFloat(calcCurrentVal) || 0;
  calcOperator = op;
  calcExpression = `${formatCalcNumber(calcPrevVal)} ${getOperatorSymbol(op)}`;
  calcOverwrite = true;
}

function computeCalcResult() {
  if (calcOperator === null || calcPrevVal === null) return;

  const currentNum = parseFloat(calcCurrentVal) || 0;
  let result = 0;

  switch (calcOperator) {
    case 'add':
      result = calcPrevVal + currentNum;
      break;
    case 'subtract':
      result = calcPrevVal - currentNum;
      break;
    case 'multiply':
      result = calcPrevVal * currentNum;
      break;
    case 'divide':
      result = currentNum !== 0 ? calcPrevVal / currentNum : 'Lỗi chia 0';
      break;
  }

  calcExpression = `${formatCalcNumber(calcPrevVal)} ${getOperatorSymbol(calcOperator)} ${formatCalcNumber(currentNum)} =`;
  calcCurrentVal = String(result);
  calcPrevVal = null;
  calcOperator = null;
  calcOverwrite = true;
}

function addQuickAmount(amount) {
  const current = parseFloat(calcCurrentVal) || 0;
  calcCurrentVal = String(current + amount);
  calcOverwrite = false;
  updateCalcDisplay();
}

function formatCalcNumber(numOrStr) {
  const n = parseFloat(numOrStr);
  if (isNaN(n)) return String(numOrStr);
  return n.toLocaleString('vi-VN');
}

function updateCalcDisplay() {
  const exprEl = document.getElementById('calcExpression');
  const dispEl = document.getElementById('calcDisplay');

  if (exprEl) exprEl.textContent = calcExpression;
  if (dispEl) {
    if (isNaN(parseFloat(calcCurrentVal))) {
      dispEl.textContent = calcCurrentVal;
    } else {
      const parts = calcCurrentVal.split('.');
      const intPart = parseFloat(parts[0] || '0').toLocaleString('vi-VN');
      dispEl.textContent = parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
    }
  }
}

function copyCalcResult() {
  const dispEl = document.getElementById('calcDisplay');
  if (!dispEl) return;
  const txt = dispEl.textContent.trim();

  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.getElementById('btnCopyCalcResult');
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép!';
      setTimeout(() => { btn.innerHTML = original; }, 1500);
    }
  }).catch(() => {});
}

function handleCalcKeyboard(e) {
  // Chỉ nhận diện phím nếu tab Hộp Dụng Cụ và subtool Calculator đang mở
  const toolboxPane = document.getElementById('tab-toolbox');
  if (!toolboxPane || !toolboxPane.classList.contains('active')) return;
  if (currentToolboxSubtool !== 'calculator') return;

  // Nếu người dùng đang gõ trong ô input nào khác thì bỏ qua
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

  if (e.key >= '0' && e.key <= '9') {
    handleCalcInput(e.key);
  } else if (e.key === '.' || e.key === ',') {
    handleCalcInput('.');
  } else if (e.key === '+') {
    handleCalcAction('add');
  } else if (e.key === '-') {
    handleCalcAction('subtract');
  } else if (e.key === '*' || e.key === 'x') {
    handleCalcAction('multiply');
  } else if (e.key === '/') {
    e.preventDefault();
    handleCalcAction('divide');
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    handleCalcAction('equals');
  } else if (e.key === 'Backspace') {
    handleCalcAction('backspace');
  } else if (e.key === 'Escape') {
    handleCalcAction('clear');
  }
}

// ============================================================================
// 7. TIỆN ÍCH: QUY ĐỔI TIỀN TỆ (CURRENCY CONVERTER)
// ============================================================================
const DEFAULT_CURRENCY_RATES = {
  USD: { name: 'Đô la Mỹ', flag: '🇺🇸', symbol: '$', rateToUSD: 1 },
  VND: { name: 'Đồng Việt Nam', flag: '🇻🇳', symbol: '₫', rateToUSD: 25450 },
  EUR: { name: 'Euro', flag: '🇪🇺', symbol: '€', rateToUSD: 0.925 },
  JPY: { name: 'Yên Nhật', flag: '🇯🇵', symbol: '¥', rateToUSD: 154.5 },
  KRW: { name: 'Won Hàn Quốc', flag: '🇰🇷', symbol: '₩', rateToUSD: 1390 },
  CNY: { name: 'Nhân dân tệ', flag: '🇨🇳', symbol: '¥', rateToUSD: 7.24 },
  GBP: { name: 'Bảng Anh', flag: '🇬🇧', symbol: '£', rateToUSD: 0.775 },
  THB: { name: 'Baht Thái', flag: '🇹🇭', symbol: '฿', rateToUSD: 34.6 },
  SGD: { name: 'Đô la Singapore', flag: '🇸🇬', symbol: 'S$', rateToUSD: 1.32 },
  AUD: { name: 'Đô la Úc', flag: '🇦🇺', symbol: 'A$', rateToUSD: 1.52 },
  CAD: { name: 'Đô la Canada', flag: '🇨🇦', symbol: 'C$', rateToUSD: 1.39 }
};

let currentCurrencyRates = { ...DEFAULT_CURRENCY_RATES };
let currRatesLastFetched = null;

function initCurrencyConverter() {
  const fromInput = document.getElementById('currFromAmount');
  const fromSelect = document.getElementById('currFromSelect');
  const toSelect = document.getElementById('currToSelect');
  const btnSwap = document.getElementById('btnSwapCurrency');
  const btnRefresh = document.getElementById('btnRefreshRates');
  const btnCopy = document.getElementById('btnCopyCurrResult');

  // Nạp tỷ giá đã lưu nếu có
  loadCachedCurrencyRates();

  if (fromInput) {
    fromInput.addEventListener('input', () => {
      calculateCurrencyConversion();
    });
  }

  if (fromSelect) {
    fromSelect.addEventListener('change', () => {
      renderCurrencyQuickChips();
      calculateCurrencyConversion();
    });
  }

  if (toSelect) {
    toSelect.addEventListener('change', () => {
      calculateCurrencyConversion();
    });
  }

  if (btnSwap) {
    btnSwap.addEventListener('click', swapCurrency);
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      fetchLiveCurrencyRates(true);
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', copyCurrencyResult);
  }

  // Khởi tạo các chip số tiền nhanh & dải tỷ giá tham khảo
  renderCurrencyQuickChips();
  renderCurrencyRatesStrip();
  calculateCurrencyConversion();

  // Tự động kiểm tra làm mới tỷ giá nhẹ nhàng khi mở
  setTimeout(() => {
    fetchLiveCurrencyRates(false);
  }, 1200);

  // Tự động kiểm tra và cập nhật tỷ giá ngầm mỗi 15 phút
  setInterval(checkAutoRefreshCurrencyRates, 15 * 60 * 1000);
}

function loadCachedCurrencyRates() {
  const cached = localStorage.getItem('najimez_currency_rates');
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (data && data.rates && typeof data.rates === 'object') {
        Object.keys(DEFAULT_CURRENCY_RATES).forEach(code => {
          if (data.rates[code]) {
            currentCurrencyRates[code].rateToUSD = data.rates[code];
          }
        });
        currRatesLastFetched = data.time ? new Date(data.time) : null;
        updateRatesTimestampUI();
      }
    } catch (e) {}
  }
}

function swapCurrency() {
  const fromSelect = document.getElementById('currFromSelect');
  const toSelect = document.getElementById('currToSelect');
  if (!fromSelect || !toSelect) return;

  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;

  renderCurrencyQuickChips();
  calculateCurrencyConversion();

  // Hiệu ứng xoay
  const btnSwap = document.getElementById('btnSwapCurrency');
  if (btnSwap) {
    btnSwap.style.transform = 'rotate(180deg)';
    setTimeout(() => {
      btnSwap.style.transform = '';
    }, 250);
  }
}

function calculateCurrencyConversion() {
  const fromInput = document.getElementById('currFromAmount');
  const fromSelect = document.getElementById('currFromSelect');
  const toSelect = document.getElementById('currToSelect');
  const resultVal = document.getElementById('currResultValue');
  const resultUnit = document.getElementById('currResultUnit');
  const rateInfoText = document.getElementById('currRateInfoText');

  if (!fromInput || !fromSelect || !toSelect || !resultVal) return;

  const fromCode = fromSelect.value;
  const toCode = toSelect.value;
  const fromRateUSD = currentCurrencyRates[fromCode]?.rateToUSD || 1;
  const toRateUSD = currentCurrencyRates[toCode]?.rateToUSD || 1;

  // Lấy giá trị số nhập vào (hỗ trợ cả dấu chấm và phẩy)
  let rawStr = fromInput.value.replace(/,/g, '.').trim();
  let amount = parseFloat(rawStr);
  if (isNaN(amount) || amount < 0) amount = 0;

  // Công thức: Amount / fromRateUSD * toRateUSD
  const unitRate = toRateUSD / fromRateUSD;
  const converted = amount * unitRate;

  // Hiển thị kết quả định dạng chuẩn
  resultVal.textContent = formatCurrencyNumber(converted, toCode);
  if (resultUnit) resultUnit.textContent = toCode;

  // Cập nhật thông tin tỷ giá 1 đơn vị
  if (rateInfoText) {
    const formattedUnitRate = formatCurrencyNumber(unitRate, toCode);
    rateInfoText.textContent = `1 ${fromCode} ≈ ${formattedUnitRate} ${toCode}`;
  }
}

function formatCurrencyNumber(val, code) {
  if (isNaN(val)) return '0';
  // Các đồng tiền mệnh giá lớn không dùng số thập phân lẻ
  if (['VND', 'JPY', 'KRW'].includes(code)) {
    if (val >= 100) {
      return Math.round(val).toLocaleString('vi-VN');
    }
    return val.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  }
  // Các đồng tiền khác có cent
  if (val >= 1000) {
    return val.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (val >= 1) {
    return val.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (val > 0) {
    return val.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return '0';
}

function renderCurrencyQuickChips() {
  const container = document.getElementById('currQuickChips');
  const fromSelect = document.getElementById('currFromSelect');
  const fromInput = document.getElementById('currFromAmount');
  if (!container || !fromSelect) return;

  const fromCode = fromSelect.value;
  let presets = [];

  if (fromCode === 'VND') {
    presets = [
      { label: '100k', val: 100000 },
      { label: '500k', val: 500000 },
      { label: '1tr', val: 1000000 },
      { label: '5tr', val: 5000000 },
      { label: '10tr', val: 10000000 }
    ];
  } else if (fromCode === 'JPY' || fromCode === 'KRW') {
    presets = [
      { label: '1,000', val: 1000 },
      { label: '5,000', val: 5000 },
      { label: '10,000', val: 10000 },
      { label: '50,000', val: 50000 },
      { label: '100,000', val: 100000 }
    ];
  } else {
    // USD, EUR, GBP, AUD, etc.
    presets = [
      { label: '10', val: 10 },
      { label: '50', val: 50 },
      { label: '100', val: 100 },
      { label: '500', val: 500 },
      { label: '1,000', val: 1000 }
    ];
  }

  container.innerHTML = presets.map(p => `
    <button type="button" class="btn-curr-chip" data-val="${p.val}">
      ${p.label}
    </button>
  `).join('');

  container.querySelectorAll('.btn-curr-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      if (fromInput) {
        fromInput.value = btn.dataset.val;
        calculateCurrencyConversion();
      }
    });
  });
}

function renderCurrencyRatesStrip() {
  const strip = document.getElementById('currRatesStrip');
  if (!strip) return;

  const compareList = ['USD', 'EUR', 'JPY', 'KRW', 'CNY', 'GBP', 'SGD', 'THB'];
  const vndRate = currentCurrencyRates.VND.rateToUSD;

  strip.innerHTML = compareList.map(code => {
    const c = currentCurrencyRates[code];
    if (!c) return '';
    const rateInVND = vndRate / c.rateToUSD;
    const formatted = formatCurrencyNumber(rateInVND, 'VND');
    return `
      <div class="curr-rate-pill" data-from="${code}" title="Nhấn để đổi nhanh từ ${code} sang VND">
        <span>${c.flag} ${code}</span>
        <strong>${formatted}₫</strong>
      </div>
    `;
  }).join('');

  strip.querySelectorAll('.curr-rate-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const fromSelect = document.getElementById('currFromSelect');
      const toSelect = document.getElementById('currToSelect');
      if (fromSelect && toSelect) {
        fromSelect.value = pill.dataset.from;
        toSelect.value = 'VND';
        renderCurrencyQuickChips();
        calculateCurrencyConversion();
      }
    });
  });
}

function checkAutoRefreshCurrencyRates() {
  const now = Date.now();
  const lastTime = currRatesLastFetched ? currRatesLastFetched.getTime() : 0;
  // Tự động cập nhật nếu đã qua 10 phút kể từ lần nạp trước
  if (now - lastTime > 10 * 60 * 1000) {
    fetchLiveCurrencyRates(false);
  }
}

async function fetchLiveCurrencyRates(manual = false) {
  const btnRefresh = document.getElementById('btnRefreshRates');
  if (btnRefresh && manual) {
    btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
  }

  let ratesData = null;

  // 1. Thử API chính: open.er-api.com (Miễn phí, cập nhật liên tục)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates === 'object') {
        ratesData = data.rates;
      }
    }
  } catch (err) {
    // API 1 không phản hồi, thử API dự phòng bên dưới
  }

  // 2. Thử API dự phòng: exchangerate-api.com nếu API 1 gặp sự cố mạng
  if (!ratesData) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && typeof data.rates === 'object') {
          ratesData = data.rates;
        }
      }
    } catch (err) {}
  }

  if (ratesData) {
    Object.keys(DEFAULT_CURRENCY_RATES).forEach(code => {
      if (ratesData[code] && typeof ratesData[code] === 'number') {
        currentCurrencyRates[code].rateToUSD = ratesData[code];
      }
    });
    currRatesLastFetched = new Date();
    localStorage.setItem('najimez_currency_rates', JSON.stringify({
      rates: ratesData,
      time: currRatesLastFetched.getTime()
    }));
    updateRatesTimestampUI(true);
    calculateCurrencyConversion();
    renderCurrencyRatesStrip();

    if (manual && typeof showToastNotification === 'function') {
      showToastNotification('Đã cập nhật tỷ giá trực tuyến thời gian thực!');
    }
  } else {
    // Nếu cả 2 API đều không kết nối được (không có mạng), dùng dữ liệu đã lưu
    updateRatesTimestampUI(false);
    if (manual && typeof showToastNotification === 'function') {
      showToastNotification('Đang dùng tỷ giá ngoại tuyến đã lưu');
    }
  }

  if (btnRefresh) {
    btnRefresh.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Cập nhật';
  }
}

function updateRatesTimestampUI(isLive = true) {
  const el = document.getElementById('currTimestampText');
  if (!el) return;
  if (currRatesLastFetched) {
    const timeStr = currRatesLastFetched.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = currRatesLastFetched.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    if (isLive) {
      el.innerHTML = `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;margin-right:4px;"></span> Trực tuyến lúc ${timeStr} (${dateStr})`;
    } else {
      el.innerHTML = `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#94a3b8;margin-right:4px;"></span> Lưu tạm: ${timeStr} (${dateStr})`;
    }
  } else {
    el.innerHTML = '<i class="fa-regular fa-clock"></i> Tỷ giá chuẩn theo thị trường';
  }
}

function copyCurrencyResult() {
  const fromInput = document.getElementById('currFromAmount');
  const fromSelect = document.getElementById('currFromSelect');
  const toSelect = document.getElementById('currToSelect');
  const resultVal = document.getElementById('currResultValue');
  const btnCopy = document.getElementById('btnCopyCurrResult');

  if (!fromInput || !fromSelect || !toSelect || !resultVal) return;

  const text = `${fromInput.value} ${fromSelect.value} = ${resultVal.textContent} ${toSelect.value}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      if (btnCopy) {
        const orig = btnCopy.innerHTML;
        btnCopy.innerHTML = '<i class="fa-solid fa-check" style="color: #4ade80;"></i> Đã chép!';
        setTimeout(() => { if (btnCopy) btnCopy.innerHTML = orig; }, 1500);
      }
    }).catch(() => {
      fallbackCopyText(text);
    });
  } else {
    fallbackCopyText(text);
  }
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    const btnCopy = document.getElementById('btnCopyCurrResult');
    if (btnCopy) {
      const orig = btnCopy.innerHTML;
      btnCopy.innerHTML = '<i class="fa-solid fa-check" style="color: #4ade80;"></i> Đã chép!';
      setTimeout(() => { if (btnCopy) btnCopy.innerHTML = orig; }, 1500);
    }
  } catch (e) {}
  document.body.removeChild(ta);
}

// ============================================================================
// 8. KHỞI CHẠY TẤT CẢ TIỆN ÍCH TRONG HỘP DỤNG CỤ
// ============================================================================
function initToolbox() {
  // Bắt sự kiện chuyển tab công cụ con
  const tabBtns = document.querySelectorAll('.btn-toolbox-tab');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.dataset.subtool;
      if (toolId) switchToolboxTool(toolId);
    });
  });

  // Bắt sự kiện phóng to / thu nhỏ trên từng thẻ góc
  const maximizeBtns = document.querySelectorAll('.btn-quad-maximize');
  maximizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tool = btn.dataset.tool;
      if (currentToolboxSubtool === tool) {
        switchToolboxTool('all');
      } else {
        switchToolboxTool(tool);
      }
    });
  });

  // Khởi tạo các tiện ích con
  initCoinFlipper();
  initDiceRoller();
  initPomodoro();
  initMiniCalculator();
  initCurrencyConverter();
}

// Đăng ký tự động khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initToolbox);
} else {
  initToolbox();
}
