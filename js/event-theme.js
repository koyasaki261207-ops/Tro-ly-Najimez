/**
 * js/event-theme.js - Bộ Phân Loại Màu Sắc & Biểu Tượng Khoa Học Cho Sự Kiện (Smart Cognitive Event Themes)
 * Ứng dụng tâm lý học màu sắc (Color Psychology) & công thái học thị giác giúp Thời Khóa Biểu
 * sinh động, rực rỡ, phân biệt trực quan tức thì và không bị đơn điệu một màu tím.
 */

// Danh mục chủ đề màu sắc khoa học chuẩn Cyber Luxury
const SMART_EVENT_THEMES = {
  math: {
    id: 'math',
    name: 'Toán học & Logic',
    color: '#6366f1', // Indigo
    glow: 'rgba(99, 102, 241, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.34) 0%, rgba(99, 102, 241, 0.13) 100%)',
    border: 'rgba(99, 102, 241, 0.55)',
    tagBg: 'rgba(99, 102, 241, 0.24)',
    tagColor: '#e0e7ff',
    icon: 'fa-solid fa-square-root-variable',
    keywords: [
      'đại số', 'dai so', 'toán', 'toan', 'tuyến tính', 'tuyen tinh',
      'giải tích', 'giai tich', 'hình học', 'hinh hoc', 'xác suất', 'xac suat',
      'thống kê', 'thong ke', 'vi tích phân', 'logic', 'rời rạc', 'roi rac',
      'math', 'algebra', 'calculus', 'geometry', 'matrix', 'ma trận'
    ]
  },
  science: {
    id: 'science',
    name: 'Khoa học Tự nhiên',
    color: '#06b6d4', // Cyan
    glow: 'rgba(6, 182, 212, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.34) 0%, rgba(6, 182, 212, 0.12) 100%)',
    border: 'rgba(6, 182, 212, 0.55)',
    tagBg: 'rgba(6, 182, 212, 0.24)',
    tagColor: '#cffafe',
    icon: 'fa-solid fa-flask-vial',
    keywords: [
      'khoa học', 'khoa hoc', 'vật lý', 'vat ly', 'vật lí', 'vat li',
      'hóa học', 'hoa hoc', 'hóa', 'hoa', 'sinh học', 'sinh hoc', 'sinh',
      'thí nghiệm', 'thi nghiem', 'nghiên cứu', 'nghien cuu', 'lab',
      'science', 'physics', 'chemistry', 'biology', 'thiên văn'
    ]
  },
  language: {
    id: 'language',
    name: 'Ngôn ngữ & Xã hội',
    color: '#0284c7', // Sky Blue
    glow: 'rgba(2, 132, 199, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(2, 132, 199, 0.34) 0%, rgba(2, 132, 199, 0.12) 100%)',
    border: 'rgba(2, 132, 199, 0.55)',
    tagBg: 'rgba(2, 132, 199, 0.24)',
    tagColor: '#bae6fd',
    icon: 'fa-solid fa-language',
    keywords: [
      'tiếng anh', 'tieng anh', 'english', 'ielts', 'toeic', 'ngoại ngữ', 'ngoai ngu',
      'ngữ văn', 'ngu van', 'văn học', 'van hoc', 'lịch sử', 'lich su',
      'địa lý', 'dia ly', 'triết', 'triet', 'triết học', 'chính trị',
      'tiếng nhật', 'tieng nhat', 'tiếng trung', 'tieng trung', 'tiếng hàn', 'tieng han',
      'pháp luật', 'phap luat', 'xã hội', 'xa hoi', 'literature'
    ]
  },
  coding: {
    id: 'coding',
    name: 'Tin học & CNTT',
    color: '#8b5cf6', // Electric Violet
    glow: 'rgba(139, 92, 246, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.34) 0%, rgba(139, 92, 246, 0.13) 100%)',
    border: 'rgba(139, 92, 246, 0.55)',
    tagBg: 'rgba(139, 92, 246, 0.24)',
    tagColor: '#ede9fe',
    icon: 'fa-solid fa-laptop-code',
    keywords: [
      'tin học', 'tin hoc', 'lập trình', 'lap trinh', 'code', 'coding',
      'it', 'cntt', 'python', 'javascript', 'c++', 'java', 'web', 'dev',
      'frontend', 'backend', 'thuật toán', 'thuat toan', 'cấu trúc dữ liệu',
      'database', 'cs', 'ai', 'computer', 'software'
    ]
  },
  entertainment: {
    id: 'entertainment',
    name: 'Giải trí & Sự kiện',
    color: '#f43f5e', // Rose Coral
    glow: 'rgba(244, 63, 94, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.34) 0%, rgba(244, 63, 94, 0.13) 100%)',
    border: 'rgba(244, 63, 94, 0.55)',
    tagBg: 'rgba(244, 63, 94, 0.24)',
    tagColor: '#ffe4e6',
    icon: 'fa-solid fa-music',
    keywords: [
      'hát', 'hat', 'karaoke', 'ca nhạc', 'ca nhac', 'văn nghệ', 'van nghe',
      'tiệc', 'tiec', 'party', 'nhậu', 'nhau', 'xem phim', 'cinema', 'movie',
      'đi chơi', 'di choi', 'du lịch', 'du lich', 'bạn bè', 'ban be',
      'họp lớp', 'hop lop', 'liên hoan', 'lien hoan', 'sự kiện', 'su kien',
      'âm nhạc', 'am nhac', 'nhảy', 'múa', 'game', 'chơi game'
    ]
  },
  sports: {
    id: 'sports',
    name: 'Thể thao & Sức khỏe',
    color: '#10b981', // Emerald
    glow: 'rgba(16, 185, 129, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.34) 0%, rgba(16, 185, 129, 0.12) 100%)',
    border: 'rgba(16, 185, 129, 0.55)',
    tagBg: 'rgba(16, 185, 129, 0.24)',
    tagColor: '#d1fae5',
    icon: 'fa-solid fa-dumbbell',
    keywords: [
      'gym', 'thể thao', 'the thao', 'chạy bộ', 'chay bo', 'đá bóng', 'da bong',
      'bóng đá', 'bong da', 'cầu lông', 'cau long', 'bơi', 'boi', 'yoga',
      'tập thể dục', 'the duc', 'khám bệnh', 'kham benh', 'bác sĩ', 'bac si',
      'sức khỏe', 'suc khoe', 'uống thuốc', 'fitness', 'workout', 'thể chất'
    ]
  },
  meeting: {
    id: 'meeting',
    name: 'Hẹn hò & Gặp gỡ',
    color: '#f97316', // Warm Orange
    glow: 'rgba(249, 115, 22, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.34) 0%, rgba(249, 115, 22, 0.12) 100%)',
    border: 'rgba(249, 115, 22, 0.55)',
    tagBg: 'rgba(249, 115, 22, 0.24)',
    tagColor: '#ffedd5',
    icon: 'fa-solid fa-mug-saucer',
    keywords: [
      'cafe', 'cà phê', 'ca phe', 'trà sữa', 'tra sua', 'hẹn hò', 'hen ho',
      'ăn trưa', 'an trua', 'ăn tối', 'an toi', 'ăn uống', 'an uong',
      'gặp mặt', 'gap mat', 'hẹn gặp', 'hen gap', 'date', 'coffee', 'gặp gỡ'
    ]
  },
  urgent: {
    id: 'urgent',
    name: 'Thi cử & Deadline',
    color: '#f59e0b', // Amber Gold
    glow: 'rgba(245, 158, 11, 0.40)',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.36) 0%, rgba(245, 158, 11, 0.13) 100%)',
    border: 'rgba(245, 158, 11, 0.60)',
    tagBg: 'rgba(245, 158, 11, 0.26)',
    tagColor: '#fef3c7',
    icon: 'fa-solid fa-triangle-exclamation',
    keywords: [
      'thi', 'kiểm tra', 'kiem tra', 'giữa kỳ', 'giua ky', 'cuối kỳ', 'cuoi ky',
      'deadline', 'hạn chót', 'han chot', 'nộp bài', 'nop bai', 'báo cáo', 'bao cao',
      'quan trọng', 'quan trong', 'urgent', 'exam', 'test', 'khẩn cấp'
    ]
  },
  celebration: {
    id: 'celebration',
    name: 'Sinh nhật & Kỷ niệm',
    color: '#ec4899', // Pink
    glow: 'rgba(236, 72, 153, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.34) 0%, rgba(236, 72, 153, 0.13) 100%)',
    border: 'rgba(236, 72, 153, 0.55)',
    tagBg: 'rgba(236, 72, 153, 0.24)',
    tagColor: '#fce7f3',
    icon: 'fa-solid fa-cake-candles',
    keywords: [
      'sinh nhật', 'sinh nhat', 'birthday', 'kỷ niệm', 'ky niem', 'anniversary',
      'đám cưới', 'dam cuoi', 'quà', 'qua', 'chúc mừng', 'chuc mung', 'party'
    ]
  },
  work: {
    id: 'work',
    name: 'Công việc & Dự án',
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.38)',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.34) 0%, rgba(168, 85, 247, 0.13) 100%)',
    border: 'rgba(168, 85, 247, 0.55)',
    tagBg: 'rgba(168, 85, 247, 0.24)',
    tagColor: '#f3e8ff',
    icon: 'fa-solid fa-briefcase',
    keywords: [
      'họp', 'hop', 'dự án', 'du an', 'công việc', 'cong viec', 'meeting',
      'bàn giao', 'ban giao', 'khách hàng', 'khach hang', 'hợp đồng', 'hop dong',
      'project', 'task', 'công ty', 'cong ty', 'văn phòng', 'van phong'
    ]
  }
};

