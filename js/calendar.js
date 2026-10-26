/**
 * js/calendar.js - Quản lý Lịch Vạn Niên & Sự Kiện (Interactive Lunar-Solar Calendar Engine)
 * Tích hợp thuật toán chuyển đổi Âm - Dương lịch Việt Nam chính xác, tra cứu ngày lễ truyền thống,
 * tính Can Chi ngày/năm và đồng bộ đa chiều với To-Do và Sổ Thu Chi.
 */

let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth(); // 0-11
let calSelectedDateStr = getFormattedDateKey(new Date()); // YYYY-MM-DD
let editingEventId = null;
let userManuallyPickedColor = false;

const EVENT_COLORS = [
  '#6366f1', // Indigo (Toán học, Logic)
  '#06b6d4', // Cyan (Khoa học Tự nhiên)
  '#0284c7', // Sky Blue (Ngôn ngữ, Xã hội)
  '#8b5cf6', // Electric Violet (Tin học, Lập trình)
  '#f43f5e', // Rose Coral (Giải trí, Âm nhạc, Đi hát)
  '#10b981', // Emerald (Thể thao, Sức khỏe)
  '#f97316', // Warm Orange (Hẹn hò, Cafe)
  '#f59e0b', // Amber Gold (Thi cử, Deadline)
  '#ec4899', // Hot Pink (Sinh nhật, Kỷ niệm)
  '#a855f7'  // Royal Purple (Công việc, Dự án)
];
let selectedEventColor = EVENT_COLORS[0];

// 1. DANH SÁCH CÁC NGÀY LỄ LỚN CỐ ĐỊNH DƯƠNG LỊCH (Định dạng: 'DD-MM')
const SOLAR_HOLIDAYS = {
  '01-01': { name: 'Tết Dương Lịch', icon: '🎆', desc: 'Khởi đầu năm mới dương lịch tràn đầy niềm vui' },
  '14-02': { name: 'Lễ Tình Nhân (Valentine)', icon: '💖', desc: 'Ngày tôn vinh tình yêu đôi lứa' },
  '08-03': { name: 'Quốc Tế Phụ Nữ (8/3)', icon: '🌸', desc: 'Tôn vinh và yêu thương một nửa thế giới' },
  '30-04': { name: 'Giải Phóng Miền Nam (30/4)', icon: '🇻🇳', desc: 'Ngày Giải phóng miền Nam, Thống nhất non sông đất nước' },
  '01-05': { name: 'Quốc Tế Lao Động (1/5)', icon: '⚒️', desc: 'Ngày tôn vinh giai cấp lao động toàn thế giới' },
  '01-06': { name: 'Quốc Tế Thiếu Nhi (1/6)', icon: '🎈', desc: 'Ngày hội vui tươi tràn ngập tiếng cười của các em nhỏ' },
  '02-09': { name: 'Quốc Khánh Việt Nam (2/9)', icon: '🇻🇳', desc: 'Tết Độc lập thiêng liêng của toàn thể dân tộc Việt Nam' },
  '20-10': { name: 'Phụ Nữ Việt Nam (20/10)', icon: '💐', desc: 'Tôn vinh nét đẹp và phẩm chất phụ nữ Việt Nam' },
  '31-10': { name: 'Lễ Hội Halloween', icon: '🎃', desc: 'Lễ hội hóa trang rộn ràng màu sắc' },
  '20-11': { name: 'Nhà Giáo Việt Nam (20/11)', icon: '🎓', desc: 'Tri ân công ơn dạy dỗ của quý thầy cô giáo' },
  '24-12': { name: 'Đêm Giáng Sinh (Noel Eve)', icon: '🎄', desc: 'Đêm an lành bên gia đình và người thân' },
  '25-12': { name: 'Lễ Giáng Sinh (Noel)', icon: '🎅', desc: 'Ngày mừng Chúa Giáng Sinh an lành và hạnh phúc' }
};

// 2. DANH SÁCH CÁC NGÀY LỄ TRUYỀN THỐNG LỚN ÂM LỊCH (Định dạng: 'DD-MM')
const LUNAR_HOLIDAYS = {
  '01-01': { name: 'Tết Nguyên Đán (Mùng 1)', icon: '🧧', desc: 'Khởi đầu năm mới an khang thịnh vượng, vạn sự như ý' },
  '02-01': { name: 'Tết Nguyên Đán (Mùng 2)', icon: '🧧', desc: 'Mùng 2 Tết - Chúc tết sum vầy ấm cúng' },
  '03-01': { name: 'Tết Nguyên Đán (Mùng 3)', icon: '🧧', desc: 'Mùng 3 Tết - Mùng ba tết thầy' },
  '15-01': { name: 'Tết Nguyên Tiêu', icon: '🏮', desc: 'Rằm tháng Giêng, ngày lễ cầu an lớn nhất đầu năm' },
  '10-03': { name: 'Giỗ Tổ Hùng Vương', icon: '👑', desc: 'Dù ai đi ngược về xuôi, nhớ ngày Giỗ Tổ mùng mười tháng ba' },
  '15-04': { name: 'Đại Lễ Phật Đản', icon: '🪷', desc: 'Kỷ niệm ngày Đức Phật Thích Ca Đản sinh' },
  '05-05': { name: 'Tết Đoan Ngọ', icon: '🌾', desc: 'Tết diệt sâu bọ, thưởng thức cơm rượu nếp thơm nồng' },
  '15-07': { name: 'Vu Lan Báo Hiếu', icon: '🕯️', desc: 'Rằm tháng Bảy, mùa báo hiếu mẹ cha và xá tội vong nhân' },
  '15-08': { name: 'Tết Trung Thu', icon: '🥮', desc: 'Tết đoàn viên, ngắm trăng rằm, phá cỗ rước đèn' },
  '23-12': { name: 'Tiễn Táo Quân Về Trời', icon: '🐟', desc: 'Lễ cúng ông Công ông Táo chầu trời' }
};

const CAN_NAMES = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI_NAMES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

/**
 * Thuật toán thiên văn chuyển đổi Dương lịch sang Âm lịch Việt Nam (Hồ Ngọc Đức)
 */
function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getNewMoonDay(k, timeZone) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr);
  C1 -= 0.0004 * Math.sin(3 * dr * Mpr);
  C1 += 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr);
  C1 -= 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
  C1 -= 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
  C1 += 0.0010 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((2 * Mpr + M) * dr);
  const deltat = (T < -11)
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000078 + 0.000076 * T + 0.0000609 * T2;
  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24.0);
}

function getSunLongitude(jdn, timeZone) {
  const T = (jdn - 2451545.5 - timeZone / 24.0) / 36525.0;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor(L / (Math.PI / 6));
}

function getLunarMonth11(yy, timeZone) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11, timeZone) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  while (true) {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    if (!(arc !== last && i < 14)) break;
  }
  return i - 1;
}

function convertSolar2Lunar(dd, mm, yy, timeZone = 7) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29.0);
  let lunarLeap = 0;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = 1;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear--;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
}

