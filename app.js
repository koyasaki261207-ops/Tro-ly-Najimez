/**
 * app.js - Điểm khởi động chính của Trợ Lý Ảo Najimez
 * Kết nối các module: config, storage, ui, vietqr, finance, debt, todos, copilot
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Bầu trời sao thiên thể & sao băng (Starry Sky Engine)
  if (typeof initStarrySky === 'function') {
    initStarrySky();
  }

  // 1. Tiện ích giao diện & đồng hồ
  initClock();
  initSidebar();
  initTabNavigation();

  // 2. Các hộp thoại chức năng
  initApiKeyModal();
  initBankSettingsModal();
  initVietQrModal();
  if (typeof initPersonHistoryModal === 'function') initPersonHistoryModal();
  if (typeof initPersonInfoModal === 'function') initPersonInfoModal();
  if (typeof initLuckyWheel === 'function') initLuckyWheel();
  if (typeof initBillImageModule === 'function') initBillImageModule();
  if (typeof initFirebaseSyncModule === 'function') initFirebaseSyncModule();

  // 3. Sổ cái & Thống kê dữ liệu
  initLedgerAndStats();

  // 4. Các phân hệ chức năng
  try {
    initFinanceTab();
  } catch (err) {
    console.error('Lỗi khởi tạo Finance Tab:', err);
  }

  try {
    initTodosTab();
  } catch (err) {
    console.error('Lỗi khởi tạo Todos Tab:', err);
  }

  try {
    if (typeof initCalendar === 'function') initCalendar();
  } catch (err) {
    console.error('Lỗi khởi tạo Calendar Tab:', err);
  }

  try {
    if (typeof initTimetable === 'function') initTimetable();
  } catch (err) {
    console.error('Lỗi khởi tạo Timetable Tab:', err);
  }

  try {
    initChatEngine();
  } catch (err) {
    console.error('Lỗi khởi tạo Chat Engine:', err);
  }
});
