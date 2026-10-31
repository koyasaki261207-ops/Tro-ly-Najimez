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
  // 1. Hột vịt lộn / Trứng vịt lộn / Trứng cút lộn / Các món trứng
  hot_vit_lon: {
    key: 'hot_vit_lon',
    label: 'Hột vịt lộn',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Hotvitlon.jpg',
    fallbackSvg: createAutoSvg('#f59e0b', '#d97706', '🥚', 'HỘT VỊT LỘN')
  },
  // 2. Tiền cơm / Cơm tấm / Cơm bình dân
  com: {
    key: 'com',
    label: 'Tiền cơm',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#f97316', '#ea580c', '🍚', 'TIỀN CƠM')
  },
  // 3. Bún đậu mắm tôm
  bun_dau: {
    key: 'bun_dau',
    label: 'Bún đậu',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#84cc16', '#65a30d', '🥢', 'BÚN ĐẬU')
  },
  // 4. Hải sản / Ốc / Nghêu sò
  hai_san_oc: {
    key: 'hai_san_oc',
    label: 'Hải sản / Ốc',
    url: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#ea580c', '#c2410c', '🦪', 'HẢI SẢN / ỐC')
  },
  // 5. Cá viên chiên / Ăn vặt đường phố
  ca_vien_chien: {
    key: 'ca_vien_chien',
    label: 'Cá viên / Xiên que',
    url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#f97316', '#ea580c', '🍢', 'CÁ VIÊN CHIÊN')
  },
  // 6. Gà rán / Fast food / Pizza / Burger
  ga_ran: {
    key: 'ga_ran',
    label: 'Gà rán / Fast food',
    url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#ea580c', '#b91c1c', '🍗', 'GÀ RÁN')
  },
  // 7. Bida / Billiards
  bida: {
    key: 'bida',
    label: 'Bida / Billiards',
    url: 'https://images.unsplash.com/photo-1588636142475-a62d56692870?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#0f172a', '#334155', '🎱', 'BIDA')
  },
  // 8. Thể thao / Cầu lông / Bóng đá / Gym
  the_thao: {
    key: 'the_thao',
    label: 'Thể thao / Cầu lông',
    url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#10b981', '#059669', '🏸', 'THỂ THAO')
  },
  // 9. Quán net / Gaming
  net: {
    key: 'net',
    label: 'Quán net',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#6366f1', '#a855f7', '🖥️', 'QUÁN NET')
  },
  // 10. Ăn vặt, bánh tráng, snack
  an_vat: {
    key: 'an_vat',
    label: 'Ăn vặt',
    url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#ec4899', '#f43f5e', '🍟', 'ĂN VẶT')
  },
  // 11. Trà sữa
  tra_sua: {
    key: 'tra_sua',
    label: 'Trà sữa',
    url: 'https://images.unsplash.com/photo-1558857563-b37cf05d8a58?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#f59e0b', '#d97706', '🧋', 'TRÀ SỮA')
  },
  // 12. Cà phê
  ca_phe: {
    key: 'ca_phe',
    label: 'Cà phê',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#78350f', '#451a03', '☕', 'CÀ PHÊ')
  },
  // 13. Trà chanh / Nước mía / Nước ép
  tra_chanh: {
    key: 'tra_chanh',
    label: 'Trà chanh / Nước mía',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#84cc16', '#4d7c0f', '🍹', 'TRÀ CHANH')
  },
  // 14. Phở / Mì / Hủ tiếu / Bún
  pho_mi: {
    key: 'pho_mi',
    label: 'Phở / Mì / Bún',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#ef4444', '#dc2626', '🍜', 'PHỞ / MÌ')
  },
  // 15. Lẩu nướng
  lau_nuong: {
    key: 'lau_nuong',
    label: 'Lẩu nướng',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#f97316', '#dc2626', '🍲', 'LẨU NƯỚNG')
  },
  // 16. Bánh mì / Xôi / Điểm tâm
  banh_mi: {
    key: 'banh_mi',
    label: 'Bánh mì',
    url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#eab308', '#ca8a04', '🥖', 'BÁNH MÌ')
  },
  // 17. Chè / Kem / Đồ ngọt
  che_kem: {
    key: 'che_kem',
    label: 'Chè / Kem / Tráng miệng',
    url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#ec4899', '#db2777', '🍧', 'CHÈ / KEM')
  },
  // 18. Quán nhậu / Bia / Rượu
  bia_nhau: {
    key: 'bia_nhau',
    label: 'Quán nhậu / Bia',
    url: 'https://images.unsplash.com/photo-1518099074172-bd5730dc0ff9?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#f59e0b', '#d97706', '🍻', 'QUÁN NHẬU')
  },
  // 19. Đi chợ / Siêu thị
  di_cho: {
    key: 'di_cho',
    label: 'Đi chợ / Siêu thị',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#10b981', '#047857', '🛒', 'ĐI CHỢ')
  },
  // 20. Xăng xe / Đi lại
  xang_xe: {
    key: 'xang_xe',
    label: 'Xăng xe',
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#0ea5e9', '#0284c7', '⛽', 'XĂNG XE')
  },
  // 21. Cắt tóc / Làm đẹp / Spa
  lam_dep: {
    key: 'lam_dep',
    label: 'Cắt tóc / Làm đẹp',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#8b5cf6', '#6d28d9', '💇', 'LÀM ĐẸP')
  },
  // 22. Mua sắm
  shopping: {
    key: 'shopping',
    label: 'Mua sắm',
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#ec4899', '#8b5cf6', '🛍️', 'MUA SẮM')
  },
  // 23. Nhà trọ
  nha_tro: {
    key: 'nha_tro',
    label: 'Tiền trọ',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#3b82f6', '#1d4ed8', '🏠', 'TIỀN TRỌ')
  },
  // 24. Y tế / Thuốc men
  y_te: {
    key: 'y_te',
    label: 'Y tế / Thuốc men',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#0ea5e9', '#0369a1', '💊', 'THUỐC MEN')
  },
  // 25. Quà tặng / Tiệc mừng
  qua_tang: {
    key: 'qua_tang',
    label: 'Quà tặng / Mừng cưới',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#f43f5e', '#be123c', '🎁', 'QUÀ TẶNG')
  },
  // 26. Học tập
  hoc_tap: {
    key: 'hoc_tap',
    label: 'Học tập',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#8b5cf6', '#6d28d9', '📚', 'HỌC TẬP')
  },
  // 27. Xem phim
  xem_phim: {
    key: 'xem_phim',
    label: 'Xem phim',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#8b5cf6', '#ec4899', '🎬', 'XEM PHIM')
  },
  // 28. Lương / Thưởng
  luong: {
    key: 'luong',
    label: 'Lương / Thưởng',
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#10b981', '#3b82f6', '💰', 'LƯƠNG / THƯỞNG')
  },
  // 29. Mượn tiền / Trả nợ
  tien: {
    key: 'tien',
    label: 'Mượn tiền',
    url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#10b981', '#059669', '💵', 'TIỀN MẶT')
  },
  // 30. Mặc định (Ví tiền & tiền mặt thân thiện, không dùng ảnh laptop văn phòng)
  default_money: {
    key: 'default_money',
    label: 'Khoản tiền / Sổ nợ',
    url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=400&q=80',
    fallbackSvg: createAutoSvg('#10b981', '#059669', '💵', 'KHOẢN TIỀN')
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

  // 1. Hột vịt lộn / Trứng vịt lộn / Trứng cút lộn / Các món trứng
  if (
    norm.includes('hot vit lon') || norm.includes('trung vit lon') ||
    norm.includes('hot vit') || norm.includes('trung cut lon') ||
    norm.includes('trung lon') || norm.includes('vit lon') ||
    norm.includes('trung cut') || norm.includes('trung ga') ||
    norm.includes('trung vit') || norm.includes('trung op la') ||
    norm.includes('trung chien') || norm.includes('trung ') ||
    norm.endsWith('trung') || norm === 'trung'
  ) {
    return AUTO_SMART_VISUALS.hot_vit_lon;
  }

  // 2. Bún đậu mắm tôm
  if (norm.includes('bun dau') || norm.includes('mam tom')) {
    return AUTO_SMART_VISUALS.bun_dau;
  }

  // 3. Tiền cơm, cơm tấm, cơm chiên, dĩa cơm, cơm sườn, cơm gà...
  if (
    norm.includes('com tam') || norm.includes('com suon') || norm.includes('com ga') ||
    norm.includes('com rang') || norm.includes('com chien') || norm.includes('dia com') ||
    norm.includes('suat com') || norm.includes('com binh dan') || norm.includes('com ') ||
    norm.endsWith('com') || norm === 'com'
  ) {
    return AUTO_SMART_VISUALS.com;
  }

  // 4. Hải sản / Ốc / Nghêu sò / Tôm cua mực
  if (
    norm.includes('hai san') || /\b(?:oc|ngheu|cua|tom|muc|hau|ghe)\b/.test(norm) ||
    norm.includes('oc huong') || norm.includes('oc buou') || norm.includes('oc len') ||
    norm.includes('so diep') || norm.includes('so huyet') || norm.includes('bach tuoc') ||
    norm.includes('tom hum') || norm.includes('cua bien')
  ) {
    return AUTO_SMART_VISUALS.hai_san_oc;
  }

  // 5. Cá viên chiên / Bò viên / Xiên que / Ăn vặt
  if (
    norm.includes('ca vien') || norm.includes('bo vien') || norm.includes('xien que') ||
    norm.includes('xien ban') || norm.includes('bap xao') || norm.includes('banh trang tron') ||
    norm.includes('banh trang nuong') || norm.includes('ho lo') || norm.includes('xuc xich') ||
    norm.includes('pho mai que')
  ) {
    return AUTO_SMART_VISUALS.ca_vien_chien;
  }

  // 6. Gà rán / Fast food / Pizza / Burger
  if (
    norm.includes('ga ran') || norm.includes('kfc') || norm.includes('jollibee') ||
    norm.includes('lotteria') || norm.includes('pizza') || norm.includes('burger') ||
    norm.includes('hamburger') || norm.includes('mcdonald') || norm.includes('ga sot')
  ) {
    return AUTO_SMART_VISUALS.ga_ran;
  }

  // 7. Bida / Billiards
  if (
    norm.includes('bida') || norm.includes('bi da') || norm.includes('bi-a') ||
    norm.includes('billiard') || norm.includes('billiards') || norm.includes('danh bida')
  ) {
    return AUTO_SMART_VISUALS.bida;
  }

  // 8. Thể thao / Cầu lông / Bóng đá / Gym
  if (
    norm.includes('cau long') || norm.includes('da banh') || norm.includes('da bong') ||
    norm.includes('bong da') || norm.includes('gym') || norm.includes('san banh') ||
    norm.includes('tien san') || norm.includes('pickleball') || norm.includes('tennis') ||
    norm.includes('boi loi') || norm.includes('chay bo') || norm.includes('tap gym')
  ) {
    return AUTO_SMART_VISUALS.the_thao;
  }

  // 9. Quán net, cyber, gaming, chơi game
  if (
    norm.includes('net') || norm.includes('cyber') || norm.includes('gaming') ||
    norm.includes('quan net') || norm.includes('choi net') || norm.includes('nap net') ||
    norm.includes('game')
  ) {
    return AUTO_SMART_VISUALS.net;
  }

  // 10. Trà sữa, tocotoco, gongcha, koi, nước ngọt
  if (
    norm.includes('tra sua') || norm.includes('tra dao') || norm.includes('tra vai') ||
    norm.includes('toco') || norm.includes('gongcha') || norm.includes('koi') ||
    norm.includes('sting') || norm.includes('coca') || norm.includes('pepsi') ||
    norm.includes('bo huc') || norm.includes('redbull')
  ) {
    return AUTO_SMART_VISUALS.tra_sua;
  }

  // 11. Cà phê, cafe, coffee
  if (
    norm.includes('ca phe') || norm.includes('cafe') || norm.includes('coffee') ||
    norm.includes('bac xiu') || norm.includes('highland') || norm.includes('starbuck') ||
    norm.includes('den da') || norm.includes('sua da')
  ) {
    return AUTO_SMART_VISUALS.ca_phe;
  }

  // 12. Trà chanh / Nước mía / Sinh tố / Nước ép
  if (
    norm.includes('tra chanh') || norm.includes('tra tac') || norm.includes('nuoc mia') ||
    norm.includes('nuoc dua') || norm.includes('dua tuoi') || norm.includes('sinh to') ||
    norm.includes('nuoc ep') || norm.includes('rau ma') || norm.includes('tra mang cau')
  ) {
    return AUTO_SMART_VISUALS.tra_chanh;
  }

  // 13. Phở, bún, mì, hủ tiếu, ramen
  if (
    norm.includes('pho') || norm.includes('bun bo') || norm.includes('hu tieu') ||
    norm.includes('mi tom') || norm.includes('mi cay') || norm.includes('ramen') ||
    norm.includes('mi quang') || norm.includes('bun rieu') || norm.includes('bun cha') ||
    norm.includes('bun thit nuong') || norm.includes('bun moc')
  ) {
    return AUTO_SMART_VISUALS.pho_mi;
  }

  // 14. Lẩu, nướng, bbq
  if (norm.includes('lau') || norm.includes('nuong') || norm.includes('bbq')) {
    return AUTO_SMART_VISUALS.lau_nuong;
  }

  // 15. Quán nhậu, bia, rượu
  if (
    norm.includes('nhau') || norm.includes('quan nhau') || norm.includes('bia') ||
    norm.includes('moi nhau') || norm.includes('ruou') || norm.includes('tiger') ||
    norm.includes('heineken') || norm.includes('sai gon') || norm.includes('beer') ||
    norm.includes('lai rai')
  ) {
    return AUTO_SMART_VISUALS.bia_nhau;
  }

  // 16. Bánh mì, ăn sáng, xôi, bánh bao
  if (
    norm.includes('banh mi') || norm.includes('xoi') || norm.includes('an sang') ||
    norm.includes('diem tam') || norm.includes('banh bao') || norm.includes('banh cuon') ||
    norm.includes('banh xeo')
  ) {
    return AUTO_SMART_VISUALS.banh_mi;
  }

  // 17. Chè, kem, sữa chua, đồ ngọt
  if (
    norm.includes('che ') || norm.endsWith('che') || norm.includes('kem ') || norm.endsWith('kem') ||
    norm.includes('sua chua') || norm.includes('tau hu') || norm.includes('bingsoo') ||
    norm.includes('bingsu') || norm.includes('flan') || norm.includes('pudding') ||
    norm.includes('banh ngot') || norm.includes('banh kem')
  ) {
    return AUTO_SMART_VISUALS.che_kem;
  }

  // 18. Ăn vặt chung, bánh tráng, snack & Fastfood quốc tế (Pizza, Burger, Tokbokki, Sushi...)
  if (
    norm.includes('an vat') || norm.includes('banh trang') || norm.includes('snack') ||
    norm.includes('bim bim') || norm.includes('khoai tay') || norm.includes('nem chua') ||
    norm.includes('trai cay') || norm.includes('tokbokki') || norm.includes('topokki') ||
    norm.includes('banh gao') || norm.includes('kimbap') || norm.includes('sushi') ||
    norm.includes('sashimi') || norm.includes('pizza') || norm.includes('burger') ||
    norm.includes('hamburger') || norm.includes('hotdog') || norm.includes('dimsum') ||
    norm.includes('ha cao') || norm.includes('sui cao') || norm.includes('mi y') ||
    norm.includes('spaghetti') || norm.includes('pasta') || norm.includes('steak') ||
    norm.includes('bo bit tet')
  ) {
    if (norm.includes('pizza') || norm.includes('burger') || norm.includes('hamburger') || norm.includes('hotdog')) {
      return {
        ...AUTO_SMART_VISUALS.an_vat,
        label: rawText.trim() ? `Món ăn: ${rawText.trim()}` : 'Pizza / Burger',
        fallbackSvg: createAutoSvg('#f59e0b', '#d97706', '🍕', (rawText.trim().substring(0, 16)).toUpperCase())
      };
    }
    if (norm.includes('sushi') || norm.includes('sashimi') || norm.includes('kimbap')) {
      return {
        ...AUTO_SMART_VISUALS.an_vat,
        label: rawText.trim() ? `Món ăn: ${rawText.trim()}` : 'Sushi / Kimbap',
        fallbackSvg: createAutoSvg('#ef4444', '#dc2626', '🍣', (rawText.trim().substring(0, 16)).toUpperCase())
      };
    }
    return AUTO_SMART_VISUALS.an_vat;
  }

  // 19. Cắt tóc / Làm đẹp / Nail / Spa
  if (
    norm.includes('cat toc') || norm.includes('barber') || norm.includes('salon') ||
    norm.includes('nail') || norm.includes('spa') || norm.includes('lam mong') ||
    norm.includes('uon toc') || norm.includes('nhuom toc') || norm.includes('goi dau')
  ) {
    return AUTO_SMART_VISUALS.lam_dep;
  }

  // 20. Đi chợ, siêu thị, bách hóa, tạp hóa
  if (
    norm.includes('di cho') || norm.includes('tien cho') || norm.includes('sieu thi') ||
    norm.includes('bach hoa') || norm.includes('tap hoa') || norm.includes('winmart') ||
    norm.includes('coopmart') || norm.includes('big c') || norm.includes('go!') ||
    norm.includes('thuc pham')
  ) {
    return AUTO_SMART_VISUALS.di_cho;
  }

  // 21. Y tế, thuốc, khám bệnh
  if (
    norm.includes('thuoc') || norm.includes('nha thuoc') || norm.includes('tiem thuoc') ||
    norm.includes('kham benh') || norm.includes('benh vien') || norm.includes('bac si') ||
    norm.includes('panadol') || norm.includes('khau trang')
  ) {
    return AUTO_SMART_VISUALS.y_te;
  }

  // 22. Quà tặng, tiệc mừng, sinh nhật, đám cưới
  if (
    norm.includes('sinh nhat') || norm.includes('dam cuoi') || norm.includes('mung cuoi') ||
    norm.includes('thiep cuoi') || norm.includes('qua tang') || norm.includes('tang qua') ||
    norm.includes('li xi') || norm.includes('thoi noi') || norm.includes('day thang')
  ) {
    return AUTO_SMART_VISUALS.qua_tang;
  }

  // 23. Xăng xe, xe cộ, grab, taxi
  if (
    norm.includes('xang') || norm.includes('xe') || norm.includes('grab') ||
    norm.includes('be ') || norm.includes('taxi') || norm.includes('gui xe') ||
    norm.includes('rua xe')
  ) {
    return AUTO_SMART_VISUALS.xang_xe;
  }

  // 24. Mua sắm, áo quần, shopee, mỹ phẩm
  if (
    norm.includes('shopee') || norm.includes('lazada') || norm.includes('tiki') ||
    norm.includes('mua sam') || norm.includes('quan ao') || norm.includes('giay') ||
    norm.includes('my pham') || norm.includes('son ')
  ) {
    return AUTO_SMART_VISUALS.shopping;
  }

  // 25. Nhà trọ, tiền phòng, điện nước
  if (
    norm.includes('nha tro') || norm.includes('phong tro') || norm.includes('tien tro') ||
    norm.includes('dien nuoc') || norm.includes('wifi') || norm.includes('internet')
  ) {
    return AUTO_SMART_VISUALS.nha_tro;
  }

  // 26. Học tập, sách vở, học phí
  if (
    norm.includes('hoc phi') || norm.includes('sach') || norm.includes('vo ') ||
    norm.includes('tai lieu') || norm.includes('khoa hoc')
  ) {
    return AUTO_SMART_VISUALS.hoc_tap;
  }

  // 27. Xem phim, cgv, cinema
  if (
    norm.includes('xem phim') || norm.includes('cgv') || norm.includes('cinema') ||
    norm.includes('bhd') || norm.includes('lotte')
  ) {
    return AUTO_SMART_VISUALS.xem_phim;
  }

  // 28. Lương, thưởng, thu nhập
  if (
    norm.includes('luong') || norm.includes('thuong') || norm.includes('bonus') ||
    norm.includes('thu nhap')
  ) {
    return AUTO_SMART_VISUALS.luong;
  }

  // 29. Tự động nhận diện nhóm Ăn Uống Chung (khi không rõ tên món cụ thể)
  if (
    norm.includes('do an') || norm.includes('mon an') || norm.includes('bua an') ||
    norm.includes('bua com') || norm.includes('an trua') || norm.includes('an toi') ||
    norm.includes('an sang') || norm.includes('an dem') || norm.includes('tien an') ||
    norm.includes('doi bung') || norm.includes('thuc an') || norm.includes('an uong')
  ) {
    return AUTO_SMART_VISUALS.com;
  }

  if (
    norm.includes('do uong') || norm.includes('giai khat') || norm.includes('nuoc uong') ||
    norm.includes('tien nuoc') || norm.includes('mua nuoc')
  ) {
    return AUTO_SMART_VISUALS.tra_sua;
  }

  // 30. Tiền tố món ăn Việt Nam tổng quát (dành cho mọi món ăn chưa có trong từ điển cụ thể)
  // Ví dụ: cháo lòng, bánh đúc, bánh xèo, gỏi cuốn, nem nướng, chả lụa, tré trộn, đậu phụ, nấm xào, phá lấu, canh chua, cá kho, thịt luộc, bò né...
  const foodPrefixRegex = /(?:\bchao\b|\bbanh\b|\bgoi\b|\bnem\b|\bcha\b|\btre\b|\bnam\b|\bdau\b|\btrung\b|\bpha lau\b|\bcao lau\b|\blau\b|\bcanh\b|\bsup\b|\bsoup\b|\bxoi\b|\bthit\b|\bca\b|\bga\b|\bvit\b|\bbo\b|\bheo\b|\bmuc\b|\btom\b|\boc\b|\bxao\b|\bnuong\b|\bchien\b|\bkho\b|\bhap\b|\bluoc\b|\bbo kho\b|\bbo ne\b|\bbanh canh\b|\bgoi cuon\b|\bbuffet\b|\bdac san\b|\bquan an\b|\bquan com\b|\bmon ngon\b)/;
  if (foodPrefixRegex.test(norm)) {
    // Món nước (cháo, canh, súp, bánh canh)
    if (/\b(?:chao|canh|sup|soup|banh canh)\b/.test(norm)) {
      return {
        ...AUTO_SMART_VISUALS.pho_mi,
        label: rawText.trim() ? `Món ăn: ${rawText.trim()}` : 'Món nước / Cháo',
        fallbackSvg: createAutoSvg('#ea580c', '#c2410c', '🍲', (rawText.trim().substring(0, 16)).toUpperCase())
      };
    }
    // Món bánh truyền thống (bánh xèo, bánh đúc, bánh bèo, bánh ướt...)
    if (/\bbanh\b/.test(norm)) {
      return {
        ...AUTO_SMART_VISUALS.banh_mi,
        label: rawText.trim() ? `Món ăn: ${rawText.trim()}` : 'Món bánh',
        fallbackSvg: createAutoSvg('#eab308', '#ca8a04', '🥟', (rawText.trim().substring(0, 16)).toUpperCase())
      };
    }
    // Món mặn tổng quát (gỏi, nem, thịt, cá, xào, nướng, kho...)
    return {
      ...AUTO_SMART_VISUALS.com,
      label: rawText.trim() ? `Món ăn: ${rawText.trim()}` : 'Món ăn',
      fallbackSvg: createAutoSvg('#f97316', '#ea580c', '🥘', (rawText.trim().substring(0, 16)).toUpperCase())
    };
  }

  // 31. Tiền tố thức uống tổng quát (trà dâu, trà ô long, nước sâm, sữa tươi, cà phê muối, matcha...)
  const drinkPrefixRegex = /(?:\btra\b|\bnuoc\b|\bsua\b|\bsinh to\b|\bnuoc ep\b|\bca phe\b|\bcafe\b|\bche\b|\bo long\b|\bmatcha\b|\blatte\b|\bsmoothie\b)/;
  if (drinkPrefixRegex.test(norm)) {
    return {
      ...AUTO_SMART_VISUALS.tra_sua,
      label: rawText.trim() ? `Thức uống: ${rawText.trim()}` : 'Thức uống',
      fallbackSvg: createAutoSvg('#f59e0b', '#d97706', '🧋', (rawText.trim().substring(0, 16)).toUpperCase())
    };
  }

  // 32. Mượn tiền, vay tiền, trả nợ, thu nợ, thanh toán nợ
  if (
    norm.includes('muon tien') || norm.includes('vay tien') || norm.includes('tien mat') ||
    norm.includes('chuyen khoan') || norm.includes('muon') || norm.includes('vay') ||
    norm.includes('no tien') || norm.includes('tien') || norm.includes('tra no') ||
    norm.includes('thu no') || norm.includes('thu hoi no') || norm.includes('da tra no') ||
    norm.includes('thanh toan no') || norm.includes('tat toan')
  ) {
    return AUTO_SMART_VISUALS.tien;
  }

  return AUTO_SMART_VISUALS.default_money;
}

