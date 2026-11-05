# Kiểm thử gameplay 32 ô — 27/10/2026

## Tự động

- `npm test`: các kiểm tra engine/server, gồm playthrough 2/3/4 ghế qua HttpRoomService, mỗi request tạo service mới và xác thực token như request độc lập. Dữ liệu MemoryRoomStore riêng, không chạm phòng thật.
- `playthrough-32.test.ts`: seed cố định trong fixture để lặp lại; 2 ghế 115 hành động, 3 ghế 170, 4 ghế 422. Cả ba đi qua roll/purchase/card/festival/end/debt, kết thúc bankruptcy; reconnect giữa ván và sau kết thúc giữ nguyên snapshot. Không thay dice ở client; chọn action bằng policy chỉ dùng trong test.
- Các test luật riêng bao phủ thuê, bay, thẻ chọn mục tiêu, Lễ hội, thanh lý, mua lại, thắng độc quyền, accept-winnings, kiểm tra quyền và request trùng.
- `gameplay-quotes.test.ts`: giá hiển thị khớp tiền bị trừ khi BUY/BUILD; ngân hàng thiếu nhà, giới hạn vòng và thiếu tiền bị từ chối; tên và thứ tự resort/địa danh khớp preview và gameplay.
- `gameplay-buildings.test.ts`: cấp hiển thị theo mua/nâng 1–5/chuyển chủ/phá sản/xóa property; toàn bộ tọa độ pawn và bay khớp 32 ô; legacy 40 ô không đổi.

Lệnh kiểm tra UI geometry bổ sung:

```sh
node --import tsx --test apps/web/src/features/scene3d/board32/board-layout.test.ts apps/web/src/features/scene3d/board32/building-catalog.test.ts apps/web/src/features/scene3d/board32/house-models.test.ts apps/web/src/features/scene3d/board32/gameplay-buildings.test.ts
```

## Trình duyệt

Hai tab tạo/join/sẵn sàng/start trên server production build QA ở cổng 3001, kho RAM riêng do kho phòng dev cổng 3000 báo chưa sẵn sàng. Đã thao tác tung, mua Nha Trang cấp 3 (₫380, tiền từ ₫1.500 xuống ₫1.120), xác nhận mô hình xuất hiện và giới hạn cấp 4 trước vòng đầu bị khóa; reconnect giữ đúng ghế/tài sản. Hai tab đồng bộ các lượt, mua lại/chuyển chủ và Lễ hội do timeout. Rời một trong hai ghế kết thúc ván trên tab còn lại với kết quả server. Đây là các ghế QA riêng.

## Giới hạn

Không coi kiểm thử RAM là bằng chứng MongoDB production hoạt động. Các test MongoDB cần replica set được cấu hình và có thể bị skip trong môi trường local. Cần kiểm tra mạng thực giữa nhiều thiết bị/production sau khi có kho phòng sẵn sàng. Giá kinh tế hiện giữ cấu hình có sẵn; đợt này không cân bằng lại giá/thuê hoặc thay bộ luật.


## Regression xem thông tin trong animation — 28/10/2026

Đã kiểm tra browser trên fixture QA local chỉ mô phỏng snapshot, không kết nối kho phòng hoặc production. Fixture luân phiên snapshot phase roll và kết quả ROLL thực từ reducer, có lastRoll/movement ID mới để chạy đúng useRollPresentation/PlayerPawn.

- Mở Châu Đốc rồi để snapshot tung/di chuyển tiếp: dialog giữ thuộc tính open; MutationObserver của fixture không ghi nhận tháo node hoặc dựng lại dialog qua các chu kỳ (so với số đếm ngay sau mount; dev Strict Mode có effect cleanup ban đầu). Đã đọc trực tiếp data-turn-phase=spinning trong khi dialog vẫn mở.
- Đóng bằng nút Đóng vẫn hoạt động; mở danh mục tài sản và nhật ký thành công. Các nút Tài sản/Nhật ký/Luật không mang disabled do animation. Danh mục tài sản giữ bảng qua snapshot tiếp theo.
- Mua/nâng cấp/giao dịch vẫn đi qua dispatch và kiểm tra engine/server; không đổi xúc xắc, thời lượng hoặc tiền trong lần sửa này.

Route và mã fixture QA đã gỡ sau kiểm tra, không đưa vào build/commit. Đây là kiểm tra trình diễn React theo snapshot, không thay cho bài kiểm tra mạng nhiều thiết bị.
