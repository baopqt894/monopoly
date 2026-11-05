# Luật bất động sản theo ô đến — landing-v1

Áp dụng cho ván online mới. Bàn được resolve theo `boardId`: `vietnam-32` dùng bộ thiết kế 32 ô; thiếu field giữ bàn 40 ô và IDs cũ. Đây là cập nhật engine/contracts/server; **không chỉnh scene, renderer hoặc UI**. Các phòng đang chơi thiếu `propertyRules` giữ bộ luật cũ để tránh đổi tiền/quyền xây giữa ván.

## Mua và xây

- Mua thành phố chưa có chủ phải kèm ít nhất nhà cấp 1; mặc định không truyền cấp thì mua cấp 1. Ván mới có propertyPricing level-one-included: tổng phí = giá đất + max(0, cấp−1) × chi phí nâng của ô; giá đất đã bao gồm cấp 1. Snapshot thiếu field giữ công thức cũ. Không đủ tiền cho cấp đã chọn thì giao dịch không xảy ra.
- Chưa hoàn thành vòng cá nhân đầu tiên: chọn/xây tối đa cấp 3. Sau ít nhất một vòng: tối đa cấp 4. Một vòng được ghi khi đi tiến qua/đến Xuất phát; tiền qua vạch bằng 0 vẫn tính vòng. Bay qua/đến Xuất phát cũng tính một vòng; đi lùi qua vạch hoặc bị đưa ra Đảo hoang không tính. Thẻ đi tiến có qua vạch vẫn tính.
- Chỉ xây khi vừa đáp đúng thành phố mình đang sở hữu, đã xử lý xong ô và trả hết nợ. Không xây ở đầu lượt chỉ vì còn đứng trên ô, không xây từ xa trên ô khác. Quyền xây hết khi di chuyển hoặc kết thúc lượt, kể cả chuẩn bị tung thêm.
- Không cần trọn nhóm màu và không cần xây/bán đều trong bộ luật mới. Có thể chọn cấp đích trong giới hạn, tính phí phần tăng thêm. Ván mới không có thế chấp; với snapshot cũ, tài sản thế chấp phải giải chấp trước khi xây.
- Cấp 5 là công trình đặc trưng: phải hoàn thành vòng đầu, ô đã có cấp 4 **trước lần đáp này**, và vẫn đang ở cấp 4 khi nâng. Vừa mua/xây tới cấp 4 không được lên cấp 5 trong cùng lần đáp. Mua lại một ô đã có cấp 4 cho phép nâng cấp 5 ngay nếu người mua đủ vòng/tiền.
- Ga/tiện ích không có cấp nhà. Không giới hạn số lượng ô sở hữu, nhà hoặc công trình cấp cuối cho landing-v1; nguồn 32 nhà/12 cấp cuối chỉ dành cho luật legacy. Không mở đấu giá để lách yêu cầu mua kèm nhà.

## Đáp đất đối thủ và mua lại

1. Tính và thu tiền thuê trước. Nếu chưa trả hết, phải xử lý nợ; không được mua lại để né tiền thuê.
2. Giá mua lại = **ceil(1,5 × giá trị hiện tại của ô)**, với ván mới giá trị = giá đất + max(0, cấp−1) × chi phí nâng. Khoản mua lại trả cho chủ cũ; chủ cũ không có bước đồng ý/từ chối.
3. Chỉ mua lại chính ô vừa đáp; không mua công trình cấp 5. Nhà, cấp và tình trạng thế chấp/cúp điện được giữ khi chuyển chủ, không thu tiền thuê lần hai.
   Riêng đất đã mất toàn bộ nhà do sự kiện (cấp 0), giao dịch mua lại kèm xây cấp 1 để giữ quy tắc mua tối thiểu cấp 1: chủ cũ nhận đúng khoản 1,5×; ván mới đã gồm cấp 1 trong giá đất nên không trả thêm phí xây cấp 1; snapshot theo cách giá cũ vẫn trả phí cấp 1. Thiếu tiền/tài nguyên cho toàn bộ giao dịch thì không chuyển chủ.
