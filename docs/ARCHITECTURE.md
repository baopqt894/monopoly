# Kiến trúc

`lastBoardEvent` tùy chọn là sự kiện trình diễn công khai do engine tạo khi đáp Sân bay hoặc hoàn thành nhóm đất, gồm ID log, playerId, tileId và kind. Snapshot gửi cùng sự kiện cho mọi ghế; không nhận field này từ client. `room-timing`/bot ghi boardEventId vào mốc presentation để chừa 2,4 giây đọc sau di chuyển, không chừa lại ở lượt sau. `useBoardEventNotice` nhận ID mới, đợi animation đến nơi rồi hiện thông báo chung, tự ẩn và bỏ qua sự kiện đã có khi mount/reconnect. Không dùng thông báo client để sửa vé, tiền hoặc lượt.

## Hướng phụ thuộc

```text
contracts ← game-content ← game-engine ← server
     ↑            ↑                         ↕ Next.js HTTP API + MongoDB
     └────────────┴─────────────────────── web
```

- contracts chỉ chứa types và protocol; không React, Three.js hoặc dữ liệu.
- game-content chỉ import types từ contracts.
- game-engine là reducer thuần; không DOM, localStorage hoặc network.
- server sở hữu state thật và xác thực intent.
- web hiển thị snapshot và gửi intent; không tự sửa tiền, quyền sở hữu hoặc kết quả xúc xắc.

## Hợp đồng

Luật bất động sản mới có discriminator tùy chọn `propertyRules: 'landing-v1'`, server đặt khi START_GAME cho ván mới. Phòng cũ thiếu field không bị migrate kinh tế hoặc deck. `completedLaps` tăng trong movement đi bộ hoặc bay theo chiều tiến qua/đến GO; `propertyVisit` được server tạo khi land và xóa khi move/END_TURN để không xây từ xa hoặc giữ quyền từ lượt trước. `disabledLaps` giảm chỉ khi chính chủ hiện tại qua GO. Mua kèm nhà, mua lại, phí và bảo vệ cấp 5 đều do reducer kiểm tra; action không nhận giá/refund/loại thẻ do client quyết định. Tài liệu API cho dev UI/scene: [PROPERTY_RULES.md](PROPERTY_RULES.md). Không sửa renderer trong thay đổi luật này.

`GameState.startingPlayer` tùy chọn lưu chỉ số người đi đầu và mốc vòng chung. Khi START_GAME, server chọn bằng `crypto.randomInt(seats.length)` rồi truyền vào `createGame`; không nhận lựa chọn này từ client. `createGame` là factory xác định khi truyền cấu hình, mặc định chỉ số 0 cho caller cũ/test. Giữ nguyên mảng người chơi/ID/ghế; END_TURN tăng chỉ số, vòng lại và bỏ qua người phá sản. Mốc vòng được tính tương đối từ người đi đầu, không nhất thiết từ chỉ số 0. Phòng cũ thiếu field tiếp tục mốc 0; đọc/reconnect không bốc lại hoặc reset lượt.

BoardTile.id ổn định từ 0–39, Xuất phát ở góc dưới phải. Không đổi ID các ô hay các thẻ. GameState/GameAction là hợp đồng engine; multiplayer.ts là hợp đồng mạng. Đổi schema không tương thích cần migration/version, không âm thầm đọc dữ liệu cũ.

reduceGame trả state mới, không mutate input. Phase là roll/purchase/card/auction/end/finished. Debt là ngắt thanh toán độc lập: debtor có thể khác người đang đến lượt. Payments xếp hàng, thu thanh lý tự trả phần thiếu.

Schema v1 được mở rộng tương thích với field tùy chọn: `Player.flight` thiếu nghĩa là không có vé; `drawnCard.revealed` thiếu nghĩa là chưa bóc; `movement` thiếu dùng animation vị trí cũ. Phòng cũ không mất tiền/tài sản, thẻ đang chờ phải bóc trước khi sử dụng, phiên đấu giá cũ vẫn hoàn tất. Ô 30 và thẻ chest-06 áp dụng luật mới ngay khi tiếp tục ván; người đã ở tù vẫn xử lý ra tù bình thường. Server ghi đường di chuyển cùng ID trong snapshot; renderer báo đến nơi để mở lựa chọn, không trì hoãn request mạng hay tự sửa state.

ROLL.dice là test/replay seam trong engine. Server không chấp nhận dice từ client; UI chỉ gửi ROLL. Không coi nút bị disable là kiểm tra phân quyền.

## Online

Next.js App Router ở root phục vụ frontend và backend cùng deployment. `POST /api/room` chuyển request vào `HttpRoomService`; service khôi phục một phòng từ `RoomStore`, chạy `RoomService` để giữ nguyên phân quyền/luật, rồi lưu bằng compare-and-set. `RoomService` vẫn test được với peer giả, không cần port.

