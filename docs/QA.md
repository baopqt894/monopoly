# Kiểm tra bản đầu

## Tự động

`npm test` có 66 bài kiểm tra, trong đó 3 bài MongoDB integration chỉ chạy khi có `TEST_MONGODB_URI` (CI luôn cấu hình Mongo 7 replica set riêng). Các nhóm kiểm tra:

- 40 ID, 4 góc, số lượng/vị trí các loại ô, 8 nhóm màu, 2 bộ thẻ 16 lá.
- Tọa độ 2.5D là 40 vị trí duy nhất trên chu vi, không vượt mép bàn.
- Mua/đấu giá, tiền thuê, xây đều, ngân hàng nhà/khách sạn, thế chấp/giải chấp.
- Deck cycling, di chuyển/rút tiếp, thẻ ra tù, ba đôi, ba lần thử ra tù.
- Nợ, quản lý đúng debtor, phá sản, trade, các hệ số City, kết thúc vòng.
- Tạo/join, trùng tên, phòng đầy, ready/host, quyền thao tác và từ chối dice từ client.
- Che seed/deck/tokens, reconnect không tạo ghế trùng, thay thế kết nối.
- Trade cần đối tác chấp nhận; từ chối/hết hạn không chuyển tiền; không bypass bằng TRADE.
- Rời phòng chờ và dọn phòng offline.
- HTTP create/join/poll giữa các service instance độc lập; token giả và phiên bị thay thế.
- Ghi đồng thời, idempotency của command, trade hết hạn trước lúc chấp nhận, heartbeat offline.
- Origin qua proxy Next.js/Vercel, quota/payload và production không fallback RAM khi thiếu MongoDB.
- MongoDB thật: compare-and-set chỉ một bên ghi thắng, TTL khi đọc, quota đồng thời, tạo/join/start qua hai store instance. Test tạo database `typhu_test_*` riêng và dọn sau chạy; không sửa phòng production.
- SSE tự nhận join/trade expiry không cần poll; xác thực, thu hồi phiên cũ, không lộ seed/deck/token, dọn subscription khi cancel/rotate. Decoder xử lý chunk UTF-8 tiếng Việt và revision bỏ trạng thái cũ/trùng.
- MongoDB Change Streams giữa hai connection độc lập; 16 subscriber dùng chung một cursor, tách đúng phòng với pool chỉ có 2 connection.
- Tự kết thúc lượt không mutate state; giữ mọi lựa chọn quản lý tài sản, trade tiền/đất, extra roll; không bỏ qua nợ/thẻ/mua/đấu giá.

`npm run build` kiểm tra TypeScript toàn repo trước khi build Next.js frontend và API. `npm run build:production` chỉ build các route và dependencies cần chạy.

## Tối ưu đồng bộ

- 66/66 test pass khi bật Atlas integration; typecheck và Next.js production build pass.
- Baseline trên Vercel trước thay đổi: 5 lần ready, median command 896 ms, observer poll 2.723 ms (range observer 2.421–7.167 ms). Đây là phép đo live từ máy Windows đang dùng.
- MongoDB thật giữa hai connection: commit → observer median khoảng 39–41 ms; không có poll ứng dụng.
- Bản Next.js production local + Atlas: 5 lần ready qua HTTP/SSE, median command 87 ms, observer 86 ms, 0 poll của observer. Không so sánh trực tiếp local với Vercel như cùng môi trường.
- Script tái lập tại `scripts/benchmark-room-sync.mjs`. Region Atlas được xác nhận trực tiếp trong dashboard là AWS Hong Kong ap-east-1; cấu hình Vercel hkg1 tương ứng.
- Đã bỏ 650 ms chờ trước khi gửi ROLL; animation hiện kết quả authoritative khi nhận snapshot. Client command không phải đợi heartbeat hoàn tất.

## Kiểm chứng chuyển Next.js + MongoDB

- Bản production local (`next build` + `next start`) dùng kết nối Atlas thực tế: health sẵn sàng, hai tab tạo/join cùng phòng, ready và bắt đầu đồng bộ.
- Lượt kiểm tra cuối: 53/53 test pass khi bật TEST_MONGODB_URI, gồm MongoDB Atlas thật; typecheck và Next.js production build pass.
- Dice từ backend, thẻ Cơ hội và tiền ở hai ghế cập nhật đúng; chuyển lượt sang khách và reload vẫn giữ ghế/tiền/lượt.
- Sau rebuild và restart Next.js, reload khách vẫn khôi phục cùng phòng, số tiền và lượt. Đã kiểm tra URI/mật khẩu database không nằm trong .next/static.
- Xem trực tiếp renderer 2.5D sau chuyển framework; ảnh tại `artifacts/nextjs-mongodb-production.png` (gitignored).
- Đã phát hiện và sửa Origin mismatch do Next.js bind `0.0.0.0`, thêm test kiểm tra Host/protocol công khai sau proxy.
- Bản Next.js ban đầu đã deploy production, tạo/join phòng qua hai phiên thành công. Vercel cần MONGODB_URI/MONGODB_DB, Framework Next.js và không giữ Output Directory override cũ. Mỗi đợt đổi transport vẫn cần kiểm chứng deployment riêng; kiểm chứng local không thay cho kiểm tra deployment thật.

## Kiểm tra trình duyệt bản trước khi chuyển framework

- Đặt tên → chọn tạo/join → cài đặt → tạo mã phòng.
- Phiên thứ hai đặt tên riêng, nhập cùng mã và join.
- Ready ở khách cập nhật sang host; host start đồng bộ hai phiên.
- Người đúng lượt có nút tung; khách chỉ thấy trạng thái chờ, không điều khiển đối thủ.
- Tung dice, mở mua đất, mua và cập nhật tiền ở cả hai phiên.
- Xây nhà và cập nhật danh mục online.
- Chuyển lượt làm nút tung rời thiết bị host và xuất hiện ở đúng thiết bị khách; tải lại tab khách vẫn giữ đúng ghế, tiền, tài sản và lượt.
- Luồng thẻ Cơ hội đã thử trực tiếp ở vòng local trước khi chuyển transport: rút/nhận tiền và chuyển lượt hoạt động; xử lý thẻ qua engine dùng chung.
- Renderer 2.5D khóa camera, nền fullview, HUD ở góc, dice giữa bàn, fallback sơ đồ.
- Bản giao diện du lịch: nền ảnh tối giản, HUD sáng, avatar mới, texture ô rõ hơn, xúc xắc bo cạnh và quân cờ riêng. Kiểm tra phòng chờ nằm gọn trong viewport 1280×720; kiểm tra gameplay ở cả khung ngang và khung dọc của app.

Ảnh kiểm tra nằm trong `artifacts/` (gitignored), không phải source asset. Ảnh ghi nhận state lúc chụp, không thay cho test luật.

## Giới hạn bằng chứng

Online được thử trên hai phiên trình duyệt cùng máy; chưa thử hai thiết bị vật lý hoặc Internet công khai. Chưa soak test nhiều phòng hoặc playtest cân bằng/thời lượng. Bản Next.js dùng MongoDB lưu phòng qua restart khi còn TTL; local dev thiếu MongoDB mới dùng RAM. Renderer vẫn tải động, chưa có đo đạc hiệu năng tải trên deployment Next.js thật.
