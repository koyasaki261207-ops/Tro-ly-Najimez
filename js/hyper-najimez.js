/**
 * js/hyper-najimez.js - Phân hệ Siêu Trí Tuệ & Giải Bài Tập Sâu "Hyper Najimez"
 * Tích hợp cơ chế Deep Reasoning (Chain-of-Thought), KaTeX Math Rendering,
 * Gemini Vision OCR đọc ảnh bài tập và Sổ tay bài giải học thuật.
 */

// ============================================================================
// 1. TRẠNG THÁI TOÀN CỤC HYPER NAJIMEZ
// ============================================================================
let hyperCurrentSubject = 'math'; // 'math' | 'physics' | 'chemistry' | 'code' | 'literature' | 'general'
let hyperAttachedImage = null;   // { base64, mimeType, dataUrl }
let hyperIsSolving = false;
let hyperCurrentSolutionData = null; // { prompt, thinking, solution, subject, timestamp }
let hyperTimerInterval = null;
let hyperStartTime = 0;

const HYPER_SUBJECTS = {
  math: { name: 'Toán Học', icon: 'fa-calculator', color: '#c084fc', promptHint: 'Đại số, Hình học, Giải tích, Tích phân, Lượng giác...' },
  physics: { name: 'Vật Lý', icon: 'fa-atom', color: '#38bdf8', promptHint: 'Cơ học, Điện từ, Quang học, Sóng cơ, Dao động...' },
  chemistry: { name: 'Hóa Học', icon: 'fa-flask-vial', color: '#34d399', promptHint: 'Cân bằng PTHH, Hóa hữu cơ, Điện phân, Chuỗi phản ứng...' },
  code: { name: 'Tin & Code', icon: 'fa-code', color: '#fbbf24', promptHint: 'Python, C++, Thuật toán, Đệ quy, Quy hoạch động...' },
  literature: { name: 'Ngữ Văn / Luận', icon: 'fa-book-open', color: '#f472b6', promptHint: 'Nghị luận văn học, nghị luận xã hội, phân tích tác phẩm...' },
  general: { name: 'Đa Môn / STEM', icon: 'fa-microscope', color: '#a78bfa', promptHint: 'Bài tập tổng hợp, câu hỏi hóc búa, tư duy logic...' }
};

// ============================================================================
// 2. KHỞI TẠO VÀ ĐĂNG KÝ SỰ KIỆN GIAO DIỆN
// ============================================================================
function initHyperNajimez() {
  // 1. Selector môn học
  const subjectBtns = document.querySelectorAll('.btn-subject-chip');
  subjectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.dataset.subject;
      if (sub && HYPER_SUBJECTS[sub]) {
        setHyperSubject(sub);
      }
    });
  });

  // 2. Thanh công thức toán học nhanh
  const mathSymBtns = document.querySelectorAll('.btn-math-sym');
  mathSymBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sym = btn.dataset.insert;
      if (sym) insertMathSymbol(sym);
    });
  });

  // 3. Nút giải bài (CTA)
  const btnSolve = document.getElementById('btnHyperSolve');
  if (btnSolve) {
    btnSolve.addEventListener('click', solveHyperProblem);
  }

  // 4. Xóa trắng đề bài
  const btnClear = document.getElementById('btnClearHyperInput');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      const textarea = document.getElementById('hyperPromptInput');
      if (textarea) {
        textarea.value = '';
        textarea.focus();
        updateHyperCharCount();
      }
      removeHyperImage();
    });
  }

  // 5. Textarea sự kiện đếm ký tự & phím tắt Ctrl + Enter
  const textarea = document.getElementById('hyperPromptInput');
  if (textarea) {
    textarea.addEventListener('input', updateHyperCharCount);
    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        solveHyperProblem();
      }
    });

    // Bắt sự kiện dán ảnh trực tiếp từ Clipboard (Ctrl + V)
    textarea.addEventListener('paste', handleHyperPasteEvent);
  }

  // 6. Khu vực kéo thả / chọn ảnh đề bài
  initHyperImageDropzone();

  // 7. Đăng ký các nút hành động kết quả (Copy, Sổ tay, TTS, Export)
  initHyperActionButtons();

  // 9. Cập nhật số lượng sổ tay
  updateHyperNotebookBadge();
}

/**
 * Được gọi khi người dùng chuyển sang tab Hyper Najimez
 */
