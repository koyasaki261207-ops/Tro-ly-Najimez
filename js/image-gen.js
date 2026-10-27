/**
 * js/image-gen.js - Phân hệ Sáng Tạo Hình Ảnh AI (AI Image Generation Engine) cho Trợ Lý Najimez
 * 
 * Kiến trúc & Tính năng:
 * 1. Đa động cơ (Multi-Engine):
 *    - Pollinations Flux: Miễn phí 100%, siêu tốc (2-4s), chất lượng ảnh đỉnh cao Flux.1 không cần API key.
 *    - Google Imagen 3 (imagen-3.0-generate-002): Tích hợp trực tiếp qua Gemini API Key của người dùng (tự động fallback sang Flux nếu lỗi hạn mức).
 * 2. Kho phong cách nghệ thuật đa dạng (Anime Najimez, Siêu thực 8K, Cyberpunk Neon, Epic Fantasy, Sơn dầu, 3D Pixar, Màu nước...).
 * 3. Bộ tối ưu hóa Prompt AI (Prompt Enhancer): Tự động dịch và làm giàu từ khóa nghệ thuật để ảnh sinh ra đẹp nhất.
 * 4. Tương tác 2 chiều:
 *    - Trực tiếp qua Chat với Najimez (Action Protocol <!--NAJIMEZ_ACTION:{"type":"generate_image",...}-->).
 *    - Studio Sáng Tạo Ảnh chuyên nghiệp với giao diện Cyber Luxury Glassmorphism.
 * 5. Lưu trữ lịch sử ảnh đã tạo vào LocalStorage (Recent Gallery) kèm nút xem phóng to, tải ảnh HD và vẽ lại.
 */

// Key lưu trữ lịch sử ảnh trong localStorage
const NAJIMEZ_IMAGE_HISTORY_KEY = 'najimez_generated_images_v1';

// Cấu hình các phong cách nghệ thuật (Artistic Styles)
const NAJIMEZ_IMAGE_STYLES = {
  anime: {
    id: 'anime',
    name: 'Anime Masterpiece',
    icon: 'fa-wand-magic-sparkles',
    desc: 'Phong cách anime Nhật Bản lung linh, màu sắc rực rỡ',
    suffix: 'masterpiece anime artwork, makoto shinkai aesthetic, vibrant colors, expressive eyes, delicate lineart, trending on pixiv, 8k resolution'
  },
  najimez: {
    id: 'najimez',
    name: 'Najimez Nữ Thần',
    icon: 'fa-heart',
    desc: 'Najimez anime nữ tóc tím cài hoa dịu dàng, lộng lẫy',
    suffix: 'cute anime girl with long purple hair decorated with a delicate flower hairpin, sparkling violet eyes, gentle sweet smile, elegant anime aesthetic, makoto shinkai and kyoto animation style, masterpiece, cinematic lighting, 8k'
  },
  photorealistic: {
    id: 'photorealistic',
    name: 'Ảnh Chụp 8K',
    icon: 'fa-camera',
    desc: 'Siêu thực, ánh sáng studio nghệ thuật sắc nét từng chi tiết',
    suffix: 'photorealistic, hyperrealistic 8k uhd, professional dslr photograph, natural volumetric lighting, depth of field, sharp focus, award-winning shot'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    icon: 'fa-city',
    desc: 'Thành phố tương lai, đèn neon huyền ảo phản chiếu mưa đêm',
    suffix: 'cyberpunk style, futuristic cityscape at night, glowing neon cyan and magenta lights, rain-slicked asphalt reflections, dark synthwave vibe, volumetric mist, octane render, 8k'
  },
  fantasy: {
    id: 'fantasy',
    name: 'Epic Fantasy',
    icon: 'fa-dragon',
    desc: 'Thế giới huyền ảo, ma thuật phát sáng và sinh vật thần thoại',
    suffix: 'epic fantasy digital art, ethereal mystical glow, magical particles, majestic atmosphere, high fantasy concept art, trending on artstation, masterpiece'
  },
  oil_painting: {
    id: 'oil_painting',
    name: 'Sơn Dầu Cổ Điển',
    icon: 'fa-palette',
    desc: 'Vết cọ sơn dầu nổi khối, nghệ thuật ấn tượng châu Âu',
    suffix: 'classic oil painting on textured canvas, visible rich impasto brushstrokes, dramatic chiaroscuro lighting, warm museum lighting, timeless masterpiece'
  },
  '3d_render': {
    id: '3d_render',
    name: '3D Pixar / Cute',
    icon: 'fa-cube',
    desc: 'Nhân vật 3D hoạt hình Pixar đáng yêu, chất liệu mềm mại',
    suffix: 'cute 3d character render, disney pixar animation style, smooth clay subsurface scattering, warm studio lighting, highly detailed, vibrant colors, 4k'
  },
  watercolor: {
    id: 'watercolor',
    name: 'Màu Nước Nghệ Thuật',
    icon: 'fa-paintbrush',
    desc: 'Vệt loang màu nước mềm mại, lãng mạn và thanh thoát',
    suffix: 'dreamy watercolor painting, delicate water splashes and pigment bleeding, soft pastel palette, graceful ink outlines, textured cold-press paper'
  },
  general: {
    id: 'general',
    name: 'Tự Nhiên / Mặc Định',
    icon: 'fa-sparkles',
    desc: 'Giữ nguyên phong cách nguyên bản của mô tả',
    suffix: 'masterpiece, highest quality, highly detailed, beautiful lighting, 8k'
  }
};