- Mỗi ghế có token ngẫu nhiên; snapshot không lộ token của người khác, peer ID, PRNG seed hoặc thứ tự deck.
- Reconnect token v2 kèm room code lưu sessionStorage riêng từng tab. Mỗi lần mount có connection ID mới; chỉ RECONNECT được thay connection ID. Poll/action từ ID cũ bị từ chối. Protocol HTTP nằm tại contracts/http.ts. Session v1 không được đọc lại.
- Host mới được start, cần ít nhất 2 người và mọi người ready/connected.
- Actor được xác định theo debtor, bidder rồi đến current player. Server từ chối ghế khác.
- Trade cần PROPOSE_TRADE và RESPOND_TRADE từ đúng đối tác; không nhận TRADE trực tiếp. Đề nghị hết hạn 15 giây, khóa tiến ván trong khi chờ.
- Gateway kiểm tra Origin theo Host/protocol công khai, giới hạn payload 16 KiB và 35 command/mở stream mỗi 5 giây/IP qua MongoDB; fallback poll có quota riêng 120/5 giây/IP cho nhiều người cùng mạng. Rate limit và đọc phòng chạy đồng thời. Health và API trả no-store, private. Không công khai lỗi database/credentials.
- MongoDB lưu state thật và token server-only trong rooms_v2. Cập nhật lọc cả giá trị trước đó, retry khi có ghi đồng thời. Command có request ID chống thực thi lại trong 64 request gần nhất. Seed/deck/token được che trước khi gửi snapshot. MongoClient pool được cache theo instance, tối đa 12 connection.
- `POST /api/room/events` mở stream SSE đã xác thực bằng token trong body, không đưa token vào URL. MongoDB Change Streams phát thay đổi sau commit, dùng chung một cursor cho mọi subscriber trong cùng database/instance và chỉ gửi đúng phòng. Khởi tạo cursor xong đọc lại snapshot để không mất cập nhật lúc đăng ký.
- Snapshot có revision tăng khi trạng thái công khai đổi; browser bỏ response cũ/trùng từ HTTP và SSE. Heartbeat không làm tăng revision nếu dữ liệu công khai không đổi, nên không dựng lại bàn cờ. Không tự quyết định dice/tiền ở client.
- SSE giữ tối đa 55 giây rồi client mở lại, phù hợp route maxDuration 60. Comment keepalive 15 giây không ghi DB; heartbeat HTTP từ client mỗi 15 giây duy trì presence. Chỉ khi stream lỗi mới poll fallback 500 ms và thử nối lại. Tab ẩn không còn độ trễ cố ý 10 giây. Ghế offline sau 45 giây không heartbeat. Thẻ trade có timer hết hạn trong stream và vẫn kiểm tra lại trước mỗi command.
- Vercel được ghim `hkg1`, cùng AWS ap-east-1 với cluster MongoDB Hong Kong đã kiểm tra. Nếu di chuyển database, phải đối chiếu và cập nhật region tương ứng.
- `automaticAction` trong engine xác định bước bắt buộc, `room-timing` thực thi sau presentation và SSE hẹn đúng thời điểm đó. Phase end chỉ chờ lựa chọn mua lại/nâng cấp tại ô vừa đáp; quản lý tài sản/giao dịch tùy ý không giữ lượt. Không ngắt pending trade/debt. `PropertyVisit.decisionTaken` ghi mua/xây đã hoàn tất, `automaticRoll` chỉ còn là field tương thích snapshot cũ và không kích hoạt tự tung. Sau đôi hoặc xử lý xong ô đích chuyến bay, END_TURN đưa về phase roll cùng actor, xoá cờ này và hiện lại nút tung để người chơi bấm. Snapshot cũ còn automaticRoll cũng chờ thao tác; cả UI và server đọc automaticAction từ engine. Ván cũ thiếu field vẫn khôi phục bình thường. Thẻ không cần mục tiêu tự resolve sau nhịp hiển thị; thẻ có mục tiêu giữ thời hạn chọn. Không dùng effect client để tự quyết định dice/tiền/lượt. Xem GAMEPLAY.md.
- Chủ động LEAVE_ROOM giữa ván đánh dấu `RoomSeat.bot`, xoay token server-only, xóa presence và hủy trade có liên quan. Ghế bot không thể attach/reconnect; JOIN chỉ cho phòng chờ. Disconnect/timeout không biến người thành bot. Các field bot/botActionAt tùy chọn giữ tương thích phòng cũ.
- `game-engine/bot.ts` chỉ chọn intent hợp lệ bằng reducer; `room-bots.ts` chạy một bước khi đến `botActionAt`, lưu cùng state qua CAS. Deadline được giữ qua instance/redeploy và công khai để SSE hẹn refresh server; nhiều stream cùng tick vẫn chỉ commit một hành động. Bot không có quyền quyết định ở client. Nhịp di chuyển/thẻ được chừa để người xem thấy tiến trình. Heartbeat/fallback tiếp tục tiến bot nếu stream khôi phục; không mở worker riêng. Khi không còn ai xem/gửi request, phòng giữ trạng thái đến khi TTL dọn.
- `room-timing.ts` lưu actionTimer tùy chọn theo actor/phase/log, bắt đầu 15 giây sau khoảng animation của movement mới. Snapshot chỉ công khai actionStartsAt/actionDeadlineAt. Read/reconnect không reset; thao tác hợp lệ, đổi phase/actor có cửa sổ mới. SSE hẹn deadline sớm nhất trong action, bot, trade; HTTP khôi phục và kiểm tra timeout trước khi nhận intent. CAS chống timeout chạy trùng trên nhiều stream. Phòng cũ thiếu timer được cấp một lần khi đọc. ActionClock chỉ hiển thị đếm ngược, không tự ra quyết định hoặc gửi hành động client.
- Phòng có TTL 30 phút tính từ request hợp lệ cuối cùng. TTL index dọn document; read kiểm tra expiresAt ngay cả khi MongoDB chưa dọn. State tồn tại qua restart/redeploy khi cùng database và còn TTL. Chưa tự thay người chỉ bị mất mạng.
- Chỉ local dev/test có thể dùng MemoryRoomStore. Trên Vercel, thiếu MONGODB_URI phải trả 503; không fallback RAM. CI dùng Mongo 7 replica set riêng để test storage và change streams thực tế, không dùng production credentials.
- Lỗi kho phòng ghi JSON `room_store_failure` trong runtime logs, gồm operation (health/room/events hoặc bước mongodb.configure/connect/indexes), category, tên lỗi và mã lỗi nằm trong allowlist. `room-diagnostics.ts` đọc cả cause/topology errors để phân biệt DNS, authentication, authorization, timeout và index conflict; không ghi message/stack/URI/token/state. Metadata cấu hình chỉ có cờ hiện diện, scheme và định dạng không hợp lệ. Phản hồi public vẫn là lỗi tổng quát 503, không lộ thông tin kết nối.