function getCanChiDay(dd, mm, yy) {
  const jd = jdFromDate(dd, mm, yy);
  const can = CAN_NAMES[(jd + 9) % 10];
  const chi = CHI_NAMES[(jd + 1) % 12];
  return `${can} ${chi}`;
}

function getCanChiYear(lunarYear) {
  const can = CAN_NAMES[(lunarYear + 6) % 10];
  const chi = CHI_NAMES[(lunarYear + 8) % 12];
  return `${can} ${chi}`;
}

/**
 * Tra cứu ngày lễ (Dương hoặc Âm) cho một ngày cụ thể (dd: 1-31, mm: 1-12, yy: năm)
 */
function getHolidayInfo(dd, mm, yy) {
  // 1. Định dạng khóa Dương lịch: 'DD-MM' (VD: '20-10', '20-11')
  const solarKey = `${String(dd).padStart(2, '0')}-${String(mm).padStart(2, '0')}`;

  // 2. Tính toán Âm lịch & định dạng khóa: 'DD-MM' (VD: '10-03', '15-08')
  const lunar = convertSolar2Lunar(dd, mm, yy);
  const lunarKey = `${String(lunar.day).padStart(2, '0')}-${String(lunar.month).padStart(2, '0')}`;

  // Kiểm tra ngày lễ truyền thống lớn Âm lịch trước (Tết, Giỗ Tổ, Vu Lan, Trung Thu, Đoan Ngọ...)
  if (LUNAR_HOLIDAYS[lunarKey]) {
    return { ...LUNAR_HOLIDAYS[lunarKey], type: 'lunar', lunar };
  }

  // Kiểm tra ngày lễ Dương lịch (20/10, 20/11, 30/4, 1/5, 2/9, 8/3, Valentine, Noel...)
  if (SOLAR_HOLIDAYS[solarKey]) {
    return { ...SOLAR_HOLIDAYS[solarKey], type: 'solar', lunar };
  }

  // 3. Đêm Giao Thừa (ngày cuối cùng của tháng 12 âm lịch: ngày mai là mùng 1 tháng Giêng)
  if (lunar.month === 12) {
    const nextDate = new Date(yy, mm - 1, dd + 1);
    const nextDayLunar = convertSolar2Lunar(nextDate.getDate(), nextDate.getMonth() + 1, nextDate.getFullYear());
    if (nextDayLunar.month === 1 && nextDayLunar.day === 1) {
      return { name: 'Đêm Giao Thừa (Tất Niên)', icon: '🎇', desc: 'Thời khắc chuyển giao thiêng liêng sang năm mới', type: 'lunar', lunar };
    }
  }

  // 4. Ngày Rằm (15 Âm lịch) & Mùng Một
  if (lunar.day === 15) {
    return { name: 'Ngày rằm', icon: '🌕', desc: 'Rằm trăng tròn tháng ' + lunar.month + ' âm lịch', type: 'lunar-phase', lunar };
  }
  if (lunar.day === 1) {
    return { name: 'Mùng một', icon: '🌑', desc: 'Mùng 1 đầu tháng ' + lunar.month + ' âm lịch', type: 'lunar-phase', lunar };
  }

  return null;
}

function getFormattedDateKey(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Render toàn bộ phân hệ Lịch
 */
function renderCalendarTab() {
  renderCalendarMonthGrid();
  renderSelectedDayDetails();
}

/**
 * Render bảng lưới lịch tháng
 */
function renderCalendarMonthGrid() {
  const titleEl = document.getElementById('calMonthTitle');
  const grid = document.getElementById('calDaysGrid');
  if (!grid) return;

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  if (titleEl) {
    titleEl.textContent = `${monthNames[calCurrentMonth]}, ${calCurrentYear}`;
  }

  const data = typeof getLedgerData === 'function' ? getLedgerData() : {};
  const events = Array.isArray(data.calendarEvents) ? data.calendarEvents : [];
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const transactions = Array.isArray(data.transactions) ? data.transactions : [];

  const todayKey = getFormattedDateKey(new Date());

  // Ngày đầu tiên trong tháng
  const firstDay = new Date(calCurrentYear, calCurrentMonth, 1);
  let startDayOfWeek = firstDay.getDay() === 0 ? 6 : (firstDay.getDay() - 1);

  const daysInCurrentMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

  let html = '';

  // 1. Ngày tháng trước
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDayNum = daysInPrevMonth - i;
    const prevDate = new Date(calCurrentYear, calCurrentMonth - 1, prevDayNum);
    const dateKey = getFormattedDateKey(prevDate);
    html += renderDayCellHTML(prevDayNum, prevDate.getMonth() + 1, prevDate.getFullYear(), dateKey, true, false, dateKey === calSelectedDateStr, events, tasks, transactions, prevDate.getDay() === 0);
  }

  // 2. Ngày tháng hiện tại
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const curDate = new Date(calCurrentYear, calCurrentMonth, d);
    const dateKey = getFormattedDateKey(curDate);
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === calSelectedDateStr;
    html += renderDayCellHTML(d, calCurrentMonth + 1, calCurrentYear, dateKey, false, isToday, isSelected, events, tasks, transactions, curDate.getDay() === 0);
  }

  // 3. Ngày tháng sau
  const totalCells = startDayOfWeek + daysInCurrentMonth;
  const nextPadding = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let n = 1; n <= nextPadding; n++) {
    const nextDate = new Date(calCurrentYear, calCurrentMonth + 1, n);
    const dateKey = getFormattedDateKey(nextDate);
    html += renderDayCellHTML(n, nextDate.getMonth() + 1, nextDate.getFullYear(), dateKey, true, false, dateKey === calSelectedDateStr, events, tasks, transactions, nextDate.getDay() === 0);
  }

  grid.innerHTML = html;

  // Bắt sự kiện chọn ngày
  grid.querySelectorAll('.cal-day-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      calSelectedDateStr = cell.dataset.date;
      renderCalendarMonthGrid();
      renderSelectedDayDetails();
    });
  });
}

/**
 * Kiểm tra xem một sự kiện lịch có diễn ra vào ngày dateKey (YYYY-MM-DD) hay không.
 * Hỗ trợ sự kiện thường, sự kiện nhiều ngày và các chế độ lặp lại thông minh:
 * - 'daily': Hàng ngày
 * - 'workdays': Thứ 2 - Thứ 6 (ngày làm việc)
 * - 'weekly': Hàng tuần (cùng thứ)
 * - 'monthly': Hàng tháng (cùng ngày)
 * - 'yearly': Hàng năm (cùng ngày & tháng)
 */
