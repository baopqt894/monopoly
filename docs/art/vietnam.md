# Việt Nam — mô hình thành phố và 5 cấp xây dựng

> Trạng thái: bản nháp renderer 40 ô / 22 địa danh. Kế hoạch mới nhất là 32 ô / 20 thành phố, chưa chuyển đổi trong code. Xem [TASKS.md](../../TASKS.md) và [bộ concept mới](concepts/vietnam/v1/README.md). Mô hình nháp chưa đạt độ chi tiết của concept.

Bộ đầu tiên của hệ thống quốc gia. 40 vị trí, ID, giá đất, nhóm màu, tiền thuê, chi phí xây và số suất nhà/cấp 5 giữ nguyên. Chỉ đổi tên điểm đến, nhãn và mô hình. 22 ô đất có dữ liệu thành phố trong packages/game-content/src/vietnam.ts; renderer không quyết định luật. Các địa danh được dùng theo tên du lịch quen thuộc, không đại diện cho sơ đồ đơn vị hành chính.

## Cấp xây dựng

1. Nhà vườn: một tầng, hiên và mái địa phương.
2. Nhà phố: hai tầng, cửa sổ và ban công.
3. Biệt thự: hai tầng và khối phụ, diện tích lớn hơn.
4. Khu nhà: ba tầng, khối phụ và ban công nhiều tầng.
5. Công trình biểu tượng riêng của thành phố, thay hoàn toàn nhà thường.

Các kiểu nền: nhà vùng sông nước, phố di sản, ven biển, cao nguyên, kinh thành và đô thị. Cùng kiểu dùng chung geometry; mỗi thành phố giữ màu tường/mái riêng. Loại hình kinh doanh vẫn quyết định hệ số tiền thuê hiện tại; mô hình landmark cấp 5 không đổi theo loại kinh doanh. Cấp 5 tiếp tục dùng một suất khách sạn trong engine (12 suất), 4 cấp đầu dùng ngân hàng 32 suất nhà.

## Danh mục

| ID  | Thành phố / điểm đến | Công trình cấp 5         |
| --- | -------------------- | ------------------------ |
| 1   | Châu Đốc             | Miếu Bà Chúa Xứ          |
| 3   | Cần Thơ              | Nhà cổ Bình Thủy         |
| 6   | Bạc Liêu             | Nhà hát Cao Văn Lầu      |
| 8   | Sóc Trăng            | Chùa Khleang             |
| 9   | Cà Mau               | Biểu tượng Đất Mũi       |
| 11  | Vũng Tàu             | Hải đăng Vũng Tàu        |
| 13  | Phan Thiết           | Tháp Pô Sah Inư          |
| 14  | Phú Quốc             | Tháp đồng hồ An Thới     |
| 16  | Đà Lạt               | Ga Đà Lạt                |
| 18  | Buôn Ma Thuột        | Bảo tàng Thế giới Cà phê |
| 19  | Pleiku               | Bảo tháp chùa Minh Thành |
| 21  | Nha Trang            | Tháp Trầm Hương          |
| 23  | Quy Nhơn             | Tháp Đôi                 |
| 24  | Hội An               | Chùa Cầu                 |
| 26  | Huế                  | Ngọ Môn                  |
| 27  | Đà Nẵng              | Cầu Rồng                 |
| 29  | Đồng Hới             | Quảng Bình Quan          |
| 31  | Ninh Bình            | Bảo tháp Bái Đính        |
| 32  | Hạ Long              | Bảo tàng Quảng Ninh      |
| 34  | Hải Phòng            | Nhà hát lớn Hải Phòng    |
| 37  | Hà Nội               | Tháp Rùa                 |
| 39  | TP. Hồ Chí Minh      | Chợ Bến Thành            |

## Nguồn và hình học

Mô hình 3D cách điệu được viết trong scene3d/vietnam/miniature.ts và landmarks.ts; không dùng ảnh concept làm hình nền giả 3D. Mái, vòm, thân nhà, cột, lan can, mặt đồng hồ, nhịp cầu và cảnh quan là geometry thực. Đây là mô hình miniature để đọc ở kích thước bàn chơi, không phải bản đo đạc kiến trúc. Tất cả geometry mới do dự án tạo, không tải model bên thứ ba.

- [Nhà cổ Bình Thủy — Cần Thơ Tourism](https://canthotourism.vn/en/nhacobinhthuy)
- [Chùa Khleang — cơ sở dữ liệu du lịch](https://csdl.vietnamtourism.gov.vn/dest/?item=210)
- [Cầu Rồng — Visit Da Nang](https://visitdanang.travel/en/dragon-bridge-2204)
- [Tháp Pô Sah Inư — cổng du lịch Bình Thuận](https://mybinhthuan.vn/vi/posanu)
- [Quảng Bình Quan — cổng du lịch Quảng Trị](https://dulich.quangtri.gov.vn/vi/quangbinhquan)
- [Bảo tàng Quảng Ninh](https://baotangthuvienquangninh.vn/en)
- [Chùa Minh Thành — Ban Tôn giáo Chính phủ](https://religion.vn/domestic-news/minh-thanh-pagoda-special-spiritual-site-for-tourists-in-pleiku-postY1RdyNlaZQ.html)

## Kiểm tra

vietnam-art.test.ts kiểm tra 22 ô đất, 110 biến thể cấp, 5 silhouette khác nhau, geometry hữu hạn, UV/normal đầy đủ, đáy ở y=0, footprint ≤1.42×1.12 và chiều cao ≤2.05 world units, số đỉnh dưới 70k/model. Các surface được merge; geometry dùng chung, material được dọn khi unmount. Bàn vẫn có một camera trực giao cố định; khung rộng phóng lớn khoảng 12% và dịch thông tin phòng sang khoảng trống bên trái đỉnh bàn.

Ảnh xem xét là ảnh renderer chạy thật; trang gallery QA trong artifacts không được deploy. Chưa bổ sung quốc gia khác hoặc bộ chọn quốc gia trong ván.