## Rendering và UI

Danh mục quân cờ nằm trong `game-content/pawns.ts`; `room-pawns.ts` bốc không lặp bằng crypto.randomInt đúng một lần tại START_GAME, ghi vào Player.token trước snapshot/CAS. Không dùng chung PRNG xúc xắc/deck, không nhận token client chọn và không bốc khi restore/read. Renderer `scene3d/pawns` chỉ nhận token và màu ghế; preview tại `/pawn-preview` dùng cùng model, không tạo room. Token cũ tiếp tục hiển thị qua PieceModel.

Avatar HUD lấy từ chính PieceModel theo Player.token và màu ghế. PawnPortraitCapture render PNG 256×256 qua render target dùng chung WebGL của bàn, ẩn đế và chụp cận đầu/thân trên theo vùng portrait riêng của từng model (không fit xe hoặc chùm đèn sao), khôi phục render state sau readback và giải phóng target sau khi xong. Ảnh cache theo token/màu trong browser; không tạo canvas WebGL riêng cho từng avatar, không tạo lại khi xúc xắc/tiền/vị trí đổi. Khi đổi sang bàn 2D vẫn giữ ảnh đã tạo. Phòng chờ chưa bốc quân tiếp tục dùng portrait nhà đầu tư; trong ván chỉ dùng icon quân làm fallback khi ảnh chưa sẵn sàng hoặc không có WebGL.

GameScreen fullview, BoardScene là lớp nền toàn màn hình. HUD avatar/tiền ở bốn góc; controls nổi giữa bàn; toolbelt nhỏ bên cạnh. Tài sản và sự kiện chỉ mở overlay theo ngữ cảnh. Không đưa header/nav/dashboard cards trở lại gameplay.

Camera trực giao khóa cố định. Không có OrbitControls, wheel zoom hay gesture camera. Chỉ tính lại framing theo kích thước container.

- board-layout.ts: tọa độ/texture.
- BoardScene.tsx: bàn, ánh sáng, tiles, hit testing.
- CityModels.tsx: sân giữa bàn, deck stacks, cây.
- BoardDice.tsx: dice nổi và animation; không quyết định kết quả.
- PlayerPawn.tsx: animation vị trí state; không tính nước đi.
- FlightTargets.tsx: viền ô và đường bay xem trước trong world space; không chặn raycast của tile. GameScreen giữ mode chọn điểm bay, khóa thao tác khác và gửi FLY khi chạm ô. Không dùng dialog/dropdown chọn đích. Hủy, mất kết nối, đổi lượt hoặc hết vé thoát mode; client không tự tiêu vé.
- board/: sơ đồ 2D/fallback dùng cùng BOARD.

useRoom.ts là adapter HTTP/SSE duy nhất. Command gửi ngay, độc lập với stream và heartbeat; hủy heartbeat chậm khi người chơi thao tác. Revision bảo vệ thứ tự nhận. Dice request gửi ngay khi bấm, animation chạy song song và hiện kết quả khi có snapshot thật. GameScreen lấy gamePlayerId của ghế để hiện đúng controls. Portfolio của người khác chỉ xem. Server vẫn là lớp quyết định quyền cuối cùng.

## CSS và file giao nhau

CSS nằm cạnh feature. Design tokens ở styles/. App.tsx chỉ composition; app/page.tsx mount game ở browser để tránh SSR WebGL/sessionStorage. Contracts, manifest/lockfile, base styles và App cần người tích hợp điều phối. Không reformat ngoài phạm vi một PR. Local dev không cấu hình MongoDB dùng RAM nên restart có thể mất phòng.

## Cổ điển và cài đặt kinh tế phòng

CREATE_ROOM chỉ cho tạo phòng classic; mode/maxRounds trong protocol còn tùy chọn cho client cũ, mode city bị từ chối khi tạo. Giữ game city đã lưu để không âm thầm đổi luật kinh tế giữa ván. `startingCash` và `goSalary` được resolve/validate chung trong game-engine/settings.ts, server lưu cùng phòng và truyền vào createGame. Snapshot công khai cấu hình; field thiếu fallback 1500/200. Không sửa tiền đã tồn tại trong snapshot cũ. Schema/state vẫn v1 với field tùy chọn, action và ID giam giữ giữ tên nội bộ cũ, UI chuyển Đảo hoang. Luật ba đôi và thoát đảo mới áp dụng khi tiếp tục ván.


Ô sự kiện ngẫu nhiên: `festivals.ts` trong engine dùng chung validation số lượng theo bàn (0–24 cho vietnam-32, 0–22 cho legacy) cho server/factory. Khi START_GAME, `createGame` dùng PRNG server-seeded chọn đất/resort không trùng theo boardFor(state) và lưu `eventTileIds` vào state; snapshot công khai IDs, không seed. Thiếu field là tắt, không migrate bản đồ đang chơi. `rentFor` nhân 1,5 trước lần làm tròn cuối, nên engine là nơi duy nhất tính tiền. Lobby chỉ gửi số lượng và hiển thị cấu hình chung; renderer chưa thay đổi.


Theo yêu cầu chuyển sang bộ thiết kế 32 ô, `boardId: 'vietnam-32'` là không gian ID riêng; thiếu field tiếp tục BOARD 40. Engine, bot, end-turn choices, sự kiện và giới hạn server đều resolve qua boardFor, không tráo ID snapshot cũ. Layout32 cho engine nằm trong game-content và giữ nguyên bố cục prototype; scene3d/board32/board-layout.ts đã re-export dữ liệu chung. Bàn 2D/2.5D, pawn, nhãn thanh lý và flight targets đã đọc boardFor và số ô tương ứng. Các modal tài sản dùng boardFor/groupsFor và helper báo giá của engine; RaisedTile dựng công trình theo quyền sở hữu/cấp từ snapshot. Không coi build/test rule là bằng chứng toàn bộ hình ảnh đã khớp.


