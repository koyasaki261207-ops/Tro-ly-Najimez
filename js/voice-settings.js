/**
 * js/voice-settings.js - Quản lý Cài Đặt Giọng Đọc & Hiệu Ứng Âm Thanh Cho Trợ Lý Najimez
 * Hỗ trợ 2 Động Cơ Giọng Đọc AI Đỉnh Cao:
 * 1. ElevenLabs AI (Giọng Người Thật 100% Siêu Cảm Xúc - khi người dùng có Key)
 * 2. Microsoft Edge Neural TTS (Hoài My / Nam Minh - 100% Miễn phí không cần API Key, tự động cất tiếng mượt mà)
 * Tuyệt đối LOẠI BỎ hoàn toàn SAPI/Web Speech API cũ của Windows.
 */

const NAJIMEZ_VOICE_STORAGE_KEY = 'najimez_voice_settings';

const DEFAULT_VOICE_SETTINGS = {
  engine: 'elevenlabs',                   // 'elevenlabs' | 'edge'
  elevenApiKey: '',                      // API Key từ elevenlabs.io
  elevenModelId: 'eleven_flash_v2_5',    // Mô hình siêu tốc Flash v2.5 (~75ms, giảm 95% độ trễ)
  elevenVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (Nữ dịu dàng, tự nhiên)
  elevenCustomVoiceId: '',               // Voice ID tùy chọn
  voiceURI: 'edge:vi-VN-HoaiMyNeural',   // Mặc định cho Edge TTS: Nữ Hoài My
  rate: 1.0,                             // Tốc độ 1.0x tự nhiên
  volume: 0.90,                          // Âm lượng 90%
  soundEffects: true,                    // Bật hiệu ứng âm thanh tương tác UI
  soundTheme: 'chime',                   // chime | water | bubble | bell
  soundVolume: 0.5,                      // Âm lượng hiệu ứng 50%
  autoRead: false                        // Tự động đọc câu trả lời của AI
};

let currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
let voiceAudioCtx = null;
let currentAudioPlayer = null;
let currentAbortController = null;
let currentBlobUrl = null;
let isSpeechLoading = false;
let isSpeechPlaying = false;
let currentSpeechSessionId = 0;
const activeAudioSet = new Set();
let isUserAbortedSpeech = false;

// Tải cài đặt từ localStorage
function loadVoiceSettings() {
  try {
    const raw = localStorage.getItem(NAJIMEZ_VOICE_STORAGE_KEY);
    if (raw) {
      currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Lỗi đọc voice settings từ storage:', err);
    currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
  }
  return currentVoiceSettings;
}

// Lưu cài đặt vào localStorage
function saveVoiceSettings(newSettings) {
  currentVoiceSettings = { ...currentVoiceSettings, ...newSettings };
  try {
    localStorage.setItem(NAJIMEZ_VOICE_STORAGE_KEY, JSON.stringify(currentVoiceSettings));
  } catch (err) {
    console.warn('Lỗi lưu voice settings:', err);
  }
  return currentVoiceSettings;
}

// Khởi tạo và nạp ngay cài đặt từ localStorage khi nạp script
loadVoiceSettings();

// Lấy Web Audio Context cho hiệu ứng âm thanh UI
function getVoiceAudioContext() {
  if (!voiceAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) voiceAudioCtx = new AudioContextClass();
  }
  if (voiceAudioCtx && voiceAudioCtx.state === 'suspended') {
    voiceAudioCtx.resume().catch(() => {});
  }
  return voiceAudioCtx;
}

/**
 * Phát hiệu ứng âm thanh tương tác UI (Sound Effects)
 */
