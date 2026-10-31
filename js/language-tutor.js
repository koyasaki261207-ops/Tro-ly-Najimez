/**
 * ==========================================================================
 * TRỢ LÝ GIA SƯ TỪ VỰNG NAJIME (NAJIME VOCABULARY TUTOR)
 * Module chuyên biệt quản lý khung chat AI đồng hành luyện phản xạ từ vựng
 * ==========================================================================
 */

let tutorChatHistory = [];
let isTutorCollapsed = false;

// Khởi tạo khung chat Najime khi tải trang
function initNajimeTutor() {
  const chatBody = document.getElementById('najimeTutorBody');
  if (!chatBody) return;

  // Nếu chưa có tin nhắn nào, nạp tin nhắn chào mừng mặc định
  if (tutorChatHistory.length === 0) {
    addNajimeWelcomeMessage();
  }
}

// Thêm tin nhắn chào mừng ban đầu
function addNajimeWelcomeMessage() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const welcomeHtml = `
    <div class="tutor-msg tutor-msg-najime intro-msg">
      <div class="tutor-msg-avatar">
        <img src="assets/najimez.jpg" alt="Najime Tutor" />
      </div>
      <div class="tutor-msg-bubble">
        <div class="tutor-msg-author">
          <span>Najime</span>
          <span class="tutor-msg-time">${timeStr}</span>
        </div>
        <div class="tutor-msg-content">
          Chào bạn! Mình là <strong>Najime</strong> – trợ lý gia sư đồng hành cùng bạn ôn luyện từ vựng. ✨<br><br>
          Hãy thử sức gõ câu trả lời ở ô bài tập bên trái và bấm <strong>Kiểm Tra</strong>, mình sẽ tự động đối chiếu, chỉ rõ lỗi sai hoặc mở rộng collocation, câu ví dụ cho bạn nhé!
        </div>
        <div class="tutor-quick-suggestions">
          <button type="button" class="tutor-chip" onclick="handleTutorChipClick('Đặt cho mình một câu ví dụ hay với từ này')">💡 Đặt câu ví dụ</button>
          <button type="button" class="tutor-chip" onclick="handleTutorChipClick('Từ này thường đi với giới từ hoặc collocation nào?')">🔍 Collocation</button>
          <button type="button" class="tutor-chip" onclick="handleTutorChipClick('Mẹo nhớ nhanh từ này là gì?')">🧠 Mẹo nhớ từ</button>
        </div>
      </div>
    </div>
  `;

  const chatBody = document.getElementById('najimeTutorBody');
  if (chatBody) {
    chatBody.innerHTML = welcomeHtml;
    scrollTutorChatToBottom();
  }
}