## Điều kiện thắng tức thì

`game-engine/victory.ts` kiểm tra các mục tiêu sở hữu theo boardFor(state); reducer gọi sau action thành công, không chạy với action bị từ chối và không thay kết quả đã finished. `victoryRules: 'business-tour-v1'` chỉ do server đặt cho ván mới; thiếu field giữ luồng thắng cũ. `winnerId`/`winReason` là kết quả authoritative; `gameOutcome` cung cấp thứ tự/leaders cho ResultsModal để mục tiêu độc quyền không bị bảng vốn ghi đè.

RoomService chỉ gọi resolveDepartureVictory cho LEAVE_ROOM đã xác thực, ghi departedPlayerIds; disconnect/presence timeout không ghi field này. Bot tiếp tục nếu còn ít nhất hai người chưa phá sản chưa rời; còn một người thì Accept Winnings kết thúc, dừng deadline/bot và hủy trade. State/phòng được lưu qua CAS hiện có để thao tác thoát trùng/đồng thời không nhận thắng hai lần. Server không cho client gửi winnerId, winReason hoặc action tự nhận thắng.


## Thanh lý trả nợ

`liquidationRules: 'full-value-v1'` và `propertyPricing: 'level-one-included'` được đặt cho ván mới; factory hỗ trợ opt-in, snapshot thiếu field giữ cách cũ. Property value/giá mua lại/hoàn tiền do thẻ/giá thanh lý dùng cùng propertyValue; giá cấp 1 đã nằm trong giá gốc, chỉ cộng phần nâng từ cấp 2. Net worth trong bộ thanh lý mới dùng giá trị có thể bán đầy đủ.

Debt có ID riêng và selectedTileIds. SET_LIQUIDATION_SELECTION/LIQUIDATE_SELECTED chỉ actor đang nợ được gọi; AUTO_LIQUIDATE không nằm trong allowlist public. Reducer bán/xóa nguyên tài sản rồi chạy payment queue, giữ phần tiền dư, không bán quá số cần hoặc sang người nợ tiếp theo. Thiếu tổng giá trị thì thanh lý hết trước khi phá sản. Luật mới từ chối thế chấp/giải chấp/bán lẻ cấp nhà.

room-timing giữ key cố định theo debt.id, 30 giây kể từ bước nợ sau movement. Lựa chọn/sale thay state nhưng không đổi ID/key hoặc gia hạn deadline. Timer/selection/payout được lưu qua CAS và receipt để timeout đua nhiều observer, request lặp hay reconnect không bán hai lần. ActionClock lấy độ dài từ startsAt/expiresAt, không hardcode vòng tròn 15 giây. LiquidationSelection nằm cạnh CSS trong feature properties và chỉ hiển thị tổng nợ, tổng đã chọn cùng nút xác nhận. GameScreen mở mode chọn ô trực tiếp thay cho modal; LiquidationTargets chiếu tọa độ ô sang nhãn giá DOM, tự dời nhãn bị chồng và nối về ô gốc, có trạng thái chọn và thứ tự ưu tiên, còn Board 2D dùng cùng selection/giá. Giá đọc liquidationValue từ engine; chỉ gửi intent, không tự sửa tiền. Tile layout, pawn, flight targets và các overlay chọn ô nhận boardId để hit testing/nhãn giá dùng đúng ID của bàn 32 hoặc 40; không đổi camera. Không dùng nhầm ID bàn 32 làm ID catalog 40. Bàn 32 dùng RaisedTile/HouseModel và catalog mới, bàn 40 tiếp tục dùng catalog cũ.


## Thẻ và Lễ hội

`card-targets.ts` kiểm tra mục tiêu thẻ trước resolve; `card-actions.ts` lên kế hoạch fallback thuần cho bot/timeout. Gift chuyển nguyên một property rồi chạy kiểm tra thắng hiện có; action không nhận tiền/owner nguồn do client gửi. PRNG chỉ tiến trong reducer sau validation, fallback lấy mẫu trên seed copy. CardModal đọc boardId và bộ đếm thực tế gồm thẻ giữ lại; thẻ có mục tiêu dùng CardBoardSelection và chọn ô trên bàn, kèm người nhận cho thẻ tặng.

Ô sự kiện ngẫu nhiên đổi API thành eventTileCount/eventTileIds; resolver đọc alias cũ và từ chối cấu hình hai tên mâu thuẫn. Public snapshot còn có alias để client cũ không mất dữ liệu, nhưng festivalTileId/festivalLevel mới luôn là Lễ hội duy nhất. Phase festival chỉ mở ở ô parking của bộ luật mới khi người đến sở hữu ít nhất một city. HOST_FESTIVAL xác thực actor/owner/phase, tăng bộ đếm toàn ván 1 rồi thay địa điểm; rentFor áp dụng 1+festivalIncrement*level bên cạnh hệ số sự kiện ngẫu nhiên và nhóm màu, làm tròn cuối. Timer/bot biết phase mới; API receipt ngăn tăng level/tặng trùng. Scene giữ nguyên, GameScreen nối bước chọn vị trí Lễ hội trên bàn.


Mức tăng Lễ hội (`festivalIncrement`) là cấu hình phòng 0.25 hoặc 0.5, mặc định 0.5. `resolveFestivalIncrement` dùng chung để xác thực CREATE_ROOM/factory; server truyền từ phòng vào createGame, lưu cùng state và công khai trong snapshot. Multiplier hiện tại và preview lần kế tiếp dùng field này với fallback 0.5; client chỉ chọn khi tạo phòng, không sửa qua action tổ chức. Không thay bộ đếm toàn ván hoặc hệ số ô sự kiện ngẫu nhiên.