function isEventOccurringOnDate(event, dateKey) {
  if (!event || !event.date || !dateKey) return false;

  const repeatMode = event.repeat || 'none';

  // 0. Kiểm tra ngày bị loại trừ (nếu người dùng chọn xóa riêng lẻ lần lặp trong chuỗi sự kiện lặp lại)
  if (repeatMode !== 'none' && Array.isArray(event.excludedDates) && event.excludedDates.includes(dateKey)) {
    return false;
  }

  // Không bao giờ diễn ra trước ngày bắt đầu sự kiện
  if (dateKey < event.date) return false;

  // 1. Không lặp lại
  if (repeatMode === 'none') {
    if (event.endDate && event.endDate !== event.date) {
      return dateKey >= event.date && dateKey <= event.endDate;
    }
    return dateKey === event.date;
  }

  // 2. Kiểm tra giới hạn ngày kết thúc lặp lại (nếu có cài đặt)
  const repeatUntil = event.repeatUntil || event.repeatEnd || event.until || (event.endDate && event.endDate > event.date && event.repeat && event.repeat !== 'none' ? event.endDate : '');
  if (repeatUntil && dateKey > repeatUntil) {
    return false;
  }

  // Chu kỳ: Mỗi X (interval) Y (unit)
  let interval = Math.max(1, parseInt(event.repeatInterval, 10) || 1);
  let unit = event.repeatUnit;

  if (!unit) {
    if (repeatMode === 'daily') unit = 'day';
    else if (repeatMode === 'weekly') unit = 'week';
    else if (repeatMode === 'monthly') unit = 'month';
    else if (repeatMode === 'yearly') unit = 'year';
    else if (repeatMode === 'workdays') unit = 'workdays';
    else unit = 'day';
  }

  const [tY, tM, tD] = dateKey.split('-').map(Number);
  const [sY, sM, sD] = event.date.split('-').map(Number);
  const targetDate = new Date(tY, tM - 1, tD);
  const startDate = new Date(sY, sM - 1, sD);

  // 1. Mỗi X ngày
  if (unit === 'day' || unit === 'daily') {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((targetDate.getTime() - startDate.getTime()) / msPerDay);
    if (diffDays < 0) return false;
    return diffDays % interval === 0;
  }

  // 2. Mỗi X tuần (cùng thứ trong tuần hoặc theo các thứ daysOfWeek)
  if (unit === 'week' || unit === 'weekly') {
    const rawDays = event.daysOfWeek || event.repeatDays;
    let allowedDays = null;
    if (Array.isArray(rawDays) && rawDays.length > 0) {
      allowedDays = rawDays.map(d => {
        if (typeof d === 'number') return d;
        const str = String(d).toLowerCase().trim();
        if (str.includes('cn') || str.includes('chủ nhật') || str === '0') return 0;
        if (str.includes('t2') || str.includes('thứ 2') || str.includes('thứ hai') || str === '1') return 1;
        if (str.includes('t3') || str.includes('thứ 3') || str.includes('thứ ba') || str === '2') return 2;
        if (str.includes('t4') || str.includes('thứ 4') || str.includes('thứ tư') || str === '3') return 3;
        if (str.includes('t5') || str.includes('thứ 5') || str.includes('thứ năm') || str === '4') return 4;
        if (str.includes('t6') || str.includes('thứ 6') || str.includes('thứ sáu') || str === '5') return 5;
        if (str.includes('t7') || str.includes('thứ 7') || str.includes('thứ bảy') || str === '6') return 6;
        return null;
      }).filter(x => x !== null);
    }

    const targetDay = targetDate.getDay();
    if (allowedDays && allowedDays.length > 0) {
      if (!allowedDays.includes(targetDay)) return false;
    } else {
      if (targetDay !== startDate.getDay()) return false;
    }

    // Tính khoảng cách tuần theo Thứ Hai của tuần (ISO week)
    const mondayTarget = new Date(targetDate);
    const dayT = mondayTarget.getDay();
    mondayTarget.setDate(mondayTarget.getDate() - dayT + (dayT === 0 ? -6 : 1));
    mondayTarget.setHours(0, 0, 0, 0);

    const mondayStart = new Date(startDate);
    const dayS = mondayStart.getDay();
    mondayStart.setDate(mondayStart.getDate() - dayS + (dayS === 0 ? -6 : 1));
    mondayStart.setHours(0, 0, 0, 0);

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffWeeks = Math.round((mondayTarget.getTime() - mondayStart.getTime()) / msPerWeek);
    if (diffWeeks < 0) return false;
    return diffWeeks % interval === 0;
  }

  // 3. Mỗi X tháng (cùng ngày trong tháng)
  if (unit === 'month' || unit === 'monthly') {
    const diffMonths = (tY - sY) * 12 + (tM - sM);
    if (diffMonths < 0) return false;
    if (diffMonths % interval !== 0) return false;
    const daysInTargetMonth = new Date(tY, tM, 0).getDate();
    const effectiveDay = Math.min(sD, daysInTargetMonth);
    return tD === effectiveDay;
  }

  // 4. Mỗi X năm (cùng ngày & tháng)
  if (unit === 'year' || unit === 'yearly') {
    const diffYears = tY - sY;
    if (diffYears < 0) return false;
    if (diffYears % interval !== 0) return false;
    if (sM === 2 && sD === 29) {
      const isLeapYear = (tY % 4 === 0 && tY % 100 !== 0) || (tY % 400 === 0);
      return tM === 2 && (isLeapYear ? tD === 29 : tD === 28);
    }
    return tM === sM && tD === sD;
  }

  // 5. Thứ 2 đến Thứ 6 (workdays)
  if (unit === 'workdays') {
    const dayOfWeek = targetDate.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  return false;
}

function getRepeatLabel(evOrRepeat, interval, unit) {
  let r = evOrRepeat;
  let intv = interval;
  let u = unit;
  if (typeof evOrRepeat === 'object' && evOrRepeat !== null) {
    r = evOrRepeat.repeat;
    intv = evOrRepeat.repeatInterval;
    u = evOrRepeat.repeatUnit;
  }
  if (!r || r === 'none') return '';
  const num = Math.max(1, parseInt(intv, 10) || 1);
  const effectiveUnit = u || (r === 'daily' ? 'day' : r === 'weekly' ? 'week' : r === 'monthly' ? 'month' : r === 'yearly' ? 'year' : r);

  let label = '';
  if (effectiveUnit === 'day' || effectiveUnit === 'daily') {
    label = num === 1 ? 'Mỗi ngày' : `Mỗi ${num} ngày`;
  } else if (effectiveUnit === 'week' || effectiveUnit === 'weekly') {
    const rawDays = (typeof evOrRepeat === 'object' && evOrRepeat !== null) ? (evOrRepeat.daysOfWeek || evOrRepeat.repeatDays) : null;
    if (Array.isArray(rawDays) && rawDays.length > 0) {
      const dayMap = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };
      const daysStr = rawDays.map(d => dayMap[d] || d).join(', ');
      label = num === 1 ? `Mỗi tuần (${daysStr})` : `Mỗi ${num} tuần (${daysStr})`;
    } else {
      label = num === 1 ? 'Mỗi tuần' : `Mỗi ${num} tuần`;
    }
  } else if (effectiveUnit === 'month' || effectiveUnit === 'monthly') {
    label = num === 1 ? 'Mỗi tháng' : `Mỗi ${num} tháng`;
  } else if (effectiveUnit === 'year' || effectiveUnit === 'yearly') {
    label = num === 1 ? 'Mỗi năm' : `Mỗi ${num} năm`;
  } else if (effectiveUnit === 'workdays') {
    label = 'Thứ 2 - Thứ 6';
  } else {
    label = `Mỗi ${num} ${effectiveUnit}`;
  }

  if (typeof evOrRepeat === 'object' && evOrRepeat !== null) {
    const until = evOrRepeat.repeatUntil || evOrRepeat.repeatEnd || (evOrRepeat.endDate && evOrRepeat.endDate > evOrRepeat.date && evOrRepeat.repeat && evOrRepeat.repeat !== 'none' ? evOrRepeat.endDate : '');
    if (until) {
      const [uY, uM, uD] = until.split('-');
      if (uD && uM) label += ` (đến ${uD}/${uM}${uY ? '/' + uY : ''})`;
    }
  }
  return label;
}