// Cấu hình tỷ lệ khung hình
const NAJIMEZ_IMAGE_RATIOS = {
  '1:1': { width: 1024, height: 1024, label: '1:1 (Vuông)', icon: 'fa-square' },
  '16:9': { width: 1280, height: 720, label: '16:9 (Ngang)', icon: 'fa-tv' },
  '9:16': { width: 720, height: 1280, label: '9:16 (Dọc)', icon: 'fa-mobile-screen' },
  '4:3': { width: 1024, height: 768, label: '4:3 (Cổ Điển)', icon: 'fa-window-maximize' },
  '3:4': { width: 768, height: 1024, label: '3:4 (Chân Dung)', icon: 'fa-file-image' }
};

// Từ điển dịch & gợi ý từ khóa tiếng Việt sang tiếng Anh
const VIETNAMESE_PROMPT_DICTIONARY = [
  { vi: /najimez/i, en: 'cute anime girl with long purple hair decorated with a flower hairpin, violet eyes' },
  { vi: /mèo\s+(?:con|cute|dễ\s+thương)?/i, en: 'an adorable fluffy kitten with sparkling eyes' },
  { vi: /chó\s+(?:con|corgi|shiba|husky)?/i, en: 'a playful cute puppy' },
  { vi: /cô\s+gái(?:\s+anime)?/i, en: 'a beautiful anime girl with elegant features' },
  { vi: /chàng\s+trai(?:\s+anime)?/i, en: 'a handsome anime boy with stylish hair' },
  { vi: /hoàng\s+hôn/i, en: 'breathtaking sunset with golden and purple skies' },
  { vi: /bình\s+minh/i, en: 'gentle glowing sunrise breaking over morning mist' },
  { vi: /thành\s+phố/i, en: 'sprawling futuristic city' },
  { vi: /vũ\s+trụ|thiên\s+hà|ngân\s+hà/i, en: 'vast deep cosmic galaxy with glowing nebulae and stars' },
  { vi: /rừng\s+(?:hoa|tiên|thần)/i, en: 'enchanted magical forest with bioluminescent flowers' },
  { vi: /bãi\s+biển/i, en: 'pristine tropical beach with crystal clear turquoise waves' },
  { vi: /phi\s+hành\s+gia/i, en: 'astronaut floating in zero gravity' },
  { vi: /hoa\s+anh\s+đào/i, en: 'blooming pink cherry blossoms drifting in the wind' },
  { vi: /mưa/i, en: 'peaceful rain with glowing puddle reflections' },
  { vi: /quán\s+cà\s+phê|cafe/i, en: 'cozy warm aesthetic coffee shop on a rainy afternoon' }
];

// Danh sách gợi ý chủ đề ngẫu nhiên
const RANDOM_PROMPT_IDEAS = [
  { title: 'Najimez trong vườn hoa anh đào', prompt: 'Najimez cute anime girl with purple hair and flower hairpin standing under blooming cherry blossoms, gentle breeze, golden hour sunlight, masterpiece 8k', style: 'najimez', ratio: '1:1' },
  { title: 'Mèo phi hành gia ngoài không gian', prompt: 'An adorable fluffy white kitten wearing a sleek futuristic spacesuit, floating near planet earth, vibrant nebulae, cosmic starlight', style: '3d_render', ratio: '1:1' },
  { title: 'Thành phố Cyberpunk mưa đêm', prompt: 'Futuristic cyberpunk metropolis at night, dazzling neon holograms in cyan and magenta, wet pavement reflections, flying cars', style: 'cyberpunk', ratio: '16:9' },
  { title: 'Lâu đài bay giữa biển mây', prompt: 'A majestic ancient floating castle nestled in soft billowing clouds at sunset, waterfalls spilling into the sky, fantasy concept art', style: 'fantasy', ratio: '16:9' },
  { title: 'Quán cà phê ấm áp chiều mưa', prompt: 'Cozy aesthetic cafe interior with warm glowing lamps, raindrops trailing down window glass, books and steam rising from coffee mug', style: 'watercolor', ratio: '1:1' },
  { title: 'Hồ nước thần tiên phát sáng', prompt: 'Enchanted glowing crystal lake surrounded by luminous giant mushrooms and glowing willow trees, fireflies dancing in twilight', style: 'fantasy', ratio: '16:9' },
  { title: 'Chân dung cô gái ánh sáng tự nhiên', prompt: 'A stunning close-up portrait of a girl with gentle warm smile, natural cinematic morning sunlight, bokeh, hyperrealistic 8k', style: 'photorealistic', ratio: '3:4' }
];

// Trạng thái hiện tại của Studio
let studioCurrentStyle = 'anime';
let studioCurrentRatio = '1:1';
let studioCurrentEngine = 'pollinations';
let isGeneratingImage = false;

/**
 * Đọc lịch sử ảnh đã tạo từ LocalStorage
 */