Thẻ cần chọn đất: CardModal chỉ xử lý rút thẻ và các thẻ không có mục tiêu hợp lệ. Sau khi bóc thẻ tác động đất/tặng tài sản, GameScreen mở CardBoardSelection và đánh dấu tileIds từ cardChoices trên bàn 2D/2.5D. CardTargets chỉ tăng sáng/viền cho ô hợp lệ và phủ tối ô còn lại, không đặt nhãn nổi; CardBoardSelection là thanh xác nhận nhỏ ở mép dưới, không có mô tả dài hoặc panel giữa bàn; chọn ô chỉ tạo preview cục bộ, RESOLVE_CARD gửi một lần khi xác nhận (kèm người nhận cho thẻ tặng). Preview được gắn với người chơi/thẻ/nextLogId để không giữ nhầm qua lượt khác; pending/moving/offline khóa thao tác, server xác thực lại mục tiêu và giữ deadline hiện có.


FestivalSelection dùng chung mode đánh sáng/làm tối ô của bước chọn thẻ trên Board/BoardScene. Các đích lấy từ festivalTargets; chỉ thành phố của người đang tổ chức được chọn. Preview gắn với currentPlayer/round/nextLogId, tự loại ô không còn hợp lệ; HOST_FESTIVAL chỉ gửi sau khi xác nhận trên thanh nhỏ dưới màn hình, SKIP_FESTIVAL vẫn có. Không có modal/dropdown hoặc nhãn nổi; hệ số lần tới đọc nextFestivalMultiplier, không tính lại luật ở UI.


## Tích hợp gameplay 32 ô — 27/10/2026

`scene3d/board32/board-layout.ts` re-export bố cục/nội dung từ game-content/board32-layout; chỉ hàm tọa độ trực quan ở UI. `tileLayout(id, boardId)` cấp tọa độ cùng một nguồn cho quân và vùng bay. Cấp 0/không có chủ không dựng nhà, cấp 1–4 là nhà vùng, cấp 5 là landmark theo thành phố. Xóa tài sản tự gỡ model qua snapshot, không có state sở hữu cục bộ. Center preview có showDice để không dựng chồng xúc xắc giả lên xúc xắc authoritative trong gameplay.

`purchaseQuote` và `upgradeQuote` là helper engine cung cấp tổng giá/validation cho LevelPicker. Client gửi BUY/BUILD kèm cấp hoặc BUY_BACK kèm tileId; không gửi tiền. Bảng kết quả đọc winnerId/winReason. Bảng vùng 32 ô dùng groupsFor thay cho tên nhóm của bàn cũ. Không migrate ván 40 ô đang lưu.


## Trình tự xúc xắc và di chuyển

ROLL được gửi ngay, server phát lastRoll tùy chọn (id log duy nhất và playerId), kể cả lần thử thoát đảo không di chuyển. Movement do ROLL có rollId; các thẻ/máy bay không tạo lại roll event. useRollPresentation theo ID thay vì giá trị dice/nextLogId, nên hai lần ra cùng số vẫn có animation riêng. Các client đang xem giữ pawn paused cho tới hết quay + giữ kết quả; snapshot khi mount/reconnect không phát lại lịch sử. PlayerPawn dùng pawnMotionFrame với thời lượng xác định từng chặng và chỉ báo đến một lần, không ack sớm khi snapshot rerender. GameScreen khóa thao tác và modal kết quả trong toàn bộ bước này; bàn 2D dùng cùng thời lượng.

turn-timing.ts trong game-content là ngân sách trình diễn chung, không chứa luật kinh tế hoặc chọn xúc xắc. room-timing lưu rollId/movementId cùng deadline để không gia hạn khi đọc lại; room-bots và finishIdleTurn đợi ngân sách này kết thúc. Client chỉ trình diễn state thật, không sinh dice, tự di chuyển state authoritative hoặc điều khiển deadline server.


## Phản hồi gameplay cho cả bàn

GameState.lastRevealedCard là event tùy chọn do DRAW_CARD thành công công bố (id log, playerId, deck, cardId), có thể còn trong snapshot sau RESOLVE_CARD nhưng không phải tín hiệu để phát lại UI. activeCardReveal chỉ nhận event khớp drawnCard đã bóc, phase card và current player; observer đóng ảnh khi xử lý xong, đổi lượt hoặc tung tiếp. Chủ lượt xem CardArtwork trong scene với nút thực hiện/chọn mục tiêu, không dùng dialog nội dung thẻ. SVG vẽ tiêu đề/mô tả lấy từ getCard ngay trong mặt ảnh, dùng minh họa raster image_gen qua Next image optimizer; không nhân bản hoặc hardcode mô tả theo từng board trong bitmap.

AnimatedBalance chỉ trình diễn số dư authoritative: giữ số khi pawn đang chạy, đếm tới số dư mới trong 1,2 giây và giữ nhãn cộng/trừ 3,2 giây. Không trì hoãn request, thay tiền thật hoặc timer server. Màu HUD và viền tài sản dùng Player.color. Tên/giá giữ chữ vẽ trực tiếp trên mặt ô như giao diện gốc, chỉ tăng độ đậm; không tạo nhãn nổi DOM. Bảng thông tin khi click đọc tiền thuê từ rentFor; không tự mở khi mua/xây. Bộ chọn thẻ/lễ hội tiếp tục làm tối ô không hợp lệ, thanh lý giữ lớp nhãn riêng; không đổi camera.


## Chat và trạng thái sân bay