const WEB_IMAGE_CACHE_KEY = 'NAJIMEZ_WEB_IMAGE_CACHE_V2';
let webImageMemoryCache = null;
const pendingWebImageFetches = new Set();

function getWebImageCache() {
  if (webImageMemoryCache) return webImageMemoryCache;
  try {
    const raw = localStorage.getItem(WEB_IMAGE_CACHE_KEY);
    webImageMemoryCache = raw ? JSON.parse(raw) : {};
  } catch (e) {
    webImageMemoryCache = {};
  }
  return webImageMemoryCache;
}

function getCachedWebImageUrl(keyword) {
  if (!keyword) return null;
  const cache = getWebImageCache();
  const key = keyword.toLowerCase().trim();
  return cache[key] || null;
}

function setCachedWebImageUrl(keyword, url) {
  if (!keyword || !url) return;
  const cache = getWebImageCache();
  const key = keyword.toLowerCase().trim();
  cache[key] = url;
  try {
    localStorage.setItem(WEB_IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) { }
}

/**
 * Tạo huy hiệu vector SVG mang đúng tên món hoặc khoản chi (KHÔNG bao giờ đoán mò từ khóa sai lệch)
 */
function createDishOrExpenseFallbackSvg(rawText) {
  const clean = (rawText || 'Giao dịch').trim();
  const upper = clean.substring(0, 16).toUpperCase();
  const isMoney = /(?:tiền|nợ|chuyển|vay|mượn|lương|thưởng|thu|chi)/i.test(clean);
  const icon = isMoney ? '💵' : '🍲';
  const c1 = isMoney ? '#0d9488' : '#7c3aed';
  const c2 = isMoney ? '#042f2e' : '#4c1d95';
  return createAutoSvg(c1, c2, icon, upper);
}

/**
 * Trả về thông tin hình ảnh của một giao dịch hoặc khoản nợ:
 * - ƯU TIÊN #1 TUYỆT ĐỐI: Ảnh thực tế từ Web (tự động tìm kiếm & gán luôn từ Wikipedia/Commons).
 * - Nếu đã có item.image (từ Web hoặc người dùng gán), hiển thị ngay lập tức.
 * - Nếu chưa có item.image, kích hoạt tìm kiếm ảnh trên Web ngầm và tự động cập nhật vào sổ cái.
 * - Loại bỏ hoàn toàn việc nhận diện từ khóa cứng nhắc đoán bừa (như đoán bánh cuốn thành bánh mì).
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

  // Nếu là giao dịch Thu nợ / Trả nợ / Thu hồi nợ, dùng hình TIỀN MẶT chuẩn
  const normCategory = (item.category || '').toLowerCase();
  const normNote = (item.note || item.reason || '').toLowerCase();
  if (
    normCategory.includes('thu nợ') || normCategory.includes('trả nợ') ||
    normNote.includes('thu hồi nợ') || normNote.includes('đã trả nợ') ||
    normNote.includes('thanh toán nợ') || normNote.includes('tất toán')
  ) {
    const moneyVisual = AUTO_SMART_VISUALS.tien || AUTO_SMART_VISUALS.default_money;
    return {
      src: moneyVisual.url,
      label: item.note || 'Tiền mặt',
      key: 'tien',
      isAuto: true
    };
  }

  // 1. Ảnh đã có (Ảnh từ Web được tự động gán hoặc ảnh do người dùng chọn)
  if (item.image && typeof item.image === 'string' && item.image.trim().length > 0) {
    return {
      src: item.image,
      label: item.note || 'Ảnh thực tế từ Web',
      key: 'custom',
      isAuto: false
    };
  }

  const rawNote = (item.note || item.reason || '').trim();
  const personName = item.person || '';
  const itemId = item.id;

  // 2. Tự động kiểm tra Local Cache (nếu từ khóa này từng tìm thấy ảnh trước đó, dùng ngay trong 0ms!)
  const clean = cleanQueryForImageSearch(rawNote, personName);
  if (clean) {
    const cachedUrl = getCachedWebImageUrl(clean);
    if (cachedUrl) {
      item.image = cachedUrl;
      setTimeout(() => applyFetchedImageToLedger(itemId, cachedUrl), 0);
      return {
        src: cachedUrl,
        label: rawNote,
        key: 'custom',
        isAuto: false
      };
    }

    // 3. TỰ ĐỘNG TÌM KIẾM ẢNH TRÊN WEB VÀ GÁN LUÔN
    if (itemId && !pendingWebImageFetches.has(String(itemId))) {
      setTimeout(() => autoFetchAndAssignWebImageForItem(item), 20);
    }
  }

  // 4. Trong khi chờ ảnh Web tải về hoặc nếu offline, tạo SVG vector mang đúng tên món (KHÔNG đoán bừa từ khóa)
  const fallbackSvg = createDishOrExpenseFallbackSvg(rawNote || item.category || 'Giao dịch');
  return {
    src: fallbackSvg,
    label: rawNote || 'Giao dịch',
    key: 'web_pending',
    isAuto: true
  };
}

/**
 * Cập nhật DOM của thumbnail đang hiển thị mà không làm giật màn hình
 */
function updateThumbnailsInDom(itemId, imageUrl) {
  if (!itemId || !imageUrl) return;

  const selectors = [
    `[data-action="view-debt-img"][data-id="${itemId}"] img`,
    `[data-action="view-tx-img"][data-id="${itemId}"] img`,
    `[data-id="${itemId}"] .history-item-thumb`,
    `#row-debt-${itemId} img`,
    `#row-tx-${itemId} img`
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(img => {
      img.src = imageUrl;
    });
  });

  // Nếu Modal xem ảnh đang mở đúng item này, cập nhật preview lớn luôn
  if (currentModalTargetId && String(currentModalTargetId) === String(itemId)) {
    const largeImg = document.getElementById('txImageLargePreview');
    if (largeImg) largeImg.src = imageUrl;
    const metaTitle = document.getElementById('txImageMetaTitle');
    if (metaTitle) {
      metaTitle.innerHTML = `<span style="font-size:0.75rem; color:#38bdf8;">🌐 Ảnh thực tế từ Web</span>`;
    }
  }
}