4. Sau mua lại, quyền xây vẫn còn trong lần đáp đó, theo giới hạn vòng của người mua và điều kiện cấp 5 nêu trên. Không đủ tiền có thể bỏ qua bằng cách kết thúc lượt; timeout không tự mua lại.
5. Trọn nhóm màu nhân đôi **tiền thuê ở mọi cấp**, kể cả công trình đặc trưng. Khi mất một ô trong nhóm, tiền thuê trở về mức không có thưởng nhóm ngay ở lần tính tiếp theo. Ô thế chấp hoặc đang cúp điện không thu tiền thuê.

## Bốn thẻ sự kiện

Chỉ thẻ sự kiện mới kích hoạt phá hủy/hạ cấp/buộc bán/cúp điện. Người chơi chọn thành phố của đối thủ; không có hành động trả tiền tấn công trực tiếp. Target phải hợp lệ tại lúc thực hiện thẻ.

| Thẻ | Hiệu ứng | Cấp 5 |
| --- | --- | --- |
| `chance-17` — Động đất | Xóa toàn bộ đất và nhà, mất quyền sở hữu; không hoàn tiền | Không áp dụng |
| `chance-18` — Hỏa hoạn | Hạ đúng 1 cấp, thấp nhất 0; không hoàn tiền xây | Không áp dụng |
| `chance-19` — Buộc bán nhà | Ngân hàng thu hồi ô; hoàn cho chủ cũ đúng giá đất + giá trị xây hiện có; ô trở thành chưa có chủ, không chuyển miễn phí cho người dùng thẻ | Không áp dụng |
| `chance-20` — Cúp điện | Ngừng tiền thuê/lợi nhuận tới khi chủ đất đi tiến qua Xuất phát thêm 3 lần; không đổi chủ hoặc cấp | **Áp dụng** |

Hết 3 **vòng cá nhân của chủ đất**, ô tự hoạt động lại; không đếm vòng chung hoặc lượt đối thủ; chủ đất bay qua/đến Xuất phát cũng được tính. Cúp điện lần nữa đặt thời hạn lại thành 3 lần qua vạch, không cộng dồn thành 6. Nếu mua lại ô đang cúp điện thì số lần còn lại chuyển nguyên sang chủ mới, chỉ chủ mới qua vạch mới giảm tiếp. Phá hủy/hạ cấp không tự xóa thời gian cúp điện còn lại.

Không có target hợp lệ thì thẻ được tiêu thụ mà không gây tác động; target sai khi vẫn có lựa chọn thì trả lỗi, giữ nguyên thẻ/tiền/tài sản/seed. Người hết giờ được server chọn target ngẫu nhiên; bot chọn chủ đủ điều kiện có tài sản ròng cao nhất, rồi ưu tiên tài sản giá trị hơn. Việc chọn tự động và áp dụng thẻ được xử lý trong state trên server.

## Hợp đồng cho nhánh UI/scene

- `GameState.propertyRules === 'landing-v1'`: bộ luật mới. Field thiếu nghĩa là bộ luật cũ.
- `Player.completedLaps`: số vòng cá nhân. `GameState.propertyVisit`: quyền của lần đáp hiện tại, gồm người/ô/chủ/cấp tại lúc đáp; chỉ server tạo và xóa. Client không được tự gửi state/quyền xây.
- `Property.disabledLaps`: số lần chủ hiện tại còn phải qua Xuất phát để hoạt động lại; thiếu/0 nghĩa là không bị khóa.
- `BUY { level?: number }`: mặc định cấp 1 khi mua thành phố; server tính tổng tiền.
- `BUILD { tileId, level?: number }`: mặc định tăng 1; có thể chọn cấp đích hợp lệ.
- `BUY_BACK { tileId }`: server tính lại giá từ state và kiểm tra đã trả thuê; không nhận giá do client quyết định. `buyBackQuote` trả `price` trả cho chủ cũ, `constructionCost` luôn 0 với cách giá gồm cấp 1 (snapshot theo cách giá cũ vẫn có phí nhà tối thiểu nếu cấp 0), `totalCost` tổng người mua trả và `error` nếu chưa đủ điều kiện.
- `RESOLVE_CARD { targetTileId?: number }`: 4 thẻ mới yêu cầu target nếu có target hợp lệ. Thẻ phải được bóc trước. Thẻ thường không nhận target.
- Helpers thuần có thể dùng cho UI: `personalBuildCap`, `initialConstruction`, `buildProblem`, `buyBackQuote`, `propertyEventTargets`, `rentFor`.
- Ván mới có **23 thẻ Cơ hội**, Quỹ Cộng đồng vẫn 16. Ván cũ giữ số lượng và thứ tự deck đang lưu.