function getRecentGeneratedImages() {
  try {
    const raw = localStorage.getItem(NAJIMEZ_IMAGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Lỗi đọc lịch sử ảnh:', e);
    return [];
  }
}

/**
 * Lưu một ảnh vừa tạo vào lịch sử LocalStorage
 */
function saveGeneratedImageToHistory(imgObj) {
  try {
    let list = getRecentGeneratedImages();
    // Chống trùng lặp URL
    list = list.filter(item => item.url !== imgObj.url);
    list.unshift(imgObj);
    // Giới hạn 24 ảnh gần nhất
    if (list.length > 24) list = list.slice(0, 24);
    localStorage.setItem(NAJIMEZ_IMAGE_HISTORY_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Lỗi lưu lịch sử ảnh:', e);
  }
}

/**
 * Tối ưu hóa prompt từ tiếng Việt / văn bản thô thành Prompt nghệ thuật tiếng Anh
 */
function enhancePromptLocally(rawText, styleKey = 'anime') {
  let prompt = (rawText || '').trim();
  if (!prompt) return '';

  // Chuyển đổi các từ khóa tiếng Việt phổ biến sang tiếng Anh
  VIETNAMESE_PROMPT_DICTIONARY.forEach(item => {
    if (item.vi.test(prompt)) {
      prompt = prompt.replace(item.vi, item.en);
    }
  });

  // Nối phong cách tương ứng
  const styleObj = NAJIMEZ_IMAGE_STYLES[styleKey] || NAJIMEZ_IMAGE_STYLES.general;
  if (styleObj && styleObj.suffix) {
    return `${prompt}, ${styleObj.suffix}`;
  }
  return prompt;
}

/**
 * Gọi Gemini để mở rộng và biến hóa Prompt một cách thông minh (nếu có API Key)
 */
async function expandPromptWithGemini(rawPrompt, styleKey = 'anime') {
  const apiKey = typeof getStoredApiKey === 'function' ? getStoredApiKey() : '';
  if (!apiKey) {
    // Không có API key -> dùng thuật toán tăng cường nội bộ
    return enhancePromptLocally(rawPrompt, styleKey);
  }

  try {
    const styleObj = NAJIMEZ_IMAGE_STYLES[styleKey] || NAJIMEZ_IMAGE_STYLES.anime;
    const systemInstruction = `You are an expert AI prompt engineer for image generation models (Midjourney, Flux, Stable Diffusion).
Transform the user's brief idea into a rich, evocative, highly detailed English prompt for text-to-image AI.
Target style: ${styleObj.name} (${styleObj.desc}).
Requirements:
- Keep the user's core subject intact.
- Add specific aesthetic details: lighting, atmosphere, colors, composition, textures.
- Output ONLY the final English prompt as plain text. Do not add quotes, introductory or concluding text.`;

    const activeModel = (typeof getActiveModelInfo === 'function') ? getActiveModelInfo() : null;
    const modelName = (activeModel && activeModel.modelName) ? activeModel.modelName : 'gemini-1.5-flash';
    const version = (activeModel && activeModel.version) ? activeModel.version : 'v1beta';

    const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser request: "${rawPrompt}"` }] }
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
      })
    });

    if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
    const data = await resp.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (candidate) {
      return candidate.replace(/^["']|["']$/g, '').trim();
    }
    return enhancePromptLocally(rawPrompt, styleKey);
  } catch (err) {
    console.warn('Gemini prompt expand error, falling back to local enhancer:', err);
    return enhancePromptLocally(rawPrompt, styleKey);
  }
}

/**
 * Tải trước hình ảnh để đảm bảo khi hiển thị thì ảnh đã sẵn sàng 100%
 */
function preloadImage(url, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = '';
      reject(new Error('Hết thời gian chờ tạo ảnh. Máy chủ có thể đang bận.'));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Không thể tải hình ảnh từ máy chủ.'));
    };
    img.src = url;
  });
}

/**
 * Động cơ tạo ảnh 1: Pollinations AI (với kiểm tra HTTP status thực tế, chặn banner lỗi)
 */
async function generateImageViaPollinations(prompt, width = 1024, height = 1024, seed = null, onStatus = null) {
  const useSeed = seed || Math.floor(Math.random() * 1000000);
  const cleanPrompt = encodeURIComponent(prompt.trim());

  // Danh sách model: sana là model miễn phí active chính thức của Pollinations
  const candidateModels = ['sana', 'turbo'];
  let lastError = null;

  for (let attempt = 0; attempt < candidateModels.length; attempt++) {
    const curModel = candidateModels[attempt];
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${useSeed}&model=${curModel}&nologo=true`;

    try {
      if (onStatus && attempt > 0) {
        onStatus(`Đang chuyển sang mô hình ${curModel.toUpperCase()} để hoàn tất...`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);

      const resp = await fetch(imageUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'image/*,application/json' }
      });
      clearTimeout(timeoutId);

      // Nếu gặp mã 402 Payment Required hoặc 503/429 Rate Limit (Free limit: 1 image/15s)
      if (resp.status === 402 || resp.status === 503 || resp.status === 429) {
        console.warn(`Pollinations model ${curModel} hit free rate limit (${resp.status})`);

        if (attempt === candidateModels.length - 1) {
          // Thử tự động chờ 9 giây và gửi lại vì giới hạn miễn phí đặt theo khung 15s
          if (onStatus) {
            onStatus('⏳ Máy chủ miễn phí đang tạm nghỉ 10s giữa các lượt. Najimez đang tự động xếp hàng thử lại...');
          }
          await new Promise(r => setTimeout(r, 9000));
          const retryResp = await fetch(`https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${useSeed}&model=sana&nologo=true`);
          if (retryResp.ok) {
            const blob = await retryResp.blob();
            if (!blob.type.includes('json') && blob.size > 3000) {
              const objectUrl = URL.createObjectURL(blob);
              return {
                url: objectUrl,
                seed: useSeed,
                engine: 'Pollinations AI (Sana Engine)',
                width,
                height
              };
            }
          }
        }
        continue;
      }

      if (!resp.ok) {
        throw new Error(`Máy chủ tạo ảnh phản hồi mã lỗi HTTP ${resp.status}`);
      }

      const blob = await resp.blob();
      // Chặn triệt để ảnh banner lỗi hoặc json lỗi
      if (blob.type.includes('json') || blob.size < 3000) {
        throw new Error('Dữ liệu ảnh trả về không hợp lệ.');
      }

      const objectUrl = URL.createObjectURL(blob);
      return {
        url: objectUrl,
        seed: useSeed,
        engine: `Pollinations AI (${curModel.toUpperCase()})`,
        width,
        height
      };
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') {
        console.warn(`Quá thời gian chờ với model ${curModel}`);
      }
    }
  }

  throw lastError || new Error('Máy chủ miễn phí đang quá tải (giới hạn 1 ảnh mỗi 15 giây). Bạn vui lòng đợi 10 giây rồi bấm "Thử lại ngay" nhé!');
}