CHAT là command phòng độc lập khỏi GameAction. RoomService lấy tên/id ghế từ phiên đã xác thực, kiểm tra 1–240 ký tự, cooldown 750 ms phía server, sinh id/thời điểm và giữ 50 tin; lastChatAt nằm trong Seat server-only. Room.chat tùy chọn đi qua publicRoomSnapshot, storage CAS, receipt chống lặp và SSE revision hiện có. Không tăng nextLogId hoặc thay game state nên chat không reset actionTimer. RoomChat dùng text React thuần, không render HTML, dùng chung cho lobby/gameplay; phím gõ chat không kích hoạt hotkey chọn điểm bay.

flightRollPending tùy chọn là quyền tung thường sau FLY thành công, không thay lastRoll hoặc giả lập tung đôi. land ở jail/airport xóa quyền này; END_TURN sau xử lý đích chuyển lại phase roll cùng actor. ROLL từ chối trước khi lấy random nếu vé ready và đủ phí. land ở airport hủy đôi; hasEndTurnChoices trả false và SSE hẹn tại actionStartsAt để chuyển lượt ngay sau animation thay vì chờ hết 15 giây. Bot/timeout chọn FLY hợp lệ khi đủ phí, ROLL khi thiếu phí. Các field tùy chọn tương thích snapshot cũ.

EventMarkers chỉ đọc eventTileIds/festivalTileId/festivalLevel; cờ/glow/particle không sửa luật hoặc camera. Helper rentFor vẫn là nơi duy nhất tính thuê. Nguồn công trình hữu hạn được bỏ khỏi BUY/BUY_BACK/BUILD và các quote cho landing-v1, giữ nguyên kiểm tra tiền, landing context, cấp theo vòng và bảo vệ công trình cấp cuối.


RoomChat luôn hiện thanh nhập chat cố định và một nút lịch sử riêng; đã bỏ nút mở chat. Không tự focus khi mount để không chiếm phím điều khiển bàn. AvatarChatBubble gắn theo seat.id vào portrait HUD (trên: bong bóng phía dưới; dưới: bong bóng phía trên), mỗi ghế hiện độc lập tin mới nhất trong 5–10 giây, thay khi cùng người gửi tiếp; không phát lại lịch sử khi mount/reconnect. Lobby dùng cùng bubble theo ghế và chừa khoảng trống trong hàng. Lịch sử giữ đủ nội dung từ Room.chat; composer giữ nguyên sau gửi, xóa nội dung để nhập tiếp; Escape bỏ focus/đóng lịch sử nhưng không ẩn thanh nhập hoặc kích hoạt chọn điểm bay. Trên mobile, controls lượt nằm phía trên thanh chat, HUD dưới nằm phía dưới.

## Nhịp di chuyển, rút thẻ và giá trên bàn — 27/10/2026

- movement.path chứa mọi ô của đường tiến/lùi, kể cả máy bay, thẻ đi xa và thẻ ra đảo; không rút gọn đường dài thành một điểm. Mỗi bước nhiều ô dùng 420 ms, một bước đơn dùng 900 ms; movement.mode=card dùng 150 ms/ô. Chỉ ô đích áp dụng mua/thuê/thuế/đảo; đi ngang không kích hoạt ô trung gian. Bay/thẻ tiến qua GO vẫn trả lương đúng một lần, đi ra đảo/lùi không nhận lương. Đây là thay đổi trình diễn, không thêm phí dọc đường.
- room-timing tự DRAW_CARD tại startsAt sau toàn bộ dice/movement và nhịp rút 900 ms. Timer lưu revealId tùy chọn để chỉ chừa thời gian đọc một lần; room-events hẹn refresh startsAt cho thẻ chưa bóc, không cần browser bấm hoặc observer poll. Bot không chạy trước startsAt. Compare-and-set hiện có bảo vệ auto-draw khỏi chạy lặp qua nhiều observer/instance.
- turnPresentationMs chừa CARD_READING_MS (0 ms; bỏ chờ đọc bắt buộc ngày 28/10) cho event bóc mới, rồi cấp cửa sổ hành động 15 giây. UI có nhịp lật 300 ms; không khóa nút thực hiện theo animation hoặc tải minh họa. Mở target mode không đổi state/timer; thực hiện vẫn qua reducer và xác thực actor hiện có.
- tileAmount gọi rentFor/taxFor từ engine. Bàn 2D, 3D legacy và RaisedTile 32 đều không vẽ giá mua; ô sở hữu vẽ thuê theo nhà, trọn nhóm, ô sự kiện, Lễ hội và trạng thái ngừng hoạt động. Ô chưa sở hữu không vẽ tiền. Đây là mức thuê khi đáp thường; thẻ buộc trả gấp đôi vẫn có hệ số riêng khi thực hiện thẻ. Modal mua/chi tiết giữ giá mua cần cho quyết định giao dịch.
- HUD dùng --player-color cho border cả avatar và thẻ tên/tiền, gồm vòng sáng của người đang có lượt. Không đổi màu ghế hoặc màu model.


`propertyPricing: business-tour-v1` được server ghi cho ván mới bàn 32 ô. `constructionValue` định nghĩa giá xây tích lũy (cấp 1–4: 0–3H; cấp 5: 6H), `constructionUpgradeCost` cung cấp chênh lệch cho quote/validation/debit; không tính tiền trong UI. `level-one-included` và snapshot thiếu field giữ cách tính cũ. Không đổi rent, board data, renderer hay protocol action.


## Tách runtime khỏi preview — 28/10/2026

`features/scene3d/board32` sở hữu BoardTiles, BoardCenter, atlas góc, geometry nhà/landmark, texture paint và bố cục trực quan 32 ô. BoardScene, EventMarkers và board-layout chỉ import từ đây; không phụ thuộc route hoặc feature preview. Dữ liệu luật/tên/ID vẫn ở game-content, không đổi renderer legacy 40 ô. Các test geometry, mapping ownership/cấp nhà và footprint đã chuyển theo runtime.