UI đã có chọn cấp khi mua/nâng cấp và nút mua lại cùng bảng giá tổng từ helper engine. Overlay thẻ đã có chọn mục tiêu/người nhận và bộ đếm theo số thẻ thực tế (gồm thẻ đang cầm/thẻ thoát đảo), không hardcode 16. Các nút cũ gửi `BUY`/`BUILD` không có cấp vẫn được hiểu là cấp 1/tăng 1; thẻ chưa được UI chọn target sẽ chờ tới timeout server chọn ngẫu nhiên.

## Kiểm thử

Test engine bao phủ mua kèm nhà nguyên khối, giới hạn vòng/cấp, quyền đáp, mua lại sau thanh toán nợ, bảo vệ cấp 5, x2 nhóm, hiệu ứng/thời hạn thẻ và tương thích snapshot cũ. Test server xác nhận actor, chống sửa giá, chống xây từ xa và chống gọi tấn công khi không có thẻ được server giữ. Bot/SSE theo luật mới mua rồi xây tới cấp cho phép mà không cần observer poll.


## Bàn 32 ô và lễ hội

Xem mục Ô sự kiện ngẫu nhiên trong [GAMEPLAY.md](GAMEPLAY.md). Cài đặt mới của lobby gửi `boardId: 'vietnam-32'`; engine chọn trong 24 ô sở hữu được (20 đất + 4 resort). Scene/modal đã đọc `boardFor(game)`, dùng đúng boardId khi lấy thẻ và hiển thị dấu ô sự kiện cùng địa điểm Lễ hội. Renderer gameplay 32 ô dùng bộ model đã duyệt theo ownership/level server. Phòng cũ thiếu boardId giữ nguyên 40 ô.


## Đảo, thuế và máy bay — cập nhật tiếp

Đáp Đảo hoang là bị giữ luôn (kể cả xúc xắc đôi, thẻ hoặc máy bay). Tung đôi thoát đảo được đi theo tổng và giữ lượt tung thêm, bắt đầu chuỗi đôi ở 1. Thuế mặc định `taxFor(state, playerId)` = ceil(10% tổng tiền mặt + toàn bộ giá trị hiện tại của đất và công trình/resort/ga/tiện ích đang sở hữu); giá đất đã gồm nhà cấp 1 không bị tính trùng cấp 1. Hai khoản thuế cố định cũ không còn được dùng để tính tiền.

`FLIGHT_FEE = 50`: server kiểm tra có ít nhất ₫50 trước khi tiêu vé, thu phí đúng một lần rồi xử lý ô đến. Bay theo chiều tiến vòng qua/đến GO nhận đủ `goSalary`, kể cả tới ô 0; không đi qua thì không nhận. Bay cùng ô không tính đi hết vòng. Bay qua/đến Xuất phát tăng completedLaps một lần và giảm disabledLaps của chính chủ đất một lần, kể cả goSalary bằng 0; bay không qua vạch hoặc cùng ô thì không cộng vòng. FLY được chọn đất chưa có chủ hoặc đất của chính người bay, không cho chọn đất đối thủ, ô rút thẻ, Thuế, Lễ hội hoặc Đảo hoang; bay tới sân bay nhận vé chờ mới. Client vẫn chỉ gửi FLY với tileId, không gửi giá phí/thuế/lương. Scene/modal cần đọc helper thuế thay cho nhãn số thuế cố định trong metadata 40 ô cũ.


## Thanh lý trả nợ thay cho thế chấp