/**
 * Động cơ tạo ảnh 2: Google Imagen 3 (imagen-3.0-generate-002)
 */
async function generateImageViaGoogleImagen(prompt, apiKey, aspectRatio = '1:1') {
  if (!apiKey) {
    throw new Error('Chưa kết nối Gemini API Key.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio,
        outputMimeType: 'image/jpeg'
      }
    })
  });

  if (!resp.ok) {
    const errorJson = await resp.json().catch(() => ({}));
    const errMsg = errorJson.error?.message || `HTTP ${resp.status}`;
    throw new Error(`Google Imagen 3 lỗi: ${errMsg}`);
  }

  const resData = await resp.json();
  const b64 = resData.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) {
    throw new Error('Không nhận được dữ liệu ảnh từ Google Imagen 3.');
  }

  const dataUrl = `data:image/jpeg;base64,${b64}`;
  return {
    url: dataUrl,
    seed: Math.floor(Math.random() * 1000000),
    engine: 'Google Imagen 3',
    width: 1024,
    height: 1024
  };
}

/**
 * Hàm điều phối chung: Tạo ảnh AI theo yêu cầu
 */
async function generateAIImage({
  prompt,
  title = '',
  style = 'anime',
  aspectRatio = '1:1',
  engine = 'auto',
  seed = null,
  onStatus = null
}) {
  const ratioCfg = NAJIMEZ_IMAGE_RATIOS[aspectRatio] || NAJIMEZ_IMAGE_RATIOS['1:1'];
  const fullPrompt = enhancePromptLocally(prompt, style);
  const apiKey = typeof getStoredApiKey === 'function' ? getStoredApiKey() : '';

  let result = null;

  // 1. Nếu có Gemini API Key và chọn auto hoặc imagen: Thử Google Imagen 3 trước
  if ((engine === 'imagen' || engine === 'auto') && apiKey) {
    try {
      if (onStatus) onStatus('Đang sáng tạo qua bộ não Google Imagen 3...');
      result = await generateImageViaGoogleImagen(fullPrompt, apiKey, aspectRatio);
    } catch (imagenErr) {
      console.warn('Google Imagen 3 không khả dụng trên API Key này, tự động chuyển sang Pollinations:', imagenErr);
      if (engine === 'imagen') {
        if (typeof showAppToast === 'function') {
          showAppToast('Google Imagen bận, Najimez chuyển sang máy chủ miễn phí!', 'info');
        }
      }
    }
  }

  // 2. Pollinations với cơ chế xác thực HTTP status & retry
  if (!result) {
    if (onStatus) onStatus('Đang phác thảo từng nét vẽ tinh tế...');
    result = await generateImageViaPollinations(fullPrompt, ratioCfg.width, ratioCfg.height, seed, onStatus);
  }

  const finalRecord = {
    id: 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    url: result.url,
    title: title || prompt.substring(0, 50),
    prompt: prompt,
    fullPrompt: fullPrompt,
    style: style,
    styleName: NAJIMEZ_IMAGE_STYLES[style]?.name || 'Nghệ thuật',
    aspectRatio: aspectRatio,
    engine: result.engine,
    seed: result.seed,
    timestamp: Date.now()
  };

  saveGeneratedImageToHistory(finalRecord);
  return finalRecord;
}

/**
 * Hiển thị Thẻ Tạo Ảnh (AI Image Generation Card) trực tiếp trong Bong bóng Chat của Najimez
 */
