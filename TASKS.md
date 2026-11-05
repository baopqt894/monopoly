# Tiến độ và kế hoạch — Tỷ Phú Việt Nam

Cập nhật: 27/10/2026, đối chiếu code tại `2703dc3` (merge PR #9). Checklist thể hiện chức năng đã có trong source; không đồng nghĩa chất lượng hình ảnh đã được duyệt hoặc production đã được kiểm chứng. Push GitHub kích hoạt Vercel tự deploy theo cấu hình dự án.

## Trạng thái hiện tại

### Nền tảng và phòng chơi

- [x] Next.js 16.4.3 phục vụ frontend và API cùng deployment; React 19, Three.js 0.180 / React Three Fiber. Luật ở game-engine, nội dung ở game-content, protocol ở contracts.
- [x] Server authoritative: xác thực ghế/actor; server chọn xúc xắc, người đi đầu, quân cờ và lưu kết quả. Client chỉ gửi intent.
- [x] MongoDB lưu phòng qua compare-and-set, request ID chống thực thi lặp; SSE qua Change Streams, revision chống snapshot cũ, fallback poll và reconnect.
- [x] Runtime logs có chẩn đoán lỗi kho phòng theo allowlist, không ghi URI/token/state hoặc lỗi database thô cho người chơi.
- [x] Phòng mới chỉ tạo chế độ classic; cài đặt tiền ban đầu, lương Xuất phát, số ô sự kiện và mức tăng Lễ hội. Phòng city đã lưu vẫn giữ luật cũ.
- [x] Lobby tạo phòng mới với `boardId: 'vietnam-32'`. `boardFor` / `groupsFor` giữ phòng thiếu boardId trên bàn 40 ô; không tráo ID snapshot cũ.
- [x] Người đi đầu chọn ngẫu nhiên một lần; `startingPlayer` giữ mốc vòng qua reconnect. Quân cờ được bốc không trùng một lần khi bắt đầu.
- [x] Thoát có xác nhận; ghế đã chủ động thoát không reconnect giữa ván. Bot thay ghế nếu ván tiếp tục; khi đủ điều kiện Accept Winnings thì server kết thúc. Mất mạng đơn thuần không biến ghế thành bot.
- [x] Hạn hành động thông thường 15 giây, auto-roll/auto-skip và tự kết thúc khi hết lựa chọn hợp lệ. Pending trade/debt có xử lý riêng; thanh lý dùng deadline 30 giây.

### Luật và tương tác đã tích hợp

- [x] Luồng tung → di chuyển → xử lý ô. UI chờ trình diễn di chuyển trước khi mở lựa chọn, không tự sửa state.
- [x] `landing-v1`: giá đất ván mới gồm nhà cấp 1; mua có chọn cấp, xây chỉ tại lần đáp hợp lệ, giới hạn cấp theo vòng cá nhân; cấp 5 cần điều kiện riêng. Không giới hạn nguồn nhà/cấp cuối trong luật mới; legacy giữ ngân hàng cũ.
- [x] Mua lại ô đối thủ sau trả thuê với giá 1,5× theo quote engine; không mua lại landmark cấp 5. Trọn nhóm nhân đôi thuê ở mọi cấp. UI mua/xây/mua lại và bảng giá đã dùng helpers engine.
- [x] `full-value-v1`: bán nguyên ô theo giá trị đầy đủ để trả nợ, chọn ưu tiên trực tiếp trên map; deadline cố định 30 giây tự bán đủ, giữ tiền dư, thiếu sau bán hết thì phá sản. Luật mới từ chối thế chấp và bán từng cấp.
- [x] Đáp Đảo hoang bị giữ ngay, không chỉ do thẻ. Bàn 32 gọi góc này là Côn Đảo; tung đôi thoát vẫn đi và được tung thêm. UI có hành động thoát đảo.
- [x] Thuế = làm tròn lên 10% tổng giá mua gốc đất/resort/ga/tiện ích sở hữu; không tính tiền mặt hoặc tiền xây.
- [x] Sân bay kết thúc lượt hiện tại, vé dùng lượt sau. Nếu đủ ₫50 phải chọn đích bay trước khi tung; thiếu phí được tung và bỏ vé. Bay theo chiều tiến qua/đến Xuất phát nhận lương và tăng vòng cá nhân; bay cùng ô không tính một vòng.
- [x] Sau FLY xử lý xong đích được tung thường tiếp qua `flightRollPending`; tới đảo/sân bay mất quyền này. Chọn đích trực tiếp trên map; bot/timeout dùng cùng luật.
- [x] 23 thẻ Cơ hội cho ván landing mới; deck cũ không bị thay thứ tự/số lượng. Quỹ Cộng đồng còn 16 thẻ trong content/legacy; bố cục 32 chỉ có 3 ô Cơ hội, không có ô chest riêng.
- [x] Thẻ 17–20: Động đất xóa cả đất, Hỏa hoạn hạ cấp, Buộc bán thu hồi ô và hoàn tiền, Cúp điện ngừng thuê tới 3 lần chủ qua GO. Chỉ Cúp điện áp dụng lên cấp 5.
- [x] Thẻ 6/7 tới Lễ hội/Sân bay; thẻ 21 tới địa điểm Lễ hội, 22 tới Thuế, 23 tặng nguyên ô. UI chọn đất trên map và chọn người nhận; server kiểm tra lại. Timeout chọn ngẫu nhiên, bot ưu tiên đối thủ hợp lệ giàu nhất theo tài sản ròng cho thẻ tác động đối thủ.
- [x] Ô sự kiện ngẫu nhiên ×1,5 chọn một lần khi tạo ván, tách khỏi Lễ hội. Lễ hội có một thành phố chủ sở hữu chọn và bộ đếm chung; tăng mỗi lần 0,25 hoặc 0,5 (mặc định 0,5), chuyển nơi thì ô cũ mất hiệu ứng.
- [x] `business-tour-v1`: thắng bằng Side Monopoly, Triple Monopoly, đủ 4 resort, đối thủ phá sản hoặc Accept Winnings khi các đối thủ còn khả năng chơi đều chủ động rời. ResultsModal dùng winnerId/winReason từ server, không lấy người giàu nhất ghi đè.

### Giao diện và renderer

- [x] Gameplay fullview, HUD ở góc, camera trực giao cố định; bàn 2D/2.5D và tọa độ quân/bay đọc đúng boardId.
- [x] Bàn 32 dùng RaisedTile và HouseModel theo ownership/level snapshot: 4 cấp nhà theo nhóm, cấp 5 theo landmark từng thành phố. Có bộ model, vật liệu và chi tiết riêng trong `features/scene3d/board32/`; bộ 40 cũ còn đường render riêng.
- [x] Ô góc dùng AssetCorner, có nhập ảnh `corners-go-arrow.png` làm texture tham chiếu/mặt ô. Không còn đúng khi nói toàn bộ PNG concept chưa được dùng runtime; không đồng nhất texture này với model 3D hoàn chỉnh.
- [x] Highlight chọn đất cho thẻ, Lễ hội, thanh lý và sân bay; EventMarkers hiển thị ô sự kiện/địa điểm Lễ hội. Modal tài sản/thẻ đọc bàn và quote đúng phiên bản.
- [x] Quân cờ Việt Nam; trang preview đã được dọn ngày 28/10/2026; avatar HUD chụp từ chính model quân cờ bằng render target dùng chung, có cache và fallback. Ghế bot làm tối avatar, gắn BOT.
- [x] Chat lobby/gameplay: composer và lịch sử riêng, bong bóng độc lập theo avatar; chat không reset timer hay phát lại bong bóng lịch sử khi reconnect.
- [x] Hiển thị biến động tiền và thông báo thẻ dùng chung; bàn có phản hồi sự kiện và trạng thái.
- [ ] Người dùng duyệt chất lượng cuối của mặt bàn, model và tổng thể gameplay. Đã có code tích hợp không đồng nghĩa đã đạt hình ảnh 1:1 hoặc hoàn thiện mỹ thuật.
- [ ] Xác nhận độ rõ, footprint, che khuất quân/HUD và hiệu năng trên thiết bị di động thật.

## Bàn Việt Nam đang dùng trong ván mới

Nguồn: [board32-layout.ts](packages/game-content/src/board32-layout.ts), [board32.ts](packages/game-content/src/board32.ts). Không gian ID riêng `vietnam-32`; legacy 0–39 không bị thay.

| Loại | Số ô | Nội dung hiện tại |
| --- | ---: | --- |
| Thành phố | 20 | 8 nhóm màu, cấp nhà 1–4 và landmark cấp 5 |
| Resort | 4 | Phú Quốc (4), Lăng Cô (14), Mỹ Khê (18), Cô Tô (25) |
| Cơ hội | 3 | ID 12, 20, 28 |
| Thuế | 1 | ID 30; tính theo taxFor, không lấy số thuế cố định trong metadata |
| Góc | 4 | Xuất phát 0, Côn Đảo 8, Lễ hội 16, Sân bay 24 |

Resort dùng loại nội bộ railroad + resort=true, giá mua hiện ₫200/ô, không xây nhà; thuê nền 25 × 2^(số resort sở hữu − 1), sau đó áp hệ số liên quan. Côn Đảo là góc giam giữ, không phải resort. Đà Lạt và Sa Pa không nằm trong bàn 32 hiện tại.

| Nhóm | Màu | Thành phố (ID) → công trình cấp 5 |
| --- | --- | --- |
| Miền Tây | Nâu | Châu Đốc (1) → Miếu Bà Chúa Xứ; Cần Thơ (2) → Nhà cổ Bình Thủy |
| Nam Bộ | Xanh ngọc | Sóc Trăng (3) → Chùa Khleang; Bạc Liêu (5) → Nhà hát Cao Văn Lầu; Cà Mau (6) → Biểu tượng Đất Mũi |
| Tây Nguyên | Hồng | Buôn Ma Thuột (7) → Bảo tàng Thế giới Cà phê; Kon Tum (9) → Nhà rông Kon Klor |
| Nam Trung Bộ | Cam | Quy Nhơn (10) → Tháp Đôi; Nha Trang (11) → Tháp Trầm Hương; Phan Thiết (13) → Tháp nước Phan Thiết |
| Di sản miền Trung | Đỏ | Huế (15) → Ngọ Môn; Đà Nẵng (17) → Cầu Rồng; Hội An (19) → Chùa Cầu |
| Bắc Trung Bộ | Vàng | Vinh (21) → Cổng thành cổ Vinh; Đồng Hới (22) → Tháp chuông Tam Tòa |
| Bắc Bộ | Xanh lá | Ninh Bình (23) → Bảo tháp Bái Đính; Hạ Long (26) → Bảo tàng Quảng Ninh; Hải Phòng (27) → Nhà hát lớn Hải Phòng |
| Hai thành phố | Xanh dương | Hà Nội (29) → Tháp Rùa; TP. Hồ Chí Minh (31) → Chợ Bến Thành |

Giá thành phố theo các tier hiện có; kinh tế đã có trong engine nhưng chưa được coi là cân bằng qua playtest dài hạn. Tên địa danh theo nhận diện du lịch.

## Hướng hình ảnh và tài sản tham chiếu

- [x] Đã tạo 6 hướng concept bàn cờ và bộ v1 gồm 32 PNG (8 bảng nhà × 4 cấp, 20 landmark, 4 góc).
- [x] Đã ghi nhận chọn nhóm nhà đơn giản v2: ưu tiên khối/mái/cửa lớn và màu vùng, giảm cây và chi tiết nhỏ.
- [x] Đã ghi nhận duyệt `landmarks-simple-revised.png`: dùng Kon Tum–Kon Klor, tháp nước Phan Thiết và tháp chuông Tam Tòa thay các mẫu cũ.
- [x] Đã tạo các vòng chỉnh ô góc: công trình mép ngoài chừa đường quân, đảo phủ cát toàn ô, Xuất phát chỉ mũi tên giữa ô. Code đã dùng ảnh góc mới nhất; vẫn cần duyệt kết quả trên bàn thật.
- [ ] Duyệt tổng thể bàn mới. Góp ý đã lưu ngày 27/10 đánh giá prototype `/board` / `/map-preview` chưa đạt hình ảnh; chưa có bằng chứng trong tài liệu này xác nhận người dùng đã duyệt bản gameplay sau tích hợp.

Tài liệu v2 và manifest giữ lịch sử từng vòng, nên các câu “chưa tích hợp runtime” trong mô tả lúc tạo ảnh không phải trạng thái code hiện tại.

| Tài sản / công cụ xem | Nơi lưu |
| --- | --- |
| Bố cục 32 ô | [board-layout-32.md](docs/art/board-layout-32.md) |
| Ảnh mẫu đang dùng | [Tham chiếu model](docs/art/concepts/vietnam/v2/README.md) |
| Atlas góc runtime | [corners-go-arrow.png](public/assets/board/corners-go-arrow.png) |
| Renderer gameplay | `apps/web/src/features/scene3d/board32/` |
| Preview và concept cũ | Đã dọn ngày 28/10/2026; xem lịch sử Git nếu cần khôi phục. |

Các trang preview đã được loại khỏi app; gameplay vẫn ở `/`. Các model runtime hiện ở `features/scene3d/board32/` và `features/scene3d/`. Không commit dữ liệu QA, .env, cache build hoặc ZIP trùng ảnh.

## Kế hoạch tiếp theo theo ưu tiên

### P0 — Duyệt hình ảnh trên bản tích hợp

- [ ] So sánh bàn gameplay hiện tại với nhà/landmark v2, ghi góp ý theo từng nhóm thay vì tiếp tục coi bản v1 là chuẩn.
- [ ] Chốt tỷ lệ model, mặt tiền, footprint góc, khoảng trống di chuyển và hit target trên desktop/mobile; giữ camera cố định, không thêm xoay/zoom.
- [ ] Chụp ảnh kết quả sau mỗi thay đổi hình ảnh để người dùng góp ý. Test/build không thay thế duyệt mỹ thuật.

### P1 — Kiểm chứng online và hồi quy

- [x] Có test engine/server cho board 32, luật mua/xây/mua lại, thẻ mục tiêu, Lễ hội, bay, thanh lý, timeout/bot, thắng và tương thích legacy.
- [x] Có playthrough HTTP 2/3/4 người, mỗi request khôi phục service riêng, reconnect giữa/sau ván; có test geometry và ánh xạ gameplay-building riêng phía web.
- [ ] Kiểm chứng MongoDB replica set và SSE nhiều instance với môi trường test cấu hình đầy đủ; không dùng credentials production trong test.
- [ ] Kiểm tra production giữa nhiều thiết bị/mạng: reconnect, nhiều người thao tác, timeout, chat, bot và kết thúc ván. RAM QA không chứng minh MongoDB production hoạt động.
- [ ] Bổ sung/re-run kiểm tra trình duyệt cho các thay đổi mới nhất về chat, bay và phản hồi bàn; ghi rõ viewport và giới hạn.

### P2 — Hiệu năng và cân bằng

- [ ] Đo thời gian command → snapshot và độ trễ giữa nhiều người trong mạng thực; phân biệt mạng/database với thời gian animation.
- [ ] Đo FPS, bộ nhớ và tải đầu trên thiết bị di động thật; tối ưu geometry/material/cache/instancing/LOD khi số đo chỉ ra vấn đề.
- [ ] Playtest giá mua/thuê, tăng Lễ hội, phí bay và tốc độ kết thúc bằng độc quyền; code đã có kinh tế, không ghi lại thành chưa triển khai.

### P3 — Quy trình cập nhật tiếp

- [ ] Sau thay đổi luật, cập nhật test và GAMEPLAY.md/PROPERTY_RULES.md tương ứng; giữ version cho snapshot cũ.
- [ ] Sau thay đổi renderer, xem trực tiếp giao diện và lưu ảnh; không thêm chữ hướng dẫn nhỏ hoặc dashboard vào gameplay.
- [ ] Chỉ commit/push khi người dùng yêu cầu; dùng GitHub push để Vercel tự deploy.

## Ý tưởng chưa cam kết triển khai

- Bộ quốc gia tiếp theo với kiến trúc và landmark riêng; Việt Nam vẫn là ưu tiên, chưa chọn nước tiếp theo.
- Cải thiện model resort theo đặc trưng của 4 điểm hiện hành, giữ nguyên luật mua/thuê trừ khi được yêu cầu đổi.
- Animation xây/nâng landmark theo từng khối, hiệu ứng hạ cánh/lật thẻ ngắn; không trì hoãn command hoặc nhận snapshot.
- Mở rộng hiệu ứng Lễ hội từ EventMarkers hiện có, giữ nền rìa đơn giản và không che quân/HUD.
- Cân bằng hoặc thêm thẻ sau playtest. Bộ 23 thẻ và chọn mục tiêu đã tồn tại, không còn là hạng mục chờ triển khai từ đầu.
- Chế độ xem cận công trình riêng nếu người dùng yêu cầu; không tự thêm camera điều khiển vào gameplay.

## Kiểm chứng và giới hạn

- [QA gameplay 32 ô](docs/QA_GAMEPLAY_32.md) ghi nhận playthrough tự động, hai tab QA, mua/nâng/mua lại và reconnect trong kho RAM riêng. Đó là kết quả đã ghi của đợt trước, không phải kiểm chứng production trong lần cập nhật tài liệu này.
- `npm test` ở root chạy engine/server; các test web/geometry không nằm trong glob đó. Lệnh bổ sung nằm trong tài liệu QA; không gộp thành kết quả root test.
- CI có MongoDB 7 replica set riêng rồi chạy test và build. Có workflow không đồng nghĩa đã kiểm tra trạng thái CI mới nhất.
- Số 94 test / 91 đạt / 3 bỏ qua là mốc cũ trước các PR vừa pull, không dùng làm số hiện tại.
- Lần cập nhật này chỉ sửa TASKS.md; không thay luật, renderer hoặc các tài liệu lịch sử khác. Chưa commit/push trong lần cập nhật này.
- Kiểm tra chạy lại ngày 27/10/2026: `npm test` có **234 test, 231 đạt, 3 MongoDB integration bỏ qua, 0 lỗi**. `npm run build` đạt, gồm typecheck và Next.js production build. Lần build đầu bị sandbox chặn tạo thư mục .next (EPERM), chạy lại ngoài sandbox đã thành công.
- Đã kiểm tra đủ 23 đường dẫn Markdown cục bộ trong tài liệu. Không chạy lại QA trình duyệt hoặc kiểm tra production cho lần sửa tài liệu này.

## Cập nhật tương tác và hình ảnh thẻ — 27/10/2026

- [x] Máy bay, thẻ đi xa và thẻ ra đảo có đường đi đầy đủ dọc bàn; đường xem trước bay đi theo chu vi. Không xử lý thuế/thuê tại các ô đi ngang.
- [x] Server tự rút sau hoạt cảnh đến ô và nhịp 900 ms; ảnh thẻ lật chậm, chừa 5,5 giây trình diễn/đọc trước cửa sổ thao tác. Bot cũng chờ nhịp đọc.
- [x] Thay dialog nội dung thẻ bằng mặt ảnh SVG trong scene, tiêu đề/nội dung nằm trên ảnh; 10 minh họa image_gen dùng chung theo loại hiệu ứng cho đủ 23 thẻ Cơ hội, cũng hỗ trợ thẻ Community legacy. [Prompt và provenance](docs/art/chance-cards-manifest.json).
- [x] Thông báo thẻ cho người khác chỉ hiện với thẻ đang xử lý; đóng sau thực hiện và không phát lại khi tung/đổi lượt.
- [x] Border avatar và thẻ tên/tiền theo màu người chơi, gồm vòng sáng của người đang có lượt.
- [x] Mặt ô bỏ giá mua, chỉ hiện tiền thuê hiện tại của ô đã sở hữu từ helper engine; kiểm tra trường hợp cấp nhà + trọn nhóm + ô sự kiện + Lễ hội. Ô cúp điện/thế chấp có thuê 0; giá mua vẫn giữ trong chi tiết/lựa chọn mua.
- [x] QA trình duyệt desktop 1707×791 và viewport mobile 390×844: mặt thẻ, chọn mục tiêu trên map, thực hiện thẻ và chuyển lượt; kiểm tra giá Châu Đốc ₫540 so với giá mua ₫60. Dùng fixture local riêng, không sửa phòng production.
- [ ] Duyệt hình ảnh thẻ mới và tổng thể bàn; chưa commit/push đợt sửa này.

Ảnh QA cục bộ (Git ignore): artifacts/fixes-chance-card.png, artifacts/fixes-chance-mobile.png, artifacts/fixes-board-rent-hud.png. Kiểm tra cuối đợt: npm test có 237 test (234 đạt, 3 MongoDB integration bỏ qua, 0 lỗi); bộ apps/web/tests có 19/19 đạt. npm run build đạt (typecheck + production build), không còn route QA tạm trong output. Chưa kiểm chứng production/database thật; kiểm tra hình ảnh dùng fixture riêng, không đại diện hiệu năng thiết bị thật.

## Bộ landmark Blender Việt Nam — hoàn thành ngày 28/10/2026

Theo yêu cầu hoàn thành toàn bộ công trình còn lại, dọn preview rồi commit/push. Bộ cuối gồm **20 GLB + 20 file Blender chỉnh sửa được**; chưa ghép vào map.

| Thành phố | Công trình | Revision | Trạng thái hình ảnh |
| --- | --- | --- | --- |
| Châu Đốc | Miếu Bà Chúa Xứ | 2 | Đã đồng ý hướng hình ảnh |
| Cần Thơ | Nhà cổ Bình Thủy | 2 | Đã đồng ý hướng hình ảnh |
| Sóc Trăng | Chùa Khleang | 2 | Đã đồng ý hướng hình ảnh |
| Bạc Liêu | Nhà hát Cao Văn Lầu | 2 | Đã đồng ý hướng hình ảnh |
| Cà Mau | Biểu tượng Đất Mũi | 2 | Đã đồng ý hướng hình ảnh |
| Buôn Ma Thuột | Bảo tàng Thế giới Cà phê | 3 | Đã sửa cấu trúc mái sau góp ý, đã đồng ý |
| Kon Tum | Nhà rông Kon Klor | 2 | Đã đồng ý hướng hình ảnh |
| Quy Nhơn | Tháp Đôi | 2 | Đã đồng ý hướng hình ảnh |
| Nha Trang | Tháp Trầm Hương | 2 | Đã đồng ý hướng hình ảnh |
| Phan Thiết | Tháp nước | 2 | Đã đồng ý hướng hình ảnh |
| Huế | Ngọ Môn | 2 | Đã đồng ý hướng hình ảnh |
| Đà Nẵng | Cầu Rồng | 2 | Đã cho tiếp tục hoàn thành cả bộ |
| Hội An | Chùa Cầu | 2 | Hoàn thành cùng đợt, đã QA; chưa duyệt riêng |
| Vinh | Cổng thành cổ Vinh | 2 | Hoàn thành cùng đợt, đã QA; chưa duyệt riêng |
| Đồng Hới | Tháp chuông Tam Tòa | 2 | Hoàn thành cùng đợt, đã QA; chưa duyệt riêng |
| Ninh Bình | Bảo tháp Bái Đính | 2 | Hoàn thành cùng đợt, đã QA; chưa duyệt riêng |
| Hạ Long | Bảo tàng Quảng Ninh | 2 | Hoàn thành cùng đợt, đã QA; chưa duyệt riêng |
| Hải Phòng | Nhà hát lớn Hải Phòng | 2 | Hoàn thành cùng đợt, đã QA; chưa duyệt riêng |
| Hà Nội | Tháp Rùa | 2 | Hoàn thành cùng đợt, đã QA; chưa duyệt riêng |
| TP.HCM | Chợ Bến Thành | 2 | Hoàn thành cùng đợt, đã QA; chưa duyệt riêng |

- [x] Dựng geometry thật trong Blender theo ảnh concept có sẵn; không dùng billboard ảnh để giả model.
- [x] Giữ riêng các đặc trưng: mái/cửa/cột, vòm xuyên, tháp giật cấp, bờm/đuôi rồng, kính và đồng hồ theo từng công trình. Mặt khuất là phần thiết kế tiếp nối từ ảnh một góc.
- [x] Xuất GLB có UV/PBR, chuẩn hóa footprint tối đa 1,42 × 1,12 và pivot giữa chân đế.
- [x] Giữ nguồn mesh/curve/modifier trong 20 file Blender; bỏ camera/đèn/sàn preview khỏi scene nguồn.
- [x] Gom source dựng vào art-source/blender; mặc định tái tạo chỉ xuất model và metadata, không tự tạo ảnh/trang preview.
- [x] Xóa art-review, gallery/viewer/server preview, script ghép ảnh, generator v1 và bản Buôn Ma Thuột v2 bị loại; dọn các bản nháp/ảnh/log preview trong artifacts. Giữ ảnh concept gốc làm tham chiếu dựng model.
- [x] Kiểm tra ảnh tám công trình mới và sửa mạch đá chạy qua vòm Hội An, góc tường Tháp Rùa, chi tiết ngói/cửa. Ảnh QA dùng để kiểm tra nằm ngoài repository, không đưa vào commit.
- [x] Kiểm chứng cuối: đủ 20 GLB nhập lại Blender đạt geometry/normal/UV, footprint/ground và đúng số tam giác; 20 scene Blender không còn camera/đèn/đối tượng preview. Catalog có checksum từng GLB.
- [x] Tải cả 20/20 GLB bằng Three.js trong phiên QA tạm ngoài repository, không có console warning/error. Đã chụp ảnh tổng kết rồi dừng/xóa server QA.
- [x] Chạy npm test: 237 test, 234 đạt, 3 MongoDB integration bỏ qua, 0 lỗi. npm run build đạt (typecheck + Next.js production build).
- [ ] Ghép bộ GLB vào map: chưa thực hiện trong đợt bàn giao tài sản này.
- [ ] LOD/collision và đo hiệu năng trên map sau khi chọn mức chi tiết phù hợp. Không coi render, GLB import hoặc build app thành công là chứng minh hiệu năng thiết bị.

[Danh mục và hướng dẫn tài sản](assets/models/vietnam/README.md) · [Catalog/checksum](assets/models/vietnam/manifest.json) · [Báo cáo kiểm tra](assets/models/vietnam/validation.json) · [Nguồn và cách tái tạo Blender](art-source/blender/README.md).

GLB nằm ngoài public/runtime, nên deployment hiện tại không tự tải các model này. Hướng dẫn, schema gameplay, ID ô, protocol và camera bàn cờ không thay đổi. Không tự deploy thủ công; push GitHub theo yêu cầu để pipeline hiện có xử lý.