Luật mới full-value-v1 bán nguyên ô với giá trị đầy đủ (cấp 1 đã nằm trong giá đất). Chọn nhiều ô trên bàn cờ rồi xác nhận một lần; server bán tất cả ô đã chọn, cộng tổng tiền bán một lần rồi trả nợ một lần. Tiền dư giữ lại. Deadline cố định 30 giây; nhóm bán chưa đủ/chọn lại/reconnect không gia hạn. Timeout bán hết nhóm đã chọn rồi chỉ thêm ô dự phòng cho đủ. Không đủ tổng tài sản thì bán hết và phá sản. MORTGAGE/UNMORTGAGE/SELL_BUILDING bị từ chối trong toàn bộ ván dùng luật thanh lý mới. Xem API và cách ưu tiên trong [GAMEPLAY.md](GAMEPLAY.md).


## Ô sự kiện, Lễ hội và thẻ tặng

Ô sự kiện (`eventTileIds`) là các vị trí ngẫu nhiên ×1,25 khi tạo ván. Lễ hội có đúng một địa điểm `festivalTileId` và bộ đếm toàn ván `festivalLevel`; chỉ chọn thành phố của mình tại ô góc Lễ hội. Mức thuê = 1 + festivalIncrement × số lần đã tổ chức, với festivalIncrement chọn 0,25 hoặc 0,5 trong cài đặt phòng (mặc định 0,5); di chuyển Lễ hội sang ô mới, không cộng hiệu ứng cho nơi cũ. Các alias festivalTileIds/festivalTileCount cũ chỉ còn chỉ ô sự kiện, không phải Lễ hội này.

Thẻ 6/7 đã đổi thành đến ô Lễ hội/Sân bay. Thêm 21 đến địa điểm Lễ hội đang hoạt động, 22 đến Thuế, 23 tặng một ô cho người khác. `RESOLVE_CARD` thêm targetPlayerId cho thẻ tặng, giữ targetTileId cho ô được tặng; kiểm tra quyền sở hữu người dùng, người nhận khác/chưa phá sản và trạng thái không nợ. Công trình, cúp điện chuyển nguyên; không trừ tiền, không hỏi người nhận xác nhận. Bộ Cơ hội mới 23 thẻ, UI/timeout/bot dùng chung cardChoices/cardSelectionProblem. Động đất nay xóa cả quyền sở hữu.


## Giá xây mới cho bàn 32 ô

Ván mới dùng `propertyPricing: business-tour-v1`: giá đất P đã gồm cấp 1; tổng mua cấp 1–4 = P+(cấp−1)H; cấp cuối có tổng P+6H, nên phí nâng 4→5 là 3H. Engine dùng `constructionUpgradeCost` cho quote, kiểm tra tiền và trừ tiền; `propertyValue` dùng cùng giá xây tích lũy cho hoàn tiền, thanh lý và thuế. Thuê và mua lại ×1,5 giữ nguyên. Giá P/H mỗi ô giữ nguyên; không áp dụng công thức mới cho snapshot có discriminator cũ hoặc thiếu discriminator.


### Bảng P/H mới — business-tour-v2

Ghi chú giữ nguyên P/H trong phần V1 ở trên đã được thay thế cho ván mới: server dùng business-tour-v2 và bảng 20 P/H độc lập tại `game-content/board32-prices.ts`. Công thức mua/xây/khách sạn giống V1, thuê không đổi. Snapshot V1, level-one-included hoặc thiếu field giữ đúng giá cũ qua boardFor. Bảng đầy đủ và phạm vi xác minh nằm trong GAMEPLAY.md; mua lại vẫn ×1,5.

Lễ hội nhân trên mức thuê đã áp dụng ô sự kiện +25%; giữ phần lẻ và chỉ làm tròn lên sau tất cả hệ số. Nhãn setting/lobby/bàn/thông tin đất dùng ×1,25.

### Khu nguyên khối trên bàn 32 ô

Ván `boardLayout: districts-v1` chỉ đổi vị trí khu, giữ nguyên thành viên/màu nhóm và công trình theo thành phố; P/H và thuê lấy lần lượt theo thứ tự thành phố trên bàn mới. Mỗi nhóm nằm trong một nửa dãy; số ô là 3–3/3–2/2–3/2–2. Thưởng trọn nhóm vẫn ×2 và không yêu cầu sở hữu resort trong nửa dãy. Snapshot thiếu field giữ layout gốc. Xem bảng khu mới trong GAMEPLAY.md.