Đã bỏ các route `/board`, `/map-preview`, `/board-demo`, `/game-scene`, `/model-preview`, `/landmark-preview`, `/pawn-preview`, gallery/concept lỗi thời và thumbnail chỉ dùng trong ModelPreview. Atlas góc runtime ở `public/assets/board/corners-go-arrow.png`, giữ nguyên bytes. Hai ảnh mẫu nhà/landmark được giữ để chỉnh model; Blender/GLB và asset thẻ/nền/nhân vật giữ nguyên. Không xóa nguồn model chỉ vì chưa được tích hợp vào renderer.


Bảng giá P/H mới cho ván 32 ô dùng discriminator `propertyPricing: business-tour-v2`; cả V1 và V2 dùng công trình cuối 3H. `board32-prices.ts` cung cấp P/H cho BOARD_32 và MAP_TILES; boardFor resolve bảng P/H cũ cho snapshot thiếu field hoặc phiên bản trước. Luật tính giá ở engine, renderer/quote chỉ đọc cùng state version; rent không thay đổi.


## Xem thông tin khi đang tung/di chuyển — 28/10/2026

GameScreen tách khóa giao dịch (`moving`, `pending`, actor và phase) khỏi thao tác xem cục bộ. Thông tin đất, danh mục tài sản, nhật ký và luật không bị unmount chỉ vì xúc xắc quay hoặc quân di chuyển; không tự xóa selected khi về phase roll. Các nút xem dùng inspectionBlocked theo mode chọn mục tiêu/debt/trade, không theo animation. Khi có bảng thông tin đang mở, modal mua/thẻ/đấu giá tự động không dựng chồng; sau khi đóng, lựa chọn lượt còn hợp lệ tiếp tục hiển thị.

BUILD/BUY/trade và dispatch vẫn giữ kiểm tra quyền/phần trình diễn; PropertyModal/PortfolioModal không cho quản lý tài sản trong lúc moving/pending. Tự mở nâng cấp khi đáp ô không thay thế bảng người dùng đang đọc. Đổi renderer 2D/2.5D vẫn khóa trong lúc chuyển động để không ngắt đường đi của quân.

## Phiên bản vị trí khu 32 ô

`boardLayout: districts-v1` là field tùy chọn của GameState/NewGameOptions do server chọn khi start ván 32 ô mới. DISTRICT_MAP_TILES di chuyển các nhóm gốc vào nửa dãy 3–3/3–2/2–3/2–2, không sửa group của thành phố. MAP_TILES/BOARD_32 cũ vẫn dùng để khôi phục snapshot thiếu field; boardFor chọn cả layout và phiên bản giá, mapTilesFor cấp tile đúng cho BoardScene. Không migrate ID ownership trong ván cũ.

BuildBoard ánh xạ P/H và thuê bằng thứ tự thành phố của layout đang dùng (bỏ qua ô đặc biệt), không dùng vị trí của tên thành phố trong catalog cũ. getCard và buildingName nhận boardLayout để thẻ di chuyển và nhãn landmark không lệch phiên bản. FlightSelection nhận layout để tên điểm đến khớp engine. Resort/corners/chance/tax giữ ID hiện có; bộ legacy 40 không đổi.

### Mô hình góc bàn 32 ô — 28/10/2026

`RaisedTile` dùng `AssetCorner` trong renderer gameplay thật. Côn Đảo, Lễ hội và Sân bay có component mô hình riêng (`IslandCorner`, `FestivalCorner`, `AirportCorner`); không phụ thuộc route preview hay atlas ảnh cắt. Atlas cũ được giữ làm tư liệu. Sân bay ID 24 dùng mẫu nhà ga mái cong, tháp kính, máy bay có bánh đáp/đầu cánh và xe hành lý. Hướng mô hình, sân đỗ và nhãn được đặt theo camera cố định; không thay đổi camera, ID ô, lựa chọn bay hoặc luật phí bay. Phòng 32 ô hiện có cũng dùng hình mới khi tải lại client, không cần migrate state.

### Animation xây dựng

`ConstructionReveal` bọc `HouseModel` trên bàn 32 ô, theo chênh lệch cấp nhà giữa hai snapshot. Mua/nâng cấp tới cấp 5 chạy hiệu ứng nhô lên và bụi/tia sáng trong 1,15 giây; mount/reconnect, đổi chủ cùng cấp, hạ cấp hoặc thanh lý không phát animation. Mesh giữ nguyên vị trí chân và trở về scale 1 khi kết thúc; không đổi state, giá, thời gian lượt hoặc chặn input. Hạt hiệu ứng không bắt raycast; `prefers-reduced-motion: reduce` bỏ animation. Mỗi ô tự theo dõi chuyển đổi, không dùng key theo toàn bộ snapshot.

### Animation phá huỷ và bán nhà

Log authoritative có `propertyChange?: { tileId, kind: 'destroy' | 'sell' }`: Động đất/Hoả hoạn ghi `destroy`, thanh lý/thẻ Bán nhà/bán một cấp ở luật cũ ghi `sell`. Field chỉ mô tả kết quả đã được engine xác thực, không nhận từ client và không thay đổi tiền/luật. `PropertyLifecycle` ở renderer 32 ô đọc những log mới hơn snapshot trước và chỉ phát khi cấp nhà giảm. Mount/reconnect, log cũ, chuyển nhượng cùng cấp và đổi map không phát lại. Bản sao công trình cũ chỉ tồn tại cho animation (chuyển động phá huỷ 1,15 giây/bán 0,9 giây; bụi tan hết trong 1,7/1,3 giây), không bắt raycast và dùng material clone riêng; state mới có hiệu lực ngay. Tải client/server cũ thiếu metadata vẫn hiển thị kết quả bình thường. `prefers-reduced-motion` bỏ cả hai hiệu ứng.