function renderHyperTab() {
  updateHyperNotebookBadge();
  const textarea = document.getElementById('hyperPromptInput');
  if (textarea && !textarea.value.trim()) {
    setTimeout(() => textarea.focus(), 150);
  }
}

// ============================================================================
// 3. XỬ LÝ ĐẦU VÀO: MÔN HỌC, SYMBOL & ẢNH ĐÍNH KÈM
// ============================================================================
function setHyperSubject(subjectKey) {
  hyperCurrentSubject = subjectKey;
  document.querySelectorAll('.btn-subject-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subject === subjectKey);
  });

  const textarea = document.getElementById('hyperPromptInput');
  if (textarea && !textarea.value.trim()) {
    const info = HYPER_SUBJECTS[subjectKey];
    textarea.placeholder = `Nhập đề bài ${info.name}... (${info.promptHint}) hoặc dán ảnh đề bài (Ctrl+V)`;
  }
}

function insertMathSymbol(symbol) {
  const textarea = document.getElementById('hyperPromptInput');
  if (!textarea) return;

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const text = textarea.value;

  textarea.value = text.substring(0, start) + symbol + text.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
  textarea.focus();
  updateHyperCharCount();
}

function updateHyperCharCount() {
  const textarea = document.getElementById('hyperPromptInput');
  const countEl = document.getElementById('hyperCharCount');
  if (textarea && countEl) {
    countEl.textContent = `${textarea.value.length} ký tự`;
  }
}

// ============================================================================
// 4. KÉO THẢ, CHỌN TỆP VÀ DÁN ẢNH ĐỀ BÀI (OCR VISION)
// ============================================================================
function initHyperImageDropzone() {
  const dropzone = document.getElementById('hyperDropzone');
  const fileInput = document.getElementById('hyperFileInput');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleHyperImageFile(file);
    fileInput.value = '';
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt && dt.files && dt.files[0];
    if (file && file.type.startsWith('image/')) {
      handleHyperImageFile(file);
    }
  });

  // Nút xóa ảnh
  const btnRemove = document.getElementById('btnRemoveHyperImg');
  if (btnRemove) {
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      removeHyperImage();
    });
  }
}

function handleHyperPasteEvent(e) {
  const items = (e.clipboardData || e.originalEvent.clipboardData)?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();
      if (blob) {
        handleHyperImageFile(blob);
        break;
      }
    }
  }
}

async function handleHyperImageFile(fileOrBlob) {
  try {
    let compressed;
    if (typeof compressImageForGemini === 'function') {
      const res = await compressImageForGemini(fileOrBlob, 1600, 1600, 0.88);
      const base64Part = res.dataUrl ? res.dataUrl.split(',')[1] : '';
      compressed = {
        dataUrl: res.dataUrl,
        base64: base64Part,
        mimeType: res.mimeType || 'image/jpeg',
        width: res.width,
        height: res.height
      };
    } else {
      // Fallback nếu hàm compressImageForGemini chưa tải
      compressed = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          resolve({
            dataUrl: dataUrl,
            base64: dataUrl.split(',')[1] || '',
            mimeType: fileOrBlob.type || 'image/jpeg'
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBlob);
      });
    }

    hyperAttachedImage = compressed;

    // Cập nhật UI hiển thị ảnh
    const previewWrap = document.getElementById('hyperImgPreviewWrap');
    const previewImg = document.getElementById('hyperPreviewImg');
    const dropzone = document.getElementById('hyperDropzone');

    if (previewImg) previewImg.src = compressed.dataUrl;
    if (previewWrap) previewWrap.style.display = 'flex';
    if (dropzone) dropzone.style.display = 'none';

  } catch (err) {
    alert('Không thể xử lý hình ảnh này: ' + err.message);
  }
}

function removeHyperImage() {
  hyperAttachedImage = null;
  const previewWrap = document.getElementById('hyperImgPreviewWrap');
  const previewImg = document.getElementById('hyperPreviewImg');
  const dropzone = document.getElementById('hyperDropzone');

  if (previewImg) previewImg.src = '';
  if (previewWrap) previewWrap.style.display = 'none';
  if (dropzone) dropzone.style.display = 'flex';
}