/**
 * Lưu ảnh tìm được từ Web vào sổ cái (debts và transactions)
 */
function applyFetchedImageToLedger(itemId, imageUrl) {
  if (!itemId || !imageUrl) return;
  const data = getLedgerData();
  let changed = false;

  // Cập nhật debts
  (data.debts || []).forEach(d => {
    if (String(d.id) === String(itemId) && !d.image) {
      d.image = imageUrl;
      changed = true;
    }
  });

  // Cập nhật transactions
  (data.transactions || []).forEach(t => {
    if ((String(t.id) === String(itemId) || String(t.debtId) === String(itemId) || String(t.id) === 'tx-debt-' + itemId) && !t.image) {
      t.image = imageUrl;
      changed = true;
    }
  });

  if (changed) {
    saveLedgerData(data);
    updateThumbnailsInDom(itemId, imageUrl);
  }
}

/**
 * Tự động tìm kiếm ảnh trên Web cho một item và gán luôn
 */
async function autoFetchAndAssignWebImageForItem(item) {
  if (!item || !item.id) return;
  const rawNote = (item.note || item.reason || '').trim();
  const personName = item.person || '';
  const clean = cleanQueryForImageSearch(rawNote, personName);
  if (!clean) return;

  const itemId = String(item.id);
  if (pendingWebImageFetches.has(itemId)) return;
  pendingWebImageFetches.add(itemId);

  // 1. Kiểm tra cache
  const cachedUrl = getCachedWebImageUrl(clean);
  if (cachedUrl) {
    applyFetchedImageToLedger(itemId, cachedUrl);
    return;
  }

  // 2. Tìm kiếm trên Web qua API Wikipedia / Commons
  try {
    const results = await searchWebImages(clean);
    if (results && results.length > 0) {
      const best = results[0];
      setCachedWebImageUrl(clean, best.url);
      applyFetchedImageToLedger(itemId, best.url);
    }
  } catch (err) {
    console.warn('[AutoWebImage] Lỗi tự động tải ảnh mạng cho:', clean, err);
  }
}

