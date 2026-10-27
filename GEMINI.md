# Quy Định & Bối Cảnh Dự Án Trợ Lý Ảo Najimez

Tài liệu này lưu lại các yêu cầu cốt lõi của dự án cho các phiên làm việc tiếp theo:

## 1. Định Danh & Vai Trò
* **Tên ứng dụng / Trợ lý:** Trợ lý ảo **"Najimez"**
* **Hình ảnh đại diện mặc định:** Ảnh nhân vật anime nữ tóc tím cài hoa (lưu tại [assets/najimez.jpg](file:///d:/Siêu%20bá%20khí%20trợ%20lý/assets/najimez.jpg)) được sử dụng làm avatar chính thức của Najimez trên toàn bộ hệ thống (Logo Sidebar, Favicon, Bong bóng chat AI).

## 2. Các Tính Năng Yêu Cầu Cốt Lõi
1. **Trò chuyện & Giải đáp thắc mắc:**
   * Trò chuyện thân thiện, tương tác với người dùng.
   * Giải đáp các thắc mắc (đang trong quá trình cân nhắc khả năng giải bài tập/hỗ trợ học tập).
2. **Quản lý chi tiêu:**
   * Ghi chép và theo dõi thu chi của người dùng.
3. **Quản lý sổ nợ:**
   * Theo dõi danh sách nợ (họ nợ tôi / tôi nợ họ).
   * **Bảo toàn lịch sử Thu Chi:** Khi xóa người nợ ra khỏi danh sách nợ, hệ thống tuyệt đối **KHÔNG** xóa các giao dịch bên Sổ Thu Chi Cá Nhân (các khoản chi cho mượn, thu nợ,... vẫn được giữ nguyên vẹn).
   * **Quy tắc đàm thoại giao tiếp:** Khi nói chuyện bình thường (chào hỏi, tâm sự, hỏi thăm, giải đáp kiến thức, code...), Najimez tuyệt đối **KHÔNG** tự ý nhắc đến danh sách sổ nợ hay ai đang nợ mình. Tính năng ghi nợ chỉ là phụ trợ, nhắc nhiều sẽ không hay và gây phản cảm. Chỉ nhắc đến nợ nần khi người dùng chủ động hỏi đích danh hoặc yêu cầu xử lý nợ.
4. **Lên lịch trình:**
   * Quản lý công việc, lịch trình cá nhân, nhắc việc.
5. **Giao diện đa năng:**
   * Bổ sung các tính năng giao diện hỗ trợ người dùng toàn diện về mọi mặt.

## 3. Lưu Ý Cho Các Phiên Làm Việc
* Giữ tính nhất quán theo tài liệu [PROJECT_NOTES.md](file:///d:/Siêu%20bá%20khí%20trợ%20lý/PROJECT_NOTES.md).
* Chỉ chỉnh sửa mã nguồn khi có yêu cầu cụ thể từ người dùng.

## 4. Quy Chuẩn Kiến Trúc Mã Nguồn (Code Modularization)
* **Luôn chia nhỏ code thành từng file riêng biệt:** Mỗi file chỉ đảm nhiệm một nhóm chức năng có liên quan mật thiết (ví dụ: `finance.js`, `debt.js`, `vietqr.js`, `todos.js`, `copilot.js`,...).
* **Bố cục khoa học, tối ưu hóa đọc hiểu:** Không để mã nguồn dồn vào một file khổng lồ (>500 dòng). Mỗi lần chạy hoặc sửa tính năng, chỉ cần nạp và đọc đúng file liên quan để tối ưu ngữ cảnh (context), tránh đọc thừa, tiết kiệm token và tránh xung đột code.
* Chi tiết quy chuẩn thực thi xem tại kỹ năng: [.agents/skills/code-modularization/SKILL.md](file:///d:/Siêu%20bá%20khí%20trợ%20lý/.agents/skills/code-modularization/SKILL.md).

## 5. Quy Chuẩn Bố Cục Thẻ Hộp Dụng Cụ (Toolbox Grid Layout)
* Mỗi tiện ích/công cụ trong Hộp Dụng Cụ luôn luôn chiếm đúng **1 ô chữ nhật chuẩn (1 cột)** trong hệ thống lưới 2 cột.
* **Tuyệt đối không dùng `grid-column: 1 / -1` (không kéo dãn thẻ chiếm trọn cả hàng)** đối với các thẻ lẻ, mà giữ nguyên phần ô bên phải để trống, chừa chỗ cho các tính năng tiếp theo lấp đầy lần lượt theo thứ tự, đảm bảo bố cục không bị xô lệch hay lấn chỗ khi mở rộng tính năng mới.

