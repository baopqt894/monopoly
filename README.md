# Tỷ Phú — Thành Phố Sống

Game cờ tỷ phú online 2–4 người; phòng mới dùng bàn Việt Nam 32 ô (20 thành phố, 4 resort). Phòng cũ không có boardId tiếp tục bàn 40 ô. React + Three.js giữ camera 2.5D cố định; Next.js phục vụ cả giao diện và API phòng chơi trong cùng deployment.

## Chạy

Dùng Node.js 22.x và npm 10+. Chạy từ root repository:

```sh
npm ci
npm run dev
```

Mở http://localhost:3000. Đặt tên → tạo/join phòng → mọi người sẵn sàng → chủ phòng bắt đầu. Mỗi người dùng một tab/thiết bị riêng. Khi chưa cấu hình MongoDB, dev dùng kho RAM để thử nhanh. Để kiểm tra lưu phòng bền vững, sao chép `.env.example` thành `.env.local` và điền `MONGODB_URI`.

```sh
npm test
npm run build
npm start
```

`npm run build` typecheck toàn repository rồi build Next.js. `npm run build:production` chỉ build các page/API và dependencies được sử dụng; không chạy test hoặc typecheck. `npm start` phục vụ frontend và backend tại cổng 3000; đổi cổng bằng `npm start -- --port 3001`.

## Deploy cả frontend và backend lên Vercel

1. Trong Vercel Project Settings, đặt **Root Directory** là root (`.`), **Framework Preset** là **Next.js**, Node.js **22.x**, Production Branch **main**.
2. Xóa override Output Directory cũ `apps/web/dist` hoặc `dist`, để Next.js dùng mặc định. `vercel.json` đã khai báo framework và `npm run build:production`.
3. Thêm Environment Variables cho Production (và Preview nếu cần): `MONGODB_URI` là connection string Atlas có username/password thật; `MONGODB_DB=typhu`. Đây là biến server-only, không thêm tiền tố `NEXT_PUBLIC_` và không commit vào Git.
4. Trong MongoDB Atlas, cấp database user quyền `readWrite` trên database đã chọn và cấu hình Network Access cho kết nối từ Vercel. Nếu dùng Preview, nên đặt database riêng, ví dụ `typhu_preview`, để tách phòng thử với production.
5. Push/merge `main` để Vercel build và deploy. Sau khi thêm/sửa env, redeploy. Kiểm tra `/health` trả `200` với `status: ok`, rồi thử hai tab tạo/join phòng.

Deployment bao gồm `/` (giao diện), `POST /api/room` (command/heartbeat), `POST /api/room/events` (server push SSE) và `GET /health`. Không cần chạy room server riêng hoặc cấu hình WebSocket domain. Production trên Vercel sẽ trả `503` khi thiếu MongoDB thay vì âm thầm tạo phòng trong RAM không dùng chung. Backend ghim region `hkg1` để cùng vùng với Atlas Hong Kong hiện tại; đổi region khi di chuyển database.

MongoDB lưu mỗi phòng trong một document của `rooms_v2`; cập nhật có compare-and-set để tránh mất thao tác đồng thời. Connection pool được tái sử dụng trong mỗi instance. Phòng hết hạn sau 30 phút không có request hợp lệ, bằng TTL index và kiểm tra thời hạn khi đọc. API cũng tạo TTL index cho quota request. Database user cần quyền tạo index.

### CI/CD

- **CI — GitHub Actions:** chạy khi có pull request, push `main` hoặc chạy thủ công. Cài theo lockfile, chạy engine/server tests và MongoDB integration test với Mongo 7 replica set riêng, typecheck và build Next.js. Không cần production database secret trong CI.
- **CD — Vercel Git integration:** tự deploy `main` lên production, nhánh khác thành preview theo cấu hình Vercel. Không thêm workflow deploy hoặc token thứ hai.
- **Production build:** `npm run build:production` tạo Next.js frontend/API; test và file kiểm thử không phải API route. Không dùng `npm ci --omit=dev` vì compiler vẫn cần devDependencies khi build.
- **Chặn merge lỗi:** bật branch protection/ruleset yêu cầu check **Test, typecheck and build** thành công trước khi merge vào `main`. Nếu push thẳng vào `main`, CI và Vercel chạy độc lập.

## Chức năng