// Bảng màu dự phòng ngẫu nhiên tất định (Deterministic Fallback Palette)
const DETERMINISTIC_PALETTES = [
  SMART_EVENT_THEMES.math,
  SMART_EVENT_THEMES.science,
  SMART_EVENT_THEMES.language,
  SMART_EVENT_THEMES.sports,
  SMART_EVENT_THEMES.entertainment,
  SMART_EVENT_THEMES.meeting,
  SMART_EVENT_THEMES.coding,
  SMART_EVENT_THEMES.celebration
];

/**
 * Hàm băm chuỗi ký tự thành số nguyên (Deterministic String Hash)
 */
function hashStringToInt(str) {
  let hash = 0;
  if (!str || !str.length) return 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Xóa dấu tiếng Việt và chuyển thường để so khớp từ khóa chính xác
 */
function normalizeKeywordText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/**
 * Hàm cốt lõi: Nhận diện Theme màu sắc & Biểu tượng khoa học thông minh cho một Sự Kiện
 * @param {Object} event - Đối tượng sự kiện { title, category, color, note }
 * @returns {Object} Theme đầy đủ { color, glow, bgGradient, border, tagBg, tagColor, icon, tagText }
 */
function getSmartEventTheme(event) {
  if (!event) return SMART_EVENT_THEMES.work;

  const titleRaw = (event.title || '').trim();
  const titleLower = titleRaw.toLowerCase();
  const titleNorm = normalizeKeywordText(titleRaw);

  const catRaw = (event.category || '').trim();
  const catLower = catRaw.toLowerCase();

  // 1. Kiểm tra từ khóa trong Tiêu đề (Độ ưu tiên cao nhất)
  // Duyệt các danh mục đặc thù trước
  const checkOrder = [
    'urgent',
    'math',
    'science',
    'coding',
    'language',
    'entertainment',
    'sports',
    'meeting',
    'celebration',
    'work'
  ];

  for (const themeKey of checkOrder) {
    const theme = SMART_EVENT_THEMES[themeKey];
    for (const kw of theme.keywords) {
      const kwNorm = normalizeKeywordText(kw);
      // So khớp từ khóa dạng nguyên từ hoặc chứa trong cụm từ
      if (titleLower.includes(kw) || titleNorm.includes(kwNorm)) {
        return {
          ...theme,
          tagText: event.category || theme.name
        };
      }
    }
  }

  // 2. Kiểm tra Phân loại (Category) nếu tiêu đề không chứa từ khóa rõ ràng
  if (catLower.includes('học tập') || catLower.includes('hoc tap') || catLower.includes('bài vở')) {
    return { ...SMART_EVENT_THEMES.science, tagText: event.category || 'Học tập' };
  }
  if (catLower.includes('sự kiện') || catLower.includes('su kien') || catLower.includes('giải trí')) {
    return { ...SMART_EVENT_THEMES.entertainment, tagText: event.category || 'Sự kiện' };
  }
  if (catLower.includes('hẹn') || catLower.includes('hen') || catLower.includes('gặp gỡ')) {
    return { ...SMART_EVENT_THEMES.meeting, tagText: event.category || 'Hẹn gặp' };
  }
  if (catLower.includes('sức khỏe') || catLower.includes('suc khoe') || catLower.includes('thể thao')) {
    return { ...SMART_EVENT_THEMES.sports, tagText: event.category || 'Sức khỏe' };
  }
  if (catLower.includes('sinh nhật') || catLower.includes('kỷ niệm')) {
    return { ...SMART_EVENT_THEMES.celebration, tagText: event.category || 'Sinh nhật' };
  }
  if (catLower.includes('quan trọng') || catLower.includes('nhắc nhở') || catLower.includes('deadline')) {
    return { ...SMART_EVENT_THEMES.urgent, tagText: event.category || 'Quan trọng' };
  }

  // 3. Nếu người dùng đã chọn một màu riêng khác với màu tím mặc định (#a855f7)
  const customColor = event.color;
  if (customColor && customColor.toLowerCase() !== '#a855f7') {
    return {
      id: 'custom',
      name: event.category || 'Tùy chỉnh',
      color: customColor,
      glow: `${customColor}55`,
      bgGradient: `linear-gradient(135deg, ${customColor}38 0%, ${customColor}14 100%)`,
      border: `${customColor}66`,
      tagBg: `${customColor}28`,
      tagColor: '#ffffff',
      icon: 'fa-regular fa-calendar-check',
      tagText: event.category || 'Sự kiện'
    };
  }

  // 4. Dự phòng thông minh: Phân bổ màu sắc dựa trên Hash của Tiêu Đề
  // Đảm bảo không bao giờ bị trùng lặp toàn màu tím ngắt
  const hashIdx = hashStringToInt(titleRaw || 'Najimez') % DETERMINISTIC_PALETTES.length;
  const pickedTheme = DETERMINISTIC_PALETTES[hashIdx];

  return {
    ...pickedTheme,
    tagText: event.category || pickedTheme.name
  };
}

/**
 * Gợi ý nhanh mã màu hex phù hợp dựa trên tiêu đề hoặc phân loại đang nhập
 */
function suggestColorForEvent(title, category) {
  const dummy = { title, category, color: '#a855f7' };
  const theme = getSmartEventTheme(dummy);
  return theme.color;
}

// Xuất các hàm ra phạm vi toàn cục
window.SMART_EVENT_THEMES = SMART_EVENT_THEMES;
window.getSmartEventTheme = getSmartEventTheme;
window.suggestColorForEvent = suggestColorForEvent;