/**
 * Tự động quét toàn bộ sổ nợ và giao dịch chưa có ảnh:
 * Tự động tìm kiếm ảnh trên Web cho từng món và chọn gán luôn!
 */
async function scanAndAutoFillAllWebImages() {
  const data = getLedgerData();
  const itemsToFetch = [];

  // 1. Quét các khoản nợ
  (data.debts || []).forEach(d => {
    if (d && !d.image && d.note) {
      const clean = cleanQueryForImageSearch(d.note, d.person);
      if (clean && clean.length > 1) {
        itemsToFetch.push({ id: d.id, note: d.note, person: d.person });
      }
    }
  });

  // 2. Quét các giao dịch
  (data.transactions || []).forEach(t => {
    if (t && !t.image && t.note) {
      const clean = cleanQueryForImageSearch(t.note);
      if (clean && clean.length > 1 && !itemsToFetch.some(x => x.id === t.id)) {
        itemsToFetch.push({ id: t.id, note: t.note });
      }
    }
  });

  if (itemsToFetch.length === 0) return;

  // Fetch ngầm lần lượt
  for (const item of itemsToFetch.slice(0, 20)) {
    await autoFetchAndAssignWebImageForItem(item);
  }

  if (typeof renderFinanceTab === 'function') renderFinanceTab();
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
    const badgeText = targetItem.image ? '🌐 Ảnh thực tế từ Web' : '📷 Ảnh đại diện';
    if (metaTitle) {
      metaTitle.innerHTML = `<strong>${safeEscape(noteText)}</strong> <span style="font-size:0.75rem; color:#38bdf8; margin-left:8px;">${badgeText}</span>`;
    }
    if (metaDate) metaDate.textContent = targetItem.timestamp ? new Date(targetItem.timestamp).toLocaleDateString('vi-VN') : 'Gần đây';
  } else if (info) {
    if (metaTitle) metaTitle.innerHTML = `<strong>${safeEscape(info.label)}</strong>`;
  }

  if (viewSec) viewSec.style.display = 'block';
  if (editSec) editSec.style.display = 'none';

  modal.classList.add('active');
}

