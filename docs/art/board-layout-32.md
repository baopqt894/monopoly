# Prototype bàn cờ Việt Nam — bố cục 32 ô

> **PROTOTYPE — CHƯA PHẢI MAP HOÀN CHỈNH.** Ngày 27/10/2026, người dùng đánh giá bản dựng hiện tại "quá xấu", chưa đạt yêu cầu hình ảnh. Bản này chỉ dùng để kiểm tra bố cục/vị trí ô và lưu tiến độ; chưa được duyệt làm map chính thức. Việc test/build đạt không có nghĩa chất lượng đồ họa đã đạt. Cần thiết kế lại và được người dùng duyệt trước khi đánh dấu hoàn thiện map.

Bố cục theo yêu cầu người dùng ngày 27/10/2026. Mỗi dãy gồm 7 ô giữa hai góc, đếm theo chiều di chuyển, bắt đầu sau Xuất phát. Các góc lần lượt là Xuất phát → Đảo hoang → Lễ hội → Sân bay → Xuất phát.

| Dãy | Ô 1 | Ô 2 | Ô 3 | Ô 4 (giữa) | Ô 5 | Ô 6 (kế cuối) | Ô 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1: Xuất phát → Đảo hoang | Châu Đốc | Cần Thơ | Sóc Trăng | **Phú Quốc** | Bạc Liêu | Cà Mau | Buôn Ma Thuột |
| 2: Đảo hoang → Lễ hội | Kon Tum | Quy Nhơn | Nha Trang | **Cơ hội** | Phan Thiết | **Đà Lạt** | Huế |
| 3: Lễ hội → Sân bay | Đà Nẵng | **Côn Đảo** | Hội An | **Cơ hội** | Vinh | Đồng Hới | Ninh Bình |
| 4: Sân bay → Xuất phát | **Sa Pa** | Hạ Long | Hải Phòng | **Cơ hội** | Hà Nội | **Thuế** | TP. Hồ Chí Minh |

- 20 ô đất trong 8 nhóm màu, 4 ô du lịch, 3 Cơ hội, 1 Thuế, 4 góc = 32 ô.
- Dãy đầu không có Cơ hội; ba dãy sau chỉ có đúng một ô Cơ hội ở giữa. Các vị trí này được kiểm thử riêng, không chỉ kiểm tra tổng số.
- Các khu đặc biệt giữ tên đã có: Phú Quốc, Đà Lạt, Côn Đảo, Sa Pa theo thứ tự bốn dãy.

## Phạm vi prototype

Route `/board` hiển thị toàn bộ bàn 3D, camera trực giao khóa hướng; `/map-preview` là URL tương thích. Component `VietnamBoard32` xuất độc lập khỏi HUD, render cùng dữ liệu trong `map-data.ts`.

Mặt bàn có nền giữa xanh sáng, đế viền, ô đất có dải màu nhóm, khu xây dựng trống, tên/giá in trực tiếp lên mặt ô và viền phản hồi khi chọn. Ô du lịch dùng biểu tượng minh họa riêng: ô dù Phú Quốc, cây thông Đà Lạt, rùa Côn Đảo, núi Sa Pa. Cơ hội dùng hình bộ thẻ, Thuế dùng ngân hàng/đồng tiền; bộ thẻ và hai xúc xắc ở giữa là phần trưng bày của scene bàn, không tự quyết định lượt hoặc rút thẻ trong ván thật.

Giữ thiết kế góc đã chọn: Xuất phát chỉ có mũi tên giữa ô; Đảo hoang phủ toàn ô với bãi cát trống; Lễ hội và Sân bay gom mô hình về mép ngoài. Công trình trên 20 ô đất và dãy nhà mẫu giữa bàn đã được bỏ khỏi scene theo yêu cầu cập nhật sau; metadata các công trình đã duyệt vẫn được giữ.

Giá hiển thị theo thang giá prototype (đất 60–400, du lịch 200, Thuế 200), chưa khẳng định đã cân bằng kinh tế cho engine 32 ô. Engine đã hỗ trợ riêng `boardId: 'vietnam-32'` và lễ hội trên 20 đất + 4 resort; không migrate các phòng 40 ô. Renderer/HUD/modal gameplay chưa tích hợp sang boardId này trong nhánh luật. Không tráo tọa độ 32 ô vào state 40 ô.

## Demo hình ảnh đang duyệt

- `/board-demo` dùng bố cục 32 ô ở trên. Vùng xây dựng được in phẳng trên mặt ô, không có bệ màu nhô lên riêng dưới nhà.
- Nhà cấp 1–4 là mesh 3D dựng theo `houses-simple-overview.png`: 8 nhóm × 4 cấp, có mái, cửa, ban công, cánh phụ và nhà sàn theo mẫu. Source: `apps/web/src/features/scene3d/board32/house-models.ts`; chưa coi độ giống concept là đã được người dùng duyệt.
- Các nhà trong demo là mẫu trưng bày cấp độ; chưa thay dữ liệu phòng chơi hoặc quy tắc nâng cấp. Bốn góc tiếp tục dùng artwork đã căn về mặt phẳng bàn. `/game-scene` mở bản xem scene gameplay 40 ô hiện có để đối chiếu, không tạo phòng thật.
- Kiểm tra geometry nhà: `node --import tsx --test apps/web/src/features/scene3d/board32/house-models.test.ts`.

## Kiểm tra

`node --import tsx --test apps/web/src/features/scene3d/board32/board-layout.test.ts` kiểm tra số lượng, vị trí từng dãy, tên khu đặc biệt, giá hiển thị hợp lệ, footprint không chồng và geometry trong giới hạn. Chạy thêm `npm test` và `npm run build`. Kiểm tra trình duyệt desktop/mobile, chọn ô qua raycast/bàn phím và lỗi console; ảnh QA lưu trong `artifacts/board-32/` đã được Git ignore.
