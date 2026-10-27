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

  // 4. Hải sản / Ốc / Nghêu sò
  if (
    norm.includes('hai san') || norm.includes('oc ') || norm.endsWith('oc') ||
    norm.includes('ngheu') || norm.includes('so ') || norm.includes('cua ') ||
    norm.includes('tom ') || norm.includes('muc ') || norm.includes('hau ') ||
    norm.includes('oc huong') || norm.includes('oc buou') || norm.includes('oc len') ||
    norm.includes('so diep') || norm.includes('so huyet') || norm.includes('ghe ')
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

  // 32. Mượn tiền, vay tiền, trả nợ
  if (
    norm.includes('muon tien') || norm.includes('vay tien') || norm.includes('tien mat') ||
    norm.includes('chuyen khoan') || norm.includes('muon') || norm.includes('vay') ||
    norm.includes('no tien') || norm.includes('tien') || norm.includes('tra no')
  ) {
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

  const btnGenAI = document.getElementById('btnGenerateAITxImage');
  if (btnGenAI) {
    btnGenAI.addEventListener('click', () => {
      const data = getLedgerData();
      let targetItem = null;
      if (currentModalTargetType === 'debt') {
        targetItem = (data.debts || []).find(d => String(d.id) === String(currentModalTargetId));
      } else {
        targetItem = (data.transactions || []).find(t => String(t.id) === String(currentModalTargetId));
      }
      const rawNote = targetItem && (targetItem.note || (targetItem.category ? targetItem.category : '')) || '';
      const promptText = rawNote.trim() ? rawNote.trim() : 'Món ăn Việt Nam';
      closeTransactionImageModal();
      if (typeof openImageGenModal === 'function') {
        openImageGenModal(`Chụp ảnh món ${promptText} thơm ngon bày trên đĩa, phong cách ẩm thực cao cấp, ánh sáng tự nhiên chân thực, sắc nét 8k`, 'photorealistic', '1:1');
      } else {
        alert(`Bạn có thể dùng tính năng Tạo Ảnh AI để vẽ món: ${promptText}`);
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