function playAssistantSound(eventType = 'reply') {
  if (!currentVoiceSettings.soundEffects) return;

  try {
    const ctx = getVoiceAudioContext();
    if (!ctx) return;

    const baseVol = Number(currentVoiceSettings.soundVolume) || 0.5;
    const theme = currentVoiceSettings.soundTheme || 'chime';
    const now = ctx.currentTime;

    if (theme === 'chime') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      const freq1 = eventType === 'send' ? 587.33 : 659.25;
      const freq2 = eventType === 'send' ? 880.00 : 987.77;

      osc1.frequency.setValueAtTime(freq1, now);
      osc2.frequency.setValueAtTime(freq2, now + 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(baseVol * 0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);

    } else if (theme === 'water') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const startFreq = eventType === 'send' ? 600 : 750;
      const endFreq = eventType === 'send' ? 1200 : 1550;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

      gain.gain.setValueAtTime(baseVol * 0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

    } else if (theme === 'bubble') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';

      osc.frequency.setValueAtTime(eventType === 'send' ? 380 : 480, now);
      osc.frequency.exponentialRampToValueAtTime(eventType === 'send' ? 700 : 920, now + 0.09);

      gain.gain.setValueAtTime(baseVol * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);

    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(baseVol * 0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (err) {
    console.debug('Lỗi phát hiệu ứng âm thanh:', err);
  }
}

/**
 * Kiểm tra trợ lý có đang phát hoặc đang nạp giọng nói hay không
 */
function isSpeakingAssistant() {
  if (isSpeechLoading || isSpeechPlaying) return true;
  if (currentAudioPlayer && !currentAudioPlayer.paused) return true;
  return false;
}

/**
 * Chuẩn hóa phiên âm cho giọng đọc (Phonetic Normalization)
 * Giữ nguyên 100% chữ viết "Najimez" trên màn hình giao diện,
 * chỉ biến đổi âm thanh đưa vào Engine để đọc chuẩn xác là "Na chi me".
 */
function normalizePhoneticsForTTS(rawText) {
  if (!rawText) return '';
  return rawText
    // Tên trợ lý ảo Najimez đọc chuẩn ngữ âm: "Na chi me"
    .replace(/\bNajimez\b/gi, 'Na chi me')
    .replace(/\bNajime\b/gi, 'Na chi me')
    // Đơn vị tiền tệ tiếng Việt
    .replace(/\bVNĐ\b/gi, 'đồng')
    .replace(/\bVND\b/gi, 'đồng');
}

/**
 * Làm sạch và chuẩn hóa văn bản trước khi đưa vào Voice Engine TTS:
 * - Loại bỏ code block (```...```) -> "Đoạn mã lập trình."
 * - Loại bỏ các thẻ HTML, markdown formatting (#, *, ~, _, >, |, links)
 * - LOẠI BỎ TOÀN BỘ ICON & EMOJI (trái tim 💕❤️, mặt cười 🥰😊, pháo hoa 🎉, ngôi sao ✨, ngón tay 👍...)
 *   để Voice Engine không bao giờ đọc tên icon thành tiếng (như "trái tim", "hai trái tim", "lấp lánh"...)
 * - Loại bỏ các ký tự biểu tượng trang trí đặc biệt (★, ✿, ♪, ♠, ...) và icon text (^^)
 * - Chuẩn hóa ngữ âm "Najimez" -> "Na chi me", "VNĐ" / "VND" -> "đồng"
 */
function cleanAssistantTextForSpeech(text) {
  if (!text) return '';

  return normalizePhoneticsForTTS(
    text
      // 1. Khối mã lập trình
      .replace(/```[\s\S]*?```/g, ' Đoạn mã lập trình. ')
      .replace(/`([^`]+)`/g, '$1')
      // 2. Thẻ HTML và HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      // 3. Markdown links [text](url) -> giữ lại text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 4. Ký tự Markdown formatting: #, *, ~, _, >, |
      .replace(/[#*~_>|]/g, ' ')
      // 5. LOẠI BỎ TOÀN BỘ EMOJI & ICONS (Unicode Extended_Pictographic, Emoticons, Symbols, Dingbats...)
      .replace(/(\p{Extended_Pictographic}|[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])[\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}\u200D]*/gu, '')
      // 6. Các ký tự biểu tượng trang trí đặc biệt (hoa, sao, nốt nhạc, chất bài...)
      .replace(/[★☆✦✧✪✫✬✭✮✯✰✿❀❁❂❃❄❅❆♪♫♬♩♠♣♥♦]/g, '')
      // 7. Icon mặt cười text (^^, ^_^...)
      .replace(/\^\^+/g, '')
      // 8. Dọn dẹp khoảng trắng dư thừa
      .replace(/\s+([.,!?;:])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Đọc văn bản với công nghệ AI thông minh:
 * 1. Nếu có ElevenLabs Key -> Đọc bằng ElevenLabs AI (Giọng Người Thật 100%)
 * 2. Nếu chưa có Key -> Tự động phát bằng Microsoft Edge Neural (Nữ Hoài My) miễn phí, ngọt ngào, không bao giờ bị câm!
 */
function speakAssistantText(text, onStart, onEnd, onError) {
  // Dừng mọi âm thanh và luồng đọc cũ trước khi bắt đầu
  stopSpeakingAssistant();
  isUserAbortedSpeech = false;

  const sessionId = ++currentSpeechSessionId;

  // Làm sạch văn bản, loại bỏ 100% icon/emoji và chuẩn hóa ngữ âm
  const cleanText = cleanAssistantTextForSpeech(text);

  if (!cleanText) {
    if (typeof onEnd === 'function') onEnd();
    return;
  }

  const volume = Number(currentVoiceSettings.volume) || 0.90;
  const apiKey = (currentVoiceSettings.elevenApiKey || '').trim();

  // ƯU TIÊN 1: Người dùng chọn ElevenLabs và có Key hợp lệ
  if (currentVoiceSettings.engine === 'elevenlabs' && apiKey && (!apiKey.startsWith('sk_') || apiKey.length >= 50)) {
    const voiceId = (currentVoiceSettings.elevenVoiceId === 'custom' && currentVoiceSettings.elevenCustomVoiceId)
      ? currentVoiceSettings.elevenCustomVoiceId.trim()
      : (currentVoiceSettings.elevenVoiceId || '21m00Tcm4TlvDq8ikWAM');

    speakWithElevenLabs(cleanText, apiKey, voiceId, volume, onStart, onEnd, onError, sessionId);
    return;
  }

  // Nếu người dùng chọn ElevenLabs nhưng chưa nhập key hoặc key bị thiếu ký tự
  if (currentVoiceSettings.engine === 'elevenlabs' && !apiKey) {
    if (typeof showAppToast === 'function') {
      showAppToast('Chưa nhập ElevenLabs Key, Najimez tạm phát giọng Hoài My ngọt ngào nhé! (Vào cài đặt 🎚️ để nhập Key)', 'info');
    }
  } else if (currentVoiceSettings.engine === 'elevenlabs' && apiKey.startsWith('sk_') && apiKey.length < 50) {
    if (typeof showAppToast === 'function') {
      showAppToast(`Key ElevenLabs bị thiếu (${apiKey.length}/51 ký tự). Najimez tạm phát giọng Hoài My để không bị gián đoạn nhé!`, 'warning');
    }
  }

  // ƯU TIÊN 2 (Mặc định miễn phí): Microsoft Edge Neural TTS (Nữ Hoài My)
  speakWithEdgeNeural(cleanText, volume, onStart, onEnd, onError, sessionId);
}

/**
 * Tách văn bản thành các đoạn hợp lý để đọc liền mạch, 100% không bị khựng:
 * - Đối với các câu trả lời thông thường (dưới 400 ký tự): giữ nguyên 1 đoạn hoàn chỉnh duy nhất.
 *   Giúp Najimez nói một lèo truyền cảm, mượt mà từ đầu đến cuối như người thật, không bị ngắt quãng.
 * - Đối với các câu trả lời rất dài (> 400 ký tự): chia theo đoạn văn hoặc câu tự nhiên (~350 - 450 ký tự).
 *   Mỗi đoạn đủ dài để phát trong 20-30 giây, giúp đoạn sau được nạp ngầm hoàn tất từ trước, không có khoảng lặng.
 */
function splitIntoSpeechChunks(text) {
  if (!text) return [];

  const trimmed = text.trim();
  if (trimmed.length <= 400) {
    return [trimmed];
  }

  // Tách theo dấu câu tự nhiên
  const sentences = trimmed
    .replace(/([.!?\n]+)\s+/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return [trimmed];

  const chunks = [];
  let buffer = '';

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if (buffer) {
      if (buffer.length + s.length < 350) {
        buffer += ' ' + s;
      } else {
        chunks.push(buffer);
        buffer = s;
      }
    } else {
      buffer = s;
    }
  }

  if (buffer) chunks.push(buffer);
  return chunks;
}

async function fetchSingleChunkBlob(chunkText, apiKey, voiceId, modelId, signal) {
  // 1. Thử gọi qua tts_server.py (có disk cache thông minh)
  try {
    const res = await fetch('http://127.0.0.1:5050/tts_eleven', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        text: chunkText,
        voiceId,
        modelId,
        stability: 0.5,
        similarity: 0.8
      }),
      signal
    });
    if (res.ok) return await res.blob();
  } catch (e) {
    if (e.name === 'AbortError') throw e;
  }

  // 2. Dự phòng: gọi trực tiếp ElevenLabs API
  const directRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey
    },
    body: JSON.stringify({
      text: chunkText,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        use_speaker_boost: true
      }
    }),
    signal
  });
  if (!directRes.ok) {
    const err = await directRes.json().catch(() => ({}));
    throw new Error(err.detail?.message || `ElevenLabs HTTP ${directRes.status}`);
  }
  return await directRes.blob();
}

async function fetchSingleEdgeChunkBlob(chunkText, voice, rateStr, signal) {
  const ttsUrl = `http://127.0.0.1:5050/tts?text=${encodeURIComponent(chunkText)}&voice=${encodeURIComponent(voice)}&rate=${encodeURIComponent(rateStr)}`;
  const res = await fetch(ttsUrl, { signal });
  if (!res.ok) throw new Error(`Edge TTS HTTP ${res.status}`);
  return await res.blob();
}

/**
 * Tổng hợp giọng đọc bằng ElevenLabs
 */
function speakWithElevenLabs(cleanText, apiKey, voiceId, volume, onStart, onEnd, onError, sessionId) {
  const modelId = currentVoiceSettings.elevenModelId || 'eleven_flash_v2_5';
  const chunks = splitIntoSpeechChunks(cleanText);

  if (chunks.length === 0) {
    if (typeof onEnd === 'function') onEnd();
    return;
  }

  const controller = new AbortController();
  currentAbortController = controller;
  isSpeechLoading = true;

  let currentChunkIndex = 0;
  let isStarted = false;
  const prefetchMap = new Map();

  function prefetchChunk(idx) {
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || idx >= chunks.length || prefetchMap.has(idx) || controller.signal.aborted) return;
    const p = fetchSingleChunkBlob(chunks[idx], apiKey, voiceId, modelId, controller.signal)
      .catch(err => {
        if (err.name === 'AbortError' || controller.signal.aborted) return null;
        console.warn(`Lỗi prefetch chunk ${idx}:`, err);
        return null;
      });
    prefetchMap.set(idx, p);
  }

  async function playNextChunk() {
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted || currentChunkIndex >= chunks.length) {
      isSpeechLoading = false;
      isSpeechPlaying = false;
      if (typeof onEnd === 'function') onEnd();
      return;
    }

    const idx = currentChunkIndex;
    currentChunkIndex++;

    prefetchChunk(currentChunkIndex);

    try {
      let blobPromise = prefetchMap.get(idx);
      if (!blobPromise) {
        blobPromise = fetchSingleChunkBlob(chunks[idx], apiKey, voiceId, modelId, controller.signal);
      }
      const blob = await blobPromise;
      if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted || !blob) {
        isSpeechLoading = false;
        isSpeechPlaying = false;
        if (typeof onEnd === 'function') onEnd();
        return;
      }

      playAudioBlob(
        blob,
        volume,
        controller,
        () => {
          if (!isStarted) {
            isStarted = true;
            if (typeof onStart === 'function') onStart();
          }
        },
        () => {
          if (!isUserAbortedSpeech && sessionId === currentSpeechSessionId && !controller.signal.aborted) {
            playNextChunk();
          } else {
            isSpeechLoading = false;
            isSpeechPlaying = false;
            if (typeof onEnd === 'function') onEnd();
          }
        },
        (err) => {
          if (!isUserAbortedSpeech && sessionId === currentSpeechSessionId && !controller.signal.aborted) {
            console.error(`Lỗi phát audio chunk ${idx}:`, err);
            playNextChunk();
          } else {
            isSpeechLoading = false;
            isSpeechPlaying = false;
            if (typeof onEnd === 'function') onEnd();
          }
        },
        sessionId
      );
    } catch (err) {
      isSpeechLoading = false;
      isSpeechPlaying = false;
      if (!isStarted && !isUserAbortedSpeech && sessionId === currentSpeechSessionId && !controller.signal.aborted) {
        console.warn('ElevenLabs lỗi, tự động chuyển sang giọng Hoài My:', err);
        speakWithEdgeNeural(cleanText, volume, onStart, onEnd, onError, sessionId);
      } else {
        if (typeof onEnd === 'function') onEnd();
      }
    }
  }

  playNextChunk();
}