function renderModalPresetChips() {
  const container = document.getElementById('txModalPresetChipsList');
  if (!container) return;

  const presets = [
    { key: 'hot_vit_lon', label: '🥚 Hột vịt lộn' },
    { key: 'com', label: '🍚 Tiền cơm' },
    { key: 'bun_dau', label: '🥢 Bún đậu' },
    { key: 'pho_mi', label: '🍜 Phở / Bún' },
    { key: 'hai_san_oc', label: '🦪 Hải sản / Ốc' },
    { key: 'ca_vien_chien', label: '🍢 Cá viên chiên' },
    { key: 'ga_ran', label: '🍗 Gà rán' },
    { key: 'banh_mi', label: '🥖 Bánh mì' },
    { key: 'lau_nuong', label: '🍲 Lẩu nướng' },
    { key: 'tra_sua', label: '🧋 Trà sữa' },
    { key: 'ca_phe', label: '☕ Cà phê' },
    { key: 'tra_chanh', label: '🍹 Trà chanh' },
    { key: 'che_kem', label: '🍧 Chè / Kem' },
    { key: 'bia_nhau', label: '🍻 Quán nhậu' },
    { key: 'bida', label: '🎱 Bida' },
    { key: 'the_thao', label: '🏸 Cầu lông' },
    { key: 'net', label: '🖥️ Quán net' },
    { key: 'di_cho', label: '🛒 Đi chợ' },
    { key: 'tien', label: '💵 Tiền mặt' },
  ];

  container.innerHTML = presets.map(p => `
    <button type="button" class="tx-preset-chip" data-key="${p.key}">
      ${p.label}
    </button>
  `).join('');

  container.querySelectorAll('.tx-preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      const v = AUTO_SMART_VISUALS[k];
      if (v) {
        setModalPendingPreview(v.url);
      }
    });
  });
}