function renderDayCellHTML(dayNum, monthNum, yearNum, dateKey, isOtherMonth, isToday, isSelected, events, tasks, transactions, isSunday) {
  // 1. Tính toán ngày Âm lịch
  const lunar = convertSolar2Lunar(dayNum, monthNum, yearNum);
  const holiday = getHolidayInfo(dayNum, monthNum, yearNum);

  // Hiển thị ngày âm lịch: nếu là ngày 1 âm lịch thì hiển thị "1/tháng" (VD: 1/9)
  const lunarDisplay = (lunar.day === 1) ? `1/${lunar.month}` : String(lunar.day);
  const isSpecialLunar = lunar.day === 1 || lunar.day === 15;

  // Đếm sự kiện người dùng tự thêm (hỗ trợ cả sự kiện lặp lại và nhiều ngày), tasks, thu chi
  const dayEvents = events.filter(e => isEventOccurringOnDate(e, dateKey));
  const hasTask = tasks.some(t => {
    if (t.dueDate === dateKey) return true;
    if (t.timestamp && getFormattedDateKey(new Date(t.timestamp)) === dateKey) return true;
    return false;
  });
  const hasTx = transactions.some(t => {
    if (t.timestamp && getFormattedDateKey(new Date(t.timestamp)) === dateKey) return true;
    return false;
  });

  let dotsHtml = '';
  if (dayEvents.length > 0) {
    const MAX_EVENT_DOTS = 3;
    dayEvents.slice(0, MAX_EVENT_DOTS).forEach(ev => {
      const theme = (typeof getSmartEventTheme === 'function')
        ? getSmartEventTheme(ev)
        : { color: ev.color || '#a855f7', name: ev.title || 'Sự kiện' };
      const dotColor = theme.color || ev.color || '#a855f7';
      const timeStr = ev.time ? ` (${ev.time}${ev.endTime ? ' - ' + ev.endTime : ''})` : '';
      const dotTitle = `${ev.title || 'Sự kiện'}${timeStr}`;
      dotsHtml += `<span class="cal-dot event" style="background: ${dotColor}; color: ${dotColor}; box-shadow: 0 0 5px ${dotColor};" title="${escapeHTML(dotTitle)}"></span>`;
    });
    if (dayEvents.length > MAX_EVENT_DOTS) {
      dotsHtml += `<span class="cal-dot-more" title="Còn ${dayEvents.length - MAX_EVENT_DOTS} sự kiện khác">+${dayEvents.length - MAX_EVENT_DOTS}</span>`;
    }
  }
  if (hasTask) dotsHtml += '<span class="cal-dot task" title="Có việc cần làm"></span>';
  if (hasTx) dotsHtml += '<span class="cal-dot tx" title="Có giao dịch thu chi"></span>';

  const isHoliday = !!holiday;
  const solarClass = (isSunday || isHoliday) ? 'is-holiday' : '';

  return `
    <div class="cal-day-cell ${isOtherMonth ? 'is-other-month' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${dateKey}">
      <div class="cal-day-top">
        <span class="cal-day-solar ${solarClass}">${String(dayNum).padStart(2, '0')}</span>
        <span class="cal-day-lunar ${isSpecialLunar ? 'special' : ''}">${lunarDisplay}</span>
      </div>

      ${holiday ? `
        <div class="cal-day-holiday ${holiday.type === 'lunar' ? 'lunar-event' : (holiday.type === 'lunar-phase' ? 'lunar-phase' : '')}" title="${escapeHTML(holiday.name)}">
          ${escapeHTML(holiday.name)}
        </div>
      ` : '<div style="flex: 1;"></div>'}

      <div class="cal-day-bottom">
        <div class="cal-dots-wrap">${dotsHtml}</div>
      </div>
    </div>
  `;
}

/**
 * Render chi tiết các mục trong ngày được chọn ở cột phải
 */