// ============================================================================
// 5. THỰC THI GIẢI BÀI TẬP VỚI CƠ CHẾ TƯ DUY SÂU (DEEP REASONING)
// ============================================================================
async function solveHyperProblem() {
  if (hyperIsSolving) return;

  const promptInput = document.getElementById('hyperPromptInput');
  const userPrompt = (promptInput ? promptInput.value : '').trim();

  if (!userPrompt && !hyperAttachedImage) {
    alert('Vui lòng nhập đề bài hoặc đính kèm/dán ảnh bài tập để Najimez giải nhé!');
    if (promptInput) promptInput.focus();
    return;
  }

  // Kiểm tra Gemini API Key
  const apiKey = typeof getStoredApiKey === 'function' ? getStoredApiKey() : '';
  if (!apiKey) {
    const confirmSet = confirm('Bạn chưa kết nối Gemini API Key.\n\nHãy nhấn OK để mở khung cài đặt API Key Google (hoàn toàn miễn phí) và kích hoạt chế độ Hyper Najimez nhé!');
    if (confirmSet) {
      const modal = document.getElementById('apiKeyModal');
      if (modal) modal.classList.add('active');
    }
    return;
  }

  // Tùy chọn cấu hình
  const chkVerify = document.getElementById('hyperChkVerify')?.checked ?? true;
  const chkStepByStep = document.getElementById('hyperChkStep')?.checked ?? true;
  const budgetSelect = document.getElementById('hyperBudgetSelect');
  const budgetTokens = budgetSelect ? parseInt(budgetSelect.value, 10) : 2048;

  // Chuẩn bị System Prompt chuyên biệt cho Hyper Mode
  const subjectInfo = HYPER_SUBJECTS[hyperCurrentSubject] || HYPER_SUBJECTS.math;
  const hyperSystemInstruction = `Bạn là HYPER NAJIMEZ – Phiên bản Thức Tỉnh Trí Tuệ & Siêu Năng Lực Giải Đề Học Thuật của Trợ Lý Ảo Najimez.
Chuyên môn hiện tại: BẬC THẦY GIẢI ĐỀ ${subjectInfo.name.toUpperCase()}.

CƠ CHẾ TƯ DUY SUY NGHĨ SÂU BẮT BUỘC (CHAIN-OF-THOUGHT PROTOCOL):
Mọi câu trả lời của bạn BẮT BUỘC phải mở đầu bằng khối thẻ tư duy:
<hyper_thinking>
[Viết toàn bộ quá trình nháp tư duy, phân tích đề bài, nhận diện bẫy, thử các hướng giải, kiểm tra tính toán và đối chiếu điều kiện ở đây.
1. Hiểu đề & Giả thiết: Đề cho gì? Cần tìm gì? Điều kiện xác định là gì?
2. Chiến lược: Dùng định lý, công thức hoặc phương pháp nào tối ưu nhất?
3. Phép biến đổi chi tiết: Nháp từng bước tính, kiểm tra sai số, nghiệm ngoại lai.
4. Tự kiểm tra (Self-Verification): Thử lại kết quả vào đề bài gốc để đảm bảo chính xác 100%.]
</hyper_thinking>

Sau thẻ </hyper_thinking>, hãy trình bày bài giải hoàn chỉnh theo chuẩn mực sư phạm cao cấp nhất:
# 📐 1. PHÂN TÍCH & PHƯƠNG PHÁP
- Nhắc lại giả thiết, điều kiện xác định ($D = ...$)
- Nêu rõ định lý, công thức cốt lõi.

# 📝 2. LỜI GIẢI CHI TIẾT
${chkStepByStep ? '- Trình bày từng bước tuần tự, gãy gọn, chú thích lý do mỗi phép biến đổi.' : '- Trình bày ngắn gọn, súc tích.'}
- Mọi công thức Toán, Lý, Hóa BẮT BUỘC đặt trong cú pháp LaTeX chuẩn: dùng $...$ cho công thức nội dòng và $$...$$ cho công thức khối.

# 🎯 3. ĐÁP SỐ CUỐI CÙNG
- Đóng khung hoặc in đậm đáp án chính xác nhất kèm đơn vị.

${chkVerify ? '# 💡 4. BÍ KÍP & BẪY CẦN TRÁNH (PRO TIPS)\n- Chỉ ra các sai sót học sinh/sinh viên hay mắc phải ở dạng bài này và cách kiểm tra nhanh.' : ''}

Giọng điệu: Thông tuệ, tự tin, sư phạm và chuẩn xác tuyệt đối!`;

  // Cập nhật UI bắt đầu giải
  setHyperSolvingUIState(true);

  let accumulatedText = '';
  hyperStartTime = Date.now();
  startHyperTimer();

  try {
    let modelInfo = typeof autoDetectAndTestModel === 'function'
      ? await autoDetectAndTestModel(apiKey, false)
      : { version: 'v1beta', modelName: 'gemini-1.5-flash' };

    const streamUrl = `https://generativelanguage.googleapis.com/${modelInfo.version}/models/${modelInfo.modelName}:streamGenerateContent?key=${apiKey}&alt=sse`;

    // Chuẩn bị parts
    const parts = [];
    const imgBase64 = hyperAttachedImage
      ? (hyperAttachedImage.base64 || (hyperAttachedImage.dataUrl ? hyperAttachedImage.dataUrl.split(',')[1] : ''))
      : '';

    if (imgBase64) {
      parts.push({
        inline_data: {
          mime_type: hyperAttachedImage.mimeType || 'image/jpeg',
          data: imgBase64
        }
      });
    }

    let finalPrompt = userPrompt;
    if (imgBase64) {
      if (userPrompt) {
        finalPrompt = `${userPrompt}\n\n[LƯU Ý: Hãy quan sát và đọc kỹ toàn bộ nội dung, đề bài hoặc mã nguồn trong hình ảnh đính kèm để giải đúng yêu cầu trên.]`;
      } else {
        finalPrompt = 'Hãy quan sát kỹ toàn bộ hình ảnh bài tập/mã nguồn đính kèm này, nhận diện đề bài và giải chi tiết từng bước cho tôi nhé!';
      }
    }
    parts.push({ text: finalPrompt });

    const payload = {
      contents: [{ role: 'user', parts: parts }],
      generationConfig: {
        temperature: 0.2, // Nhiệt độ thấp đảm bảo chính xác logic học thuật
        topP: 0.95,
        maxOutputTokens: budgetTokens * 2
      }
    };

    if (modelInfo.version === 'v1beta') {
      payload.system_instruction = {
        parts: [{ text: hyperSystemInstruction }]
      };
    } else {
      payload.contents[0].parts.unshift({ text: `[HƯỚNG DẪN HYPER: ${hyperSystemInstruction}]\n\n` });
    }

    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Lỗi từ Google Gemini (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.substring(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const data = JSON.parse(jsonStr);
            const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (chunk) {
              accumulatedText += chunk;
              renderHyperStreamingResult(accumulatedText);
            }
          } catch (e) { }
        }
      }
    }

    // Kết thúc stream: Render hoàn chỉnh với KaTeX
    finishHyperSolution(accumulatedText, finalPrompt);

  } catch (err) {
    renderHyperError(err.message);
  } finally {
    setHyperSolvingUIState(false);
    stopHyperTimer();
  }
}