/**
 * Làm sạch tên món/nội dung giao dịch để tìm kiếm ảnh trên mạng chính xác nhất
 */
function cleanQueryForImageSearch(rawText, personName = '') {
  if (!rawText || typeof rawText !== 'string') return '';
  let s = rawText.trim();

  // 1. Nếu có dấu hai chấm (vd: "Cho Nam mượn tiền: bánh cuốn"), lấy phần sau dấu hai chấm
  if (s.includes(':')) {
    const afterColon = s.split(':').slice(1).join(':').trim();
    if (afterColon.length > 0) {
      s = afterColon;
    }
  }

  // 2. Bỏ tên người nợ nếu được truyền vào để tránh tìm nhầm tên người
  if (personName && typeof personName === 'string') {
    const p = personName.trim();
    if (p.length > 1) {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regP = new RegExp('\\b' + escaped + '\\b', 'gi');
      s = s.replace(regP, ' ');
    }
  }

  // 3. Bỏ các từ nợ nần, tiền nong, mượn trả dư thừa
  s = s.replace(/\b(?:khoản nợ|khoan no|nợ tiền|no tien|trả nợ|tra no|trả tiền|tra tien|mượn tiền|muon tien|vay tiền|vay tien|nợ|no|mượn|muon|tiền|tien)\b/gi, ' ');
  // 4. Bỏ tiền tố hành động
  s = s.replace(/\b(?:thanh toán|chi trả|mua|ăn|uống|đi|uong|thanh toan|cho|vay)\b/gi, ' ');
  // 5. Bỏ "với [Tên]" nếu có
  s = s.replace(/\bvới\s+[^\s,]+/gi, ' ');
  // 6. Bỏ dấu câu linh tinh
  s = s.replace(/[;,\-–—]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s || rawText.trim();
}

/**
 * Tính điểm mức độ phù hợp giữa tiêu đề bài viết/ảnh và từ khóa tìm kiếm
 */
function calculateWebImageScore(title, cleanQuery) {
  if (!title || !cleanQuery) return 0;
  const t = title.toLowerCase().trim();
  const q = cleanQuery.toLowerCase().trim();

  // 1. Khớp hoàn hảo tuyệt đối
  if (t === q) return 100;

  // 2. Bắt đầu hoặc chứa trọn vẹn cụm từ
  if (t.startsWith(q)) return 85;
  if (t.includes(q)) return 75;
  if (q.includes(t) && t.length > 3) return 70;

  // 3. Xử lý đồng nghĩa phổ biến (ví dụ: hột vịt lộn <-> trứng vịt lộn)
  const normT = t.replace(/trứng/g, 'hột');
  const normQ = q.replace(/trứng/g, 'hột');
  if (normT.includes(normQ) || normQ.includes(normT)) return 80;

  // 4. Khớp không dấu (cho Commons tiếng Anh hoặc tên file không dấu)
  const noMarkT = normalizeVisualText(t);
  const noMarkQ = normalizeVisualText(q);
  if (noMarkT === noMarkQ) return 85;
  if (noMarkT.includes(noMarkQ)) return 65;

  // 5. Trùng lặp từng từ
  const qWords = q.split(/\s+/).filter(w => w.length > 1);
  if (qWords.length === 0) return 10;
  let matchCount = 0;
  qWords.forEach(w => {
    if (t.includes(w) || noMarkT.includes(normalizeVisualText(w))) matchCount++;
  });
  const ratio = matchCount / qWords.length;
  if (ratio === 1) return 60;
  if (ratio >= 0.5) return 40;

  // Trừ điểm các bài viết phong cảnh, địa danh, bản đồ hành chính
  if (/(?:bản đồ|hành chính|vị trí|quang cảnh|dân số|tỉnh|huyện|xã|chợ nổi)/i.test(t)) {
    return 5;
  }

  return 10;
}

/**
 * Tìm kiếm ảnh thực tế từ Wikipedia và Wikimedia Commons (Hoàn toàn miễn phí, không cần API Key, không bị CORS)
 */
async function searchWebImages(rawQuery) {
  const clean = cleanQueryForImageSearch(rawQuery);
  if (!clean) return [];

  const results = [];
  const seenUrls = new Set();

  // 1. Tìm trên Wikipedia Tiếng Việt (chất lượng cao nhất về ẩm thực & đời sống Việt Nam)
  const p1 = (async () => {
    try {
      const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: clean,
        gsrlimit: '8',
        prop: 'pageimages',
        piprop: 'thumbnail|original',
        pithumbsize: '600',
        format: 'json',
        origin: '*'
      });
      const res = await fetch(`https://vi.wikipedia.org/w/api.php?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const pages = (data.query && data.query.pages) || {};
      for (const p of Object.values(pages)) {
        const origUrl = (p.original && p.original.source) || '';
        const thumbUrl = (p.thumbnail && p.thumbnail.source) || origUrl;
        const targetUrl = origUrl || thumbUrl;
        const title = p.title || '';
        if (targetUrl && !seenUrls.has(targetUrl)) {
          seenUrls.add(targetUrl);
          const baseScore = calculateWebImageScore(title, clean);
          results.push({
            title: title,
            url: targetUrl,
            thumb: thumbUrl,
            source: 'Wikipedia VN',
            score: baseScore + 5 // Ưu tiên bài viết tiếng Việt
          });
        }
      }
    } catch (e) { }
  })();

  // 2. Tìm trên Wikimedia Commons (kho ảnh mở toàn cầu)
  const p2 = (async () => {
    try {
      const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrnamespace: '6',
        gsrsearch: clean,
        gsrlimit: '10',
        prop: 'imageinfo',
        iiprop: 'url',
        format: 'json',
        origin: '*'
      });
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const pages = (data.query && data.query.pages) || {};
      for (const p of Object.values(pages)) {
        const info = (p.imageinfo && p.imageinfo[0]) || {};
        const url = info.url;
        const title = (p.title || '').replace(/^File:/i, '').replace(/\.[a-zA-Z0-9]+$/, '');
        if (url && !seenUrls.has(url)) {
          const lower = url.toLowerCase();
          if (lower.endsWith('.pdf') || lower.endsWith('.svg') || lower.endsWith('.tif') || lower.endsWith('.djvu')) continue;
          seenUrls.add(url);
          const baseScore = calculateWebImageScore(title, clean);
          results.push({
            title: title,
            url: url,
            thumb: url,
            source: 'Wikimedia Commons',
            score: baseScore
          });
        }
      }
    } catch (e) { }
  })();

  await Promise.allSettled([p1, p2]);

  // Sắp xếp theo mức độ phù hợp cao nhất (ưu tiên ảnh khớp chính xác món ăn nhất)
  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Hiển thị lưới kết quả tìm kiếm ảnh mạng
 */
function renderWebSearchGrid(containerId, results, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!results || results.length === 0) {
    container.innerHTML = `
      <div class="tx-web-empty-state">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 1.5rem; color: #f59e0b; margin-bottom: 6px; display: block;"></i>
        Chưa tìm thấy ảnh phù hợp trên mạng. Bạn hãy thử gõ từ khóa ngắn gọn hơn (ví dụ: "bún bò", "bánh cuốn", "cơm sườn").
      </div>
    `;
    container.style.display = 'grid';
    return;
  }

  container.innerHTML = results.map((item, idx) => `
    <div class="tx-web-card" data-idx="${idx}" title="${escapeTxAttr(item.title)} (${item.source})">
      <img src="${escapeTxAttr(item.thumb || item.url)}" alt="${escapeTxAttr(item.title)}" loading="lazy" />
      <div class="tx-web-card-overlay">${escapeTxHTML(item.title)}</div>
      <button type="button" class="tx-web-card-select-btn">Gán ảnh</button>
    </div>
  `).join('');

  container.style.display = 'grid';

  container.querySelectorAll('.tx-web-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.idx, 10);
      const item = results[idx];
      if (item && typeof onSelect === 'function') {
        onSelect(item);
      }
    });
  });
}

function escapeTxHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeTxAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;');
}

/**
 * Gán trực tiếp ảnh từ Web vào giao dịch hoặc khoản nợ hiện tại
 */
async function applyWebImageDirectly(imageUrl, titleText = '') {
  if (!currentModalTargetId) return;
  const data = getLedgerData();
  if (currentModalTargetType === 'debt') {
    const debt = (data.debts || []).find(d => String(d.id) === String(currentModalTargetId));
    if (debt) debt.image = imageUrl;
    (data.transactions || []).forEach(t => {
      if (String(t.debtId) === String(currentModalTargetId) || String(t.id) === 'tx-debt-' + currentModalTargetId) {
        t.image = imageUrl;
      }
    });
  } else {
    const tx = (data.transactions || []).find(t => String(t.id) === String(currentModalTargetId));
    if (tx) tx.image = imageUrl;
    if (tx && tx.debtId) {
      const debt = (data.debts || []).find(d => String(d.id) === String(tx.debtId));
      if (debt) debt.image = imageUrl;
    }
  }

  saveLedgerData(data);

  // Cập nhật ngay preview lớn trong view modal
  const largeImg = document.getElementById('txImageLargePreview');
  if (largeImg) largeImg.src = imageUrl;

  const metaTitle = document.getElementById('txImageMetaTitle');
  if (metaTitle) {
    metaTitle.innerHTML = `<strong>${escapeTxHTML(titleText || 'Ảnh từ Web')}</strong> <span style="font-size:0.75rem; color:#38bdf8; margin-left:8px;">🌐 Ảnh thực tế từ mạng</span>`;
  }

  if (typeof renderFinanceTab === 'function') renderFinanceTab();
}

/**
 * Tự động tìm kiếm trên mạng và gán ảnh chuẩn nhất chỉ với 1 chạm
 */
async function autoSearchAndApplyWebImage(targetId, targetType) {
  const data = getLedgerData();
  let targetItem = null;
  if (targetType === 'debt') {
    targetItem = (data.debts || []).find(d => String(d.id) === String(targetId));
  } else {
    targetItem = (data.transactions || []).find(t => String(t.id) === String(targetId));
  }

  const query = targetItem ? (targetItem.note || targetItem.reason || targetItem.category || '') : '';
  const clean = cleanQueryForImageSearch(query);
  if (!clean) {
    alert('Không tìm thấy tên món ăn/khoản chi để tìm kiếm.');
    return;
  }

  const btnAuto = document.getElementById('btnQuickAutoApplyTopImage');
  const btnWeb = document.getElementById('btnAutoWebSearchTxImage');
  if (btnAuto) btnAuto.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tìm...';
  if (btnWeb) btnWeb.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tìm...';

  try {
    const results = await searchWebImages(clean);
    if (results && results.length > 0) {
      const best = results[0];
      await applyWebImageDirectly(best.url, best.title);
      // Hiển thị cả lưới ảnh để người dùng có thể đổi nếu muốn
      renderWebSearchGrid('txWebSearchResultsView', results, (chosen) => {
        applyWebImageDirectly(chosen.url, chosen.title);
      });
      const tray = document.getElementById('txWebSearchTrayView');
      if (tray) tray.style.display = 'block';
    } else {
      alert(`Không tìm thấy ảnh trên mạng cho từ khóa: "${clean}". Bạn có thể thử gõ từ khóa khác vào ô tìm kiếm.`);
    }
  } catch (err) {
    alert('Không thể kết nối đến máy chủ tìm kiếm ảnh. Vui lòng kiểm tra lại mạng Internet.');
  } finally {
    if (btnAuto) btnAuto.innerHTML = '<i class="fa-solid fa-bolt"></i> Gán ảnh đầu tiên';
    if (btnWeb) btnWeb.innerHTML = '<i class="fa-solid fa-globe"></i> Tìm ảnh Web';
  }
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

  renderModalPresetChips();

  // Tự động điền từ khóa và tìm kiếm ảnh web trong tab edit
  const data = getLedgerData();
  let targetItem = null;
  if (targetType === 'debt') {
    targetItem = (data.debts || []).find(d => String(d.id) === String(targetId));
  } else {
    targetItem = (data.transactions || []).find(t => String(t.id) === String(targetId));
  }
  const raw = targetItem ? (targetItem.note || targetItem.reason || targetItem.category || '') : '';
  const clean = cleanQueryForImageSearch(raw);
  const inputEdit = document.getElementById('txWebSearchInputEdit');
  const containerEdit = document.getElementById('txWebSearchResultsEdit');
  if (inputEdit) inputEdit.value = clean;
  if (clean && containerEdit) {
    containerEdit.innerHTML = '<div class="tx-web-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem; color:#38bdf8;"></i> Đang tìm kiếm ảnh thực tế trên mạng...</div>';
    containerEdit.style.display = 'grid';
    searchWebImages(clean).then(results => {
      renderWebSearchGrid('txWebSearchResultsEdit', results, (chosen) => {
        setModalPendingPreview(chosen.url);
      });
    });
  }

  modal.classList.add('active');
}

function closeTransactionImageModal() {
  const modal = document.getElementById('transactionImageModal');
  if (modal) modal.classList.remove('active');
  currentModalTargetId = null;
  currentModalActiveImageUrl = null;
  currentPendingModalImage = null;
  const trayView = document.getElementById('txWebSearchTrayView');
  if (trayView) trayView.style.display = 'none';
  const gridEdit = document.getElementById('txWebSearchResultsEdit');
  if (gridEdit) gridEdit.style.display = 'none';
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

  // Nút Tìm ảnh Web trong View Modal
  const btnAutoWeb = document.getElementById('btnAutoWebSearchTxImage');
  const trayView = document.getElementById('txWebSearchTrayView');
  const inputView = document.getElementById('txWebSearchInputView');
  const btnRunSearchView = document.getElementById('btnRunWebSearchView');
  const btnQuickTop = document.getElementById('btnQuickAutoApplyTopImage');

  if (btnAutoWeb && trayView) {
    btnAutoWeb.addEventListener('click', async () => {
      const isHidden = trayView.style.display === 'none' || !trayView.style.display;
      if (isHidden) {
        trayView.style.display = 'block';
        const data = getLedgerData();
        let targetItem = null;
        if (currentModalTargetType === 'debt') {
          targetItem = (data.debts || []).find(d => String(d.id) === String(currentModalTargetId));
        } else {
          targetItem = (data.transactions || []).find(t => String(t.id) === String(currentModalTargetId));
        }
        const raw = targetItem ? (targetItem.note || targetItem.reason || targetItem.category || '') : '';
        const clean = cleanQueryForImageSearch(raw);
        if (inputView) inputView.value = clean;
        if (clean) {
          const container = document.getElementById('txWebSearchResultsView');
          if (container) {
            container.innerHTML = '<div class="tx-web-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem; color:#38bdf8;"></i> Đang tìm kiếm ảnh thực tế trên mạng...</div>';
            container.style.display = 'grid';
          }
          const results = await searchWebImages(clean);
          renderWebSearchGrid('txWebSearchResultsView', results, (chosen) => {
            applyWebImageDirectly(chosen.url, chosen.title);
          });
        }
      } else {
        trayView.style.display = 'none';
      }
    });
  }

  if (btnRunSearchView && inputView) {
    btnRunSearchView.addEventListener('click', async () => {
      const q = inputView.value.trim();
      if (!q) return;
      const container = document.getElementById('txWebSearchResultsView');
      if (container) {
        container.innerHTML = '<div class="tx-web-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem; color:#38bdf8;"></i> Đang tìm kiếm ảnh...</div>';
        container.style.display = 'grid';
      }
      const results = await searchWebImages(q);
      renderWebSearchGrid('txWebSearchResultsView', results, (chosen) => {
        applyWebImageDirectly(chosen.url, chosen.title);
      });
    });
    inputView.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnRunSearchView.click();
      }
    });
  }

  if (btnQuickTop) {
    btnQuickTop.addEventListener('click', () => {
      if (currentModalTargetId) {
        autoSearchAndApplyWebImage(currentModalTargetId, currentModalTargetType);
      }
    });
  }

  // Nút Tìm ảnh Web trong Edit Modal
  const btnRunSearchEdit = document.getElementById('btnRunWebSearchEdit');
  const inputEdit = document.getElementById('txWebSearchInputEdit');
  if (btnRunSearchEdit && inputEdit) {
    btnRunSearchEdit.addEventListener('click', async () => {
      const q = inputEdit.value.trim();
      if (!q) return;
      const container = document.getElementById('txWebSearchResultsEdit');
      if (container) {
        container.innerHTML = '<div class="tx-web-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem; color:#38bdf8;"></i> Đang tìm kiếm...</div>';
        container.style.display = 'grid';
      }
      const results = await searchWebImages(q);
      renderWebSearchGrid('txWebSearchResultsEdit', results, (chosen) => {
        setModalPendingPreview(chosen.url);
      });
    });
    inputEdit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnRunSearchEdit.click();
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
    // 0. Click thumbnail thu hồi nợ / trả nợ (luôn xem ảnh tiền mặt)
    const viewSettleBtn = e.target.closest('[data-action="view-settle-img"]');
    if (viewSettleBtn) {
      e.stopPropagation();
      const moneyUrl = (typeof AUTO_SMART_VISUALS !== 'undefined' && AUTO_SMART_VISUALS.tien)
        ? AUTO_SMART_VISUALS.tien.url
        : 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=400&q=80';
      const imgSrc = viewSettleBtn.dataset.img || moneyUrl;
      const label = viewSettleBtn.dataset.label || 'Thu hồi nợ (Tiền mặt)';
      openViewImageModal(imgSrc, 'settle', 'settle', label, { src: imgSrc, label, key: 'tien' });
      return;
    }

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

  // Tự động quét và tìm kiếm ảnh Web cho toàn bộ giao dịch / sổ nợ chưa có ảnh
  setTimeout(() => {
    if (typeof scanAndAutoFillAllWebImages === 'function') {
      scanAndAutoFillAllWebImages();
    }
  }, 600);
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
window.searchWebImages = searchWebImages;
window.autoSearchAndApplyWebImage = autoSearchAndApplyWebImage;
window.cleanQueryForImageSearch = cleanQueryForImageSearch;
window.autoFetchAndAssignWebImageForItem = autoFetchAndAssignWebImageForItem;
window.scanAndAutoFillAllWebImages = scanAndAutoFillAllWebImages;
