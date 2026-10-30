# TÀI LIỆU DỰ ÁN TRỢ LÝ ẢO NAJIMEZ

> **Trạng thái:** Nâng cấp trải nghiệm chuẩn Google Gemini Web & Interactive Action Engine  
> **Cập nhật lần cuối:** 24/10/2026  

---

## 1. Thông Tin Tổng Quan
* **Tên ứng dụng:** Trợ lý ảo **Najimez** (Powered by Gemini Engine)
* **Hình ảnh nhận diện mặc định:** [assets/najimez.jpg](file:///d:/Siêu%20bá%20khí%20trợ%20lý/assets/najimez.jpg) (Nhân vật anime nữ tóc tím cài hoa làm avatar chính thức của Najimez trên toàn bộ giao diện).
* **Mục tiêu:** Ứng dụng trợ lý ảo thông minh, toàn năng, mô phỏng hoàn hảo trải nghiệm đàm thoại đỉnh cao của Google Gemini Web nhưng được trang bị "Bộ não hành động" tương tác tài chính, sổ nợ VietQR và lịch trình To-Do.

---

## 2. Danh Sách Tính Năng Cốt Lõi Đã Triển Khai

### 2.1. Đàm Thoại & Trí Tuệ Gemini Web Đích Thực
* **Gõ chữ thời gian thực (Real-time Streaming):** Sử dụng SSE (`streamGenerateContent?alt=sse`) hiển thị chữ mượt mà từng từ với con trỏ nhấp nháy, không bị độ trễ chờ đợi.
* **Đẳng cấp tư duy Gemini:** Phân tích logic sâu sắc, giải thích học thuật (Toán, Lý, Hóa, Code...), giao tiếp nhã nhặn, tự nhiên, chuẩn mực tiếng Việt.
* **Tiện ích trên tin nhắn chuẩn Gemini:** Khối mã code có nút *Sao chép mã*, thanh công cụ dưới mỗi tin nhắn với *Sao chép phản hồi*, *Đọc to bằng giọng nói (TTS)*, và *Tạo lại câu trả lời (Regenerate)*.
* **Hệ Thống Lời Chào Động & Tính Cách Najimez (Dynamic Greeting Personality Engine):** Thay thế cách chào cứng nhắc "Chào buổi x" bằng kho lời chào phong phú theo 7 khung giờ thực tế trong ngày (sáng sớm cà phê, giữa sáng tập trung, trưa ăn uống nạp năng lượng, chiều trà sữa tăng tốc, hoàng hôn tan ca, tối ấm cúng tâm sự, đêm muộn nhắc ngủ sớm). Cập nhật ngẫu nhiên sinh động cho cả Header Banner và bong bóng đàm thoại Najimez ban đầu.
* **Gửi Ảnh & Thị Giác Đa Phương Thức (Gemini Multimodal / Vision Engine):**
  * Nút đính kèm ảnh trực tiếp trên thanh chat (`btnCopilotAttachImg`), hỗ trợ chụp ảnh, chọn tệp từ máy, **kéo & thả ảnh (Drag & Drop)** hoặc **dán ảnh trực tiếp từ clipboard (`Ctrl + V`)**.
  * Tự động nén ảnh qua Canvas Retina sắc nét với độ phân giải tối ưu (1600px, JPEG quality 0.85), giữ nguyên độ rõ của bài tập toán, công thức và hóa đơn nhưng dung lượng siêu nhẹ (~150-300KB).
  * Khay xem trước ảnh (Preview Tray) nổi sang trọng có nút hủy và thông tin dung lượng.
  * Truyền dữ liệu `inline_data` base64 vào Gemini API (`callGeminiAPIStream` và `callGeminiAPIFallback`) giúp Najimez:
    - 📚 **Giải bài tập & học tập:** Nhìn đề thi, bài tập Toán, Lý, Hóa, sơ đồ hoặc đoạn code để giải và giảng bài chi tiết.
    - 🧾 **Nhận diện hóa đơn thông minh:** Tự động đọc hóa đơn/bill chuyển khoản và tạo thẻ ghi chép thu chi / sổ nợ tự động.
    - 💬 **Tâm sự & nhận diện hình ảnh:** Phân tích, bình luận và trò chuyện về bất kỳ bức ảnh nào được gửi lên.
  * Modal xem ảnh phóng to toàn màn hình sắc nét (Lightbox Modal) kèm nút tải ảnh về máy.

### 2.2. Bộ Não Hành Động Quản Lý Tài Chính & Sổ Nợ (Action Engine)
* **Tự động nhận diện & Tạo thẻ giao dịch:** Khi chat về thu/chi, AI tự động tạo thẻ Thu/Chi trực quan, cộng trừ tiền và cập nhật số dư thực tế trên Header.
* **Quản lý Sổ nợ, Tất toán & Tạo mã VietQR:**
  * Tự động tạo thẻ nợ nần 2 chiều kèm nút kích hoạt tạo ảnh mã VietQR ngân hàng thực tế để thanh toán/đòi tiền ngay lập tức.
  * **Thuật toán Tất toán nợ thông minh (`settle_debt`):** Nhận diện lệnh "tôi đã trả nợ cho [ai]" hoặc "[ai] đã trả nợ tôi", tự động gạch nợ (`status: 'paid'`), khấu trừ đúng số dư nợ (không bị cộng dồn thêm nợ), và tự động đồng bộ một khoản Thu/Chi tương ứng vào Sổ Thu Chi cá nhân.
  * **Cơ chế Tự chữa lành dữ liệu ([healLedgerData](file:///d:/Siêu%20bá%20khí%20trợ%20lý/app.js)):** Tự động phát hiện và xử lý triệt để các bản ghi nợ trùng do lỗi trả nợ trước đó trong LocalStorage.
  * **Tính năng Cấn trừ nợ 2 chiều (Mutual Debts Offset):** Tự động phát hiện các đối tượng có nợ 2 chiều (họ nợ tôi và tôi nợ họ), tính toán số dư chênh lệch ròng (Net Balance) và hiển thị nút "Cấn trừ nợ ngay" tiện lợi.
  * **Thuật toán Khớp tên thông minh & Cách ly đối tượng ([matchPersonName](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/storage.js)):** So khớp chính xác theo ranh giới từ nguyên vẹn, loại bỏ hoàn toàn lỗi nuốt chuỗi con (không để tên ngắn như "An" bị gom nhầm giao dịch của "Tuấn", "Lan", "Hoàng"...).
* **Quản lý Lịch trình & To-Do:** Tự động tạo thẻ công việc với checkbox tích chọn hoàn thành trực tiếp trên tin nhắn.
* **Lưu trữ dữ liệu bền vững:** Tích hợp `LocalStorage` cho Sổ cái giao dịch, nợ nần, công việc và cấu hình tài khoản ngân hàng.

### 2.3. Bảng Điều Khiển Quản Lý Tài Chính & Sổ Nợ Chuyên Sâu (Tab Finance)
* **Giao diện quản lý 2 cột Cyber Luxury:**
  * **Sổ Thu Chi Cá Nhân:** Theo dõi chi tiết từng khoản thu/chi; thống kê **Số dư hiện có**; bộ lọc (Tất cả, Khoản Chi, Khoản Thu); form drawer thêm nhanh giao dịch mới; nút xóa từng giao dịch.
  * **Sổ Nợ (Mô hình Danh Sách Đối Tượng - Person-Centric Net Debt):**
    * **2 chế độ xem linh hoạt:**
      * **Người:** Hiển thị danh sách các cá nhân nợ hiện tại (mỗi người 1 thẻ với avatar, tên, số dư ròng, nút Lịch sử riêng và nút Chi tiết).
      * **Lịch sử giao dịch:** Hiển thị dòng thời gian chi tiết của toàn bộ các cuộc giao dịch nợ/trả của tất cả mọi người với tôi.
    * Thao tác nhanh gọn theo đối tượng: Nút "Lịch sử" (xem chi tiết từng lần mượn/trả trong hộp thoại popup dòng thời gian) và nút Menu "Chi tiết" tinh tế:
      * **Thông tin đối tượng:** Cho phép tùy chỉnh và lưu ảnh đại diện (avatar) qua việc tải ảnh từ máy, dán trực tiếp ảnh từ clipboard (hỗ trợ Ctrl+V hoặc nút dán), dán link ảnh URL; đổi tên đối tượng (tự động đồng bộ trên toàn bộ sổ nợ và giao dịch liên quan); thêm ghi chú cá nhân (SĐT, STK, lưu ý riêng).
      * **Tạo mã VietQR:** Tự động tạo mã QR Napas chuyển khoản nhanh.
      * **Đã thu / Trả nợ (hoặc Khôi phục chưa trả):** Đánh dấu tất toán và đồng bộ Sổ Thu Chi.
  * **Hộp Thoại Xác Nhận Toàn Hệ Thống (Universal Confirm Modal - `showAppConfirm`):** Thay thế hoàn toàn hàm `window.confirm()` mặc định của trình duyệt để ngăn chặn triệt để tình trạng trình duyệt chặn popup ("Prevent this page from creating additional dialogs"), giúp các thao tác xóa giao dịch, xóa nợ hay xóa task luôn phản hồi tức thì với giao diện Cyber Midnight sang trọng.
  * **Khắc phục lỗi Tái sinh giao dịch nợ:** Loại bỏ hàm đồng bộ ngầm tự hồi sinh giao dịch nợ trong `healLedgerData()`, đảm bảo khi người dùng xóa giao dịch khỏi Sổ Thu Chi thì giao dịch đó sẽ biến mất vĩnh viễn đúng theo ý muốn.
* **Đồng bộ 2 chiều thời gian thực (Real-time Bidirectional Sync):**
### 2.4. Động Cơ Nhận Diện & Tự Động Gắn Ảnh Thông Minh (Auto Smart Visuals Engine)
* **Tự động nhận diện ngữ cảnh 100% rảnh tay:** Người dùng không cần bấm chọn hay tải ảnh lên; hệ thống tự động phân tích ghi chú, lý do và danh mục giao dịch (như "Tiền cơm", "Bún đậu", "Quán net", "Ăn vặt", "Mượn tiền", "Trà sữa", "Cà phê", "Phở / Mì", "Lẩu nướng", "Xăng xe", "Mua sắm", "Tiền trọ"...) để tự động dán và hiển thị ảnh đại diện tương ứng bên góc phải hàng giao dịch.
* **Cơ chế Fallback Vector SVG không bao giờ lỗi:** Tích hợp bộ tạo vector SVG trực tiếp (Data-URI) với dải gradient sang trọng, biểu tượng nổi bật và nhãn nhận diện. Nếu thiết bị offline hoặc ảnh CDN gặp sự cố mạng, hàm `handleAutoImgError` lập tức chuyển đổi sang SVG sắc nét tức thì.
* **Hỗ trợ toàn diện trên mọi màn hình:**
  * Lịch sử giao dịch sổ nợ toàn cục (`#debtHistoryList`).
  * Chi tiết lịch sử giao dịch từng cá nhân (`#personHistoryModal`).
  * Sổ Thu Chi Cá Nhân (`#expenseHistoryList`).
* **Hộp thoại xem phóng to & tùy biến nâng cao:** Nhấp vào bất kỳ ảnh thu nhỏ (thumbnail) nào ở góc phải để mở Modal xem ảnh phóng to, hiển thị nhãn nhận diện tự động, tải ảnh về máy hoặc tải ảnh tùy biến ghi đè nếu muốn.

---

## 3. Cấu Trúc Kỹ Thuật (Kiến Trúc Module Hóa)
* **index.html:** Bố cục Cyber Luxury Midnight Glassmorphism với hệ thống tab chuyển đổi (`#tab-copilot`, `#tab-finance`, `#tab-todos`), tích hợp Modal API Key, Modal Cài đặt STK VietQR, Modal hiển thị mã QR, Modal Lịch sử giao dịch, và Modal Hồ Sơ Đối Tượng.
* **style.css:** File điều phối nạp 8 module CSS độc lập qua `@import`:
  * [`css/variables.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/variables.css): Biến `:root`, bảng màu Cyber, typography, reset layout.
  * [`css/base.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/base.css): Khung ứng dụng chính (`.omni-app`, `.omni-workspace`), Top Header, Greeting, Stat bubbles.
  * [`css/sidebar.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/sidebar.css): Thanh điều hướng trái, Live Clock card, nút Cài STK VietQR.
  * [`css/copilot.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/copilot.css): Khung chat, bong bóng tin nhắn, streaming cursor, toolbar tin nhắn, code blocks, action cards.
  * [`css/modal.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/modal.css): Tất cả các hộp thoại (API Key, Cài STK VietQR, Test QR, Popup QR, Lịch sử nợ, Hồ sơ đối tượng).
  * [`css/finance.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/finance.css): Bảng thu chi cá nhân, thẻ nợ 2 tầng (2-Tier Luxury Card), avatar đối tượng, drawer forms, filter pills.
  * [`css/todos.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/todos.css): Giao diện danh sách việc cần làm To-Do.
  * [`css/responsive.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/responsive.css): Media queries tối ưu hóa cho tablet và mobile.
* **app.js:** Entrypoint chính gọn gàng kết nối các module khi `DOMContentLoaded`.
* **js/ (Hệ thống module logic):**
  * [`js/config.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/config.js): Cấu hình hệ thống, `APP_CONFIG`, trạng thái toàn cục.
  * [`js/storage.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/storage.js): Quản lý LocalStorage, tự chữa lành dữ liệu ([healLedgerData](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/storage.js)), các hàm helper định dạng tiền tệ, thời gian, avatar gradient.
  * [`js/ui.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/ui.js): Đồng hồ thời gian thực, điều hướng tabs (thứ tự thanh điều hướng: Trợ Lý Najimez -> Tài Chính & Sổ Nợ -> Lịch & Sự Kiện -> Thời Khóa Biểu -> Lịch Trình & To-Do -> Hộp Dụng Cụ -> Ngoại Ngữ -> Bạn Bè & Kết Nối -> Hyper Najimez), toggle sidebar, cập nhật Header Stats (Cân đối thu chi & Ô Sự Kiện Hôm Nay đếm số sự kiện lịch trong ngày), thông báo chat.
  * [`js/vietqr.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/vietqr.js): Cài đặt STK ngân hàng, kiểm tra kết nối QR, modal hiển thị VietQR Napas.
  * [`js/debt.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/debt.js): Quản lý sổ nợ, thuật toán gom nhóm theo người (Person-Centric Net Debt), tính số dư ròng, tất toán nợ, bộ lọc nợ (đã loại bỏ ribbon thống kê tổng nợ nần để giữ giao diện tối giản, riêng tư và tinh tế).
  * [`js/debt-profile.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/debt-profile.js): Quản lý hồ sơ đối tượng sổ nợ: nén ảnh và đổi avatar (tải ảnh/dán ảnh/url), đổi tên, ghi chú cá nhân.
  * [`js/lucky-wheel.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/lucky-wheel.js): Động cơ Vòng Quay May Mắn Najimez (Canvas Retina, Web Audio API, Confetti physics, Presets: Ăn gì, Uống gì, Việc To-Do, Ai bao/Ai mời, Tùy chỉnh; hỗ trợ API `applyCustomWheelItems`, `loadWheelItemsAndNavigate` và thẻ hành động Copilot `renderLuckyWheelActionCard` giúp AI tạo vòng quay tùy biến theo yêu cầu).
  * [`css/lucky-wheel.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/lucky-wheel.css): Định kiểu Cyber Glassmorphism, kim chỉ phát sáng, vòng đèn LED, bảng điều khiển preset, thẻ hành động Copilot (Action Card) với chip lựa chọn neon, nút mở vòng quay chuyển sắc vàng cam và hiệu ứng phát sáng neon (`highlight-pulse`) khi điều hướng đến Hộp Dụng Cụ.
  * [`js/finance.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/finance.js): Quản lý sổ thu chi, tính tổng thu/chi/còn lại, form thêm giao dịch, bộ lọc thu chi.
  * [`js/todos.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/todos.js): Quản lý công việc To-Do, đánh dấu hoàn thành, thêm/xóa việc.
  * [`js/calendar.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/calendar.js): Quản lý Lịch Vạn Niên & Sự Kiện: Thuật toán Lịch Âm Việt Nam, Can Chi ngày/năm, danh sách ngày lễ lớn tinh gọn, tính năng lặp lại sự kiện với ô checkbox bật tắt trực quan, tùy biến chu kỳ "Mỗi X Y (Ngày/Tuần/Tháng/Năm)", hỗ trợ lặp nhiều thứ trong tuần (`daysOfWeek: [1, 3, 5]` như Thứ 2, 4, 6), ngày kết thúc lặp, mặc định ngày kết thúc bằng ngày bắt đầu và tự động đồng bộ khi đổi ngày, hộp thoại xóa sự kiện lặp lại thông minh chuẩn Google/Apple Calendar với 3 tùy chọn (Chỉ sự kiện này / Sự kiện này và các sự kiện sau đó / Tất cả các sự kiện), highlight hôm nay, đồng bộ To-Do và Thu Chi, **đồng bộ hoàn toàn chấm màu sự kiện trên ô lịch và thẻ chi tiết theo màu sắc nhận diện khoa học (Smart Cognitive Event Themes) của Thời Khóa Biểu**.
  * [`js/event-theme.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/event-theme.js): Bộ Phân Loại Màu Sắc & Biểu Tượng Khoa Học Sự Kiện (Smart Cognitive Event Themes): Áp dụng tâm lý học màu sắc (Color Psychology) và công thái học thị giác giúp phân biệt trực quan tức thì từng môn học, hoạt động (Toán/Logic = Indigo #6366f1, Khoa học Tự nhiên = Cyan #06b6d4, Ngôn ngữ/Xã hội = Sky Blue #0284c7, CNTT/Lập trình = Violet #8b5cf6, Giải trí/Ca hát = Rose Coral #f43f5e, Thể thao/Sức khỏe = Emerald #10b981, Hẹn hò/Cafe = Orange #f97316, Thi cử/Deadline = Amber #f59e0b, Sinh nhật = Pink #ec4899, Công việc = Purple #a855f7). Tự động nhận diện từ khóa tiếng Việt không dấu/có dấu, tự động gợi ý chọn màu khi nhập tiêu đề hoặc phân loại, thuật toán băm (Deterministic Hash) dự phòng chống trùng màu lặp lại.
  * [`css/calendar.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/calendar.css): Định kiểu Lịch Vạn Niên Cyber Luxury, ngày âm lịch, tên ngày lễ, Can Chi, chấm sự kiện đa màu và thẻ banner ngày lễ hội.
  * [`js/timetable.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/timetable.js): Quản lý Phân Hệ Thời Khóa Biểu & Lịch Trình Tuần Vừa Khít 1 Màn Hình Cả 24 Khung Giờ: Hiển thị tuần từ Thứ Hai đến Chủ Nhật, mặc định hiển thị trọn vẹn cả 24 khung giờ trong ngày (00:00 - 24:00) theo tỉ lệ phần trăm responsive, thuật toán xếp cột song song chống đè (Overlapping Event Packing), tích hợp hiển thị màu sắc và icon khoa học theo chủ đề từ `event-theme.js`, vạch đỏ chỉ thị giờ thực tế (Real-Time Indicator), thẻ nổi xem nhanh chi tiết khi hover chuột (Hover Tooltip Card).
  * [`css/timetable.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/timetable.css): Định kiểu Thời Khóa Biểu Tuần Cyber Luxury Glassmorphism 100% Vừa Khít 1 Màn Hình Cho Cả 24 Khung Giờ & Thanh Ngày: Phân hệ Thời Khóa Biểu Tuần (`.timetable-weekly-section`) thiết lập `height: calc(100vh - 92px); max-height: calc(100vh - 92px);`, hàng tiêu đề thứ ngày (T2 - CN) cao 44px sắc nét ở đầu thẻ; thân lưới và 24 ô giờ sử dụng công thức Flexbox triệt tiêu chiều cao thừa (`flex: 1 1 0px !important; min-height: 0 !important; height: 0 !important; overflow: hidden;`) giúp toàn bộ 24 khung giờ (từ 00:00 đến 23:00) và thanh ngày nằm trọn vẹn 100% trong màn hình cùng lúc mà không bị cắt xén hay tràn ra ngoài; bảo toàn thanh cuộn dọc cho trang (`.timetable-workspace-layout`); dải mốc giờ ban đêm (0h - 6h) tách bạch 24px khi bật chế độ thu gọn.
  * [`js/bill-image.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/bill-image.js): Quản lý Đính Kèm & Nhận Diện Ảnh Tự Động Cho Giao Dịch & Sổ Nợ:
    * **Ưu tiên #1 Tuyệt Đối - Tự Động Tìm & Gán Ảnh Thực Tế Từ Web (Wikipedia & Wikimedia Commons):**
      - Xóa bỏ triệt để cơ chế nhận diện từ khóa cứng nhắc đoán mò (tránh tình trạng gán nhầm "bánh cuốn" thành "bánh mì" hay "ốc" thành "hải sản").
      - Khi bất kỳ giao dịch/khoản nợ nào được tạo (qua form drawer, AI Copilot, hay quét QR), hệ thống tự động làm sạch tên món (`cleanQueryForImageSearch`: loại bỏ từ ngữ nợ nần, tên người quen, tiền tố hành động), tra cứu API Wikipedia Tiếng Việt và Wikimedia Commons ngầm trong nền và tự động chọn luôn bức ảnh chụp thực tế có điểm số phù hợp cao nhất (`calculateWebImageScore`).
      - Bộ nhớ đệm LocalStorage (`NAJIMEZ_WEB_IMAGE_CACHE_V2`): Lưu vết ảnh các món ăn/khoản chi đã tìm được để các lần sau gán ngay trong 0ms mà không tốn băng thông.
      - Hàm quét nền tự động khi khởi động (`scanAndAutoFillAllWebImages`): Tự động tìm kiếm và bổ sung ảnh Web chất lượng cao cho toàn bộ các giao dịch và khoản nợ cũ chưa có ảnh.
      - Huy hiệu Vector SVG dự phòng (`createDishOrExpenseFallbackSvg`): Hiển thị đúng tên món và biểu tượng ẩm thực chuẩn xác chỉ khi thiết bị offline, không bao giờ đoán nhầm sang món khác.
      - Nút **"🌐 Tìm ảnh Web"** trong modal xem ảnh: Cho phép người dùng duyệt lưới ảnh hoặc tự gõ từ khóa tìm kiếm ảnh thực tế khác tùy thích.
  * [`css/bill-image.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/bill-image.css): Định kiểu thumbnail ảnh góc phải trên dòng thời gian lịch sử giao dịch/sổ nợ, hộp thoại Modal xem ảnh giao dịch phóng to, nút Tìm ảnh Web xanh Cyan neon, khay tìm kiếm ảnh Web (Web Search Tray) và lưới ảnh trực tuyến Cyber Luxury.
  * [`js/timetable-timeline.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/timetable-timeline.js): Quản lý Thanh Timeline Chạy Ngang của Ngày: Hiển thị mốc giờ nằm ngang ngay bên dưới Header Thời Khóa Biểu Tuần (Header Tuần nằm ở hàng 1, Timeline Ngày nằm ở hàng 2), hỗ trợ chế độ thu gọn khung giờ ngủ (00:00 – 06:00) thành 1 ô "🌙 0h–6h" tương tự TKB tuần giúp tối ưu diện tích cho 18 khung giờ hoạt động (06:00 – 24:00), dải tiến độ thời gian thực (Past Progress Fill), kim thời gian thực chỉ thị phút hiện tại (Realtime Needle), định vị capsule sự kiện theo tọa độ % thời gian; tối giản hóa thanh header (đã loại bỏ hàng thanh/nút trùng lặp gồm bộ chọn 7 ngày, đồng hồ, nút 6h-24h, nút thêm sự kiện và nút cuộn để giữ giao diện thanh thoát, chỉ giữ nút chevron thu gọn/mở rộng); không kích hoạt tạo sự kiện khi click vào nền khung giờ.
  * [`css/timetable-timeline.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/timetable-timeline.css): Định kiểu Cyber Glassmorphism cho Thanh Timeline Ngày: Thân track bo tròn phát sáng, dải tiến độ gradient neon, kim thời gian thực đỏ phát xung, ô ban đêm thu gọn viền đứt tím neon, hiệu ứng tương tác hover tooltip và highlight đồng bộ cột ngày tương ứng.
  * [`js/copilot-image.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/copilot-image.js): Động cơ Quản Lý Gửi Ảnh & Thị Giác Copilot: Tải ảnh từ thiết bị, kéo thả (Drag & Drop), dán ảnh từ clipboard (Ctrl + V), nén ảnh Canvas Retina sắc nét, khay xem trước ảnh (Preview Tray) và Modal xem ảnh phóng to (Lightbox).
  * [`css/copilot-image.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/copilot-image.css): Định kiểu nút đính kèm ảnh, khay preview ảnh đính kèm, hiệu ứng kéo thả viền đứt tím neon và Modal xem ảnh chi tiết toàn màn hình.
  * [`js/copilot.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/copilot.js): Bộ não đàm thoại Gemini AI, kết nối streaming SSE, trích xuất và thực thi Action Protocol (`<!--NAJIMEZ_ACTION:...-->`), bộ não nội bộ dự phòng, tra cứu lịch và sự kiện tự động. Hỗ trợ toàn diện các thao tác lịch: tạo mới (`calendar_event`), xóa sự kiện (`delete_calendar_event`), và **tự động dời lịch / sửa ngày (`update_calendar_event`)**, tự động xóa lịch cũ khi người dùng đính chính ngày/tháng để tránh trùng lặp. Thiết lập quy tắc đàm thoại riêng tư: Najimez giao tiếp gần gũi, ấm áp, tuyệt đối không tự tiện đem sổ nợ hay số dư tài chính ra báo cáo khi trò chuyện thông thường.
  * [`js/stars.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/stars.js): Động cơ bầu trời sao tĩnh lặng (Deep Space Celestial Engine) với hạt sao li ti đa tầng lấp lánh nhẹ nhàng, tinh vân trầm ấm, không gây chói/màu mè.
  * [`js/voice-settings.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/voice-settings.js): Quản lý Cài Đặt Giọng Đọc (TTS) & Hiệu Ứng Âm Thanh Najimez: Hỗ trợ ElevenLabs Flash v2.5 / Multilingual v2 (giọng người thật 100% có nhịp thở, cảm xúc), Microsoft Edge Neural (Hoài My / Nam Minh miễn phí) và Web Speech API Offline. Tích hợp kiến trúc hàng đợi nối tiếp siêu tốc (Zero-Latency Sentence Streaming Pipeline: câu đầu tiên tải và cất tiếng nói sau ~0.2s, nạp ngầm các câu sau, vừa nhắn xong là có voice ngay), bộ nhớ đệm chống tốn quota ký tự và bộ chuẩn hóa phiên âm ngữ âm ("Najimez" -> "Na chi me").
  * [`css/voice-settings.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/voice-settings.css): Định kiểu Modal Cài Đặt Âm Thanh & Giọng Đọc Cyber Luxury Glassmorphism, thẻ chọn Engine giọng đọc (ElevenLabs / Edge / Offline), form API Key kèm nút kiểm tra hạn mức trực tiếp.

  * [`js/toolbox.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/toolbox.js): Quản lý Phân Hệ Hộp Dụng Cụ & Tiện Ích Đa Năng: Bố cục lưới tiện ích tích hợp đồng thời 5 tính năng (Vòng quay may mắn, Xúc xắc 3D & Lật đồng xu, Đồng hồ Pomodoro, Máy tính bỏ túi, Quy đổi tiền tệ đa quốc gia trực tuyến & ngoại tuyến), hỗ trợ nút phóng to/thu nhỏ từng góc tiện ích linh hoạt, bộ tổng hợp âm thanh Web Audio API thuần (Offline 100%), động cơ lật đồng xu 3D, xúc xắc 3D, đồng hồ Pomodoro và tỷ giá ngoại tệ thời gian thực.
  * [`css/toolbox.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/toolbox.css): Định kiểu Cyber Luxury Glassmorphism cho Hộp Dụng Cụ: Lưới tiện ích đa năng cân đối, viền phát sáng gradient riêng biệt cho từng tiện ích (Vàng hổ phách, Xanh cyan, Đỏ hoa hồng, Xanh ngọc lục bảo, Tím amethyst), responsive co giãn mượt mà trên mọi thiết bị.
  * [`js/language-learning.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/language-learning.js): Quản Lý Phân Hệ Trung Tâm Ngoại Ngữ Najimez (Language Learning Hub Workspace): Phân hệ độc lập trong "TRUNG TÂM TIỆN ÍCH" trên thanh Sidebar, hỗ trợ 6 ngôn ngữ phổ biến (Tiếng Anh, Tiếng Nhật, Tiếng Hàn, Tiếng Trung, Tiếng Pháp, Tiếng Đức), HUD Header với ô đổi ngôn ngữ nhanh bên phải; cột điều hướng icon nhỏ gọn bên trái (Flashcard 3D, Trắc nghiệm phản xạ, Sổ từ vựng cá nhân); giao diện "Từ Vựng Của Tôi" (My Vocabulary) có tìm kiếm, phân loại theo ngôn ngữ, thêm từ mới, nghe phát âm và xóa từ. **Tích hợp Thẻ Flashcard 3D thông minh học trực tiếp từ Sổ Từ Vựng Của Tôi**: Lấy các từ vựng trong sổ từ để hỏi, hỗ trợ lật thẻ 3D 180°, phát âm chuẩn bản xứ, phiên âm IPA, câu ví dụ ngữ cảnh, đánh dấu "Chưa nhớ" / "Đã thuộc", trộn thẻ ngẫu nhiên, phím tắt bàn phím (Space để lật, Mũi tên trái/phải để chuyển từ), và màn hình Empty State thân thiện khi sổ từ trống kèm nút nạp từ mẫu 1-chạm. **Tích hợp 2 chiều với Trợ lý ảo Najimez (Copilot)**: Najimez đọc được danh sách từ vựng trong sổ để đố bài tập, giải thích, và tự động xuất thẻ lệnh `add_vocab` / `delete_vocab` lưu thẳng vào Sổ Từ Vựng ngay khi chat.
  * [`css/language-learning.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/language-learning.css): Định kiểu Cyber Luxury Glassmorphism cho Trung Tâm Ngoại Ngữ: HUD Header với avatar Najimez phát sáng xanh Cyan Neon (#06b6d4), khung điều hướng 3 icon tròn nhỏ gọn bên mép trái, sân khấu Thẻ Flashcard 3D bề thế chuẩn chiều cao (`330px`) xoay lật 3D siêu mượt không bị clipping hay tràn viền, màn hình Từ Vựng Của Tôi dạng lưới thẻ bài sang trọng có hiệu ứng âm thanh và phát âm bản ngữ.

  * [`js/friends.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/friends.js): Quản lý Dữ Liệu & Đồng Bộ Thời Gian Thực Phân Hệ Bạn Bè (Najimez Social Connect): Quản lý Mã Najimez ID cá nhân (`NJ-XXXXXX`), tra cứu và gửi lời mời kết bạn theo ID hoặc Email Google, tự động lắng nghe thời gian thực (Firestore `onSnapshot`) lời mời kết bạn (`friend_requests`) và danh sách bạn bè (`friendships`), chấp nhận/từ chối/hủy kết bạn, cập nhật badge thông báo trên Sidebar, gửi lời nhắn động viên bạn bè.
  * [`js/friends-ui.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/friends-ui.js): Giao Diện & Tương Tác Phân Hệ Bạn Bè: Render Thẻ hồ sơ cá nhân / Banner kêu gọi đăng nhập Google, thanh tìm kiếm & gửi kết bạn nhanh, danh sách lời mời chờ duyệt, lưới thẻ bạn bè Cyber Glassmorphism với các nút hành động 1-chạm (Chia tiền/nợ chuyển tự động sang Tab Tài Chính, So khớp TKB, Gửi lời nhắn), Modal xem và tải Mã QR kết bạn cá nhân, hỗ trợ chia sẻ link kết bạn nhanh (`?friend=NJ-XXXXXX`) tự động nhận diện khi người nhận mở link.
  * [`css/friends.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/friends.css): Định kiểu Cyber Luxury Glassmorphism cho Phân Hệ Bạn Bè & Kết Nối: Thẻ hồ sơ cá nhân viền tím neon, chấm tròn trạng thái online xanh ngọc, thanh tìm kiếm bo góc mờ, lưới thẻ bạn bè hiệu ứng hover 3D, badge lời mời kết bạn cam hổ phách và Modal QR sắc nét.
  * [`js/timetable-matcher.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/timetable-matcher.js): Quản Lý & Thuật Toán So Khớp Thời Khóa Biểu Cùng Bạn Bè: Tự động đối chiếu lịch trình hai bên trên Firestore (`shared_timetables`) hoặc chế độ bạn học mẫu Demo, thuật toán hợp nhất khoảng bận (Interval Merging) để trích xuất toàn bộ khung giờ rảnh chung (Mutual Free Slots), tính năng phân tích lời khuyên thông minh từ AI Najimez, chế độ xem dòng thời gian 2 làn song song (Dual-lane Timeline) với ruy-băng phát sáng giờ rảnh chung, chế độ xem tổng quan cả tuần, và nút 1-chạm "Lên Lịch Hẹn" điền sẵn thông tin vào Thời Khóa Biểu.
  * [`css/timetable-matcher.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/timetable-matcher.css): Định kiểu Cyber Luxury Glassmorphism cho Modal So Khớp TKB: Khung modal viền tím ngọc bích, bộ chuyển tab chế độ ngày/tuần, thanh AI Insights viền phát sáng gradient, lưới thẻ khung giờ rảnh viền xanh mint, thước đo thời gian 07h-22h và ruy-băng rảnh chung nổi bật.
  * [`js/hyper-najimez.js`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/js/hyper-najimez.js): Phân Hệ Siêu Trí Tuệ & Tư Duy Sâu "Hyper Najimez" (Overclock Deep Reasoning & Academic STEM Problem Solver):
    * **Cơ chế suy nghĩ sâu (Chain-of-Thought Protocol):** Bắt buộc AI phân tích bản chất qua thẻ `<hyper_thinking>`, tự động bóc tách quá trình tư duy nháp vào khối Accordion "Bộ Não Suy Nghĩ" có đồng hồ bấm giây và hiệu ứng sóng não.
    * **Giải đề học thuật đỉnh cao:** Trình bày theo chuẩn sư phạm 4 phần (Phân tích & Phương pháp, Lời giải chi tiết, Đáp số cuối cùng, Bí kíp & Bẫy cần tránh). Tích hợp thư viện KaTeX render công thức Toán học, Vật lý, Hóa học sắc nét.
    * **Đa phương thức thị giác (Gemini Vision OCR):** Hỗ trợ kéo thả, chọn tệp hoặc dán trực tiếp ảnh chụp đề thi/sách giáo khoa từ Clipboard (`Ctrl + V`).
    * **Thanh công cụ ký hiệu toán học nhanh:** Chèn tức thì các ký hiệu phổ biến ($\sqrt{x}$, $x^2$, $\int$, $\sum$, $\lim$, $\pi$, $\theta$, $\Delta$, $\infty$, $\neq$, $\le$, $\ge$, $\rightarrow$) vào đề bài chỉ với 1 click.
    * **Sổ tay bài tập Hyper (Hyper Notebook):** Tự động lưu trữ bài giải vào `LocalStorage`, hỗ trợ tìm kiếm, lọc theo môn học và mở lại bất cứ lúc nào.
    * **Tiện ích đi kèm:** Sao chép bài giải Markdown/LaTeX, đọc bài giảng bằng giọng nói Najimez (TTS), và xuất file Markdown ôn tập.
  * [`css/hyper-najimez.css`](file:///d:/Siêu%20bá%20khí%20trợ%20lý/css/hyper-najimez.css): Định kiểu Cyber Luxury Overclock Glassmorphism cho Phân Hệ Hyper Najimez: HUD Header phát sáng gradient với avatar có vòng xoay năng lượng, bố cục 2 cột (Input Studio & Solution Arena), hộp tư duy sâu với viền xanh cyber và khối công thức KaTeX căn giữa sắc nét.

---

## 4. Định Hướng Kiến Trúc & Quy Chuẩn (Code Modularization)
* Kỹ năng **`code-modularization`** tại [.agents/skills/code-modularization/SKILL.md](file:///d:/Siêu%20bá%20khí%20trợ%20lý/.agents/skills/code-modularization/SKILL.md).
* Quy tắc bắt buộc: Phân tách mã nguồn thành các module độc lập, kích thước nhỏ (150 - 400 dòng/file), có tính liên kết chặt chẽ theo từng phân hệ nhằm tối ưu tốc độ đọc hiểu và xử lý của AI mỗi khi thực thi tác vụ.
* **Quy chuẩn bố cục thẻ Hộp Dụng Cụ (Toolbox Grid Layout):** Mỗi tính năng/tiện ích trong Hộp Dụng Cụ luôn luôn chiếm đúng 1 ô chữ nhật chuẩn (1 cột) trong lưới 2 cột. Tuyệt đối không dùng `grid-column: 1 / -1` (không kéo dãn thẻ chiếm trọn cả hàng) đối với các thẻ lẻ, mà để trống phần ô bên phải để chừa chỗ cho các tính năng tiếp theo lấp đầy lần lượt theo thứ tự, đảm bảo bố cục không bị xô lệch hay lấn chỗ khi mở rộng tính năng mới.