// ============================================================================
// 6. RENDER KẾT QUẢ, PARSING THOUGHTS & KATEX FORMULAS
// ============================================================================
function setHyperSolvingUIState(isSolving) {
  hyperIsSolving = isSolving;
  const btnSolve = document.getElementById('btnHyperSolve');
  const emptyState = document.getElementById('hyperEmptyState');
  const solutionStage = document.getElementById('hyperSolutionStage');
  const thoughtsCard = document.getElementById('hyperThoughtsCard');

  if (btnSolve) {
    btnSolve.disabled = isSolving;
    btnSolve.innerHTML = isSolving
      ? `<i class="fa-solid fa-spinner fa-spin"></i> NAJIMEZ ĐANG TƯ DUY SÂU...`
      : `<i class="fa-solid fa-bolt"></i> THỨC TỈNH HYPER NAJIMEZ • GIẢI BÀI NGAY`;
  }

  if (isSolving) {
    if (emptyState) emptyState.style.display = 'none';
    if (solutionStage) solutionStage.style.display = 'flex';
    if (thoughtsCard) thoughtsCard.classList.remove('collapsed');
  }
}

function startHyperTimer() {
  const timerEl = document.getElementById('hyperThinkingTimer');
  if (hyperTimerInterval) clearInterval(hyperTimerInterval);

  hyperTimerInterval = setInterval(() => {
    const elapsedSec = ((Date.now() - hyperStartTime) / 1000).toFixed(1);
    if (timerEl) timerEl.textContent = `${elapsedSec}s`;
  }, 100);
}