UI Lễ hội chỉ truyền danh sách mục tiêu cho renderer khi festivalTargeting của chính người xem bật. Người khác nhận undefined (không phải [] vì [] sẽ làm tối mọi ô), nhìn bàn cờ bình thường và vẫn xem được thông tin đất. FestivalSelection xác thực self.id trước khi bật nút; server vẫn quyết định quyền gửi lệnh.

`flightTargets` xác định chủ theo currentPlayer(state).id: cho ô chưa mua và tài sản của chính actor, chặn tài sản đối thủ cùng các kind chance/chest/tax/parking/jail. Engine FLY, vùng sáng UI và chọn bằng phím đọc cùng helper. Đáp đất mình dùng land/propertyVisit sẵn có, không trả thuê cho chính mình, không thay phí bay hoặc quyền tung sau khi xử lý đích.

## Đồng hồ giới hạn ván

Room lưu các field tùy chọn `durationMinutes`, `matchStartedAt`, `matchDeadlineAt`, `matchEndedAt`. CREATE_ROOM validate bốn preset qua engine/settings; START_GAME đặt mốc bằng giờ máy chủ, không nhận timestamp client. Phòng đã lưu thiếu field không tự thêm timer. `syncMatchClock` kiểm tra trước mọi intent đã xác thực, trước tiến action/bot khi snapshot và lúc sweep; quá hạn gọi reducer thuần `finishGameOnTime`, hủy trade, xóa timer action/bot. Kết quả và mốc thời gian cùng được lưu qua CAS; HTTP restore/read/reconnect không kéo dài hạn. SSE đưa hạn ván vào deadline sớm nhất để cập nhật tất cả người xem. Thắng sớm lưu matchEndedAt để đồng hồ dừng đúng mốc. MatchClock chỉ trình diễn, BoardClockAnchor chiếu vị trí vào overlay theo camera cố định; client không gửi lệnh kết thúc ván.

Hiệu ứng mất nhà dùng ExitDust: 18 cụm bụi mềm khi phá huỷ và 10 khi bán, xuất hiện lệch nhịp ở chân nhà, nở ra rồi tan dần sau khi công trình biến mất. Billboard dùng chung texture canvas nhỏ và material riêng từng cụm; hủy tài nguyên khi kết thúc, không thêm đèn động hoặc bắt raycast.

### MONOPOLY presentation — 29/10/2026

`lastBoardEvent` mở rộng union với `kind: monopoly`, chứa danh sách nhóm vừa hoàn thành và người sở hữu. Reducer so sánh ownership trước/sau từng hành động đã xác thực; không suy đoán từ log chữ hay từ UI, không nhận sự kiện từ client. `turnPresentationMs` thêm BOARD_EVENT_NOTICE_MS cho ID mới, `Room.lastMonopolyNoticeId` giữ cursor qua khôi phục timer/trade để không chừa lại thời gian cho cùng sự kiện. RoomService chặn ACTION/PROPOSE_TRADE tới actionStartsAt khi đang báo Monopoly; bot/timeout/idle-turn cũng chờ mốc này. Snapshot giữ event để mọi ghế nhận; reload không phát lại banner cũ. Hook thông báo tách chuyển động quân với khóa thao tác, tránh tự chờ chính nó; thông báo chữ lớn được hiện trước modal kết quả. Camera và luật thắng không đổi.

### Trình diễn giao dịch tiền — 29/10/2026

Engine cập nhật tiền ngay như trước, đồng thời ghi `cashEvents` tùy chọn (tối đa 64 giao dịch, ID tăng dần độc lập với log). Mỗi sự kiện mang lý do, các khoản thay đổi kèm số dư sau giao dịch do server xác thực; chuyển tiền giữa hai người nằm trong cùng sự kiện. Tiền Xuất phát có mốc `movementId`/`stepIndex`; chi phí tại ô đích có mốc arrival; phí bay hiện ngay trước di chuyển. Ledger không được nhận từ intent client, không đổi số dư/rent/luật phá sản, không phụ thuộc đọc chuỗi log.

`CashPresentationQueue` chỉ giữ bản trình diễn của số dư authoritative và xếp từng giao dịch cách nhau 700 ms, không gộp chênh lệch cuối. `PlayerPawn` báo bước đã thực sự chạm (kể cả frame bỏ qua nhiều ô); bàn 2D báo khi đổi vị trí. Qua Xuất phát hiện khoản cộng ở bước đó, đến đích mới hiện chi phí. Hook chạy độc lập với gameplay/server timer, không khóa các lượt vì đang trình diễn tiền; BXH chờ trình diễn các khoản cuối. Mount/reconnect không phát lại lịch sử, snapshot cũ thiếu ledger dùng fallback số dư, mất đoạn ledger thì đồng bộ số dư thật. Quân đã phá sản chỉ xác nhận movement của chính mình, không xác nhận nhầm đường đi của người khác.


## Dọn phòng sau ván

Khi snapshot finished đến client, useRoom dừng SSE/heartbeat/retry, xoá reconnect session và giữ bảng kết quả local 10 giây trước khi gửi LEAVE_ROOM rồi về sảnh. Nút Về sảnh rời ngay. Kết quả vẫn dùng state server, client không tự kết thúc luật. SSE gửi kết quả cuối rồi đóng và giải phóng subscription. Server ghi matchEndedAt cho mọi kiểu kết thúc; kho phòng dùng expiresAt cố định matchEndedAt + 2 phút, không gia hạn bởi heartbeat/reconnect. TTL Mongo dọn tự động và HTTP cũng từ chối/xoá phòng quá hạn trước khi restore.

LEAVE_ROOM cuối cùng làm phòng không còn ghế người thì xoá phòng bằng CAS ngay, huỷ trade/timer và không chạy bot tiếp. Phòng bot-only cũ được xoá trước restore khi có request. Offline/reload vẫn là ghế người và có quyền reconnect trong ván; không xem mất kết nối là đã rời phòng.