/**
 * Tổng hợp giọng đọc bằng Microsoft Edge Neural TTS với kiến trúc nối tiếp siêu tốc (Zero Latency Streaming)
 * Câu đầu tiên cất giọng ngay qua HTTP Streaming chỉ sau ~0.2s - 0.4s, các câu tiếp theo được nạp ngầm vào cache.
 */
function speakWithEdgeNeural(cleanText, volume, onStart, onEnd, onError, sessionId) {
  if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId) return;

  const neuralVoiceName = (currentVoiceSettings.voiceURI || '').replace(/^edge:/, '') || 'vi-VN-HoaiMyNeural';
  const rateVal = Number(currentVoiceSettings.rate) || 1.0;
  const ratePercent = Math.round((rateVal - 1.0) * 100);
  const rateStr = (ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`);

  const chunks = splitIntoSpeechChunks(cleanText);
  if (chunks.length === 0) {
    if (typeof onEnd === 'function') onEnd();
    return;
  }

  const controller = new AbortController();
  currentAbortController = controller;
  isSpeechLoading = true;

  let currentChunkIndex = 0;
  let isStarted = false;

  function getChunkUrl(idx) {
    return `http://127.0.0.1:5050/tts?text=${encodeURIComponent(chunks[idx])}&voice=${encodeURIComponent(neuralVoiceName)}&rate=${encodeURIComponent(rateStr)}`;
  }

  // Nạp trước câu tiếp theo vào cache máy chủ trong lúc câu trước đang phát
  function prefetchChunk(idx) {
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || idx >= chunks.length || controller.signal.aborted) return;
    const url = getChunkUrl(idx);
    fetch(url, { signal: controller.signal })
      .then(res => res.blob())
      .catch(err => {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        console.warn(`Lỗi prefetch Edge chunk ${idx}:`, err);
      });
  }

  function playNextChunk() {
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted || currentChunkIndex >= chunks.length) {
      isSpeechLoading = false;
      isSpeechPlaying = false;
      if (typeof onEnd === 'function') onEnd();
      return;
    }

    const idx = currentChunkIndex;
    currentChunkIndex++;

    // Tải trước câu tiếp theo ngay lập tức
    prefetchChunk(currentChunkIndex);

    const chunkUrl = getChunkUrl(idx);

    playAudioDirect(
      chunkUrl,
      volume,
      controller,
      () => {
        if (!isStarted) {
          isStarted = true;
          if (typeof onStart === 'function') onStart();
        }
      },
      () => {
        if (!isUserAbortedSpeech && sessionId === currentSpeechSessionId && !controller.signal.aborted) {
          playNextChunk();
        } else {
          isSpeechLoading = false;
          isSpeechPlaying = false;
          if (typeof onEnd === 'function') onEnd();
        }
      },
      (err) => {
        if (!isUserAbortedSpeech && sessionId === currentSpeechSessionId && !controller.signal.aborted) {
          console.error(`Lỗi phát Edge audio chunk ${idx}:`, err);
          playNextChunk();
        } else {
          isSpeechLoading = false;
          isSpeechPlaying = false;
          if (typeof onEnd === 'function') onEnd();
        }
      },
      sessionId
    );
  }

  // Bắt đầu cất tiếng ngay từ câu đầu tiên!
  playNextChunk();
}