function stopHyperTimer() {
  if (hyperTimerInterval) {
    clearInterval(hyperTimerInterval);
    hyperTimerInterval = null;
  }
}

function renderHyperStreamingResult(text) {
  const thoughtsBody = document.getElementById('hyperThoughtsBody');
  const solutionContent = document.getElementById('hyperSolutionContent');
  const thoughtsCard = document.getElementById('hyperThoughtsCard');

  // Phân tách khối <hyper_thinking>
  const thinkStart = text.indexOf('<hyper_thinking>');
  const thinkEnd = text.indexOf('</hyper_thinking>');

  let thinkingText = '';
  let solutionText = '';

  if (thinkStart !== -1) {
    if (thinkEnd !== -1) {
      thinkingText = text.substring(thinkStart + 16, thinkEnd).trim();
      solutionText = text.substring(thinkEnd + 17).trim();
    } else {
      thinkingText = text.substring(thinkStart + 16).trim();
      solutionText = '';
    }
  } else {
    solutionText = text;
  }

  if (thoughtsBody && thinkingText) {
    thoughtsBody.textContent = thinkingText;
    if (thoughtsCard) thoughtsCard.style.display = 'block';
  }

  if (solutionContent && solutionText) {
    // Render markdown tạm thời khi đang stream
    if (typeof marked !== 'undefined') {
      solutionContent.innerHTML = marked.parse(solutionText);
    } else {
      solutionContent.textContent = solutionText;
    }
  }
}

function finishHyperSolution(fullText, promptText) {
  const thoughtsBody = document.getElementById('hyperThoughtsBody');
  const solutionContent = document.getElementById('hyperSolutionContent');
  const thoughtsCard = document.getElementById('hyperThoughtsCard');
  const thoughtsMeta = document.getElementById('hyperThoughtsMeta');

  const thinkStart = fullText.indexOf('<hyper_thinking>');
  const thinkEnd = fullText.indexOf('</hyper_thinking>');

  let thinkingText = '';
  let solutionText = '';

  if (thinkStart !== -1 && thinkEnd !== -1) {
    thinkingText = fullText.substring(thinkStart + 16, thinkEnd).trim();
    solutionText = fullText.substring(thinkEnd + 17).trim();
  } else {
    solutionText = fullText;
  }

  const elapsedSec = ((Date.now() - hyperStartTime) / 1000).toFixed(1);

  if (thoughtsBody) {
    thoughtsBody.textContent = thinkingText || 'Quá trình tư duy logic trực tiếp được áp dụng cho bài giải này.';
  }

  if (thoughtsMeta) {
    thoughtsMeta.innerHTML = `<i class="fa-regular fa-clock"></i> Thời gian suy nghĩ: ${elapsedSec}s`;
  }

  if (thoughtsCard) {
    thoughtsCard.style.display = 'block';
    // Đăng ký toggle accordion
    const header = thoughtsCard.querySelector('.hyper-thoughts-header');
    if (header && !header.dataset.hasListener) {
      header.dataset.hasListener = 'true';
      header.addEventListener('click', () => {
        thoughtsCard.classList.toggle('collapsed');
      });
    }
  }

  if (solutionContent) {
    // 1. Render Markdown
    if (typeof marked !== 'undefined') {
      solutionContent.innerHTML = marked.parse(solutionText);
    } else {
      solutionContent.textContent = solutionText;
    }

    // 2. Render KaTeX Toán học
    renderMathFormulas(solutionContent);
  }

  // Lưu trạng thái hiện tại
  hyperCurrentSolutionData = {
    id: 'hyp_' + Date.now(),
    prompt: promptText,
    thinking: thinkingText,
    solution: solutionText,
    subject: hyperCurrentSubject,
    timestamp: new Date().toISOString()
  };
}

function renderMathFormulas(element) {
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn('Lỗi render KaTeX:', e);
    }
  }
}