- 40 ô: 22 đường phố trong 8 nhóm màu, 4 ga, 2 tiện ích, 3 Cơ hội, 3 Quỹ Cộng đồng, 2 thuế, 4 góc.
- Cơ hội 7/22/36; Quỹ Cộng đồng 2/17/33. Hai bộ riêng, mỗi bộ 16 thẻ.
- Xúc xắc, mua/đấu giá, thuê, xây đều, ngân hàng 32 nhà/12 khách sạn, thế chấp, Đảo hoang, nợ và phá sản.
- Phòng mới chỉ có Cổ điển: chọn 2–4 người, tiền khởi đầu và tiền qua Xuất phát. Mặc định ₫1.500/₫200. Không chọn chế độ hoặc số vòng; ván kết thúc khi còn một người chưa phá sản.
- Ba đôi liên tiếp đưa thẳng ra Đảo hoang. Thoát đảo bằng ₫200, thẻ hoặc tung đôi; lần thử thứ 3 được ra miễn phí.
- Trade chỉ thực hiện khi đúng đối tác chấp nhận; có nhật ký, tài sản và kết quả.
- Backend xác thực ghế/lượt, quyết định dice, che PRNG seed và deck chưa rút.
- Reload cùng tab giữ ghế qua session token. MongoDB Change Streams đẩy thay đổi ngay sau commit qua SSE, revision loại bỏ response cũ/trùng. Heartbeat 15 giây; chỉ poll fallback 500 ms khi mất stream. Ghế không heartbeat trong 45 giây hiển thị offline.
- Gửi thao tác ngay khi bấm; dice animation chạy song song với request. Server tự chuyển lượt nếu không còn lựa chọn hợp lệ nào, giữ lượt nếu còn quản lý tài sản/giao dịch/lượt tung thêm. Xem điều kiện chi tiết trong GAMEPLAY.md.

## Đo độ trễ đồng bộ

Chạy `npm run benchmark:sync` khi `npm start` đang chạy. Script tạo hai ghế QA trong phòng riêng, đổi ready 5 lần, đo thời gian command và lúc người quan sát nhận SSE; không đọc/poll trạng thái để nhận thay đổi. Cuối script tự rời/dọn phòng thử. Có thể đổi host bằng biến `ROOM_BENCHMARK_ORIGIN`. `npm run benchmark:sync -- --baseline` mô phỏng cơ chế poll 1,5 giây cũ để đối chiếu. Không coi số đo localhost là số đo của production.

## Cấu trúc

```text
app/
  layout.tsx                # metadata và CSS nền
  page.tsx                  # mount game phía browser
  api/room/route.ts         # Next.js API phòng chơi
  health/route.ts           # kiểm tra kết nối backend/database
apps/
  web/src/
    app/                    # composition, không chứa luật
    features/
      multiplayer/          # lobby, HTTP adapter, HUD, trade online
      scene3d/              # camera 2.5D khóa, mô hình, quân cờ, dice
      board/                # sơ đồ 2D và fallback
      game/                 # thẻ, luật, nhật ký, kết quả
      properties/           # tài sản, xây dựng, thế chấp
      trading/              # styles giao dịch
    shared/                 # modal, token, format
    styles/                 # design tokens, base styles
  server/
    src/rooms.ts            # phòng, phân quyền, trade approvals
    src/http-room-service.ts # request độc lập, heartbeat, retry đồng thời
    src/http-gateway.ts     # origin, payload, rate limit, HTTP response
    src/room-store.ts       # MongoDB production / memory dev-test
    tests/
packages/
  contracts/src/            # state/action và protocol HTTP/multiplayer
  game-content/src/         # bàn cờ, thẻ, sự kiện
  game-engine/src/          # reducer thuần, selectors, PRNG
  game-engine/tests/
public/                     # runtime assets
```

Đọc [kiến trúc](docs/ARCHITECTURE.md) và [quy ước](docs/CONTRIBUTING.md). Dùng một root lockfile; component và CSS nằm cạnh feature.

## Giới hạn

Push loại bỏ chu kỳ chờ poll nhưng vẫn có độ trễ mạng và commit database; không bảo đảm 0 ms. Stream tự mở lại sau 55 giây để phù hợp thời hạn function; khi lỗi dùng poll fallback. Browser/OS có thể tạm dừng tab chạy nền. Chưa có tài khoản, matchmaking, bot hoặc tự thay người offline. Đóng hẳn tab có thể mất token khôi phục. Phòng v2 không khôi phục session RAM/WebSocket v1. Production cần MongoDB reachable và env đúng; build thành công không chứng minh kết nối Atlas. Cân bằng kinh tế/thời lượng chưa được xác nhận bằng playtest nhiều người. Xem [GAMEPLAY.md](docs/GAMEPLAY.md).

Tham khảo luật: [Hasbro Classic](https://www.hasbro.com/common/instruct/Monopoly_Vintage.pdf). Tham khảo HUD: [Business Tour](https://store.steampowered.com/app/397900/Business_Tour__Board_Game_with_Online_Multiplayer/). Mô hình, avatar và giao diện dựng riêng.

## Chơi thử bàn 32 ô

Mở `/` để tạo/join phòng và chơi thật. Các route preview đã được bỏ; renderer gameplay nằm trong `features/scene3d/board32/`. Tên/nội dung bàn mới dùng chung từ `game-content/board32-layout.ts`; mua/xây chọn cấp và báo giá từ engine, model trên bàn theo snapshot server.

Nếu kho MongoDB dev không sẵn sàng, có thể mở một server QA RAM riêng sau `npm run build`: `MONGODB_URI='' ROOM_STORE=memory npm start -- --port 3001`. Truy cập `http://localhost:3001` ở hai tab/thiết bị. Dữ liệu QA RAM mất khi dừng server; không dùng cấu hình này thay cho MongoDB khi triển khai production.

Kiểm thử tích hợp và giới hạn: [docs/QA_GAMEPLAY_32.md](docs/QA_GAMEPLAY_32.md).