function renderImageGenCard(action) {
  const cardId = 'img-card-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const card = document.createElement('div');
  card.className = 'action-card image-gen-card';
  card.id = cardId;
  card.dataset.id = cardId;

  const rawPrompt = action.prompt || action.title || 'Bức tranh nghệ thuật';
  const displayTitle = action.title || action.originalPrompt || rawPrompt.substring(0, 40);
  const styleKey = action.style || 'anime';
  const ratioKey = action.aspectRatio || '1:1';
  const styleObj = NAJIMEZ_IMAGE_STYLES[styleKey] || NAJIMEZ_IMAGE_STYLES.anime;

  // Giao diện trạng thái đang khởi tạo & vẽ tranh
  card.innerHTML = `
    <div class="image-gen-header">
      <div class="image-gen-title-row">
        <div class="image-gen-icon pulsing">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div class="image-gen-info">
          <div class="image-gen-title">🎨 Najimez đang vẽ tranh: <strong>${escapeHTML(displayTitle)}</strong></div>
          <div class="image-gen-sub"><span class="badge-style">${escapeHTML(styleObj.name)}</span> &bull; Tỷ lệ: ${escapeHTML(ratioKey)}</div>
        </div>
      </div>
    </div>
    <div class="image-gen-viewport loading">
      <div class="image-gen-shimmer"></div>
      <div class="image-gen-loader-content">
        <div class="cyber-spinner"></div>
        <div class="loader-status-text">Đang phác thảo từng nét vẽ tinh tế...</div>
        <div class="loader-time-elapsed">Khoảng 2 - 4 giây</div>
      </div>
    </div>
  `;

  // Bắt đầu quá trình sinh ảnh trong nền
  (async () => {
    const startTime = Date.now();
    try {
      const statusEl = card.querySelector('.loader-status-text');
      const generated = await generateAIImage({
        prompt: rawPrompt,
        title: displayTitle,
        style: styleKey,
        aspectRatio: ratioKey,
        onStatus: (msg) => {
          if (statusEl) statusEl.textContent = msg;
        }
      });

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

      // Cập nhật thẻ khi hoàn thành thành công
      card.innerHTML = `
        <div class="image-gen-header">
          <div class="image-gen-title-row">
            <div class="image-gen-icon success">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <div class="image-gen-info">
              <div class="image-gen-title">Đã hoàn thành: <strong>${escapeHTML(generated.title)}</strong></div>
              <div class="image-gen-sub"><span class="badge-style">${escapeHTML(generated.styleName)}</span> &bull; Hoàn thành trong ${elapsedSec}s</div>
            </div>
          </div>
          <div class="image-gen-quick-actions">
            <button type="button" class="btn-card-icon-action btn-copy-prompt" title="Sao chép prompt">
              <i class="fa-regular fa-copy"></i>
            </button>
            <button type="button" class="btn-card-icon-action btn-regen-card" title="Vẽ lại (Biến thể mới)">
              <i class="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>
        <div class="image-gen-viewport completed">
          <img src="${escapeHTML(generated.url)}" alt="${escapeHTML(generated.title)}" class="image-gen-result-img" />
          <div class="image-gen-overlay">
            <button type="button" class="btn-overlay-action btn-zoom-lightbox" title="Xem toàn màn hình">
              <i class="fa-solid fa-magnifying-glass-plus"></i> Xem Phóng To
            </button>
            <a href="${escapeHTML(generated.url)}" download="Najimez_${generated.id}.jpg" target="_blank" class="btn-overlay-action btn-download-img" title="Tải ảnh về máy">
              <i class="fa-solid fa-download"></i> Tải Về HD
            </a>
          </div>
        </div>
        <div class="image-gen-footer">
          <button type="button" class="btn-studio-edit">
            <i class="fa-solid fa-sliders"></i> Mở trong Studio Sáng Tạo
          </button>
        </div>
      `;

      // Gắn sự kiện xem phóng to
      const btnZoom = card.querySelector('.btn-zoom-lightbox');
      if (btnZoom && typeof window.openImageViewerModal === 'function') {
        btnZoom.addEventListener('click', () => {
          window.openImageViewerModal(generated.url, generated.title);
        });
      }

      // Nhấp trực tiếp vào ảnh cũng mở phóng to
      const resultImg = card.querySelector('.image-gen-result-img');
      if (resultImg && typeof window.openImageViewerModal === 'function') {
        resultImg.addEventListener('click', () => {
          window.openImageViewerModal(generated.url, generated.title);
        });
      }

      // Sao chép Prompt
      const btnCopy = card.querySelector('.btn-copy-prompt');
      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
          navigator.clipboard.writeText(generated.prompt || generated.fullPrompt);
          if (typeof showAppToast === 'function') {
            showAppToast('Đã sao chép mô tả ảnh vào clipboard!', 'success');
          }
        });
      }

      // Nút vẽ lại
      const btnRegen = card.querySelector('.btn-regen-card');
      if (btnRegen) {
        btnRegen.addEventListener('click', () => {
          card.remove();
          const newCard = renderImageGenCard(action);
          const feed = document.getElementById('copilotFeed');
          if (feed) feed.appendChild(newCard);
        });
      }

      // Mở trong Studio
      const btnStudio = card.querySelector('.btn-studio-edit');
      if (btnStudio) {
        btnStudio.addEventListener('click', () => {
          openImageGenModal(generated.prompt, generated.style, generated.aspectRatio);
        });
      }

      // Tự động phát âm thanh thông báo dịu nhẹ
      if (typeof playAssistantSound === 'function') {
        playAssistantSound('reply');
      }
    } catch (err) {
      console.warn('Lỗi khi vẽ ảnh qua thẻ chat:', err);
      card.innerHTML = `
        <div class="image-gen-header">
          <div class="image-gen-title-row">
            <div class="image-gen-icon" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">
              <i class="fa-solid fa-hourglass-half"></i>
            </div>
            <div class="image-gen-info">
              <div class="image-gen-title" style="color: #fbbf24;">Máy chủ tạo ảnh tạm thời bận</div>
              <div class="image-gen-sub">${escapeHTML(err.message || 'Giới hạn 1 ảnh mỗi 15 giây')}</div>
            </div>
          </div>
        </div>
        <div class="image-gen-footer" style="gap: 8px;">
          <button type="button" class="btn-card-action-retry" id="btnRetryCard_${cardId}" style="background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.4); color: #fde68a;">
            <i class="fa-solid fa-rotate-right"></i> Thử lại ngay
          </button>
        </div>
      `;
      const btnRetry = card.querySelector(`#btnRetryCard_${cardId}`);
      if (btnRetry) {
        btnRetry.addEventListener('click', () => {
          card.remove();
          const newCard = renderImageGenCard(action);
          const feed = document.getElementById('copilotFeed');
          if (feed) feed.appendChild(newCard);
        });
      }
    }
  })();

  return card;
}