function renderSelectedDayDetails() {
  const container = document.getElementById('calDayTimelineList');
  const dateTitleEl = document.getElementById('calDetailDateTitle');
  const dateSubEl = document.getElementById('calDetailDateSub');
  if (!container) return;

  const [y, m, d] = calSelectedDateStr.split('-').map(Number);
  const selectedDate = new Date(y, m - 1, d);

  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[selectedDate.getDay()];
  const isToday = calSelectedDateStr === getFormattedDateKey(new Date());

  // Tính ngày âm lịch và can chi
  const lunar = convertSolar2Lunar(d, m, y);
  const canChiDay = getCanChiDay(d, m, y);
  const canChiYear = getCanChiYear(lunar.year);
  const holiday = getHolidayInfo(d, m, y);

  if (dateTitleEl) {
    dateTitleEl.textContent = `${dayName}, ${d}/${m}/${y}`;
  }
  if (dateSubEl) {
    dateSubEl.innerHTML = `
      <span>Âm lịch: <strong>${lunar.day}/${lunar.month}</strong> (Năm ${canChiYear} • Ngày ${canChiDay})</span>
      ${isToday ? ' • <span style="color: #fbbf24; font-weight: 700;">Hôm nay</span>' : ''}
    `;
  }

  const data = typeof getLedgerData === 'function' ? getLedgerData() : {};
  const allEvents = Array.isArray(data.calendarEvents) ? data.calendarEvents : [];
  const allTasks = Array.isArray(data.tasks) ? data.tasks : [];
  const allTxs = Array.isArray(data.transactions) ? data.transactions : [];

  // Lọc theo ngày đang chọn (hỗ trợ cả sự kiện lặp lại và sự kiện kéo dài nhiều ngày)
  const dayEvents = allEvents.filter(e => isEventOccurringOnDate(e, calSelectedDateStr));
  const dayTasks = allTasks.filter(t => {
    if (t.dueDate === calSelectedDateStr) return true;
    if (isToday && (t.time === 'Hôm nay' || !t.time)) return true;
    if (t.timestamp && getFormattedDateKey(new Date(t.timestamp)) === calSelectedDateStr) return true;
    return false;
  });
  const dayTxs = allTxs.filter(t => {
    if (t.timestamp && getFormattedDateKey(new Date(t.timestamp)) === calSelectedDateStr) return true;
    return false;
  });

  let html = '';

  // 1. Thẻ Banner Ngày Lễ / Kỷ Niệm nếu có
  if (holiday) {
    html += `
      <div class="cal-holiday-banner">
        <div class="cal-holiday-banner-icon">${holiday.icon || '🎉'}</div>
        <div>
          <div class="cal-holiday-banner-title">${escapeHTML(holiday.name)}</div>
          <div class="cal-holiday-banner-desc">${escapeHTML(holiday.desc || 'Ngày lễ đặc biệt trong năm')}</div>
        </div>
      </div>
    `;
  }

  // 2. Phân mục Sự kiện lịch người dùng tự thêm
  if (dayEvents.length > 0) {
    html += `
      <div class="cal-section-group">
        <div class="cal-section-title">
          <i class="fa-regular fa-calendar-check" style="color: #a855f7;"></i>
          <span>Sự kiện &amp; Ghi chú riêng (${dayEvents.length})</span>
        </div>
        ${dayEvents.map(ev => {
          const sched = formatEventScheduleBadge(ev);
          const isMultiDay = !!(ev.endDate && ev.endDate !== ev.date);
          const repeatLabel = getRepeatLabel(ev);
          const theme = (typeof getSmartEventTheme === 'function')
            ? getSmartEventTheme(ev)
            : { color: ev.color || '#a855f7', icon: 'fa-regular fa-calendar-check', tagText: ev.category || 'Học tập' };
          const evColor = theme.color || ev.color || '#a855f7';
          const evIcon = theme.icon || 'fa-regular fa-calendar-check';
          const evTag = theme.tagText || ev.category || 'Học tập';
          const evGlow = theme.glow || 'rgba(168, 85, 247, 0.2)';
          return `
            <div class="cal-event-card" style="border-left-color: ${evColor}; border-color: ${evColor}44; background: linear-gradient(135deg, ${evGlow} 0%, rgba(30, 41, 59, 0.45) 100%);">
              <div class="cal-event-card-top">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <i class="${evIcon}" style="color: ${evColor}; font-size: 0.95rem;"></i>
                  <strong class="cal-event-name">${escapeHTML(ev.title)}</strong>
                </div>
                <div class="cal-event-tools">
                  <button type="button" class="btn-cal-tool edit" data-action="edit-event" data-id="${ev.id}" title="Chỉnh sửa sự kiện">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button type="button" class="btn-cal-tool" data-action="del-event" data-id="${ev.id}" data-date="${calSelectedDateStr}" title="Xóa sự kiện">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
              <div class="cal-event-meta">
                ${sched ? `<span><i class="fa-regular fa-clock"></i> ${escapeHTML(sched)}</span>` : ''}
                ${isMultiDay ? `<span class="cal-multiday-badge"><i class="fa-solid fa-arrows-left-right"></i> Nhiều ngày</span>` : ''}
                ${repeatLabel ? `<span class="cal-repeat-badge"><i class="fa-solid fa-rotate"></i> ${escapeHTML(repeatLabel)}</span>` : ''}
                <span class="cal-cat-badge" style="background: ${evColor}25; color: ${evColor}; border: 1px solid ${evColor}44; font-weight: 600;">${escapeHTML(evTag)}</span>
              </div>
              ${ev.note ? `<div class="cal-event-note"><i class="fa-regular fa-note-sticky"></i> ${escapeHTML(ev.note)}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 3. Phân mục Công việc To-Do
  if (dayTasks.length > 0) {
    html += `
      <div class="cal-section-group">
        <div class="cal-section-title">
          <i class="fa-solid fa-list-check" style="color: #10b981;"></i>
          <span>Công việc To-Do (${dayTasks.length})</span>
        </div>
        ${dayTasks.map(tk => `
          <div class="cal-todo-mini-row ${tk.done ? 'done' : ''}">
            <i class="fa-solid ${tk.done ? 'fa-circle-check' : 'fa-circle-notch'}" style="color: ${tk.done ? '#10b981' : '#94a3b8'};"></i>
            <span>${escapeHTML(tk.title)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 4. Phân mục Thu chi trong ngày
  if (dayTxs.length > 0) {
    html += `
      <div class="cal-section-group">
        <div class="cal-section-title">
          <i class="fa-solid fa-coins" style="color: #f59e0b;"></i>
          <span>Thu chi trong ngày (${dayTxs.length})</span>
        </div>
        ${dayTxs.map(t => {
          const isIncome = t.type === 'income';
          return `
            <div class="cal-tx-mini-row">
              <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'}" style="color: ${isIncome ? '#34d399' : '#fb7185'}; font-size: 0.8rem;"></i>
                <span>${escapeHTML(t.category || (isIncome ? 'Khoản thu' : 'Chi tiêu'))} ${t.note ? `<small style="color: #94a3b8;">(${escapeHTML(t.note)})</small>` : ''}</span>
              </div>
              <strong class="cal-tx-amount ${t.type}">${isIncome ? '+' : '-'}${typeof formatCurrency === 'function' ? formatCurrency(t.amount) : (Number(t.amount) || 0).toLocaleString('vi-VN') + 'đ'}</strong>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  const totalItems = dayEvents.length + dayTasks.length + dayTxs.length;
  if (!holiday && totalItems === 0) {
    html = `
      <div class="cal-day-empty-box">
        <img src="assets/najimez.jpg" alt="Najimez" />
        <strong>Ngày này chưa có kế hoạch hay giao dịch nào.</strong>
        <p>Bấm nút <strong>"+ Thêm Sự Kiện"</strong> ở góc trên để ghi chú lịch hẹn, sinh nhật hoặc sự kiện quan trọng nhé!</p>
      </div>
    `;
  }

  container.innerHTML = html;

  // Bắt sự kiện chỉnh sửa sự kiện
  container.querySelectorAll('[data-action="edit-event"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const curData = getLedgerData();
      const ev = (curData.calendarEvents || []).find(x => x.id === id);
      if (ev) openCalendarEventModal(ev.date, ev);
    });
  });

  // Bắt sự kiện xóa sự kiện (hỗ trợ 3 tùy chọn khi xóa sự kiện lặp lại)
  container.querySelectorAll('[data-action="del-event"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const targetDate = btn.dataset.date || calSelectedDateStr;
      const curData = getLedgerData();
      const ev = (curData.calendarEvents || []).find(x => x.id === id);
      if (!ev) return;

      const isRepeating = ev.repeat && ev.repeat !== 'none';

      if (isRepeating) {
        const scope = await promptRecurringEventDeleteScope(ev, targetDate);
        if (!scope) return; // Người dùng bấm Hủy

        if (scope === 'this') {
          // 1. Chỉ xóa sự kiện này: thêm ngày targetDate vào danh sách excludedDates
          if (!Array.isArray(ev.excludedDates)) {
            ev.excludedDates = [];
          }
          if (!ev.excludedDates.includes(targetDate)) {
            ev.excludedDates.push(targetDate);
          }
          saveLedgerData(curData);
          renderCalendarTab();
          if (typeof renderTimetableTab === 'function') renderTimetableTab();
          if (typeof showAppToast === 'function') {
            const [y, m, d] = targetDate.split('-');
            showAppToast(`Đã xóa sự kiện ngày ${d}/${m}/${y}`, 'info');
          }
        } else if (scope === 'following') {
          // 2. Sự kiện này và các sự kiện sau đó:
          // Nếu ngày đang chọn trùng hoặc trước ngày bắt đầu chuỗi -> xóa toàn bộ
          if (targetDate <= ev.date) {
            curData.calendarEvents = (curData.calendarEvents || []).filter(x => x.id !== id);
          } else {
            // Giới hạn repeatUntil về ngày liền trước ngày đang chọn
            const [y, m, d] = targetDate.split('-').map(Number);
            const prevDt = new Date(y, m - 1, d);
            prevDt.setDate(prevDt.getDate() - 1);
            ev.repeatUntil = getFormattedDateKey(prevDt);
          }
          saveLedgerData(curData);
          renderCalendarTab();
          if (typeof renderTimetableTab === 'function') renderTimetableTab();
          if (typeof showAppToast === 'function') {
            showAppToast('Đã dừng lặp chuỗi sự kiện từ ngày này trở đi', 'info');
          }
        } else if (scope === 'all') {
          // 3. Xóa tất cả các sự kiện trong chuỗi
          curData.calendarEvents = (curData.calendarEvents || []).filter(x => x.id !== id);
          saveLedgerData(curData);
          renderCalendarTab();
          if (typeof renderTimetableTab === 'function') renderTimetableTab();
          if (typeof showAppToast === 'function') {
            showAppToast('Đã xóa toàn bộ chuỗi sự kiện lặp lại', 'info');
          }
        }
      } else {
        // Sự kiện đơn lẻ: hiển thị hộp thoại xác nhận chuẩn
        const confirmed = typeof showAppConfirm === 'function'
          ? await showAppConfirm(`Bạn có chắc muốn xóa sự kiện "${ev.title}"?`, {
              title: 'Xóa sự kiện lịch',
              btnText: 'Xác nhận xóa',
              btnIcon: 'fa-solid fa-trash-can'
            })
          : confirm(`Bạn có chắc muốn xóa sự kiện "${ev.title}"?`);

        if (confirmed) {
          curData.calendarEvents = (curData.calendarEvents || []).filter(x => x.id !== id);
          saveLedgerData(curData);
          renderCalendarTab();
          if (typeof renderTimetableTab === 'function') renderTimetableTab();
          if (typeof showAppToast === 'function') {
            showAppToast('Đã xóa sự kiện lịch', 'info');
          }
        }
      }
    });
  });
}

/**
 * Định dạng khoảng thời gian hiển thị sự kiện trên giao diện
 */
function formatEventScheduleBadge(ev) {
  const startDate = ev.date;
  const endDate = ev.endDate && ev.endDate !== ev.date ? ev.endDate : null;
  const startTime = ev.startTime || ev.time || '';
  const endTime = ev.endTime || '';

  const fmtDay = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dStr;
  };

  // Sự kiện kéo dài nhiều ngày
  if (endDate) {
    let startText = fmtDay(startDate);
    if (startTime) startText += ` (${startTime})`;
    let endText = fmtDay(endDate);
    if (endTime) endText += ` (${endTime})`;
    return `${startText} → ${endText}`;
  }

  // Sự kiện trong cùng một ngày
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }
  if (startTime) {
    return startTime;
  }
  if (endTime) {
    return `Đến ${endTime}`;
  }
  return '';
}

/**
 * Mở modal thêm / chỉnh sửa sự kiện lịch
 */
function openCalendarEventModal(defaultDate = null, eventToEdit = null, defaultStartTime = '', defaultEndTime = '') {
  const modal = document.getElementById('calendarEventModal');
  const modalTitle = document.getElementById('calEventModalTitle');
  const inputTitle = document.getElementById('calEventTitleInput');
  const inputDate = document.getElementById('calEventDateInput');
  const inputTime = document.getElementById('calEventTimeInput');
  const inputEndDate = document.getElementById('calEventEndDateInput');
  const inputEndTime = document.getElementById('calEventEndTimeInput');
  const chkRepeat = document.getElementById('calEventRepeatCheckbox');
  const boxRepeatConfig = document.getElementById('calEventRepeatConfigBox');
  const inputInterval = document.getElementById('calEventRepeatIntervalInput');
  const selectUnit = document.getElementById('calEventRepeatUnitSelect');
  const inputRepeatEnd = document.getElementById('calEventRepeatEndInput');
  const selectCat = document.getElementById('calEventCategorySelect');
  const inputNote = document.getElementById('calEventNoteInput');
  const btnSave = document.getElementById('btnSaveCalendarEvent');

  if (!modal) return;

  if (eventToEdit) {
    editingEventId = eventToEdit.id;
    if (modalTitle) modalTitle.textContent = 'Chỉnh Sửa Sự Kiện Lịch';
    if (inputTitle) inputTitle.value = eventToEdit.title || '';
    const evDate = eventToEdit.date || calSelectedDateStr || getFormattedDateKey(new Date());
    if (inputDate) {
      inputDate.value = evDate;
      inputDate.dataset.prevValue = evDate;
    }
    if (inputTime) inputTime.value = eventToEdit.startTime || eventToEdit.time || '';
    if (inputEndDate) {
      inputEndDate.value = eventToEdit.endDate || evDate;
      inputEndDate.min = evDate;
    }
    if (inputEndTime) inputEndTime.value = eventToEdit.endTime || '';

    // Khởi tạo lặp lại
    const r = eventToEdit.repeat || 'none';
    const isRepeating = (r !== 'none');
    const intv = Math.max(1, parseInt(eventToEdit.repeatInterval, 10) || 1);
    const u = eventToEdit.repeatUnit || (r === 'daily' ? 'day' : r === 'weekly' ? 'week' : r === 'monthly' ? 'month' : r === 'yearly' ? 'year' : 'day');

    if (chkRepeat) {
      chkRepeat.checked = isRepeating;
    }
    if (boxRepeatConfig) {
      boxRepeatConfig.style.display = isRepeating ? 'block' : 'none';
    }
    if (inputInterval) inputInterval.value = intv;
    if (selectUnit) selectUnit.value = u;
    if (inputRepeatEnd) {
      inputRepeatEnd.value = eventToEdit.repeatUntil || eventToEdit.repeatEnd || '';
      inputRepeatEnd.min = evDate;
    }

    userManuallyPickedColor = true;
    if (selectCat) selectCat.value = eventToEdit.category || 'Công việc';
    if (inputNote) inputNote.value = eventToEdit.note || '';
    selectedEventColor = eventToEdit.color || EVENT_COLORS[0];
    if (btnSave) btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Cập Nhật Sự Kiện';
  } else {
    editingEventId = null;
    userManuallyPickedColor = false;
    if (modalTitle) modalTitle.textContent = 'Thêm Sự Kiện Lịch';
    if (inputTitle) inputTitle.value = '';
    const initialDate = defaultDate || calSelectedDateStr || getFormattedDateKey(new Date());
    if (inputDate) {
      inputDate.value = initialDate;
      inputDate.dataset.prevValue = initialDate;
    }
    if (inputTime) inputTime.value = defaultStartTime || '';
    if (inputEndDate) {
      inputEndDate.value = initialDate;
      inputEndDate.min = initialDate;
    }
    if (inputEndTime) inputEndTime.value = defaultEndTime || '';

    if (chkRepeat) {
      chkRepeat.checked = false;
    }
    if (boxRepeatConfig) boxRepeatConfig.style.display = 'none';
    if (inputInterval) inputInterval.value = 1;
    if (selectUnit) selectUnit.value = 'day';
    if (inputRepeatEnd) {
      inputRepeatEnd.value = '';
      inputRepeatEnd.min = initialDate;
    }

    if (selectCat) selectCat.value = 'Học tập';
    if (inputNote) inputNote.value = '';
    selectedEventColor = (typeof suggestColorForEvent === 'function')
      ? suggestColorForEvent('', 'Học tập')
      : EVENT_COLORS[0];
    if (btnSave) btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Lưu Sự Kiện';
  }

  renderEventColorPicker();

  modal.classList.add('active');
  if (inputTitle) inputTitle.focus();
}

function closeCalendarEventModal() {
  const modal = document.getElementById('calendarEventModal');
  if (modal) modal.classList.remove('active');
  editingEventId = null;
}

function renderEventColorPicker() {
  const container = document.getElementById('calEventColorPicker');
  if (!container) return;

  container.innerHTML = EVENT_COLORS.map(c => `
    <span class="color-dot-opt ${c === selectedEventColor ? 'active' : ''}" style="background: ${c};" data-color="${c}"></span>
  `).join('');

  container.querySelectorAll('.color-dot-opt').forEach(dot => {
    dot.addEventListener('click', () => {
      userManuallyPickedColor = true;
      selectedEventColor = dot.dataset.color;
      renderEventColorPicker();
    });
  });
}

function handleSaveCalendarEvent(e) {
  if (e) e.preventDefault();
  const inputTitle = document.getElementById('calEventTitleInput');
  const inputDate = document.getElementById('calEventDateInput');
  const inputTime = document.getElementById('calEventTimeInput');
  const inputEndDate = document.getElementById('calEventEndDateInput');
  const inputEndTime = document.getElementById('calEventEndTimeInput');
  const chkRepeat = document.getElementById('calEventRepeatCheckbox');
  const inputInterval = document.getElementById('calEventRepeatIntervalInput');
  const selectUnit = document.getElementById('calEventRepeatUnitSelect');
  const inputRepeatEnd = document.getElementById('calEventRepeatEndInput');
  const selectCat = document.getElementById('calEventCategorySelect');
  const inputNote = document.getElementById('calEventNoteInput');

  const title = inputTitle ? inputTitle.value.trim() : '';
  const date = inputDate ? inputDate.value.trim() : calSelectedDateStr;
  const time = inputTime ? inputTime.value.trim() : '';
  const endDate = inputEndDate ? inputEndDate.value.trim() : '';
  const endTime = inputEndTime ? inputEndTime.value.trim() : '';

  const isRepeating = chkRepeat ? chkRepeat.checked : false;
  const repeat = isRepeating ? 'custom' : 'none';
  const repeatInterval = isRepeating && inputInterval ? Math.max(1, parseInt(inputInterval.value, 10) || 1) : 1;
  const repeatUnit = isRepeating && selectUnit ? selectUnit.value : 'day';
  const repeatUntil = isRepeating && inputRepeatEnd ? inputRepeatEnd.value.trim() : '';

  const category = selectCat ? selectCat.value : 'Công việc';
  const note = inputNote ? inputNote.value.trim() : '';

  if (!title) {
    if (typeof showAppToast === 'function') {
      showAppToast('Vui lòng nhập tiêu đề sự kiện', 'warning');
    } else {
      alert('Vui lòng nhập tiêu đề sự kiện.');
    }
    if (inputTitle) inputTitle.focus();
    return;
  }

  if (!date) {
    if (typeof showAppToast === 'function') {
      showAppToast('Vui lòng chọn ngày diễn ra sự kiện', 'warning');
    } else {
      alert('Vui lòng chọn ngày diễn ra sự kiện.');
    }
    if (inputDate) inputDate.focus();
    return;
  }

  // Kiểm tra tính hợp lệ của ngày kết thúc
  if (endDate && endDate < date) {
    if (typeof showAppToast === 'function') {
      showAppToast('Ngày kết thúc không được trước ngày diễn ra', 'warning');
    } else {
      alert('Ngày kết thúc không được trước ngày diễn ra.');
    }
    if (inputEndDate) inputEndDate.focus();
    return;
  }

  // Kiểm tra tính hợp lệ của ngày kết thúc lặp lại
  if (repeatUntil && repeatUntil < date) {
    if (typeof showAppToast === 'function') {
      showAppToast('Ngày kết thúc lặp lại không được trước ngày diễn ra', 'warning');
    } else {
      alert('Ngày kết thúc lặp lại không được trước ngày diễn ra.');
    }
    if (inputRepeatEnd) inputRepeatEnd.focus();
    return;
  }

  // Nếu cùng ngày, kiểm tra giờ kết thúc không trước giờ bắt đầu
  if (endDate && endDate === date && time && endTime && endTime < time) {
    if (typeof showAppToast === 'function') {
      showAppToast('Thời gian kết thúc không được trước thời gian bắt đầu', 'warning');
    } else {
      alert('Thời gian kết thúc không được trước thời gian bắt đầu.');
    }
    if (inputEndTime) inputEndTime.focus();
    return;
  }

  const curData = getLedgerData();
  if (!Array.isArray(curData.calendarEvents)) curData.calendarEvents = [];

  if (editingEventId) {
    const idx = curData.calendarEvents.findIndex(x => x.id === editingEventId);
    if (idx !== -1) {
      curData.calendarEvents[idx] = {
        ...curData.calendarEvents[idx],
        title,
        date,
        time,
        startTime: time,
        endDate: endDate || '',
        endTime: endTime || '',
        repeat,
        repeatInterval,
        repeatUnit,
        repeatUntil,
        category,
        color: selectedEventColor,
        note,
        updatedAt: Date.now()
      };
    }
  } else {
    curData.calendarEvents.push({
      id: 'ev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title,
      date,
      time,
      startTime: time,
      endDate: endDate || '',
      endTime: endTime || '',
      repeat,
      repeatInterval,
      repeatUnit,
      repeatUntil,
      category,
      color: selectedEventColor,
      note,
      timestamp: Date.now()
    });
  }

  saveLedgerData(curData);
  closeCalendarEventModal();

  calSelectedDateStr = date;
  renderCalendarTab();
  if (typeof renderTimetableTab === 'function') {
    renderTimetableTab();
  }

  if (typeof showAppToast === 'function') {
    showAppToast(editingEventId ? 'Đã cập nhật sự kiện lịch thành công!' : 'Đã thêm sự kiện lịch mới thành công!', 'success');
  }
}

/**
 * Hiển thị hộp thoại chọn phạm vi xóa cho sự kiện lặp lại:
 * - 'this': Chỉ sự kiện này (thêm targetDate vào excludedDates)
 * - 'following': Sự kiện này và các sự kiện sau đó (giới hạn repeatUntil trước targetDate)
 * - 'all': Tất cả các sự kiện (xóa toàn bộ chuỗi)
 * - null: Người dùng hủy
 */
function promptRecurringEventDeleteScope(event, targetDate) {
  const modal = document.getElementById('calRepeatDeleteModal');
  const titleEl = document.getElementById('calRepeatDeleteTitle');
  const dateEl = document.getElementById('calRepeatDeleteDate');
  const btnConfirm = document.getElementById('btnConfirmCalRepeatDelete');
  const btnCancel = document.getElementById('btnCancelCalRepeatDeleteModal');
  const btnClose = document.getElementById('btnCloseCalRepeatDeleteModal');

  if (!modal || !btnConfirm || !btnCancel) {
    return Promise.resolve(confirm(`Bạn có chắc muốn xóa sự kiện "${event.title}"?`) ? 'all' : null);
  }

  // Format ngày dạng DD/MM/YYYY
  const [y, m, d] = (targetDate || '').split('-');
  const displayDate = (y && m && d) ? `${d}/${m}/${y}` : targetDate;

  if (titleEl) titleEl.textContent = `"${event.title || 'Sự kiện'}"`;
  if (dateEl) dateEl.textContent = displayDate;

  // Đặt mặc định về 'this' (an toàn nhất)
  const defaultRadio = modal.querySelector('input[name="calRepeatDeleteScope"][value="this"]');
  if (defaultRadio) defaultRadio.checked = true;

  modal.classList.add('active');

  return new Promise((resolve) => {
    let resolved = false;

    function cleanup(scopeResult) {
      if (resolved) return;
      resolved = true;
      modal.classList.remove('active');
      btnConfirm.removeEventListener('click', onConfirm);
      btnCancel.removeEventListener('click', onCancel);
      if (btnClose) btnClose.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      window.removeEventListener('keydown', onKeyDown);
      resolve(scopeResult);
    }

    function onConfirm() {
      const checked = modal.querySelector('input[name="calRepeatDeleteScope"]:checked');
      const scope = checked ? checked.value : 'this';
      cleanup(scope);
    }

    function onCancel() {
      cleanup(null);
    }

    function onBackdrop(e) {
      if (e.target === modal) cleanup(null);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') cleanup(null);
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    }

    btnConfirm.addEventListener('click', onConfirm);
    btnCancel.addEventListener('click', onCancel);
    if (btnClose) btnClose.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    window.addEventListener('keydown', onKeyDown);
  });
}

/**
 * Khởi tạo phân hệ Lịch
 */
function initCalendar() {
  const btnPrev = document.getElementById('btnCalPrevMonth');
  const btnNext = document.getElementById('btnCalNextMonth');
  const btnToday = document.getElementById('btnCalToday');
  const btnOpenAdd = document.getElementById('btnOpenAddCalendarEventModal');

  const modal = document.getElementById('calendarEventModal');
  const btnCloseModal = document.getElementById('btnCloseCalendarEventModal');
  const btnCancelModal = document.getElementById('btnCancelCalendarEventModal');
  const form = document.getElementById('calendarEventModalForm');
  const inputDate = document.getElementById('calEventDateInput');
  const inputEndDate = document.getElementById('calEventEndDateInput');
  const inputTitle = document.getElementById('calEventTitleInput');
  const selectCat = document.getElementById('calEventCategorySelect');

  // Gợi ý màu sắc thông minh theo thời gian thực khi gõ tiêu đề hoặc chọn danh mục
  const handleLiveColorSuggestion = () => {
    if (userManuallyPickedColor || editingEventId) return;
    const titleVal = inputTitle ? inputTitle.value : '';
    const catVal = selectCat ? selectCat.value : '';
    if (typeof suggestColorForEvent === 'function') {
      const suggested = suggestColorForEvent(titleVal, catVal);
      if (suggested && suggested !== selectedEventColor) {
        selectedEventColor = suggested;
        renderEventColorPicker();
      }
    }
  };

  if (inputTitle) inputTitle.addEventListener('input', handleLiveColorSuggestion);
  if (selectCat) selectCat.addEventListener('change', handleLiveColorSuggestion);

  // Ràng buộc và tự động đồng bộ ngày kết thúc theo ngày diễn ra
  if (inputDate && inputEndDate) {
    const handleStartDateChange = () => {
      const oldVal = inputDate.dataset.prevValue || '';
      const newVal = inputDate.value;
      if (!newVal) return;
      inputEndDate.min = newVal;

      // Nếu ngày kết thúc trước đó trùng với ngày bắt đầu cũ (sự kiện trong ngày),
      // hoặc ngày kết thúc đang trống hoặc đang nhỏ hơn ngày bắt đầu mới -> tự động đồng bộ theo ngày bắt đầu mới
      if (!inputEndDate.value || inputEndDate.value === oldVal || inputEndDate.value < newVal) {
        inputEndDate.value = newVal;
      }
      inputDate.dataset.prevValue = newVal;

      const inputRepeatEnd = document.getElementById('calEventRepeatEndInput');
      if (inputRepeatEnd) {
        inputRepeatEnd.min = newVal;
        if (inputRepeatEnd.value && inputRepeatEnd.value < newVal) {
          inputRepeatEnd.value = newVal;
        }
      }
    };

    inputDate.addEventListener('change', handleStartDateChange);
    inputDate.addEventListener('input', handleStartDateChange);

    inputEndDate.addEventListener('change', () => {
      if (inputEndDate.value && inputEndDate.value < inputDate.value) {
        inputEndDate.value = inputDate.value;
      }
    });
  }

  // Xử lý bật tắt khung cấu hình lặp lại Mỗi X Ngày / Tuần / Tháng / Năm
  const chkRepeat = document.getElementById('calEventRepeatCheckbox');
  const boxRepeatConfig = document.getElementById('calEventRepeatConfigBox');
  const inputRepeatEnd = document.getElementById('calEventRepeatEndInput');

  if (chkRepeat && boxRepeatConfig) {
    chkRepeat.addEventListener('change', () => {
      boxRepeatConfig.style.display = chkRepeat.checked ? 'block' : 'none';
      if (chkRepeat.checked && inputDate && inputRepeatEnd) {
        inputRepeatEnd.min = inputDate.value;
      }
    });
  }

  // Điều hướng tháng
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      calCurrentMonth--;
      if (calCurrentMonth < 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      }
      renderCalendarMonthGrid();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      calCurrentMonth++;
      if (calCurrentMonth > 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      }
      renderCalendarMonthGrid();
    });
  }

  if (btnToday) {
    btnToday.addEventListener('click', () => {
      const now = new Date();
      calCurrentYear = now.getFullYear();
      calCurrentMonth = now.getMonth();
      calSelectedDateStr = getFormattedDateKey(now);
      renderCalendarTab();
    });
  }

  // Mở modal thêm sự kiện
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener('click', () => {
      openCalendarEventModal(calSelectedDateStr);
    });
  }

  // Đóng modal
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeCalendarEventModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeCalendarEventModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCalendarEventModal();
    });
  }

  // Form submit
  if (form) form.addEventListener('submit', handleSaveCalendarEvent);

  // Render lần đầu
  renderCalendarTab();
}

window.isEventOccurringOnDate = isEventOccurringOnDate;
window.getRepeatLabel = getRepeatLabel;
window.openCalendarEventModal = openCalendarEventModal;
window.renderCalendarTab = renderCalendarTab;
window.getHolidayInfo = getHolidayInfo;
window.getFormattedDateKey = getFormattedDateKey;