// Cuộn khung chat xuống cuối
function scrollTutorChatToBottom() {
  const chatBody = document.getElementById('najimeTutorBody');
  if (chatBody) {
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

// Thu gọn / mở rộng khung chat Najime
function toggleNajimeTutorCollapse() {
  const container = document.getElementById('quizActiveContent');
  if (!container) return;

  isTutorCollapsed = !isTutorCollapsed;
  container.classList.toggle('tutor-collapsed', isTutorCollapsed);

  const icon = document.getElementById('tutorCollapseIcon');
  if (icon) {
    icon.className = isTutorCollapsed ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right';
  }
}
window.toggleNajimeTutorCollapse = toggleNajimeTutorCollapse;

// Làm mới lịch sử trò chuyện
function resetNajimeTutorChat() {
  tutorChatHistory = [];
  addNajimeWelcomeMessage();
}
window.resetNajimeTutorChat = resetNajimeTutorChat;

// Tính khoảng cách Levenshtein để phát hiện lỗi chính tả (typo)
function calculateLevenshtein(a, b) {
  if (!a || !b) return (a || b).length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // thay thế
          matrix[i][j - 1] + 1,     // chèn
          matrix[i - 1][j] + 1      // xóa
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Phân tích chi tiết lỗi sai giữa câu trả lời người dùng và đáp án
function analyzeAnswerMistake(rawInput, target, direction) {
  const userNorm = (rawInput || '').toLowerCase().trim();
  const targetWordNorm = (target.word || '').toLowerCase().trim();
  const targetMeaningNorm = (target.meaning || '').toLowerCase().trim();
  const targetNorm = direction === 'vi_en' ? targetWordNorm : targetMeaningNorm;

  // 1. Kiểm tra lỗi chính tả (Typo)
  const dist = calculateLevenshtein(userNorm, targetNorm);
  const maxLen = Math.max(userNorm.length, targetNorm.length);
  if (dist > 0 && dist <= 2 && maxLen >= 4) {
    return {
      type: 'typo',
      desc: `Bạn bị sai chính tả một chút xíu (khác biệt ${dist} ký tự). Hãy chú ý kỹ từng mặt chữ nhé!`
    };
  }

  // 2. Kiểm tra nhầm dạng từ (word forms: -ed, -s, -ing, -ly, be + V-ed)
  if (direction === 'vi_en') {
    if (userNorm + 's' === targetNorm || userNorm === targetNorm + 's' || userNorm + 'es' === targetNorm) {
      return { type: 'form', desc: `Chú ý dạng số ít / số nhiều của từ nhé!` };
    }
    if (userNorm + 'ed' === targetNorm || userNorm + 'd' === targetNorm) {
      return { type: 'tense', desc: `Từ này ở dạng quá khứ hoặc phân từ (-ed) nhé!` };
    }
    if (userNorm.startsWith('be ') && !targetNorm.startsWith('be ')) {
      return { type: 'form', desc: `Từ này là động từ chủ động, không cần thêm tiền tố "be" nhé!` };
    }
    if (!userNorm.startsWith('be ') && targetNorm.startsWith('be ')) {
      return { type: 'form', desc: `Từ này thường đi với dạng bị động hoặc trạng thái: bắt đầu bằng "be ..." nhé!` };
    }
  }

  return { type: 'general', desc: `Hãy quan sát kỹ nghĩa chuẩn và ví dụ mẫu bên dưới để ghi nhớ sâu sắc hơn nhé!` };
}

// Xử lý khi người dùng nộp đáp án ở ô bài tập bên trái (Hook gọi từ language-learning.js)
function handleQuizAnswerForNajimeTutor(payload) {
  const { rawInput, target, isCorrect, direction, streak } = payload;
  if (!target) return;

  const chatBody = document.getElementById('najimeTutorBody');
  if (!chatBody) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 1. Thêm bong bóng câu trả lời của người dùng vào khung chat
  const questionLabel = direction === 'vi_en' ? target.meaning : target.word;
  const userMsgHtml = `
    <div class="tutor-msg tutor-msg-user">
      <div class="tutor-msg-bubble">
        <div class="tutor-msg-author">
          <span>Bạn</span>
          <span class="tutor-msg-time">${timeStr}</span>
        </div>
        <div class="tutor-msg-content">
          <div>🎯 <em>Câu hỏi:</em> <strong>${escapeTutorHtml(questionLabel)}</strong></div>
          <div style="margin-top: 3px;">✍️ <em>Tôi đã trả lời:</em> <strong>"${escapeTutorHtml(rawInput)}"</strong></div>
        </div>
      </div>
    </div>
  `;
  chatBody.insertAdjacentHTML('beforeend', userMsgHtml);

  // 2. Hiển thị trạng thái Najime đang phản hồi
  const typingId = `tutorTyping_${Date.now()}`;
  const typingHtml = `
    <div class="tutor-msg tutor-msg-najime" id="${typingId}">
      <div class="tutor-msg-avatar">
        <img src="assets/najimez.jpg" alt="Najime Tutor" />
      </div>
      <div class="tutor-typing-indicator">
        <span class="tutor-typing-dot"></span>
        <span class="tutor-typing-dot"></span>
        <span class="tutor-typing-dot"></span>
      </div>
    </div>
  `;
  chatBody.insertAdjacentHTML('beforeend', typingHtml);
  scrollTutorChatToBottom();

  // 3. Phản hồi tự động với trí tuệ gia sư
  setTimeout(() => {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    let feedbackBubbleHtml = '';
    if (isCorrect) {
      // === KHI TRẢ LỜI ĐÚNG ===
      const praiseOptions = [
        'Tuyệt vời lắm bạn ơi! Phản xạ cực kỳ chuẩn xác 🎉',
        'Chính xác 100%! Trí nhớ của bạn rất tuyệt vời 👏',
        'Quá xuất sắc! Không sai một ly nào luôn ✨',
        'Chuẩn không cần chỉnh! Thêm một từ vựng đã được khắc sâu 🚀'
      ];
      const praise = praiseOptions[Math.floor(Math.random() * praiseOptions.length)];
      const streakBonus = streak >= 3 ? `<div style="margin-top: 4px; color: #fbbf24; font-size: 0.78rem;">🔥 <strong>Chuỗi đúng ${streak} từ liên tiếp!</strong> Giữ vững phong độ này nhé!</div>` : '';

      feedbackBubbleHtml = `
        <div class="tutor-msg tutor-msg-najime msg-correct">
          <div class="tutor-msg-avatar">
            <img src="assets/najimez.jpg" alt="Najime Tutor" />
          </div>
          <div class="tutor-msg-bubble">
            <div class="tutor-msg-author">
              <span>Najime</span>
              <span class="tutor-msg-time">${timeStr}</span>
            </div>
            <div class="tutor-feedback-banner correct">
              <i class="fa-solid fa-circle-check"></i>
              <span>${praise}</span>
            </div>
            <div class="tutor-msg-content">
              <div>Từ vựng chuẩn: <strong style="color: #38bdf8;">${escapeTutorHtml(target.word)}</strong> ${target.phonetic ? `<span style="font-family: monospace; color: #94a3b8;">/${escapeTutorHtml(target.phonetic)}/</span>` : ''}</div>
              <div style="margin-top: 2px;">Nghĩa: <em>${escapeTutorHtml(target.meaning)}</em></div>
              ${streakBonus}
              ${target.example ? `
                <div class="tutor-collocation-note">
                  <strong>💡 Ngữ cảnh & Ví dụ mẫu:</strong><br>
                  "${escapeTutorHtml(target.example)}"
                  ${target.exampleTrans ? `<br><span style="opacity: 0.85;">➔ ${escapeTutorHtml(target.exampleTrans)}</span>` : ''}
                </div>
              ` : ''}
            </div>
            <div class="tutor-quick-suggestions">
              <button type="button" class="tutor-chip" onclick="handleTutorChipClick('Đặt thêm một câu ví dụ khác với từ ${escapeTutorHtml(target.word)}')">💡 Đặt thêm câu ví dụ</button>
              <button type="button" class="tutor-chip" onclick="handleTutorChipClick('Từ đồng nghĩa của ${escapeTutorHtml(target.word)} là gì?')">🔄 Từ đồng nghĩa</button>
            </div>
          </div>
        </div>
      `;
    } else {
      // === KHI TRẢ LỜI SAI ===
      const encourageOptions = [
        'Đừng buồn nha, từ này có chút thử thách nè! Cùng xem lại nhé 💪',
        'Chưa chính xác rồi, nhưng không sao, sai lầm giúp ta nhớ lâu hơn! ✨',
        'Gần đúng rồi! Hãy cùng mổ xẻ để lần sau không bao giờ nhầm nữa nhé 🔍'
      ];
      const encourage = encourageOptions[Math.floor(Math.random() * encourageOptions.length)];
      const analysis = analyzeAnswerMistake(rawInput, target, direction);

      feedbackBubbleHtml = `
        <div class="tutor-msg tutor-msg-najime msg-wrong">
          <div class="tutor-msg-avatar">
            <img src="assets/najimez.jpg" alt="Najime Tutor" />
          </div>
          <div class="tutor-msg-bubble">
            <div class="tutor-msg-author">
              <span>Najime</span>
              <span class="tutor-msg-time">${timeStr}</span>
            </div>
            <div class="tutor-feedback-banner wrong">
              <i class="fa-solid fa-circle-xmark"></i>
              <span>${encourage}</span>
            </div>
            <div class="tutor-analysis-box">
              <div class="tutor-analysis-row">
                <span class="tutor-analysis-label">Bạn đã nhập:</span>
                <span class="tutor-user-val-wrong">${escapeTutorHtml(rawInput)}</span>
              </div>
              <div class="tutor-analysis-row">
                <span class="tutor-analysis-label">Đáp án đúng:</span>
                <span class="tutor-target-val-correct">
                  ${escapeTutorHtml(direction === 'vi_en' ? target.word : target.meaning)}
                  ${direction === 'vi_en' && target.phonetic ? `<span style="font-family: monospace; font-size: 0.78rem; color: #67e8f9;">/${escapeTutorHtml(target.phonetic)}/</span>` : ''}
                </span>
              </div>
            </div>
            <div class="tutor-msg-content" style="margin-top: 6px;">
              <div style="color: #fca5a5; font-size: 0.8rem;">
                <i class="fa-solid fa-triangle-exclamation" style="margin-right: 4px;"></i>
                ${analysis.desc}
              </div>
              ${target.example ? `
                <div class="tutor-collocation-note" style="border-left-color: #fb7185; background: rgba(244, 63, 94, 0.08);">
                  <strong>📖 Xem cách dùng trong câu:</strong><br>
                  "${escapeTutorHtml(target.example)}"
                  ${target.exampleTrans ? `<br><span style="opacity: 0.85;">➔ ${escapeTutorHtml(target.exampleTrans)}</span>` : ''}
                </div>
              ` : ''}
            </div>
            <div class="tutor-quick-suggestions">
              <button type="button" class="tutor-chip" onclick="handleTutorChipClick('Chỉ cho mình mẹo nhớ từ ${escapeTutorHtml(target.word)}')">🧠 Mẹo nhớ từ này</button>
              <button type="button" class="tutor-chip" onclick="handleTutorChipClick('Phân tích ngữ pháp cho từ ${escapeTutorHtml(target.word)}')">📝 Ngữ pháp liên quan</button>
            </div>
          </div>
        </div>
      `;
    }

    chatBody.insertAdjacentHTML('beforeend', feedbackBubbleHtml);
    scrollTutorChatToBottom();
  }, 400);
}
window.handleQuizAnswerForNajimeTutor = handleQuizAnswerForNajimeTutor;

// Xử lý khi người dùng bấm "Chưa nhớ - Xem đáp án"
function handleQuizRevealForNajimeTutor(target, direction) {
  if (!target) return;
  const chatBody = document.getElementById('najimeTutorBody');
  if (!chatBody) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const revealHtml = `
    <div class="tutor-msg tutor-msg-najime msg-reveal">
      <div class="tutor-msg-avatar">
        <img src="assets/najimez.jpg" alt="Najime Tutor" />
      </div>
      <div class="tutor-msg-bubble">
        <div class="tutor-msg-author">
          <span>Najime</span>
          <span class="tutor-msg-time">${timeStr}</span>
        </div>
        <div class="tutor-feedback-banner reveal">
          <i class="fa-solid fa-lightbulb"></i>
          <span>Gợi ý đáp án tham khảo để bạn ghi nhớ:</span>
        </div>
        <div class="tutor-msg-content">
          <div>Từ vựng: <strong style="color: #38bdf8;">${escapeTutorHtml(target.word)}</strong> ${target.phonetic ? `<span style="font-family: monospace; color: #94a3b8;">/${escapeTutorHtml(target.phonetic)}/</span>` : ''}</div>
          <div style="margin-top: 2px;">Nghĩa: <em>${escapeTutorHtml(target.meaning)}</em></div>
          ${target.example ? `
            <div class="tutor-collocation-note">
              <strong>📖 Đọc to câu ví dụ 2 lần nhé:</strong><br>
              "${escapeTutorHtml(target.example)}"
              ${target.exampleTrans ? `<br><span style="opacity: 0.85;">➔ ${escapeTutorHtml(target.exampleTrans)}</span>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
  chatBody.insertAdjacentHTML('beforeend', revealHtml);
  scrollTutorChatToBottom();
}
window.handleQuizRevealForNajimeTutor = handleQuizRevealForNajimeTutor;

// Xử lý khi người dùng nhắn tin trực tiếp trong ô Footer của Najime
async function handleTutorDirectSubmit(e) {
  if (e) e.preventDefault();
  const inputEl = document.getElementById('tutorDirectInput');
  const chatBody = document.getElementById('najimeTutorBody');
  if (!inputEl || !chatBody) return;

  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 1. Render tin nhắn người dùng
  const userHtml = `
    <div class="tutor-msg tutor-msg-user">
      <div class="tutor-msg-bubble">
        <div class="tutor-msg-author">
          <span>Bạn</span>
          <span class="tutor-msg-time">${timeStr}</span>
        </div>
        <div class="tutor-msg-content">${escapeTutorHtml(text)}</div>
      </div>
    </div>
  `;
  chatBody.insertAdjacentHTML('beforeend', userHtml);

  // 2. Typing indicator
  const typingId = `tutorTyping_${Date.now()}`;
  const typingHtml = `
    <div class="tutor-msg tutor-msg-najime" id="${typingId}">
      <div class="tutor-msg-avatar">
        <img src="assets/najimez.jpg" alt="Najime Tutor" />
      </div>
      <div class="tutor-typing-indicator">
        <span class="tutor-typing-dot"></span>
        <span class="tutor-typing-dot"></span>
        <span class="tutor-typing-dot"></span>
      </div>
    </div>
  `;
  chatBody.insertAdjacentHTML('beforeend', typingHtml);
  scrollTutorChatToBottom();

  // 3. Xử lý phản hồi từ Gemini API (nếu có API Key) hoặc bộ não Offline của Najime
  const currentVocab = (typeof quizState !== 'undefined' && quizState.currentVocab) ? quizState.currentVocab : null;
  const apiKey = (typeof getStoredApiKey === 'function') ? getStoredApiKey() : '';

  try {
    let reply = '';
    if (apiKey && typeof callGeminiAPIFallback === 'function') {
      const prompt = `Bạn là Najime - trợ lý gia sư từ vựng AI thông minh, ngọt ngào, gần gũi.
Người dùng đang làm bài tập kiểm tra từ vựng.
Từ vựng hiện tại đang học là:
- Từ: "${currentVocab?.word || 'Không rõ'}"
- Nghĩa: "${currentVocab?.meaning || 'Không rõ'}"
- Ví dụ: "${currentVocab?.example || 'Không rõ'}"
Người dùng vừa hỏi: "${text}"

Hãy trả lời trực tiếp câu hỏi của người dùng một cách thân thiện, súc tích, ngắn gọn (tối đa 3-4 câu), nêu bật trọng tâm, có kèm ví dụ hoặc mẹo hữu ích nếu liên quan.`;
      
      const res = await callGeminiAPIFallback(prompt);
      if (res) reply = res;
    }

    if (!reply) {
      reply = generateOfflineTutorReply(text, currentVocab);
    }

    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    const formattedReply = formatTutorMarkdown(reply);
    const replyHtml = `
      <div class="tutor-msg tutor-msg-najime">
        <div class="tutor-msg-avatar">
          <img src="assets/najimez.jpg" alt="Najime Tutor" />
        </div>
        <div class="tutor-msg-bubble">
          <div class="tutor-msg-author">
            <span>Najime</span>
            <span class="tutor-msg-time">${timeStr}</span>
          </div>
          <div class="tutor-msg-content">${formattedReply}</div>
        </div>
      </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', replyHtml);
    scrollTutorChatToBottom();
  } catch (err) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    const fallbackReply = generateOfflineTutorReply(text, currentVocab);
    const replyHtml = `
      <div class="tutor-msg tutor-msg-najime">
        <div class="tutor-msg-avatar">
          <img src="assets/najimez.jpg" alt="Najime Tutor" />
        </div>
        <div class="tutor-msg-bubble">
          <div class="tutor-msg-author">
            <span>Najime</span>
            <span class="tutor-msg-time">${timeStr}</span>
          </div>
          <div class="tutor-msg-content">${formatTutorMarkdown(fallbackReply)}</div>
        </div>
      </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', replyHtml);
    scrollTutorChatToBottom();
  }
}
window.handleTutorDirectSubmit = handleTutorDirectSubmit;

// Xử lý khi click vào các chip gợi ý nhanh
function handleTutorChipClick(queryText) {
  const inputEl = document.getElementById('tutorDirectInput');
  if (inputEl) {
    inputEl.value = queryText;
    handleTutorDirectSubmit();
  }
}
window.handleTutorChipClick = handleTutorChipClick;

// Trí tuệ gia sư offline khi không có API Key
function generateOfflineTutorReply(query, currentVocab) {
  const q = (query || '').toLowerCase();
  const word = currentVocab?.word || 'từ này';
  const meaning = currentVocab?.meaning || '';
  const example = currentVocab?.example || '';

  if (q.includes('ví dụ') || q.includes('đặt câu')) {
    if (example) {
      return `Câu ví dụ tiêu chuẩn cho **${word}**:\n\n> *"${example}"*\n\n(Nghĩa: ${currentVocab.exampleTrans || meaning}). Bạn có thể tự đặt thêm một câu với ngữ cảnh đời thường của bạn nhé!`;
    }
    return `Bạn hãy thử áp dụng **${word}** vào câu ngắn đơn giản hàng ngày, ví dụ: *"I always remember to use ${word} correctly."*`;
  }

  if (q.includes('đồng nghĩa') || q.includes('synonym')) {
    return `Đối với từ **${word}** (${meaning}), một số từ có nét nghĩa tương đồng hay dùng là các từ đồng nghĩa trong ngữ cảnh giao tiếp. Bạn có thể mở rộng vốn từ bằng cách liên kết chúng vào một chủ đề chung nhé!`;
  }

  if (q.includes('mẹo') || q.includes('nhớ')) {
    return `Mẹo nhớ nhanh từ **${word}**:\n1. Tưởng tượng hình ảnh cụ thể gắn liền với nghĩa "${meaning}".\n2. Đọc to từ đó 3 lần kết hợp phiên âm chuẩn.\n3. Đặt câu ngắn với cảm xúc thật của bạn!`;
  }

  if (q.includes('collocation') || q.includes('giới từ') || q.includes('đi với')) {
    return `Từ **${word}** thường kết hợp với các động từ và giới từ chỉ hành động cụ thể trong văn phong thực tế. Bạn hãy chú ý quan sát câu ví dụ mẫu để nắm vững vị trí đứng của từ nhé!`;
  }

  return `Najime luôn ở đây để giúp bạn! Với từ **${word}** (${meaning}), nếu bạn muốn tìm hiểu sâu hơn, bạn có thể bấm vào các nút gợi ý nhanh bên dưới hoặc kết nối Gemini API để mình giải đáp siêu chi tiết nhé! ✨`;
}

// Chuyển markdown cơ bản sang HTML an toàn
function formatTutorMarkdown(text) {
  if (!text) return '';
  let str = escapeTutorHtml(text);
  str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  str = str.replace(/\*(.*?)\*/g, '<em>$1</em>');
  str = str.replace(/`([^`]+)`/g, '<code style="background: rgba(6,182,212,0.15); color: #38bdf8; padding: 1px 4px; border-radius: 4px; font-family: monospace;">$1</code>');
  str = str.replace(/^> (.*$)/gim, '<blockquote style="border-left: 2px solid #38bdf8; padding-left: 8px; margin: 4px 0; color: #94a3b8; font-style: italic;">$1</blockquote>');
  str = str.replace(/\n/g, '<br>');
  return str;
}

// Thoát HTML chống XSS
function escapeTutorHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initNajimeTutor();
});