/**
 * Mở Hộp Thoại Studio Sáng Tạo Ảnh Najimez
 */
function openImageGenModal(initialPrompt = '', initialStyle = 'anime', initialRatio = '1:1') {
  const modal = document.getElementById('imageStudioModal');
  if (!modal) return;

  const promptInput = document.getElementById('studioPromptInput');
  if (promptInput && initialPrompt) {
    promptInput.value = initialPrompt;
  }

  if (initialStyle && NAJIMEZ_IMAGE_STYLES[initialStyle]) {
    studioCurrentStyle = initialStyle;
  }
  if (initialRatio && NAJIMEZ_IMAGE_RATIOS[initialRatio]) {
    studioCurrentRatio = initialRatio;
  }

  updateStudioStyleSelectionUI();
  updateStudioRatioSelectionUI();
  renderStudioRecentGalleryUI();

  modal.classList.add('active');
  if (promptInput) {
    promptInput.focus();
  }
}

/**
 * Đóng Hộp Thoại Studio
 */
function closeImageGenModal() {
  const modal = document.getElementById('imageStudioModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Cập nhật giao diện lựa chọn Phong cách trong Studio
 */
function updateStudioStyleSelectionUI() {
  document.querySelectorAll('.studio-style-card').forEach(card => {
    const sId = card.dataset.style;
    if (sId === studioCurrentStyle) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

/**
 * Cập nhật giao diện lựa chọn Tỷ lệ trong Studio
 */
function updateStudioRatioSelectionUI() {
  document.querySelectorAll('.studio-ratio-btn').forEach(btn => {
    const rId = btn.dataset.ratio;
    if (rId === studioCurrentRatio) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Hiển thị Bộ sưu tập các ảnh vừa tạo trong Studio
 */
function renderStudioRecentGalleryUI() {
  const container = document.getElementById('studioRecentGallery');
  if (!container) return;

  const list = getRecentGeneratedImages();
  if (list.length === 0) {
    container.innerHTML = `
      <div class="studio-gallery-empty">
        <i class="fa-regular fa-images"></i>
        <span>Chưa có tác phẩm nào. Hãy tạo bức tranh đầu tiên của bạn!</span>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="studio-gallery-item" data-url="${escapeHTML(item.url)}" data-prompt="${escapeHTML(item.prompt || '')}" data-style="${escapeHTML(item.style || 'anime')}">
      <img src="${escapeHTML(item.url)}" alt="${escapeHTML(item.title || 'Ảnh')}" loading="lazy" />
      <div class="gallery-item-badge">${escapeHTML(item.styleName || 'Ảnh')}</div>
      <div class="gallery-item-overlay">
        <button type="button" class="btn-gallery-view" title="Xem ảnh">
          <i class="fa-solid fa-eye"></i>
        </button>
        <button type="button" class="btn-gallery-reuse" title="Dùng lại mô tả này">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    </div>
  `).join('');

  // Gắn sự kiện xem phóng to và tái sử dụng prompt
  container.querySelectorAll('.studio-gallery-item').forEach(item => {
    const url = item.dataset.url;
    const prompt = item.dataset.prompt;
    const style = item.dataset.style;

    const btnView = item.querySelector('.btn-gallery-view');
    if (btnView && typeof window.openImageViewerModal === 'function') {
      btnView.addEventListener('click', (e) => {
        e.stopPropagation();
        window.openImageViewerModal(url, prompt || 'Ảnh đã tạo');
      });
    }

    const btnReuse = item.querySelector('.btn-gallery-reuse');
    if (btnReuse) {
      btnReuse.addEventListener('click', (e) => {
        e.stopPropagation();
        const input = document.getElementById('studioPromptInput');
        if (input) input.value = prompt;
        if (style) {
          studioCurrentStyle = style;
          updateStudioStyleSelectionUI();
        }
        if (typeof showAppToast === 'function') {
          showAppToast('Đã nạp lại mô tả tranh vào ô soạn thảo!', 'info');
        }
      });
    }
  });
}

/**
 * Xử lý khi người dùng nhấn nút Tạo Ảnh trong Studio
 */
async function handleStudioGenerate() {
  if (isGeneratingImage) return;

  const promptInput = document.getElementById('studioPromptInput');
  const rawPrompt = (promptInput?.value || '').trim();

  if (!rawPrompt) {
    if (typeof showAppToast === 'function') {
      showAppToast('Vui lòng nhập mô tả bức tranh bạn muốn Najimez vẽ!', 'warning');
    }
    if (promptInput) promptInput.focus();
    return;
  }

  const btnGenerate = document.getElementById('btnStudioGenerate');
  const previewArea = document.getElementById('studioPreviewArea');
  const origBtnHtml = btnGenerate ? btnGenerate.innerHTML : '';

  try {
    isGeneratingImage = true;
    if (btnGenerate) {
      btnGenerate.disabled = true;
      btnGenerate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang vẽ tranh...';
    }

    if (previewArea) {
      previewArea.className = 'studio-preview-box loading';
      previewArea.innerHTML = `
        <div class="studio-loading-state">
          <div class="cyber-spinner large"></div>
          <div class="loading-title">🎨 Najimez đang sáng tạo tác phẩm...</div>
          <div class="loading-desc">Áp dụng phong cách <strong>${escapeHTML(NAJIMEZ_IMAGE_STYLES[studioCurrentStyle]?.name || 'Nghệ thuật')}</strong></div>
          <div class="loading-bar-wrap"><div class="loading-bar-fill"></div></div>
        </div>
      `;
    }

    const result = await generateAIImage({
      prompt: rawPrompt,
      title: rawPrompt.substring(0, 50),
      style: studioCurrentStyle,
      aspectRatio: studioCurrentRatio,
      engine: studioCurrentEngine,
      onStatus: (msg) => {
        const descEl = previewArea?.querySelector('.loading-desc');
        if (descEl) descEl.textContent = msg;
      }
    });

    if (previewArea) {
      previewArea.className = 'studio-preview-box success';
      previewArea.innerHTML = `
        <div class="studio-result-wrap">
          <img src="${escapeHTML(result.url)}" alt="${escapeHTML(result.title)}" class="studio-result-img" id="studioCurrentResultImg" />
          <div class="studio-result-toolbar">
            <button type="button" class="btn-studio-tool" id="btnStudioZoom" title="Xem toàn màn hình">
              <i class="fa-solid fa-expand"></i> Phóng to
            </button>
            <a href="${escapeHTML(result.url)}" download="Najimez_${result.id}.jpg" target="_blank" class="btn-studio-tool primary" title="Tải về máy chất lượng cao">
              <i class="fa-solid fa-download"></i> Tải Về HD
            </a>
            <button type="button" class="btn-studio-tool" id="btnStudioSendChat" title="Gửi kết quả này vào khung chat để tâm sự">
              <i class="fa-regular fa-comment-dots"></i> Gửi vào Chat
            </button>
          </div>
        </div>
      `;

      // Phóng to
      const btnZoom = previewArea.querySelector('#btnStudioZoom');
      if (btnZoom && typeof window.openImageViewerModal === 'function') {
        btnZoom.addEventListener('click', () => {
          window.openImageViewerModal(result.url, result.title);
        });
      }

      // Gửi vào chat
      const btnSendChat = previewArea.querySelector('#btnStudioSendChat');
      if (btnSendChat) {
        btnSendChat.addEventListener('click', () => {
          closeImageGenModal();
          // Điều hướng về tab copilot
          const tabBtn = document.querySelector('.nav-item[data-tab="tab-copilot"]');
          if (tabBtn) tabBtn.click();
          // Gửi phản hồi vào chat
          const feed = document.getElementById('copilotFeed');
          if (feed) {
            const card = renderImageGenCard({
              prompt: result.prompt,
              title: result.title,
              style: result.style,
              aspectRatio: result.aspectRatio
            });
            feed.appendChild(card);
            feed.scrollTop = feed.scrollHeight;
          }
        });
      }
    }

    renderStudioRecentGalleryUI();

    if (typeof showAppToast === 'function') {
      showAppToast('Najimez đã vẽ xong tác phẩm nghệ thuật cho bạn! 🎉', 'success');
    }
    if (typeof playAssistantSound === 'function') {
      playAssistantSound('reply');
    }
  } catch (err) {
    console.error('Lỗi khi vẽ ảnh trong Studio:', err);
    if (previewArea) {
      previewArea.className = 'studio-preview-box error';
      previewArea.innerHTML = `
        <div class="studio-error-state">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div class="error-title">Không thể tạo ảnh lúc này</div>
          <div class="error-desc">${escapeHTML(err.message || 'Lỗi kết nối máy chủ tạo ảnh')}</div>
          <button type="button" class="btn-studio-tool primary" id="btnRetryStudio">
            <i class="fa-solid fa-rotate-right"></i> Thử lại ngay
          </button>
        </div>
      `;
      const btnRetry = previewArea.querySelector('#btnRetryStudio');
      if (btnRetry) btnRetry.addEventListener('click', handleStudioGenerate);
    }
  } finally {
    isGeneratingImage = false;
    if (btnGenerate) {
      btnGenerate.disabled = false;
      btnGenerate.innerHTML = origBtnHtml;
    }
  }
}

/**
 * Khởi tạo toàn bộ phân hệ Sáng Tạo Ảnh AI Najimez
 */
function initImageGenModule() {
  // 1. Nút mở Studio trên thanh chat
  const btnChatOpen = document.getElementById('btnOpenImageGenModal');
  if (btnChatOpen) {
    btnChatOpen.addEventListener('click', () => {
      const input = document.getElementById('copilotInput');
      const curText = input ? input.value.trim() : '';
      openImageGenModal(curText);
    });
  }

  // 2. Nút mở Studio trên Sidebar Menu
  const btnSidebarOpen = document.getElementById('btnSidebarImageGen');
  if (btnSidebarOpen) {
    btnSidebarOpen.addEventListener('click', () => {
      openImageGenModal();
    });
  }

  // 3. Nút đóng modal Studio
  const modal = document.getElementById('imageStudioModal');
  if (modal) {
    const btnClose = modal.querySelector('#btnCloseImageStudioModal');
    if (btnClose) btnClose.addEventListener('click', closeImageGenModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeImageGenModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeImageGenModal();
      }
    });
  }

  // 4. Lựa chọn Phong cách nghệ thuật
  document.querySelectorAll('.studio-style-card').forEach(card => {
    card.addEventListener('click', () => {
      const style = card.dataset.style;
      if (style && NAJIMEZ_IMAGE_STYLES[style]) {
        studioCurrentStyle = style;
        updateStudioStyleSelectionUI();
      }
    });
  });

  // 5. Lựa chọn Tỷ lệ khung hình
  document.querySelectorAll('.studio-ratio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ratio = btn.dataset.ratio;
      if (ratio && NAJIMEZ_IMAGE_RATIOS[ratio]) {
        studioCurrentRatio = ratio;
        updateStudioRatioSelectionUI();
      }
    });
  });

  // 6. Nút Gợi ý ngẫu nhiên (Surprise Me / Random Idea)
  const btnSurprise = document.getElementById('btnStudioSurprise');
  if (btnSurprise) {
    btnSurprise.addEventListener('click', () => {
      const randomItem = RANDOM_PROMPT_IDEAS[Math.floor(Math.random() * RANDOM_PROMPT_IDEAS.length)];
      const input = document.getElementById('studioPromptInput');
      if (input && randomItem) {
        input.value = randomItem.prompt;
        studioCurrentStyle = randomItem.style;
        studioCurrentRatio = randomItem.ratio;
        updateStudioStyleSelectionUI();
        updateStudioRatioSelectionUI();
        if (typeof showAppToast === 'function') {
          showAppToast(`Đã nạp ý tưởng: ${randomItem.title}`, 'info');
        }
      }
    });
  }

  // 7. Nút Phù Phép / Tối Ưu Hóa Prompt bằng AI
  const btnEnhance = document.getElementById('btnStudioEnhancePrompt');
  if (btnEnhance) {
    btnEnhance.addEventListener('click', async () => {
      const input = document.getElementById('studioPromptInput');
      const val = input ? input.value.trim() : '';
      if (!val) {
        if (typeof showAppToast === 'function') {
          showAppToast('Vui lòng gõ một vài từ khóa trước để Najimez phù phép nha!', 'warning');
        }
        return;
      }

      const origHtml = btnEnhance.innerHTML;
      btnEnhance.disabled = true;
      btnEnhance.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang phù phép...';

      try {
        const enriched = await expandPromptWithGemini(val, studioCurrentStyle);
        if (input && enriched) {
          input.value = enriched;
          if (typeof showAppToast === 'function') {
            showAppToast('Đã nâng cấp Prompt thành mô tả nghệ thuật chuẩn quốc tế! ✨', 'success');
          }
        }
      } catch (err) {
        console.warn('Lỗi nâng cấp prompt:', err);
      } finally {
        btnEnhance.disabled = false;
        btnEnhance.innerHTML = origHtml;
      }
    });
  }

  // 8. Nút bấm Thực thi tạo ảnh
  const btnGenerate = document.getElementById('btnStudioGenerate');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', handleStudioGenerate);
  }

  // Hỗ trợ phím tắt Ctrl + Enter trong ô nhập
  const promptInput = document.getElementById('studioPromptInput');
  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleStudioGenerate();
      }
    });
  }
}

// Đăng ký toàn cục vào window
window.initImageGenModule = initImageGenModule;
window.openImageGenModal = openImageGenModal;
window.closeImageGenModal = closeImageGenModal;
window.renderImageGenCard = renderImageGenCard;
window.generateAIImage = generateAIImage;
window.NAJIMEZ_IMAGE_STYLES = NAJIMEZ_IMAGE_STYLES;
window.NAJIMEZ_IMAGE_RATIOS = NAJIMEZ_IMAGE_RATIOS;