/**
 * Phát âm thanh trực tiếp từ URL máy chủ TTS qua HTTP/1.1 Streaming
 * Trình duyệt cất giọng ngay từ những byte âm thanh đầu tiên (~0.2s - 0.4s)
 */
function playAudioDirect(url, volume, controller, onStart, onEnd, onError, sessionId) {
  if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) return;

  const audio = new Audio();
  activeAudioSet.add(audio);
  audio.volume = Math.max(0, Math.min(1, volume));
  currentAudioPlayer = audio;

  const cleanupAudio = () => {
    activeAudioSet.delete(audio);
    if (currentAudioPlayer === audio) {
      currentAudioPlayer = null;
    }
  };

  audio.onplay = () => {
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) {
      audio.pause();
      audio.src = '';
      cleanupAudio();
      return;
    }
    isSpeechLoading = false;
    isSpeechPlaying = true;
    if (typeof onStart === 'function') onStart();
  };

  audio.onended = () => {
    cleanupAudio();
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) return;
    isSpeechLoading = false;
    isSpeechPlaying = false;
    if (typeof onEnd === 'function') onEnd();
  };

  audio.onerror = (e) => {
    cleanupAudio();
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) return;
    isSpeechLoading = false;
    isSpeechPlaying = false;
    if (typeof onError === 'function') onError(e);
  };

  if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) {
    cleanupAudio();
    return;
  }

  audio.src = url;
  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch((err) => {
      if (err.name !== 'AbortError' && !isUserAbortedSpeech && sessionId === currentSpeechSessionId) {
        console.warn('Lỗi audio.play():', err);
        cleanupAudio();
        if (typeof onError === 'function') onError(err);
      }
    });
  }
}

/**
 * Phát âm thanh từ Blob một cách an toàn, ngắt tức thì không độ trễ
 */
