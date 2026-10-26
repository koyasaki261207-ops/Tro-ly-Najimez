---
name: code-modularization
description: >-
  Hướng dẫn và quy chuẩn kiến trúc mã nguồn dạng module: luôn chia nhỏ code thành các file riêng biệt,
  gắn kết theo từng tính năng, bố cục khoa học nhằm tối ưu hóa tốc độ và ngữ cảnh đọc hiểu code của AI và lập trình viên.
---

# Kỹ Năng: Kiến Trúc Mã Nguồn Dạng Module (Code Modularization)

Kỹ năng này hướng dẫn việc tổ chức, phân tách và quản lý mã nguồn theo cấu trúc module nhỏ gọn, chuyên biệt, tránh việc dồn toàn bộ mã nguồn vào một vài file khổng lồ (monolithic files).

---

## 1. Mục Tiêu Cốt Lõi
- **Tối ưu hóa đọc hiểu (Context Optimization):** Mỗi lần AI hay lập trình viên cần xử lý một tính năng (ví dụ: Sổ nợ, VietQR, Lịch trình, AI Chat), chỉ cần đọc đúng file liên quan, không phải nạp hàng nghìn dòng code không liên quan.
- **Giảm thiểu xung đột & lỗi:** Sửa đổi ở module này không vô tình ảnh hưởng hoặc làm hỏng các module khác.
- **Bảo trì và mở rộng bền vững:** Dễ dàng kiểm thử, tìm kiếm và thay thế từng thành phần.

---

## 2. Quy Tắc Phân Tách Mã Nguồn

### 2.1. Đối với JavaScript / Logic:
- **Tối đa kích thước:** Giữ mỗi file trong khoảng **150 - 400 dòng**. Nếu một file vượt quá 500 dòng, phải lập tức cân nhắc phân tách.
- **Chia theo trách nhiệm đơn lẻ (Single Responsibility):**
  - `storage.js`: Quản lý đọc/ghi `localStorage`, migrate dữ liệu, data healing.
  - `finance.js`: Quản lý thu chi, thống kê ngân sách, biểu đồ tài chính.
  - `debt.js`: Quản lý sổ nợ, tính số dư đối ứng (net balance), thanh toán bù trừ.
  - `vietqr.js`: Quản lý tạo mã QR, cấu hình tài khoản ngân hàng, xác thực.
  - `todos.js`: Quản lý lịch trình, việc cần làm, nhắc nhở.
  - `copilot.js`: Quản lý tương tác chat với Gemini AI, streaming response, action parsing.
  - `app.js`: Chỉ đóng vai trò là điểm khởi động (entrypoint) kết nối các module lại với nhau.

### 2.2. Đối với CSS / Giao diện:
- Không dồn hàng nghìn dòng vào một file `style.css` duy nhất.
- Phân chia thành các file style theo ngữ cảnh:
  - `variables.css`: Khai báo `:root`, biến màu sắc, dark/light theme, font chữ.
  - `base.css`: Reset CSS, typography, layout chung, animation toàn cục.
  - `sidebar.css`: Style cho thanh điều hướng bên trái và widget chân trang.
  - `copilot.css`: Giao diện khung chat, bong bóng tin nhắn, streaming cursor.
  - `finance.css`: Giao diện bảng thu chi, thẻ nợ 2 tầng, thống kê.
  - `modal.css`: Tất cả các hộp thoại (Cài đặt API, Cài đặt STK, Popup QR).

---

## 3. Quy Trình Thực Hiện Khi Viết / Chỉnh Sửa Code

1. **Trước khi thêm tính năng mới:**
   - Xác định tính năng thuộc phân hệ nào.
   - Nếu phân hệ đó đã có file riêng, bổ sung vào file đó.
   - Nếu là phân hệ mới hoặc file hiện tại đã quá dài, tạo một file module mới.

2. **Cách nhúng vào ứng dụng Web:**
   - Sử dụng thẻ `<script>` có thứ tự rõ ràng hoặc sử dụng ES Modules (`type="module"`) khi thích hợp.
   - Sử dụng `@import` hoặc gắn nhiều link CSS trong `<head>` của `index.html`.

3. **Nguyên tắc bảo tồn dữ liệu:**
   - Việc tách file chỉ thay đổi cách tổ chức mã nguồn, không làm thay đổi cấu trúc dữ liệu đã lưu trữ của người dùng trong `localStorage`.