function renderHyperError(errorMsg) {
  const solutionContent = document.getElementById('hyperSolutionContent');
  if (solutionContent) {
    solutionContent.innerHTML = `
      <div style="background: rgba(225, 29, 72, 0.15); border: 1px solid rgba(244, 63, 94, 0.4); border-radius: 12px; padding: 16px; color: #fecdd3;">
        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-triangle-exclamation" style="color: #fb7185;"></i> Không Thể Hoàn Tất Lời Giải
        </div>
        <div style="font-size: 0.88rem; line-height: 1.5;">${errorMsg}</div>
        <div style="margin-top: 10px; font-size: 0.8rem; color: #fda4af;">
          Mẹo: Hãy kiểm tra lại API Key Gemini hoặc giảm bớt độ dài bài tập nhé!
        </div>
      </div>
    `;
  }
}

// ============================================================================
// 7. CÁC NÚT HÀNH ĐỘNG: COPY, SỔ TAY, TTS, XUẤT FILE
// ============================================================================
function initHyperActionButtons() {
  // 1. Sao chép bài giải
  const btnCopy = document.getElementById('btnHyperCopySolution');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (!hyperCurrentSolutionData?.solution) return;
      navigator.clipboard.writeText(hyperCurrentSolutionData.solution).then(() => {
        const orig = btnCopy.innerHTML;
        btnCopy.innerHTML = `<i class="fa-solid fa-check"></i> Đã sao chép!`;
        btnCopy.classList.add('active');
        setTimeout(() => {
          btnCopy.innerHTML = orig;
          btnCopy.classList.remove('active');
        }, 2000);
      });
    });
  }

  // 2. Lưu vào Sổ tay bài tập
  const btnSave = document.getElementById('btnHyperSaveNotebook');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      if (!hyperCurrentSolutionData) return;
      saveCurrentToNotebook();
      const orig = btnSave.innerHTML;
      btnSave.innerHTML = `<i class="fa-solid fa-check"></i> Đã lưu sổ tay!`;
      btnSave.classList.add('active');
      setTimeout(() => {
        btnSave.innerHTML = orig;
        btnSave.classList.remove('active');
      }, 2000);
    });
  }

  // 3. Đọc bài giảng (TTS)
  const btnSpeak = document.getElementById('btnHyperSpeak');
  if (btnSpeak) {
    btnSpeak.addEventListener('click', () => {
      if (!hyperCurrentSolutionData?.solution) return;
      if (typeof speakAssistantText === 'function') {
        if (typeof isSpeakingAssistant === 'function' && isSpeakingAssistant()) {
          if (typeof stopSpeakingAssistant === 'function') stopSpeakingAssistant();
          btnSpeak.innerHTML = `<i class="fa-solid fa-volume-high"></i> Nghe Najimez Giảng`;
          btnSpeak.classList.remove('active');
        } else {
          // Lọc bỏ ký hiệu LaTeX và Markdown để đọc mượt mà
          const cleanText = hyperCurrentSolutionData.solution
            .replace(/\$\$[\s\S]*?\$\$/g, ' công thức ')
            .replace(/\$([^\$]+)\$/g, ' $1 ')
            .replace(/[#*`_~]/g, '');

          btnSpeak.innerHTML = `<i class="fa-solid fa-circle-stop"></i> Dừng đọc`;
          btnSpeak.classList.add('active');

          speakAssistantText(cleanText, () => {}, () => {
            btnSpeak.innerHTML = `<i class="fa-solid fa-volume-high"></i> Nghe Najimez Giảng`;
            btnSpeak.classList.remove('active');
          });
        }
      }
    });
  }

  // 4. Xuất file Markdown / Text
  const btnExport = document.getElementById('btnHyperExport');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (!hyperCurrentSolutionData) return;
      const text = `# BÀI TẬP: ${HYPER_SUBJECTS[hyperCurrentSolutionData.subject]?.name || 'STEM'}\n\n## ĐỀ BÀI:\n${hyperCurrentSolutionData.prompt}\n\n---\n\n## LỜI GIẢI TỪ HYPER NAJIMEZ:\n${hyperCurrentSolutionData.solution}\n\n---\n*Được giải bởi Hyper Najimez lúc ${new Date(hyperCurrentSolutionData.timestamp).toLocaleString('vi-VN')}*`;
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BaiGiai_HyperNajimez_${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // 5. Mở modal Sổ tay bài tập
  const btnOpenNb = document.getElementById('btnOpenHyperNotebook');
  const modalNb = document.getElementById('hyperNotebookModal');
  const btnCloseNb = document.getElementById('btnCloseHyperNotebook');

  if (btnOpenNb && modalNb) {
    btnOpenNb.addEventListener('click', () => {
      renderHyperNotebookList();
      modalNb.classList.add('active');
    });
  }

  if (btnCloseNb && modalNb) {
    btnCloseNb.addEventListener('click', () => modalNb.classList.remove('active'));
    modalNb.addEventListener('click', (e) => {
      if (e.target === modalNb) modalNb.classList.remove('active');
    });
  }
}

// ============================================================================
// 8. QUẢN LÝ SỔ TAY BÀI TẬP (HYPER NOTEBOOK LOCAL STORAGE)
// ============================================================================
const NOTEBOOK_KEY = 'najimez_hyper_notebook_v1';

function getNotebookData() {
  try {
    const raw = localStorage.getItem(NOTEBOOK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCurrentToNotebook() {
  if (!hyperCurrentSolutionData) return;
  const list = getNotebookData();
  // Tránh trùng lặp
  const exists = list.some(item => item.id === hyperCurrentSolutionData.id);
  if (!exists) {
    list.unshift(hyperCurrentSolutionData);
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(list));
    updateHyperNotebookBadge();
  }
}

function deleteNotebookItem(id) {
  let list = getNotebookData();
  list = list.filter(item => item.id !== id);
  localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(list));
  updateHyperNotebookBadge();
  renderHyperNotebookList();
}

function updateHyperNotebookBadge() {
  const countEl = document.getElementById('hyperNotebookCount');
  const list = getNotebookData();
  if (countEl) countEl.textContent = list.length;
}

function renderHyperNotebookList() {
  const container = document.getElementById('hyperNotebookList');
  if (!container) return;

  const list = getNotebookData();
  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
        <i class="fa-solid fa-book-bookmark" style="font-size: 2.2rem; color: #a855f7; margin-bottom: 12px; display: block;"></i>
        <div style="font-weight: 600; color: #e2e8f0; margin-bottom: 4px;">Sổ tay bài tập đang trống</div>
        <div style="font-size: 0.84rem;">Sau khi Hyper Najimez giải bài, hãy nhấn "Lưu Sổ Tay" để ôn lại bất kỳ lúc nào nhé!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    const subInfo = HYPER_SUBJECTS[item.subject] || HYPER_SUBJECTS.math;
    const timeStr = new Date(item.timestamp).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    const promptShort = item.prompt || 'Đề bài qua hình ảnh';

    return `
      <div class="notebook-item-card" data-id="${item.id}">
        <div class="nb-item-info">
          <div class="nb-item-title">${escapeHtml(promptShort)}</div>
          <div class="nb-item-meta">
            <span class="nb-item-tag" style="background: ${subInfo.color}25; color: ${subInfo.color}; border: 1px solid ${subInfo.color}45;">
              <i class="fa-solid ${subInfo.icon}"></i> ${subInfo.name}
            </span>
            <span><i class="fa-regular fa-clock"></i> ${timeStr}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button type="button" class="btn-delete-nb-item" data-del-id="${item.id}" title="Xóa bài này">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Click vào bài để nạp lại
  container.querySelectorAll('.notebook-item-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-nb-item')) return;
      const id = card.dataset.id;
      const item = list.find(x => x.id === id);
      if (item) {
        loadNotebookSolutionToStage(item);
        const modalNb = document.getElementById('hyperNotebookModal');
        if (modalNb) modalNb.classList.remove('active');
      }
    });
  });

  // Click nút xóa
  container.querySelectorAll('.btn-delete-nb-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.delId;
      if (confirm('Bạn có muốn xóa bài tập này khỏi sổ tay không?')) {
        deleteNotebookItem(id);
      }
    });
  });
}

function loadNotebookSolutionToStage(item) {
  setHyperSubject(item.subject);
  const promptInput = document.getElementById('hyperPromptInput');
  if (promptInput) {
    promptInput.value = item.prompt || '';
    updateHyperCharCount();
  }

  const emptyState = document.getElementById('hyperEmptyState');
  const solutionStage = document.getElementById('hyperSolutionStage');
  if (emptyState) emptyState.style.display = 'none';
  if (solutionStage) solutionStage.style.display = 'flex';

  finishHyperSolution(
    item.thinking ? `<hyper_thinking>${item.thinking}</hyper_thinking>\n\n${item.solution}` : item.solution,
    item.prompt
  );
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