function playAudioBlob(blob, volume, controller, onStart, onEnd, onError, sessionId) {
  if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) return;

  const blobUrl = URL.createObjectURL(blob);
  currentBlobUrl = blobUrl;

  const audio = new Audio();
  activeAudioSet.add(audio);
  audio.volume = Math.max(0, Math.min(1, volume));
  currentAudioPlayer = audio;

  const cleanupAudio = () => {
    activeAudioSet.delete(audio);
    if (currentAudioPlayer === audio) {
      currentAudioPlayer = null;
    }
    if (blobUrl) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (e) {}
    }
  };

  audio.onplay = () => {
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) {
      audio.pause();
      audio.src = '';
      cleanupAudio();
      return;
    }
    isSpeechLoading = false;
    isSpeechPlaying = true;
    if (typeof onStart === 'function') onStart();
  };

  audio.onended = () => {
    cleanupAudio();
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) return;
    isSpeechLoading = false;
    isSpeechPlaying = false;
    if (typeof onEnd === 'function') onEnd();
  };

  audio.onerror = (e) => {
    cleanupAudio();
    if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) return;
    isSpeechLoading = false;
    isSpeechPlaying = false;
    if (typeof onError === 'function') onError(e);
  };

  if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted) {
    cleanupAudio();
    return;
  }

  audio.src = blobUrl;
  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch((err) => {
      cleanupAudio();
      if (isUserAbortedSpeech || sessionId !== currentSpeechSessionId || controller.signal.aborted || err.name === 'AbortError') return;
      console.warn('Lỗi phát âm thanh audio:', err);
      isSpeechLoading = false;
      isSpeechPlaying = false;
      if (typeof onError === 'function') onError(err);
    });
  }
}

// Dừng đọc ngay lập tức 0.0s (Zero Latency Instant Stop)
function stopSpeakingAssistant() {
  // 1. Đặt cờ người dùng chủ động dừng và tăng Session ID để vô hiệu hóa toàn bộ luồng cũ
  isUserAbortedSpeech = true;
  currentSpeechSessionId++;

  isSpeechLoading = false;
  isSpeechPlaying = false;

  // 2. Abort các fetch HTTP đang chạy ngầm
  if (currentAbortController) {
    try {
      currentAbortController.abort();
    } catch (e) {}
    currentAbortController = null;
  }

  // 3. Tắt ngúm 100% tất cả các thẻ Audio đang có trong bộ nhớ
  activeAudioSet.forEach(audio => {
    try {
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
    } catch (e) {}
  });
  activeAudioSet.clear();
  currentAudioPlayer = null;

  if (currentBlobUrl) {
    try {
      URL.revokeObjectURL(currentBlobUrl);
    } catch (e) {}
    currentBlobUrl = null;
  }

  // 4. Reset giao diện tất cả các nút đọc về trạng thái ban đầu
  document.querySelectorAll('.btn-tts').forEach(btn => {
    btn.dataset.state = 'idle';
    btn.classList.remove('speaking', 'loading');
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span>Đọc</span>';
    btn.title = 'Đọc bằng giọng nói';
  });
}

// Phím tắt toàn cục: Nhấn phím Escape (Esc) để dừng đọc ngay lập tức
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isSpeakingAssistant()) {
    stopSpeakingAssistant();
  }
});

// Khởi tạo Modal Cài Đặt Giọng Đọc
function initVoiceSettingsModal() {
  loadVoiceSettings();

  const modal = document.getElementById('voiceSettingsModal');
  const btnOpen = document.getElementById('btnOpenVoiceSettings');
  const btnClose = document.getElementById('btnCloseVoiceSettingsModal');
  const btnCancel = document.getElementById('btnCancelVoiceSettings');
  const btnSave = document.getElementById('btnSaveVoiceSettings');
  const btnReset = document.getElementById('btnResetVoiceDefault');

  // Engine Radios & Elements
  const engineRadios = document.querySelectorAll('input[name="ttsEngineType"]');
  const elevenPanel = document.getElementById('elevenSettingsPanel');
  const edgePanel = document.getElementById('edgeSettingsPanel');
  const badgeTag = document.getElementById('voiceEngineBadgeTag');

  // ElevenLabs elements
  const inputApiKey = document.getElementById('elevenApiKeyInput');
  const btnToggleKey = document.getElementById('btnToggleElevenKey');
  const btnVerifyKey = document.getElementById('btnVerifyElevenKey');
  const keyStatusMsg = document.getElementById('elevenKeyStatus');
  const selectElevenModel = document.getElementById('elevenModelSelect');
  const selectElevenVoice = document.getElementById('elevenVoiceSelect');
  const wrapCustomVoice = document.getElementById('elevenCustomVoiceWrap');
  const inputCustomVoice = document.getElementById('elevenCustomVoiceInput');

  // Edge elements
  const selectEdgeVoice = document.getElementById('edgeVoiceSelect');

  // Sliders
  const rateSlider = document.getElementById('voiceRateSlider');
  const rateVal = document.getElementById('voiceRateVal');
  const volumeSlider = document.getElementById('voiceVolumeSlider');
  const volumeVal = document.getElementById('voiceVolumeVal');

  const sfxToggle = document.getElementById('voiceSfxToggle');
  const sfxThemeSelect = document.getElementById('voiceSfxThemeSelect');
  const sfxVolumeSlider = document.getElementById('voiceSfxVolumeSlider');
  const sfxVolumeVal = document.getElementById('voiceSfxVolumeVal');
  const autoReadToggle = document.getElementById('voiceAutoReadToggle');

  // Tự động lưu và kích hoạt ngay lập tức khi người dùng bật/tắt Tự động đọc
  if (autoReadToggle) {
    autoReadToggle.addEventListener('change', () => {
      saveVoiceSettings({ autoRead: autoReadToggle.checked });
      if (typeof showAppToast === 'function') {
        showAppToast(
          autoReadToggle.checked ? '✨ Đã bật tự động đọc phản hồi khi Najimez trả lời xong!' : '🔇 Đã tắt tính năng tự động đọc phản hồi.',
          'info'
        );
      }
    });
  }

  // Tự động lưu ngay khi đổi bật/tắt hiệu ứng âm thanh
  if (sfxToggle) {
    sfxToggle.addEventListener('change', () => {
      saveVoiceSettings({ soundEffects: sfxToggle.checked });
    });
  }

  // Tự động lưu ngay khi đổi giai điệu âm thanh
  if (sfxThemeSelect) {
    sfxThemeSelect.addEventListener('change', () => {
      saveVoiceSettings({ soundTheme: sfxThemeSelect.value });
    });
  }

  // Tự động lưu ngay khi đổi giọng Edge TTS
  if (selectEdgeVoice) {
    selectEdgeVoice.addEventListener('change', () => {
      saveVoiceSettings({ voiceURI: selectEdgeVoice.value });
    });
  }

  // Tự động lưu ngay khi đổi giọng ElevenLabs
  if (selectElevenVoice) {
    selectElevenVoice.addEventListener('change', () => {
      saveVoiceSettings({ elevenVoiceId: selectElevenVoice.value });
    });
  }

  // Tự động lưu ngay khi đổi model ElevenLabs
  if (selectElevenModel) {
    selectElevenModel.addEventListener('change', () => {
      saveVoiceSettings({ elevenModelId: selectElevenModel.value });
    });
  }

  const btnTestVoice = document.getElementById('btnTestVoice');
  const btnTestSfx = document.getElementById('btnTestSfx');

  function updateEnginePanelVisibility(engine) {
    if (elevenPanel) elevenPanel.style.display = (engine === 'elevenlabs') ? 'flex' : 'none';
    if (edgePanel) edgePanel.style.display = (engine === 'edge') ? 'block' : 'none';

    if (badgeTag) {
      if (engine === 'elevenlabs') {
        badgeTag.style.background = 'rgba(245, 158, 11, 0.18)';
        badgeTag.style.color = '#fbbf24';
        badgeTag.style.borderColor = 'rgba(245, 158, 11, 0.35)';
        badgeTag.innerHTML = '<i class="fa-solid fa-crown"></i> ElevenLabs AI';
      } else {
        badgeTag.style.background = 'rgba(56, 189, 248, 0.18)';
        badgeTag.style.color = '#38bdf8';
        badgeTag.style.borderColor = 'rgba(56, 189, 248, 0.35)';
        badgeTag.innerHTML = '<i class="fa-solid fa-cloud"></i> Edge Neural (Miễn Phí)';
      }
    }
  }

  engineRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        updateEnginePanelVisibility(radio.value);
        saveVoiceSettings({ engine: radio.value });
      }
    });
  });

  // Toggle ẩn hiện mật khẩu API Key
  if (btnToggleKey && inputApiKey) {
    btnToggleKey.addEventListener('click', () => {
      const isPassword = inputApiKey.type === 'password';
      inputApiKey.type = isPassword ? 'text' : 'password';
      btnToggleKey.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
  }

  // Kiểm tra ElevenLabs API Key
  if (btnVerifyKey && inputApiKey && keyStatusMsg) {
    btnVerifyKey.addEventListener('click', async () => {
      const key = inputApiKey.value.trim();
      if (!key) {
        keyStatusMsg.style.display = 'block';
        keyStatusMsg.className = 'eleven-key-status-msg error';
        keyStatusMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Vui lòng dán ElevenLabs API Key vào trước khi kiểm tra!';
        return;
      }

      if (key.startsWith('sk_') && key.length < 50) {
        keyStatusMsg.style.display = 'block';
        keyStatusMsg.className = 'eleven-key-status-msg error';
        keyStatusMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <strong>Key bị thiếu ký tự!</strong> Key ElevenLabs mới bắt đầu bằng <code>sk_</code> phải có đủ <strong>51 ký tự</strong> (hiện tại bạn mới dán ${key.length} ký tự). Hãy vào trang ElevenLabs, bôi đen và copy lại trọn vẹn toàn bộ chuỗi key nhé!`;
        return;
      }

      btnVerifyKey.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang test...';
      keyStatusMsg.style.display = 'none';

      try {
        let info = null;
        try {
          const res = await fetch('http://127.0.0.1:5050/check_eleven', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key })
          });
          info = await res.json();
        } catch (e) {
          try {
            const directRes = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
              headers: { 'xi-api-key': key }
            });
            if (directRes.ok) {
              const data = await directRes.json();
              info = {
                valid: true,
                tier: data.tier || 'free',
                character_limit: data.character_limit || 10000,
                character_count: data.character_count || 0,
                remaining: (data.character_limit || 10000) - (data.character_count || 0)
              };
            } else {
              const errData = await directRes.json().catch(() => ({}));
              const rawMsg = errData?.detail?.message || '';
              let friendly = 'API Key không hợp lệ hoặc đã hết hạn.';
              if (rawMsg.includes('must be exactly 51 characters')) {
                friendly = `Key ElevenLabs bị thiếu ký tự! Chuẩn là 51 ký tự, bạn mới dán ${key.length} ký tự (hãy copy lại trọn vẹn).`;
              } else if (rawMsg) {
                friendly = rawMsg;
              }
              info = { valid: false, message: friendly };
            }
          } catch (netErr) {
            info = { valid: false, message: 'Không thể kết nối đến ElevenLabs: ' + netErr.message };
          }
        }

        if (info && info.valid) {
          keyStatusMsg.style.display = 'block';
          keyStatusMsg.className = 'eleven-key-status-msg success';
          const rem = (info.remaining || 0).toLocaleString('vi-VN');
          const max = (info.character_limit || 10000).toLocaleString('vi-VN');
          keyStatusMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Key hoạt động tuyệt vời!</strong> Gói: <em>${info.tier}</em> | Còn <strong>${rem}</strong> / ${max} ký tự miễn phí.`;
        } else {
          keyStatusMsg.style.display = 'block';
          keyStatusMsg.className = 'eleven-key-status-msg error';
          keyStatusMsg.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${info?.message || 'Không thể xác thực API Key. Hãy kiểm tra lại!'}`;
        }
      } catch (err) {
        keyStatusMsg.style.display = 'block';
        keyStatusMsg.className = 'eleven-key-status-msg error';
        keyStatusMsg.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Lỗi kết nối: ${err.message}`;
      } finally {
        btnVerifyKey.innerHTML = '<i class="fa-solid fa-plug-circle-check"></i> Kiểm tra Key';
      }
    });

    inputApiKey.addEventListener('input', () => {
      const val = inputApiKey.value.trim();
      if (!val) {
        keyStatusMsg.style.display = 'none';
        return;
      }
      if (val.startsWith('sk_') && val.length < 50) {
        keyStatusMsg.style.display = 'block';
        keyStatusMsg.className = 'eleven-key-status-msg error';
        keyStatusMsg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Đang có ${val.length}/51 ký tự (có vẻ bạn copy thiếu phần đuôi key). Hãy copy lại trọn vẹn nhé!`;
      } else if (val.startsWith('sk_') && val.length === 51) {
        keyStatusMsg.style.display = 'block';
        keyStatusMsg.className = 'eleven-key-status-msg success';
        keyStatusMsg.innerHTML = `<i class="fa-solid fa-check"></i> Đủ 51 ký tự! Hãy bấm nút <strong>Kiểm tra Key</strong> màu vàng để test kết nối.`;
      } else {
        keyStatusMsg.style.display = 'none';
      }
    });
  }

  // Chọn Custom Voice
  if (selectElevenVoice && wrapCustomVoice) {
    selectElevenVoice.addEventListener('change', () => {
      wrapCustomVoice.style.display = (selectElevenVoice.value === 'custom') ? 'block' : 'none';
    });
  }

  function syncUIFromSettings() {
    const engine = currentVoiceSettings.engine || 'elevenlabs';
    const activeRadio = document.querySelector(`input[name="ttsEngineType"][value="${engine}"]`);
    if (activeRadio) activeRadio.checked = true;
    updateEnginePanelVisibility(engine);

    if (inputApiKey) inputApiKey.value = currentVoiceSettings.elevenApiKey || '';
    if (selectElevenModel) selectElevenModel.value = currentVoiceSettings.elevenModelId || 'eleven_flash_v2_5';
    if (selectElevenVoice) {
      selectElevenVoice.value = currentVoiceSettings.elevenVoiceId || '21m00Tcm4TlvDq8ikWAM';
      if (wrapCustomVoice) wrapCustomVoice.style.display = (selectElevenVoice.value === 'custom') ? 'block' : 'none';
    }
    if (inputCustomVoice) inputCustomVoice.value = currentVoiceSettings.elevenCustomVoiceId || '';
    if (keyStatusMsg) keyStatusMsg.style.display = 'none';

    if (selectEdgeVoice) selectEdgeVoice.value = currentVoiceSettings.voiceURI || 'edge:vi-VN-HoaiMyNeural';

    if (rateSlider) rateSlider.value = currentVoiceSettings.rate || 1.0;
    if (rateVal) rateVal.textContent = `${Number(currentVoiceSettings.rate || 1.0).toFixed(2)}x`;
    if (volumeSlider) volumeSlider.value = Math.round((currentVoiceSettings.volume || 0.9) * 100);
    if (volumeVal) volumeVal.textContent = `${Math.round((currentVoiceSettings.volume || 0.9) * 100)}%`;

    if (sfxToggle) sfxToggle.checked = !!currentVoiceSettings.soundEffects;
    if (sfxThemeSelect) sfxThemeSelect.value = currentVoiceSettings.soundTheme || 'chime';
    if (sfxVolumeSlider) sfxVolumeSlider.value = Math.round((currentVoiceSettings.soundVolume || 0.5) * 100);
    if (sfxVolumeVal) sfxVolumeVal.textContent = `${Math.round((currentVoiceSettings.soundVolume || 0.5) * 100)}%`;
    if (autoReadToggle) autoReadToggle.checked = !!currentVoiceSettings.autoRead;
  }

  function openModal() {
    loadVoiceSettings();
    syncUIFromSettings();
    if (modal) modal.classList.add('active');
  }

  function closeModal() {
    stopSpeakingAssistant();
    if (modal) modal.classList.remove('active');
  }

  if (btnOpen) btnOpen.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Slider events
  if (rateSlider && rateVal) {
    rateSlider.addEventListener('input', () => {
      rateVal.textContent = `${Number(rateSlider.value).toFixed(2)}x`;
    });
  }
  if (volumeSlider && volumeVal) {
    volumeSlider.addEventListener('input', () => {
      volumeVal.textContent = `${volumeSlider.value}%`;
    });
  }
  if (sfxVolumeSlider && sfxVolumeVal) {
    sfxVolumeSlider.addEventListener('input', () => {
      sfxVolumeVal.textContent = `${sfxVolumeSlider.value}%`;
    });
  }

  // Nút nghe thử giọng nói
  if (btnTestVoice) {
    btnTestVoice.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="ttsEngineType"]:checked');
      const chosenEngine = selectedRadio ? selectedRadio.value : 'elevenlabs';

      const tempSettings = {
        engine: chosenEngine,
        elevenApiKey: inputApiKey ? inputApiKey.value.trim() : (currentVoiceSettings.elevenApiKey || ''),
        elevenModelId: selectElevenModel ? selectElevenModel.value : 'eleven_flash_v2_5',
        elevenVoiceId: selectElevenVoice ? selectElevenVoice.value : '21m00Tcm4TlvDq8ikWAM',
        elevenCustomVoiceId: inputCustomVoice ? inputCustomVoice.value.trim() : '',
        voiceURI: selectEdgeVoice ? selectEdgeVoice.value : 'edge:vi-VN-HoaiMyNeural',
        rate: rateSlider ? parseFloat(rateSlider.value) : 1.0,
        volume: volumeSlider ? parseInt(volumeSlider.value, 10) / 100 : 0.90
      };

      if (isSpeakingAssistant()) {
        stopSpeakingAssistant();
        btnTestVoice.innerHTML = '<i class="fa-solid fa-play"></i> Nghe thử giọng nói';
        return;
      }

      btnTestVoice.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải âm thanh...';

      let sampleText = 'Xin chào bạn! Tôi là Najimez. Bạn nghe chất giọng ElevenLabs của tôi có ấm áp, truyền cảm và giống người thật chưa ạ?';
      if (chosenEngine === 'edge') {
        sampleText = 'Xin chào bạn! Tôi là Najimez, trợ lý ảo đồng hành cùng bạn. Bạn thấy chất giọng Hoài My này đã dịu dàng và tự nhiên chưa ạ?';
      }

      const prevSettings = { ...currentVoiceSettings };
      currentVoiceSettings = { ...currentVoiceSettings, ...tempSettings };

      speakAssistantText(
        sampleText,
        () => {
          btnTestVoice.innerHTML = '<i class="fa-solid fa-stop"></i> Dừng đọc thử';
        },
        () => {
          btnTestVoice.innerHTML = '<i class="fa-solid fa-play"></i> Nghe thử giọng nói';
          loadVoiceSettings();
        },
        (err) => {
          btnTestVoice.innerHTML = '<i class="fa-solid fa-play"></i> Nghe thử giọng nói';
          loadVoiceSettings();
          if (typeof showAppToast === 'function') {
            showAppToast(err || 'Không thể tạo giọng đọc', 'error');
          }
        }
      );
    });
  }

  // Nút nghe thử hiệu ứng âm thanh UI
  if (btnTestSfx) {
    btnTestSfx.addEventListener('click', () => {
      const prevTheme = currentVoiceSettings.soundTheme;
      const prevVol = currentVoiceSettings.soundVolume;
      const prevSfx = currentVoiceSettings.soundEffects;

      currentVoiceSettings.soundEffects = true;
      currentVoiceSettings.soundTheme = sfxThemeSelect ? sfxThemeSelect.value : 'chime';
      currentVoiceSettings.soundVolume = sfxVolumeSlider ? parseInt(sfxVolumeSlider.value, 10) / 100 : 0.5;

      playAssistantSound('reply');

      currentVoiceSettings.soundTheme = prevTheme;
      currentVoiceSettings.soundVolume = prevVol;
      currentVoiceSettings.soundEffects = prevSfx;
    });
  }

  // Nút Đặt lại chuẩn (Default)
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      const savedKey = currentVoiceSettings.elevenApiKey;
      currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS, elevenApiKey: savedKey };
      syncUIFromSettings();
      playAssistantSound('reply');
    });
  }

  // Nút Lưu cài đặt
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="ttsEngineType"]:checked');
      const chosenEngine = selectedRadio ? selectedRadio.value : 'elevenlabs';

      const updated = {
        engine: chosenEngine,
        elevenApiKey: inputApiKey ? inputApiKey.value.trim() : '',
        elevenModelId: selectElevenModel ? selectElevenModel.value : 'eleven_flash_v2_5',
        elevenVoiceId: selectElevenVoice ? selectElevenVoice.value : '21m00Tcm4TlvDq8ikWAM',
        elevenCustomVoiceId: inputCustomVoice ? inputCustomVoice.value.trim() : '',
        voiceURI: selectEdgeVoice ? selectEdgeVoice.value : 'edge:vi-VN-HoaiMyNeural',
        rate: rateSlider ? parseFloat(rateSlider.value) : 1.0,
        volume: volumeSlider ? parseInt(volumeSlider.value, 10) / 100 : 0.90,
        soundEffects: sfxToggle ? sfxToggle.checked : true,
        soundTheme: sfxThemeSelect ? sfxThemeSelect.value : 'chime',
        soundVolume: sfxVolumeSlider ? parseInt(sfxVolumeSlider.value, 10) / 100 : 0.5,
        autoRead: autoReadToggle ? autoReadToggle.checked : false
      };

      saveVoiceSettings(updated);
      playAssistantSound('send');
      closeModal();

      if (typeof appendChatAssistantMessage === 'function') {
        const engineLabel = chosenEngine === 'elevenlabs' ? 'ElevenLabs AI (Người Thật 100%)' : 'Microsoft Edge Neural (Hoài My)';
        appendChatAssistantMessage(`✨ **Đã kích hoạt giọng đọc:** Najimez đang sử dụng **${engineLabel}**.`);
      }
    });
  }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initVoiceSettingsModal();
});
