# Gameplay đang triển khai

## Thanh lý theo nhóm

Người đang nợ chọn nhiều ô và xác nhận bán một lần. Server bán **tất cả ô đã chọn**, cộng tổng tiền bán vào tiền mặt một lần, rồi thanh toán khoản nợ một lần; phần dư giữ lại. Không trả tiền xen giữa từng ô và không tự bỏ bớt ô đã xác nhận khi đã đủ trả nợ. Nếu nhóm chọn chưa đủ, nợ còn lại giữ nguyên ID và hạn xử lý. Hết giờ tự bán toàn bộ nhóm đã chọn, chỉ thêm tài sản dự phòng đủ bù phần thiếu. Khi không đủ tài sản, bán hết rồi xử lý phá sản. Các khoản thanh toán khác đang chờ chỉ được giải quyết sau khi hoàn tất nhóm bán của khoản nợ hiện tại.

## Quân cờ nhân vật Việt Nam

Ván online mới bốc ngẫu nhiên một model cho mỗi người khi chủ phòng bắt đầu. Server chọn từ bộ 8 nhân vật, không trùng trong cùng ván; người chơi không gửi lựa chọn hoặc tự đổi quân. Model lưu trong `Player.token` cùng phòng, mọi thiết bị nhìn cùng kết quả, reload/reconnect hoặc chuyển lượt không bốc lại. Phòng đang chơi và các token cũ giữ nguyên. Hình dáng chỉ là mỹ thuật, không thay đổi tiền, quyền đi, xúc xắc hoặc khả năng của người chơi.

## Bàn cờ

40 ô theo thứ tự Classic, tên địa danh được Việt hóa. Xuất phát 0, Đảo hoang 10, Bãi đỗ xe 20, Máy bay 30. Cơ hội 7/22/36, Quỹ Cộng đồng 2/17/33, ga 5/15/25/35, tiện ích 12/28, thuế 4/38. Có 22 đường phố trong 8 nhóm màu, giá đất và bảng tiền thuê Classic.

Ván mới có 23 thẻ Cơ hội (16 cơ bản, 4 thẻ tác động công trình và 3 thẻ di chuyển/tặng mới) và 16 thẻ Quỹ Cộng đồng; xáo đầu ván. Ván cũ giữ số lượng và thứ tự deck 16/20 thẻ Cơ hội đang lưu, không tự thêm thẻ. Lá đã dùng chuyển cuối bộ, trừ thẻ thoát đảo được giữ.

## Bất động sản theo ô đến — áp dụng cho ván mới

[Luật chi tiết và API cho nhánh UI](PROPERTY_RULES.md). Giá đất của ván mới đã gồm nhà cấp 1; giá trị cấp N = giá đất + max(0, N−1) × phí nâng cấp. Mua thành phố kèm nhà tối thiểu cấp 1; trước vòng cá nhân đầu tiên tối đa cấp 3, qua vòng đầu tối đa cấp 4. Chỉ xây khi vừa đáp đúng ô của mình; bỏ điều kiện trọn nhóm màu/xây đều. Cấp 5 chỉ nâng khi đáp lại ô đã có cấp 4 từ trước. Trọn nhóm màu tăng gấp đôi tiền thuê mọi cấp.

Đáp ô đối thủ: trả thuê trước, sau đó được mua lại với giá 1,5 × (giá đất + giá trị xây hiện có), làm tròn lên; chủ cũ không được từ chối. Mua lại xong được nâng cấp trong cùng lần đáp theo giới hạn cá nhân. Công trình đặc trưng không được mua lại, phá hủy, hạ cấp hoặc buộc bán bằng thẻ; chỉ thẻ Cúp điện áp dụng được, chặn lợi nhuận trong 3 lần qua Xuất phát tiếp theo của chủ đất. Phòng cũ thiếu `propertyRules` giữ quy tắc mua/xây cũ để không đổi kinh tế giữa ván.

## Luật chung

- Khi chủ phòng bắt đầu ván, server chọn ngẫu nhiên đồng đều một người đang tham gia để đi đầu. Giữ nguyên danh sách/ID người chơi: sau người chỉ số `k` là `(k + 1) % số người`, bỏ qua người đã phá sản; lượt tung thêm vẫn thuộc người hiện tại. Ví dụ danh sách A, B, C, D, nếu C đi đầu thì thứ tự là C → D → A → B → C. HUD đặt theo chiều kim đồng hồ: trên trái → trên phải → dưới phải → dưới trái. Chỉ bốc người đi đầu một lần, lưu cùng state; reconnect/đổi instance không bốc lại và không thay lượt của ván đang dở.
- Phòng mới chỉ có Cổ điển, không chọn chế độ hoặc số vòng. Chủ phòng chọn tối đa 2/3/4 người, tiền khởi đầu (số nguyên 1–1.000.000, mặc định ₫1.500) và tiền qua Xuất phát (số nguyên 0–1.000.000, mặc định ₫200). Cấu hình cố định khi tạo, được máy chủ xác thực, lưu phòng và công khai cho người tham gia. Tung 2 xúc xắc; đi xuôi qua/đến Xuất phát nhận số tiền đã cấu hình. Di chuyển trực tiếp ra đảo không nhận khoản này; bay qua/đến Xuất phát vẫn nhận đủ tiền. Mọi ô Thuế thu 10% tổng tiền mặt và toàn bộ giá trị hiện tại của đất/nhà/resort đang sở hữu; làm tròn lên. Giá đất đã bao gồm nhà cấp 1 ở ván dùng level-one-included nên không tính trùng cấp 1. Thuế chốt tại thời điểm đáp ô, sau tiền Xuất phát nếu có. Bãi đỗ xe không có jackpot.
- Mỗi bước hành động có 15 giây do server giữ, tải lại/heartbeat không đặt lại thời gian. Sau di chuyển, bước tiếp theo có đủ 15 giây. Hết giờ: tung tự động; đất chưa mua bị bỏ qua; thẻ tự bóc rồi có 15 giây để sử dụng; hết giờ sử dụng tự áp dụng; đấu giá bỏ lượt; phase end tự kết thúc dù còn lựa chọn. Khi thiếu tiền ở ván mới, bước thanh lý có 30 giây: chọn đất ưu tiên, bán nguyên ô với toàn bộ giá trị, hết giờ tự bán đủ trả nợ; bán hết vẫn thiếu thì phá sản. Chọn/bỏ chọn hoặc bán một phần không gia hạn 30 giây. Ván cũ giữ bán cấp nhà/thế chấp và deadline cũ. Một thao tác hợp lệ tạo bước mới và cấp 15 giây mới; mở/đóng overlay không tính. Chọn Máy bay dùng chung thời gian của bước tung, hết giờ chưa chọn thì bỏ vé và tự tung xúc xắc, không thu phí bay.
- Thoát phòng cần xác nhận. Trong phòng chờ, ghế được giải phóng; trong ván đang chơi, token người thoát bị thu hồi. Ván dùng điều kiện thắng mới kết thúc ngay khi còn một người chưa phá sản chưa chủ động rời bàn (Accept Winnings); khi còn ít nhất hai người như vậy, bot tiếp quản ghế đã rời. Ván cũ giữ cách bot tiếp tục chơi. Không thể dùng phiên cũ hay tham gia lại ván đang diễn ra. Mất kết nối/tải lại trang không tính là chủ động thoát và vẫn được reconnect.
- Bot đơn giản, không giao dịch: đủ tiền thì mua đất, giải chấp, xây nhà; trả ₫200 rời đảo khi đủ tiền; bóc/sử dụng thẻ, dùng Máy bay đến đất chưa có chủ đắt nhất đủ tiền mua; đấu giá tối đa giá in trên ô. Khi nợ ở ván mới, bot thanh lý nguyên ô theo lựa chọn ưu tiên rồi chọn thêm cho đủ, phá sản nếu bán hết vẫn thiếu; ván cũ giữ cách cũ. Không còn gì để chi thì tự tung hoặc kết thúc lượt. Bot không tự thế chấp để lấy tiền xây lại.
- Luồng chơi: tung xúc xắc → quân cờ di chuyển xong → xử lý ô đến. Mua/xây/mua lại trong ván mới theo mục bất động sản ở trên; bỏ qua không mở đấu giá, không thu tiền và để đất chưa có chủ. Phiên đấu giá đang dở từ bản cũ vẫn được xử lý đến hết.
- Cơ hội/Quỹ Cộng đồng: quân đến nơi → chờ nhịp rút 900 ms → server tự bóc → lật ảnh thẻ → đọc → sử dụng/chọn mục tiêu trên map. Không cần bấm rút. Server chừa 5,5 giây trình diễn/đọc trước cửa sổ thao tác 15 giây; bot cũng chờ. UI chỉ mở nút thực hiện sau khi minh họa tải và đủ thời gian đọc. DRAW_CARD vẫn là action tương thích cho caller cũ; không thể sử dụng trước khi bóc hoặc áp dụng hai lần. Thẻ di chuyển có thể dẫn đến mua đất hoặc rút tiếp thẻ mới. Người khác chỉ thấy thẻ đang được xử lý, không phát lại nội dung cũ khi tung hoặc đổi lượt.
- Máy bay (ô 24 bàn 32 / ô 30 bàn 40): đáp ô kết thúc lượt kể cả đôi. Lượt kế tiếp đủ ₫50 thì bắt buộc chọn ô để bay; thiếu phí thì được tung bình thường và bỏ vé. Bay qua/đến Xuất phát vẫn nhận tiền, tính vòng cá nhân và giảm cúp điện. Xử lý ô đến xong vẫn được tung xúc xắc thường. Được bay đến ô chưa có chủ hoặc đất của mình; không cho bay đến đất đối thủ, ô rút thẻ, Thuế, Lễ hội hoặc Đảo hoang. Hết giờ chọn tự bỏ vé và tung xúc xắc. Bay đến Sân bay kết thúc lượt; Sân bay cấp vé mới cho lượt sau.
- Dùng vé Máy bay chuyển sang chọn trực tiếp trên bàn cờ: các ô có viền sáng, rê chuột xem đường bay và chạm ô để bay ngay. Hủy/Esc giữ nguyên vé. Bàn phím: ←/→ chọn ô, Enter bay; bàn 2D cũng chọn trực tiếp trên ô.
- Sở hữu trọn nhóm màu nhân đôi tiền thuê mọi cấp ở ván mới; ván cũ chỉ nhân đôi đất chưa xây. Không thu tiền trên đất thế chấp hoặc đang cúp điện.
- Thuê ga: ₫25/50/100/200 khi có 1/2/3/4 ga. Tiện ích: 4 hoặc 10 lần tổng xúc xắc khi sở hữu 1 hoặc 2.
- Chỉ bộ luật legacy còn kho 32 nhà và 12 cấp cuối hữu hạn, nhóm màu và xây/bán đều. landing-v1 không có giới hạn số ô sở hữu hoặc kho mô hình; vẫn giữ cấp theo vòng cá nhân và quyền xây tại ô vừa đáp.
- Ván cũ: thế chấp nhận nửa giá đất; bán cấp công trình nhận nửa chi phí xây. Bán hết công trình của mình trong nhóm trước khi thế chấp. Giải chấp trả nợ gốc cộng 10%, làm tròn lên.
- Tung đôi được thêm lượt sau khi xử lý ô; đôi lần thứ 3 liên tiếp đưa thẳng ra Đảo hoang (ô 10), không đi theo kết quả lần đó, không nhận tiền Xuất phát, hủy vé máy bay và kết thúc lượt tung thêm. Chuỗi đôi được xóa khi tung không đôi hoặc đổi người. Thẻ Cơ hội “Lạc ra đảo” cũng đưa ra đảo; Quỹ Cộng đồng không có thẻ đưa ra đảo. Đáp đúng ô Đảo hoang bằng xúc xắc, thẻ hoặc bay đều bị giữ lại ngay, hủy vé và lượt tung thêm; đảo ở ô 8 bàn 32 / ô 10 bàn 40.
- Ở Đảo hoang: trả ₫200 hoặc dùng thẻ thoát đảo trước khi tung để ra ngay, sau đó tung bình thường (tung đôi vẫn được thêm lượt). Nếu thử tung: đôi ở bất kỳ lần nào cho ra, đi theo tổng điểm và vẫn được tung thêm; đôi thoát đảo là đôi đầu tiên trong chuỗi, đôi liên tiếp thứ 3 đưa trở lại đảo; không đôi ở hai lần đầu phải ở lại. Lần thử thứ 3 mặc định ra miễn phí, đi theo tổng điểm vừa tung dù không đôi; không phát sinh khoản phí/nợ thoát đảo, nhưng ô đến vẫn xử lý mua/thuê/thẻ bình thường.
- Lúc thiếu tiền, khóa bước tiến của ván và chỉ người đang nợ được chọn/bán đất. Ván mới không có thế chấp hoặc bán lẻ từng cấp nhà. Bán nguyên ô cho ngân hàng, xóa toàn bộ nhà/chủ; tiền bán tự trả nợ và giữ lại tiền dư. Nếu tổng tài sản không đủ thì thanh lý hết rồi phá sản, không chuyển đất miễn phí cho chủ nợ.
- Giao dịch cần đề nghị từ người đúng lượt và chấp nhận từ đúng thiết bị đối tác trong 15 giây; quá hạn tự hủy, không chuyển tiền/đất. Không hỗ trợ vay tiền giữa người chơi hoặc lời hứa thực hiện sau. Đất trao đổi chưa xây và chưa thế chấp.
- Bỏ qua mua đất/nhà (bấm bỏ qua hoặc hết giờ mua) tự kết thúc bước xử lý ô, không cần bấm kết thúc lượt lần nữa. Nếu tiền mặt không đủ giá mua tối thiểu theo bộ luật của ván (gồm nhà cấp 1 khi bắt buộc), tự bỏ qua ngay, không mua, không trừ tiền và không mở đấu giá. Vẫn giữ quyền tung thêm do đôi hoặc quyền tung bình thường sau chuyến bay; nếu không còn quyền tung thì chuyển sang người tiếp theo. Phòng cũ đang chờ mua mà không đủ tiền cũng tự tiếp tục khi server đọc lại.
- Không có nút xác nhận kết thúc lượt hoặc tiếp tục sau đôi/chuyến bay. Sau animation, server tự kết thúc bước xử lý ô. Nếu vừa tung đôi, xử lý mua/xây/thẻ/bỏ qua xong sẽ hiện lại nút Tung xúc xắc cho cùng người chơi bấm; không tự tung ngay, hết 15 giây mới dùng mặc định hết giờ. Sau chuyến bay vẫn tự tung lượt thường; lượt chính của người tiếp theo vẫn chờ nút tung. Các thao tác quản lý tài sản/giao dịch tùy ý không giữ phase `end`; nợ và đề nghị giao dịch đang chờ vẫn khóa tiến trình.
- Nếu đáp ô có lựa chọn mua lại/nâng cấp hợp lệ, bảng mở một lần cho lần đáp đó với thời hạn 15 giây. Bấm ra ngoài hoặc Escape không đóng bảng mua/nâng cấp. Bỏ qua hoặc đóng bằng nút X kết thúc lựa chọn ngay, xóa quyền xây của lần đáp, không mở lại để thay đổi quyết định. Mua/xây thành công tự tiếp tục, không mở thêm bảng nâng cấp sau khi đã chọn cấp mua/xây. Mua lại vẫn cho nâng cấp ngay trong bảng đang mở trước khi hoàn tất.
- Thẻ tự bóc sau khi đến ô; sau nhịp hiển thị ngắn 1,2 giây sau thời điểm bắt đầu, server tự áp dụng thẻ không cần chọn mục tiêu. Thẻ cần mục tiêu tự mở chế độ chọn, bấm ô hợp lệ áp dụng ngay; thẻ tặng áp dụng khi đã chọn đủ ô và người nhận theo bất kỳ thứ tự nào. Không có nút Thực hiện/Xác nhận; hết giờ chọn vẫn dùng mặc định server. Không tự chọn mục tiêu cho người chơi trước hạn. Luồng thẻ, tự tung tiếp và tự kết thúc chạy trên server qua CAS, không cần trình duyệt gửi lệnh xác nhận.

## Tương thích ván Thành phố sống cũ (không tạo phòng mới)

- Lô đơn lẻ được xây đến cấp 2. Cấp 3 trở lên cần sở hữu trọn nhóm màu và xây đều. Chọn business khi xây cấp đầu, không đổi giữa chừng.
- Nhà trọ: thuê ×0,7; mỗi cấp nhận ₫8 ở đầu vòng mới.
- Café: tiền thuê cơ bản; +20% khi có nhà trọ đã xây, chưa thế chấp ở ô liền kề (kể cả khác chủ). Chỉ cộng một lần.
- Lưu trú: thuê ×1,4; mỗi cấp phải trả phí vận hành ₫6 ở đầu vòng mới.
- Sự kiện khu phố tăng 25% tiền thuê cho nhóm chỉ định, thay sau 2 vòng chung. Kế tiếp được hiển thị công khai. Hệ số áp dụng tích số, cuối cùng làm tròn lên.
- Vòng chung kết thúc khi lượt đi qua mốc người đi đầu được lưu trong state, kể cả khi người này đã phá sản (bỏ qua ghế phá sản). Ván cũ thiếu mốc này tiếp tục dùng chỉ số 0 như trước. Lượt tung thêm không làm tăng vòng.
- Chọn 8/12/20 vòng. Sau vòng cuối, tài sản ròng = tiền mặt + giá đất − nửa giá đất đã thế chấp + nửa giá công trình. Thế chấp không tạo thêm tài sản ròng. Không tính sự kiện tạm thời vào định giá.
- Nếu tài sản ròng bằng nhau, so tiền mặt; bằng cả hai thì chia sẻ vị trí dẫn đầu trong bảng kết quả.

## Khác biệt và giới hạn có chủ đích

- Tên và nội dung thẻ được viết lại; đây không phải bản phát hành Monopoly chính thức.
- Chế độ Cổ điển chưa mô phỏng hết các thủ tục thi đấu: xây/giao dịch chỉ trên lượt của người chơi; phiên đấu giá không cho thế chấp giữa phiên; không đấu giá số nhà cuối cùng.
- Đất khi phá sản với ngân hàng được trả về trạng thái chưa sở hữu, chưa tổ chức ngay các phiên đấu giá bắt buộc. Chuyển đất thế chấp cho chủ nợ chưa thu 10% phí chuyển giao.
- Nếu không có đủ nhà để hạ khách sạn, phải giải phóng nhà từ công trình khác trước; chưa có nút thanh lý đồng thời cả khu.
- Bản đầu vẫn loại người phá sản; chưa có tái cơ cấu. Chưa có metro, đường rẽ, nhân vật nghề nghiệp, hợp đồng chia doanh thu hoặc matchmaking công khai. Bot hiện chỉ thay ghế của người chủ động thoát giữa ván.
- Cân bằng kinh tế và thời lượng chưa được xác nhận bằng playtest nhiều người. Các hệ số hiện là điểm bắt đầu để thử nghiệm.

## Bộ Việt Nam

Trạng thái hiện tại là bản nháp 40 ô. Kế hoạch mới 32 ô / 20 thành phố và bộ ảnh concept nằm trong [TASKS.md](../TASKS.md), chưa áp dụng vào luật bên dưới.

- 22 ô đất dùng tên thành phố/điểm đến và công trình biểu tượng trong game-content/vietnam.ts; vị trí 40 ô, deck, giá, tiền thuê và chi phí không thay đổi.
- 4 cấp đầu lần lượt là Nhà vườn, Nhà phố, Biệt thự, Khu nhà. Cấp 5 hiển thị công trình riêng của thành phố thay vì một model khách sạn chung. Các quy tắc xây đều, nhà/cấp 5 trong ngân hàng, bán hạ cấp và loại hình kinh doanh được giữ nguyên.
- Cấp 5 vẫn tương ứng với level=5 và một suất khách sạn trong engine; không thêm trạng thái kinh tế hoặc migration. Bán cấp 5 trở về model Khu nhà; đổi tên điểm đến được áp dụng khi đọc dữ liệu hiện tại, log cũ là lịch sử.
- Chi tiết mô hình và danh mục 22 thành phố: [Bộ Việt Nam](art/vietnam.md).

## Tương thích cấu hình và trạng thái cũ

`propertyRules: 'landing-v1'` được server ghi khi tạo ván online mới; snapshot thiếu field giữ luật bất động sản cũ. Các field vòng cá nhân/quyền đáp/cúp điện và target thẻ là mở rộng tùy chọn, không đổi ID bàn hoặc reset tài sản giữa ván. Thay đổi này không sửa scene/UI, nên phần điều khiển mua lại/chọn cấp/chọn target thẻ được tích hợp riêng.

`startingPlayer` là field tùy chọn mới, lưu chỉ số người đi đầu. Ván mới chọn ngẫu nhiên trên server khi bắt đầu; ván cũ thiếu field dùng mốc vòng 0 và giữ nguyên `currentPlayer`, không bốc lại giữa ván.

Giữ `version: 1`, ID 0–39 và các action/field nội bộ `jail`, `jailed`, `jailTurns`, `PAY_BAIL`, `USE_JAIL_CARD` để đọc phòng cũ. Chúng hiện mang chủ đề Đảo hoang, cùng luật đôi/thoát đảo mới, kể cả ván đang dở. Các field `startingCash`/`goSalary` là tùy chọn: phòng cũ thiếu chúng dùng mặc định 1.500/200, không reset tiền người đang chơi. `mode`/`maxRounds` còn để khôi phục ván cũ; mọi phòng mới là `classic`; các điều kiện thắng tức thì mới được mô tả bên dưới.


## Ô sự kiện ngẫu nhiên

Chủ phòng chọn **0–24 ô sự kiện** trong cài đặt tạo phòng (mặc định 0, tắt). Khi START_GAME tạo bản đồ, server bốc ngẫu nhiên không trùng từ **20 ô đất + 4 resort của bàn 32 ô**; không chọn thuế, thẻ hoặc góc. Mỗi ván bốc mới, có thể tình cờ trùng; không bốc lại khi đọc phòng, đổi lượt hoặc reconnect. Danh sách được lưu và gửi chung cho mọi người chơi.

Đối thủ đáp ô sự kiện trả **×1,25 tiền thuê** ở mọi cấp, làm tròn lên sau tất cả hệ số. Thưởng nhóm màu ×2 nhân cùng sự kiện thành ×2,5. Không nhân giá mua/xây/mua lại, thuế hoặc tiền qua Xuất phát. Ô chưa có chủ, thế chấp hoặc cúp điện không sinh thuê. Sự kiện ngẫu nhiên gắn với ô suốt ván, giữ nguyên qua đổi chủ/buộc bán/phá hủy. Phòng/snapshot cũ thiếu cấu hình/danh sách tiếp tục không có lễ hội.

Contracts: `CREATE_ROOM.boardId: 'vietnam-32'`, `CREATE_ROOM.eventTileCount`, `RoomSnapshot.eventTileCount`; `GameState.eventTileCount` và `eventTileIds`. Client chỉ chọn số lượng, không chọn IDs. Scene có thể đọc `eventTileIds` để hiển thị dấu sự kiện; thay đổi này chỉ bổ sung cài đặt lobby và luật, chưa sửa renderer. Lễ hội được tổ chức là cơ chế riêng, không phải những ô ngẫu nhiên này.


Bộ map 32 ô có discriminator `boardId: 'vietnam-32'`, không đổi BOARD 40 ô hoặc ID của phòng cũ. Layout cho engine nằm ở `game-content/board32-layout.ts`, khớp bố cục prototype; nhánh renderer cần nối dữ liệu chung để không lẫn IDs. Resort giữ cách tính thuê theo số resort sở hữu (25/50/100/200 trước hệ số lễ hội), không xây nhà. Giá đất/xây giữ thang giá hiện có; tiền thuê dùng bảng riêng đã duyệt dưới đây. Thẻ di chuyển được resolve theo boardId, đảo ở 8 và sân bay ở 24. UI tạo phòng mới gửi boardId này; client cũ thiếu field tiếp tục bàn 40 ô (tối đa 22 ô sự kiện đất). Gameplay, HUD/modal và fallback đã nối với bàn 32 bằng `boardFor(game)` và `getCard(deck, id, game.boardId)`. Tên ô góc giam giữ trên bàn mới là Côn Đảo; 4 resort theo chiều đi là Phú Quốc, Lăng Cô, Mỹ Khê và Cô Tô.


## Điều kiện thắng theo Business Tour — ván online mới

`victoryRules: 'business-tour-v1'` được server đặt khi START_GAME; client không chọn bộ điều kiện hoặc tự khai thắng. Kiểm tra ngay sau mỗi action hợp lệ, gồm mua đất, mua lại, giao dịch được đối tác chấp nhận, đấu giá cũ và chuyển tài sản do phá sản. Không đợi kết thúc lượt/vòng, không chọn người giàu nhất thay cho người vừa hoàn thành điều kiện.

| Điều kiện | Quy tắc áp dụng |
| --- | --- |
| Side Monopoly | Sở hữu toàn bộ ô có thể mua trên cùng một dãy/cạnh: cả đất thành phố và resort. Không tính góc, thẻ hoặc thuế. |
| Triple Monopoly | Sở hữu trọn ít nhất **3 nhóm màu khác nhau**, kể cả nhóm có 2 ô. Không phải sở hữu 3 ô hoặc một nhóm 3 ô. |
| Resort Monopoly | Sở hữu đủ **4 resort** (Phú Quốc, Lăng Cô, Mỹ Khê, Cô Tô: IDs 4/14/18/25 trên bàn 32). Ga bàn 40 không được tự coi là resort. |
| Bankruptcy | Chỉ còn một người chưa phá sản. |
| Accept Winnings | Tất cả đối thủ còn khả năng chơi đã chủ động rời bàn, chỉ còn một người chưa phá sản chưa rời. Kết thúc tự động, không cần gửi action nhận thắng. |

Độc quyền tính theo **quyền sở hữu**, không yêu cầu cùng cấp nhà/cấp tối đa; nhà bị phá về 0, thế chấp hoặc cúp điện vẫn không đổi chủ nên vẫn tính. Hệ thống này hiện là solo, không cộng tài sản theo đội. Chủ dự án chốt ngày 27/10/2026: Side bao gồm cả đất thường và resort trên toàn dãy; Triple là 3 bộ/nhóm màu hoàn chỉnh.

Mất kết nối, hết hạn heartbeat hoặc tải lại trang không phải LEAVE_ROOM, không ghi `departedPlayerIds`, không tạo Accept Winnings. Đối thủ đã phá sản không cản người còn lại nhận thắng. Nếu còn ít nhất hai người chưa phá sản chưa rời bàn thì bot vẫn chơi thay ghế rời. Khi thắng, server dừng bot/timer và hủy trade đang chờ. HTTP/CAS giữ kết quả qua reconnect, hai lệnh thoát đồng thời và request gửi trùng; không bốc/chọn lại người thắng.

Kết quả lưu `winnerId` và `winReason` (`side-monopoly`, `triple-monopoly`, `resort-monopoly`, `bankruptcy`, `accept-winnings`); `gameOutcome` giúp bảng kết quả tôn trọng người thắng dù đối thủ có nhiều tài sản hơn. Nếu một giao dịch đồng thời hoàn thành mục tiêu của hai người, ưu tiên người khởi tạo/đang đến lượt, sau đó theo thứ tự ghế; một người đồng thời đủ nhiều độc quyền thì nhãn ưu tiên Resort → Side → Triple. Bankruptcy/Accept được xét trước độc quyền. Đây là quy tắc phân xử xác định của dự án khi mô tả tham chiếu không quy định rõ.

Snapshot thiếu victoryRules giữ điều kiện cũ và không tự kết thúc do việc đọc/reconnect. `capital` chỉ là nhãn kết quả tương thích chế độ city có giới hạn vòng, không thêm giới hạn thời gian hoặc điều kiện vốn cho phòng classic mới. Scene, camera, bản đồ và luật kinh tế không đổi trong cập nhật điều kiện thắng.

Tham chiếu: [Thành tích Steam của Business Tour](https://steamcommunity.com/stats/397900/achievements) liệt kê thắng theo cạnh và đủ resort; [hướng dẫn Steam do người chơi biên soạn](https://steamcommunity.com/sharedfiles/filedetails/?id=1091085897) liệt kê năm dạng thắng. Mô tả Triple giữa các nguồn có khác nhau; triển khai theo chốt 3 nhóm và toàn dãy gồm resort của chủ dự án.


## Thanh lý tài sản và giá nhà cấp 1 — ván mới

Server đặt `liquidationRules: 'full-value-v1'` và `propertyPricing: 'level-one-included'` cho ván mới. Mỗi khoản nợ có ID và danh sách `selectedTileIds` lưu trên server theo thứ tự chọn. Người đang nợ tick chọn/bỏ chọn các ô của mình, xác nhận bán trước hạn hoặc chờ hết **30 giây**. Không reset deadline khi thay lựa chọn, bán một phần, đọc phòng hay reconnect; sau animation đến ô, người chơi vẫn có đủ 30 giây. Các bước khác giữ 15 giây.

**Giá đất chính là giá nhà cấp 1**. Ví dụ giá đất 100, phí nâng 50: cấp 1 = 100, cấp 2 = 150, cấp 3 = 200, cấp 4 = 250, công trình đặc trưng = 300. Resort chỉ có giá gốc. Nhà bị phá về cấp 0 vẫn còn quyền sở hữu đất và giá gốc; khi xây lại trên đất đã sở hữu, phí sửa/xây từng cấp giữ `buildCost`, không mua lại đất. Mua lại đất cấp 0 theo cách định giá mới kèm cấp 1, không cộng thêm khoản cấp 1 lần nữa; không bị chặn bởi kho nhà legacy. Giá trị mua lại x1,5 và thẻ buộc bán cũng dùng đúng giá trị này.

Khi hết hạn, server bán các ô đã chọn theo thứ tự, dừng ngay khi trả đủ; nếu chưa đủ, ưu tiên ô chưa chọn có giá thấp nhất nhưng đủ trả phần thiếu, nếu không có thì bán ô giá trị lớn nhất rồi lặp lại. Không cam kết giải bài toán tối ưu tổ hợp giá trị. Chỉ bán tài sản của người đang nợ, không ảnh hưởng tài sản đối thủ. Mỗi lần bán xóa tài sản khỏi sở hữu, trả nhà/cấp cuối vào nguồn cung, tiền tự trả cho chủ nợ/ngân hàng; phần dư giữ trong tiền mặt. Lễ hội vẫn gắn với vị trí trên map. Mất nhóm màu ngay khi bán một ô trong nhóm.

Nếu bán hết vẫn không đủ, số tiền thu được trả cho chủ nợ trước rồi người nợ bị loại. Ván mới không chuyển nguyên đất cho chủ nợ khi phá sản. Một khoản thanh toán tiếp theo trong hàng đợi có ID/lựa chọn/thời hạn riêng, không tự bán tài sản của người khác cùng transaction. Snapshot cũ thiếu các discriminator giữ cách định giá và xử lý nợ cũ; không tự định giá lại tiền đã trả.

API client: `SET_LIQUIDATION_SELECTION { tileIds }` để lưu thứ tự; `LIQUIDATE_SELECTED` để xác nhận bán các ô đã chọn, dừng khi đủ. `AUTO_LIQUIDATE` chỉ dành cho timeout/bot, public allowlist không cho client gọi. `DECLARE_BANKRUPTCY` chỉ được chấp nhận khi tổng giá trị có thể thanh lý không đủ; engine thanh lý hết trước khi phá sản. Client không gửi giá bán/tiền hoàn hay deadline. Helpers `liquidationValue`, `liquidationPotential`, `selectedLiquidationValue`, `liquidationPlan` dùng cùng phép tính server.


## Lễ hội duy nhất và bộ thẻ mới

Ô góc Lễ hội (16 bàn 32, 20 bàn 40) cho người đến chọn **một thành phố mình sở hữu**, không chọn resort/đất đối thủ. Nếu không có thành phố thì bỏ qua. Chỉ có một nơi tổ chức tại một thời điểm: `festivalTileId`; lịch sử toàn ván là `festivalLevel`. Mỗi lần chọn thành công tăng level đúng 1, kể cả chọn lại cùng nơi; **hệ số tiền thuê = 1 + festivalIncrement × festivalLevel**. Chủ phòng chọn mức tăng **0,25 hoặc 0,5**, mặc định 0,5. Mức 0,5: lần 1 ×1,5; lần 2 ×2; lần 3 ×2,5. Mức 0,25: lần 1 ×1,25; lần 2 ×1,5; lần 3 ×1,75. Chuyển nơi tổ chức không reset lịch sử: ô cũ mất toàn bộ hiệu ứng Lễ hội, ô mới nhận mức hiện tại. Bỏ qua không tăng level. Bot/hết giờ chọn thành phố hợp lệ có giá trị cao nhất, hòa thì ID nhỏ hơn; không có thành phố thì bỏ qua.

Ô sự kiện ngẫu nhiên thưởng thêm 25% (×1,25), áp dụng trước Lễ hội. Tiền thuê nhân nhóm màu × sự kiện ngẫu nhiên × Lễ hội, rồi làm tròn lên một lần. Ví dụ thuê nền 100, đủ nhóm ×2, sự kiện ×1,25 và Lễ hội lần đầu ×1,5 → 375. Cúp điện/thế chấp cũ vẫn ngừng thu; Lễ hội không vượt qua trạng thái đó. Bán/tặng/phá hủy ô không di chuyển Lễ hội hoặc reset lịch sử; chỉ lựa chọn nơi tổ chức mới thay đổi nó. Ô chưa có chủ không thu thuê, dù vị trí vẫn được chọn làm Lễ hội.

Thẻ 6 đến ô góc Lễ hội; thẻ 7 đến Sân bay, nhận vé cho lượt chính sau và chưa thu phí bay. Thẻ 21 đến đúng thành phố đang tổ chức Lễ hội (không đến ô sự kiện ngẫu nhiên); chưa có nơi tổ chức thì tiêu thụ thẻ, không di chuyển. Thẻ 22 đến ô Thuế tiếp theo theo chiều đi, tính thuế theo luật hiện tại. Các di chuyển tiến qua/đến Xuất phát vẫn nhận tiền và cộng vòng. Giữ ID các thẻ cũ; danh sách đủ và nội dung: [CARDS.md](CARDS.md).

Động đất (17) xóa **cả đất lẫn nhà** trên thành phố đối thủ lv1–4, không hoàn tiền. Tặng tài sản (23) bắt buộc chọn đúng một ô sở hữu và một người khác chưa phá sản; có thể tặng resort hoặc công trình cấp 5. Chuyển nguyên cấp, trạng thái cúp điện và các thuộc tính tài sản; không thu/trả tiền và không cần bước chấp nhận của người nhận. Không thể dùng thẻ tặng khi đang nợ để né thanh lý. Nếu không có tài sản/người nhận hợp lệ thì thẻ không gây tác động. Tặng hoàn thành độc quyền cho người nhận sẽ kết thúc ván ngay với đúng người đó thắng.

Client gửi `HOST_FESTIVAL {tileId}`/`SKIP_FESTIVAL` ở phase festival; `RESOLVE_CARD {targetTileId,targetPlayerId}` cho thẻ tặng, `targetTileId` cho 4 thẻ tác động đối thủ. Target thiếu/sai khi có lựa chọn hợp lệ bị từ chối trước khi tiêu thụ thẻ hoặc thay tiền/seed. Server chọn fallback khi timeout, lưu kết quả qua CAS/receipt để request trùng không tặng hoặc tăng Lễ hội hai lần. Mỗi bước vẫn 15 giây; không thay hạn thanh lý 30 giây.

Các tên `festivalTileCount`/`festivalTileIds` cũ được đọc như alias **ô sự kiện ngẫu nhiên**, không phải Lễ hội đang tổ chức; API mới dùng `eventTileCount`/`eventTileIds`. Public snapshot còn cung cấp alias cho client cũ. Không suy diễn một ô trong danh sách ngẫu nhiên thành Lễ hội duy nhất. Renderer không được sửa trong thay đổi này; UI mục tiêu thẻ và chọn nơi tổ chức là overlay riêng.


Cài đặt `festivalIncrement` được gửi khi CREATE_ROOM, lưu trong RoomSnapshot và GameState, cố định trong ván. Chỉ nhận số 0.25/0.5; thiếu field dùng 0.5 cho tương thích phòng cũ. Reconnect/đổi nơi tổ chức giữ nguyên mức tăng và bộ đếm; HOST_FESTIVAL không được thay cấu hình. Ô sự kiện ngẫu nhiên vẫn ×1,25, không bị ảnh hưởng bởi lựa chọn này.


Giao diện thanh lý: người đang nợ chọn/bỏ chọn trực tiếp ô sở hữu trên bàn 2.5D hoặc 2D; mỗi ô bán được hiện giá thanh lý đầy đủ. Ô đã chọn đổi màu và hiện thứ tự ưu tiên. Cụm nổi chỉ hiển thị khoản thiếu, tổng đã chọn và nút bán; không mở danh sách tài sản che bàn. Lựa chọn gửi lên server và giữ nguyên hạn 30 giây, mất kết nối hoặc đang gửi thao tác sẽ khóa xác nhận/chọn mới.


Thẻ Động đất, Hỏa hoạn, Bán nhà, Cúp điện và Tặng tài sản chọn ô trực tiếp trên bàn cờ. Ô hợp lệ sáng lên, ô không hợp lệ tối đi; chọn/bỏ chọn ô trước khi bấm Xác nhận trên thanh nhỏ dưới màn hình. Không có nhãn tên nổi hoặc bảng mô tả giữa bàn. Với thẻ Tặng tài sản, chọn thêm một người nhận trong cụm điều khiển nổi. Không có ô hoặc người nhận hợp lệ thì thẻ dùng luồng xác nhận thông thường. Không thay phạm vi tác động, quyền bảo vệ cấp 5 hoặc thời hạn hành động.


Tổ chức Lễ hội chọn trực tiếp trên bàn: thành phố thuộc người đang tổ chức sáng lên, resort/đất đối thủ/ô đặc biệt tối đi. Bấm ô để chọn hoặc bỏ chọn; thanh nhỏ ở mép dưới hiện hệ số lần tới, tên ô đã chọn, Bỏ qua và Tổ chức. Không dùng modal giữa bàn hoặc dropdown. Luật tăng hệ số, địa điểm duy nhất và thời hạn do server giữ nguyên.


Nhịp tung xúc xắc: gửi ROLL ngay lên server; mọi người đang xem đều quay xúc xắc khoảng 1,2 giây, giữ kết quả rõ thêm 1 giây, rồi quân mới đi từng ô khoảng 0,42 giây/ô (có nhịp dừng ngắn). Bay/di chuyển một đích dùng 0,9 giây. Chỉ mở thao tác tại ô đến khi quân đi xong; bàn 2D cũng giữ vị trí trong lúc xem xúc xắc và cập nhật từng ô. Server chừa cùng ngân sách animation trước khi bắt đầu 15 giây thao tác hoặc 30 giây thanh lý; bot và tự kết thúc lượt không vượt bước này.


## Thông tin hiển thị trong ván

- Khi ở đảo hoang, trước khi tung có thể chọn trả ₫200 để rời đảo, dùng thẻ thoát đảo nếu có hoặc thử tung đôi. Trả tiền xong vẫn được tung; không đủ ₫200 thì nút trả tiền bị khóa. Luật thoát đảo không thay đổi.
- Viền đất/resort mang màu chủ sở hữu, khớp màu trên HUD. Giữ tên và giá trên mặt ô theo giao diện gốc, chỉ làm chữ đậm hơn. Tiền thuê chỉ hiển thị trong bảng thông tin khi người chơi chủ động chọn ô; mua/xây không tự mở bảng này.
- Số dư có hiệu ứng đếm và nhãn cộng/trừ cho cả người trả lẫn người nhận; số tiền thật và thời hạn hành động vẫn do server quyết định.
- Sau khi bóc thẻ, cả bàn thấy tên người rút, tên thẻ và nội dung trong thông báo nhỏ phía trên. Người rút vẫn là người duy nhất được thao tác và chọn mục tiêu trên bàn.


## Chat, sân bay và nguồn công trình — cập nhật 27/10/2026

- Chat theo phòng dùng được trong phòng chờ và trong ván; mọi ghế còn phiên hợp lệ nhận cùng lịch sử 50 tin gần nhất. Mỗi tin tối đa 240 ký tự, có chống spam. Chat không gia hạn lượt hoặc thay đổi tiền/xúc xắc.
- Ô Sân bay tự kết thúc lượt hiện tại sau trình diễn di chuyển, kể cả vừa tung đôi. Lượt chính kế tiếp đủ ₫50 thì phải chọn điểm bay trên bàn, không thể bỏ vé bằng tung xúc xắc; thiếu ₫50 thì được tung bình thường và bỏ vé. Thu phí đúng một lần khi bay. Qua/đến Xuất phát vẫn nhận tiền và tính vòng cá nhân.
- Sau khi bay, xử lý đầy đủ ô đến (trả thuê, mua, mua lại, nâng cấp, thẻ...) rồi còn lượt tung xúc xắc bình thường. Đến Đảo hoang hoặc Sân bay kết thúc quyền tung tiếp theo luật ô góc.
- Bộ luật landing-v1 không giới hạn số ô có thể mua hoặc số mô hình nhà/công trình trong ngân hàng. Giới hạn cấp 3 trước vòng đầu, cấp 4 sau vòng đầu và điều kiện cấp 5 vẫn áp dụng từng ô; không phải giới hạn số ô sở hữu. bankSupply chỉ còn dùng để kiểm tra nguồn công trình ở bộ luật legacy.
- eventTileCount chỉ chọn số lượng ô sự kiện toàn map khi bắt đầu ván (ví dụ 3 ô duy nhất, không đổi khi mua/xây). Những ô đó nhân tiền thuê ×1,25, không giới hạn tài sản mỗi người. Cờ vàng đánh dấu ô sự kiện; cờ hồng, hệ số và hiệu ứng sáng đánh dấu Lễ hội duy nhất. Nếu cùng ô có cả hai, hiện cả hai hiệu ứng.
- Mua lại thành phố xong có thể nâng ngay tại ô đó trong cùng lượt nếu đủ tiền và cấp hợp lệ. Bảng thông tin đang mở giữ nguyên để thao tác; không cần đợi lần đáp tiếp theo, ngoại trừ điều kiện vốn có của cấp 5.

## Trình diễn di chuyển và giá hiển thị trên ô — 27/10/2026

- Máy bay và thẻ di chuyển chạy lần lượt dọc bàn theo movement.path; thẻ lùi đi lùi. Quân không dịch chuyển cắt ngang bàn khi đường dài. Thẻ ra đảo vẫn không nhận lương dù hoạt cảnh đi qua Xuất phát. Ô trung gian không thu thuê/thuế hoặc kích hoạt sự kiện; chỉ xử lý ô đích.
- Trên mặt ô không hiển thị giá niêm yết. Ô chưa mua để trống số tiền; ô đã sở hữu hiển thị tiền thuê hiện tại từ engine, gồm cấp nhà và các hệ số đang áp dụng; đất cúp điện/thế chấp hiển thị 0. Resort hiển thị thuê theo số resort của chủ. Giá mua vẫn nằm trong lựa chọn mua và chi tiết tài sản. Thuế hiển thị theo tổng đất của người đang đến lượt. Trường hợp một thẻ yêu cầu thuê gấp đôi áp hệ số khi đáp bằng thẻ, không biến thành giá thuê thường cố định trên bàn.

## Điều chỉnh tương tác — 28/10/2026

- Chọn máy bay chỉ làm sáng ô hợp lệ; chuột, bàn phím và reducer dùng cùng danh sách. Server từ chối intent bay tới tài sản đối thủ, ô rút thẻ, Thuế, Lễ hội hoặc Đảo hoang mà không trừ phí/tiêu vé. SKIP_FLIGHT chỉ là action nội bộ khi timeout, public API không chấp nhận.
- Thẻ di chuyển dùng movement.mode=card, 150 ms/ô thay vì 420 ms/ô; các ô trên đường vẫn chỉ là hoạt cảnh. Máy bay và xúc xắc giữ nhịp cũ. Timer server và renderer cùng dùng pawnStepMs.
- Thẻ hiện nội dung là bấm Thực hiện/Chọn mục tiêu ngay; không khóa chờ đọc hoặc chờ minh họa tải. Thời gian chờ đọc bắt buộc là 0, cửa sổ xử lý vẫn 15 giây.
- Sau khi quân đến đất của mình và engine cho phép mua thêm cấp nhà với tiền hiện có, tự mở chi tiết có thao tác nâng cấp một lần cho lần đáp/đổi chủ đó. Đóng lại không bị ép mở; không tự xây hoặc trừ tiền.

- Minh họa thẻ dùng bản WebP 810 px đã tối ưu sẵn (giữ PNG nguồn), tải trước/giải mã từ lobby và khi reconnect thẳng vào ván. SVG trỏ file tĩnh trực tiếp để không chờ tối ưu ảnh trên server lúc rút thẻ.

## Chọn cấp mua và nâng cấp

UI luôn hiện 4 ô cấp 1–4. Các cấp đang sở hữu/đã vượt, chưa mở theo vòng cá nhân, không đủ tiền hoặc không thể thao tác đều tối màu và bị vô hiệu hóa. Cấp 5 nằm ở lựa chọn công trình đặc trưng riêng khi đất đã cấp 4. Giá các cấp mua kể cả cấp chưa mở do purchaseLevelQuotes cung cấp; báo giá không cấp quyền mua, reducer tiếp tục kiểm tra mọi điều kiện. Resort/ga/tiện ích không có lựa chọn cấp nhà.

Khi quay lại ô có nhà cấp 4 để lên công trình đặc trưng, UI dùng hộp nâng cấp cuối riêng: chỉ tên công trình/địa danh, phí và xác nhận. Không hiển thị cấp 1–4, thống kê tài sản hoặc bảng thuê trong bước này.


## Tiền thuê bàn 32 ô — cập nhật 28/10/2026

Nguồn tham khảo được người dùng duyệt: [bảng thuê Business Tour năm 2020](https://imgur.com/FWvaZjA), [thảo luận Steam](https://steamcommunity.com/app/397900/discussions/0/3557193237105034663/). Đây là bảng giá áp dụng cho game này, không khẳng định là dữ liệu Business Tour hiện tại. Các số ghi theo k trong nguồn được dùng trực tiếp theo đơn vị rút gọn ₫ của game, giữ cả các giá trị làm tròn trong bảng tham khảo.

`board32-rents.ts` ghép 20 thành phố theo thứ tự đi trên bàn, độc lập với giá mua hoặc nhóm màu. Cấp 1 là giá thuê đất gốc (giá mua đã gồm nhà cấp 1); cấp 2/3/4 lần lượt tương ứng 1/2/3 nhà trong nguồn; cấp 5 tương ứng khách sạn, thể hiện bằng công trình đặc trưng. Cấp 0 của snapshot cũ dùng cùng tiền thuê gốc với cấp 1. Không thay BOARD 40 ô, bố cục, ID, giá mua/xây hay luật nâng cấp.

| Thành phố | Cấp 1 | Cấp 2 | Cấp 3 | Cấp 4 | Cấp 5 |
|---|---:|---:|---:|---:|---:|
| Huế | 2 | 25 | 50 | 75 | 150 |
| Đà Nẵng | 2 | 28 | 55 | 83 | 165 |
| Hội An | 4 | 30 | 60 | 90 | 180 |
| Sóc Trăng | 6 | 33 | 65 | 98 | 195 |
| Bạc Liêu | 6 | 35 | 75 | 105 | 210 |
| Cà Mau | 8 | 38 | 75 | 113 | 225 |
| Quy Nhơn | 10 | 70 | 140 | 210 | 385 |
| Nha Trang | 10 | 75 | 150 | 225 | 413 |
| Phan Thiết | 12 | 80 | 160 | 240 | 440 |
| Buôn Ma Thuột | 14 | 85 | 170 | 255 | 468 |
| Kon Tum | 16 | 90 | 180 | 270 | 495 |
| Châu Đốc | 18 | 113 | 225 | 338 | 619 |
| Cần Thơ | 20 | 120 | 240 | 360 | 660 |
| Ninh Bình | 22 | 128 | 255 | 383 | 701 |
| Hạ Long | 22 | 135 | 270 | 405 | 743 |
| Hải Phòng | 24 | 143 | 285 | 428 | 784 |
| Vinh | 26 | 170 | 340 | 510 | 935 |
| Đồng Hới | 28 | 180 | 360 | 540 | 990 |
| Hà Nội | 35 | 190 | 380 | 570 | 1045 |
| TP. Hồ Chí Minh | 50 | 200 | 400 | 600 | 1100 |

Đây là thuê cơ bản trước hệ số: nhóm màu ×2, ô sự kiện ×1,25, Lễ hội theo cấu hình và bộ đếm toàn ván; nhân các hệ số rồi làm tròn lên một lần. Ô cúp điện không thu thuê. Resort giữ nguyên 25/50/100/200 theo số resort của chủ đất. Client đọc `rentFor`/`boardFor`, không tự tính hoặc lưu một bảng thuê riêng.


## Giá mua và xây bàn 32 ô — 28/10/2026

Ván mới do server tạo trên bàn `vietnam-32` dùng `propertyPricing: business-tour-v1`. Giữ nguyên P (giá đất đã gồm cấp 1), H (buildCost của ô), toàn bộ giá thuê và các hệ số thuê. Cấp 1/2/3/4 có tổng giá mua lần lượt P, P+H, P+2H, P+3H. Chỉ công trình cấp cuối thay phí: nâng cấp 4 lên 5 trả **3H**, tổng giá trị là **P+6H**. Các lần nâng thông thường trả H mỗi cấp; mua nhiều cấp không bị tính trùng đất/nhà cũ.

Quote UI, kiểm tra đủ tiền và trừ tiền server cùng đọc chênh lệch giá trị xây tích lũy từ engine. Thanh lý, buộc bán và tổng tài sản/thuế dùng tổng giá trị hiện có (cấp 5 = P+6H); không cộng phụ phí mua lại vào tài sản. Mua lại giữ hệ số **1,5×**, không áp dụng cho cấp 5. Giữ điều kiện vòng cá nhân, chỉ xây khi đáp đúng ô, và phải đáp lại ô đã có cấp 4 mới nâng cấp cuối.

Không đổi tên/ID/vị trí ô, bảng giá thuê hoặc renderer. Snapshot có pricing `level-one-included` hoặc thiếu discriminator giữ công thức cũ; bàn 40 ô không chuyển sang công thức mới. Đây là công thức mua/xây được chọn cho dự án, không phải tuyên bố đã xác minh toàn bộ giá mua Business Tour.


## Thay toàn bộ bảng P/H — cập nhật tiếp ngày 28/10/2026

Thay thế ghi chú trước về việc giữ nguyên P/H. Server tạo ván 32 ô mới với `propertyPricing: business-tour-v2`. P/H lấy từ `game-content/board32-prices.ts`, không dò phí nhà qua giá của bàn Monopoly 40 ô nữa. Giá thuê giữ nguyên toàn bộ. Cấp 1–4 lần lượt P, P+H, P+2H, P+3H; nâng cấp cuối thêm 3H, tổng P+6H. Mua lại giữ ×1,5. Resort giữ giá 200.

Bảng được áp dụng cho dự án dựa trên sáu gói mua đã đọc từ gameplay và thang giá suy ra cho phần còn lại; chưa phải bảng Business Tour hiện hành được xác minh đầy đủ. Sáu gói quan sát: Madrid 3 nhà 210, Beijing 3 nhà 250, Sydney 3 nhà 690, Lyon 2 nhà 700, Osaka 2 nhà 750, Tokyo 2 nhà 800.

| Thành phố trong game | Tham chiếu | P | H | Phí cấp cuối 3H | Tổng cấp cuối P+6H |
|---|---|---:|---:|---:|---:|
| Huế | Granada | 60 | 50 | 150 | 360 |
| Đà Nẵng | Seville | 60 | 50 | 150 | 360 |
| Hội An | Madrid | 60 | 50 | 150 | 360 |
| Sóc Trăng | Hong Kong | 100 | 50 | 150 | 400 |
| Bạc Liêu | Beijing | 100 | 50 | 150 | 400 |
| Cà Mau | Shanghai | 120 | 50 | 150 | 420 |
| Quy Nhơn | Venice | 140 | 100 | 300 | 740 |
| Nha Trang | Milan | 140 | 100 | 300 | 740 |
| Phan Thiết | Rome | 160 | 100 | 300 | 760 |
| Buôn Ma Thuột | Hamburg | 180 | 100 | 300 | 780 |
| Kon Tum | Berlin | 200 | 100 | 300 | 800 |
| Châu Đốc | London | 220 | 150 | 450 | 1120 |
| Cần Thơ | Sydney | 240 | 150 | 450 | 1140 |
| Ninh Bình | Chicago | 260 | 150 | 450 | 1160 |
| Hạ Long | Las Vegas | 260 | 150 | 450 | 1160 |
| Hải Phòng | New York | 280 | 150 | 450 | 1180 |
| Vinh | Lyon | 300 | 200 | 600 | 1500 |
| Đồng Hới | Paris | 320 | 200 | 600 | 1520 |
| Hà Nội | Osaka | 350 | 200 | 600 | 1550 |
| TP. Hồ Chí Minh | Tokyo | 400 | 200 | 600 | 1600 |

`boardFor` dùng bảng cũ cho snapshot thiếu pricing hoặc dùng `level-one-included` / `business-tour-v1`. V1 vẫn có khách sạn 3H nhưng giữ P/H cũ; chỉ V2 dùng bảng P/H mới. Không đổi ID, nhóm màu, ô đặc biệt, camera hoặc model.


## Ô sự kiện +25% — 28/10/2026

Hệ số sự kiện cố định `EVENT_RENT_MULTIPLIER = 1.25` áp dụng cho thành phố và resort có eventTileIds. Lễ hội nhân trên tiền thuê sau sự kiện: thuê cuối = ceil(thuê nền × nhóm màu × 1,25 nếu có sự kiện × (1 + festivalIncrement × festivalLevel) × hệ số thẻ nếu có). Giữ phần thập phân qua các bước và chỉ làm tròn lên ở cuối; không làm tròn riêng sau sự kiện.

Ví dụ thuê nền 100: sự kiện → 125; sự kiện + Lễ hội lần đầu +50% → ceil(125 × 1,5) = 188; sự kiện + Lễ hội lần đầu +25% → ceil(125 × 1,25) = 157. Mức tăng Lễ hội vẫn theo setting 0,25/0,5 và bộ đếm chung toàn ván. Mua/xây/mua lại/giá trị thanh lý không đổi theo bonus; cúp điện vẫn chặn thuê. Thay hệ số không bốc lại danh sách ô sự kiện hoặc reset Lễ hội.

## Di chuyển nguyên khu theo nửa dãy — 28/10/2026

Giữ nguyên tên, màu và các thành phố của 8 nhóm. Chỉ di chuyển nguyên khu, không đổi thành viên nhóm. Mỗi nhóm nằm gọn trong một nửa dãy, ngăn bởi ô giữa dãy.

| Dãy | Nửa đầu | Nửa sau | Số ô thành phố |
|---|---|---|---|
| 1 | Di sản miền Trung: Huế, Đà Nẵng, Hội An | Nam Bộ: Sóc Trăng, Bạc Liêu, Cà Mau | 3–3 |
| 2 | Nam Trung Bộ: Quy Nhơn, Nha Trang, Phan Thiết | Tây Nguyên: Buôn Ma Thuột, Kon Tum | 3–2 |
| 3 | Miền Tây: Châu Đốc, Cần Thơ | Bắc Bộ: Ninh Bình, Hạ Long, Hải Phòng | 2–3 |
| 4 | Bắc Trung Bộ: Vinh, Đồng Hới | Hai thành phố: Hà Nội, TP. Hồ Chí Minh | 2–2 |

Resort, ô giữa dãy, thuế và góc giữ nguyên vị trí. P/H và thuê cơ bản ghép lại theo thứ tự 20 ô thành phố trên bố cục mới, bỏ qua resort và ô đặc biệt. Nhóm và công trình vẫn đi theo tên thành phố. Thẻ đi đến Huế/Đà Nẵng resolve vị trí theo tên. Sở hữu đủ nhóm vẫn ×2 thuê, không cần resort xen trong nửa dãy; Side Monopoly vẫn cần cả resort trên cạnh.

Server chọn `boardLayout: districts-v1` cho ván 32 ô mới. Snapshot thiếu field giữ bố cục và ID tài sản cũ; không tự migrate phòng đang chơi. Bàn 40 ô không đổi. Bảng P/H và thuê dùng chỉ số thành phố theo thứ tự đi trên layout tương ứng; snapshot thiếu boardLayout vẫn giữ thứ tự bàn gốc.

Hiệu ứng bàn cờ: phá huỷ/giáng cấp do thẻ dùng rung, sụp và mảnh vỡ; thanh lý hoặc thẻ Bán nhà dùng hiệu ứng thu nhỏ, tan dần và hạt tiền vàng. Đây chỉ là hiển thị, không trì hoãn giao dịch, thu tiền hay lượt tiếp theo. Mua lại hoặc tặng đất cùng cấp không phát hiệu ứng phá huỷ/bán.


### Sửa chọn Lễ hội và giá sau khi chuyển khu — 28/10/2026

Khi chọn nơi tổ chức, chỉ thành phố do chính người đang tới lượt sở hữu được sáng và bấm chọn; resort/đất người khác/đất chưa mua bị loại. Người xem không chọn hộ hoặc gửi xác nhận. Engine tiếp tục xác thực ownership và phase, UI kiểm tra thêm ID người gửi để không mở nhầm bảng thông tin hoặc giữ lựa chọn cũ.

Sửa cách ghép bảng trên `districts-v1`: hàng đầu của bảng P/H và thuê thuộc Huế, hàng hai Đà Nẵng, hàng ba Hội An, tiếp tục lần lượt theo chiều đi (chỉ đếm thành phố). Hà Nội và TP. Hồ Chí Minh vẫn là hai hàng cuối. Các bảng trong tài liệu ở trên đã cập nhật tên theo thứ tự mới. Mức thuê và công thức giá đã duyệt không đổi; chỉ sửa hàng được áp dụng cho mỗi vị trí. Bảng hiển thị, báo giá, tiền thuê thực trả, mua lại/thanh lý đều đọc cùng `boardFor`. Các phòng dùng layout cũ vẫn có thứ tự cũ; phòng districts-v1 nhận giá đã sửa, không đổi ID sở hữu.

### Bay về đất của mình — 28/10/2026

Máy bay được chọn ô chưa có chủ hoặc ô do chính người đang bay sở hữu (kể cả resort và nhà cấp 5). Đất đối thủ, ô rút thẻ, Thuế, Lễ hội và Đảo hoang bị chặn. Đến đất của mình không trả tiền thuê; nâng cấp theo điều kiện đáp ô hiện tại, rồi giữ quyền tung bình thường sau khi xử lý ô đến. Phí ₫50, tiền qua Xuất phát, vòng cá nhân và timeout bỏ bay/tung xúc xắc giữ nguyên. Vùng sáng và phím chọn trên UI dùng chung `flightTargets` với engine.


### Giao diện chọn ô — 28/10/2026

Máy bay, Lễ hội và thẻ chọn mục tiêu dùng cùng bảng gọn giữa bàn: nền kem, tiêu đề xanh dịu và nút cùng phong cách HUD khi có thể hủy/bỏ qua. Ảnh tham khảo chỉ định hướng bố cục/cách tương tác; màu sắc, cỡ chữ và tỷ lệ được tùy biến theo game. Các ô hợp lệ vẫn chọn trực tiếp trên bàn. Lễ hội tổ chức ngay khi bấm thành phố hợp lệ, không cần bấm Tổ chức lần nữa; nút Bỏ qua vẫn gửi SKIP_FESTIVAL. Thẻ tặng giữ lựa chọn người nhận trong bảng và áp dụng khi chọn đủ người nhận/ô theo bất kỳ thứ tự nào. Không tạo quyền hủy cho thẻ bắt buộc hoặc chuyến bay bắt buộc; server tiếp tục xác thực mục tiêu, phí và thời hạn hiện có.

Khi xúc xắc dừng, hiển thị một ô tổng số thay cho phép cộng hai viên; đổ đôi có thông báo riêng. Viền và huy hiệu tổng số đánh dấu đích đến ngay từ nhịp kết quả đến lúc quân đến nơi. Đích đọc từ movement khớp rollId/playerId, không tự cộng vị trí; lần tung ở đảo không di chuyển không đánh dấu lại đường cũ. Mount/reconnect không phát lại kết quả; đường đi do thẻ hoặc máy bay không dùng dấu đích xúc xắc. Cả bàn 2D và 2.5D dùng cùng dữ liệu hiển thị, không đổi camera, thời gian trình diễn hoặc luật tung.

### Thông báo chung khi đến Sân bay — 28/10/2026

Khi đáp Sân bay bằng xúc xắc, thẻ di chuyển hoặc chuyến bay, engine phát một sự kiện công khai gồm ID, người chơi và ô đến. Tất cả người trong phòng đều thấy thông báo có tên người vừa đến và điều kiện dùng Máy bay ở lượt kế tiếp (đủ phí ₫50). Thông báo xuất hiện sau khi quân đến nơi, tự đóng sau 2,4 giây, không cần xác nhận; server chừa nhịp đọc này trước khi chuyển lượt. Tổng xúc xắc, dấu ô đích, đổ đôi và thẻ vừa rút cũng hiển thị cho người xem, không chỉ người đang có lượt. Bảng chọn mục tiêu vẫn chỉ cho đúng actor thao tác. Snapshot lặp không phát lại thông báo và tải lại/reconnect không phát lại lịch sử cũ.

### Giới hạn ô đặc biệt khi bay — 28/10/2026

Không được dùng Máy bay để đáp ô Cơ hội/Quỹ Cộng đồng (rút thẻ), Thuế hoặc góc Lễ hội. Các ô này vẫn hoạt động bình thường khi đi bộ hoặc đến bằng thẻ di chuyển. Được bay tới đất/thành phố/resort chưa có chủ hoặc của mình; quyền tới Xuất phát/Sân bay, phí 50, lương/vòng qua GO, quyền tung sau bay và timeout không đổi. Bộ lọc dùng TileKind thay vì ID nên áp dụng đúng ở cả layout mới lẫn cũ.

### Thời gian ván — 28/10/2026

Phòng mới chọn 15, 30, 45 hoặc 60 phút, mặc định 60. Đồng hồ bắt đầu khi chủ phòng bắt đầu ván, không chạy trong phòng chờ. Tất cả ghế dùng cùng hạn kết thúc tuyệt đối do server lưu; tải lại, reconnect, đổi instance không đặt lại giờ. Phòng cũ thiếu cấu hình/mốc thời gian tiếp tục luật cũ.

Khi hết giờ, máy chủ kết thúc ngay trước thao tác kế tiếp, kể cả đang chọn mua, rút thẻ, thanh lý, chờ giao dịch hoặc bot. Đề nghị giao dịch chưa chấp nhận bị hủy; không áp dụng hành động đến muộn. Xếp hạng bằng tài sản ròng theo `netWorth` (tiền mặt cộng giá trị tài sản, trừ nợ đang có), dùng tiền mặt để phân hạng khi tài sản bằng nhau; bằng cả hai thì đồng hạng. Nợ hiện tại được giữ làm dữ liệu chốt bảng xếp hạng, không chạy tiếp thanh toán/di chuyển. Thắng độc quyền hoặc phá sản trước hạn vẫn kết thúc sớm và giữ nguyên lý do thắng.

### Thông báo hoàn thành nhóm — 29/10/2026

Khi mua, mua lại, nhận tặng, giao dịch hoặc chuyển quyền sở hữu làm một người vừa sở hữu đủ nhóm thành phố, cả bàn thấy chữ **MONOPOLY**, tên người chơi và nhóm vừa hoàn thành. Hiện trong 2,4 giây trước khi tiếp tục thao tác; timer và bot chừa cùng nhịp, server chặn lệnh đi tiếp trong khoảng này. Không cộng thêm thưởng tiền hoặc đổi hệ số thuê (trọn nhóm vẫn ×2). Nhóm đã có không báo lại khi xây/nâng nhà/tung; mất nhóm rồi giành lại sẽ báo lần mới. Nếu một giao dịch hoàn thành nhiều nhóm/người, hiển thị chung một thông báo. Thông báo hiện trước BXH nếu lần đó cũng đạt điều kiện thắng.

### Tốc độ bay — 29/10/2026

Di chuyển bằng Máy bay dùng nhịp 100 ms/ô, đồng bộ giữa renderer 2D/2.5D và thời gian chờ server. Vẫn đi hết đường qua Xuất phát để trình diễn; luật nhận lương, tính vòng và xử lý ô đích không đổi. Đi bộ bằng xúc xắc và di chuyển bằng thẻ giữ tốc độ riêng hiện tại.

Sau khi bay và xử lý xong ô đích, giữ lượt của người đang bay và chờ họ bấm tung xúc xắc; không tự tung ngay, kể cả khi tải lại snapshot cũ có cờ `automaticRoll`. Bot và xử lý hết giờ vẫn áp dụng như cũ. Nếu ô đích kết thúc lượt (như Sân bay), không cấp thêm lần tung.

### Thanh toán phần còn lại khi phá sản — 29/10/2026

Khi không đủ tài sản trả tiền thuê, chủ đất nhận toàn bộ tiền mặt còn lại và tiền thanh lý các ô của người mắc nợ theo đúng giá trị hiện tại. Chỉ phần thực có được chuyển, không bù phần nợ thiếu từ ngân hàng hoặc người khác; đất đã bán trở về ngân hàng. Bước này hoàn tất trước khi đánh dấu phá sản, xoá số dư/nợ và xét thắng. Ván dùng luật mua/xây `landing-v1` vẫn áp dụng bước thanh lý này nếu snapshot cũ thiếu cờ `liquidationRules`. Nhật ký ghi số tiền thực trả cho chủ nợ, gồm cả khoản trả một phần.

### Hiển thị tiền theo trình tự — 29/10/2026

HUD hiển thị riêng từng khoản cộng/trừ, không gộp tiền qua Xuất phát với tiền thuê/thuế thành một con số ròng. Khoản qua Xuất phát hiện khi quân cờ chạm ô Xuất phát trên đường đi; khoản thu/trả tại ô đích hiện sau khi đến nơi. Phí bay hiện trước khi bay. Khi thanh lý, lần lượt hiện tiền bán tài sản rồi tiền trả nợ; tiền chuyển giữa hai người được hiển thị đồng thời cho bên trả và bên nhận. Mỗi giao dịch có nhịp đọc ngắn trước khoản kế tiếp. Đây là trình diễn bất đồng bộ, server vẫn chốt số dư và xác thực thao tác ngay; không thay đổi giá, tiền lương hay tiền thuê.


### Tự rời và dọn phòng

Sau khi server công bố kết quả, kết nối realtime dừng ngay; bảng xếp hạng còn hiển thị 10 giây rồi tự về sảnh, hoặc người chơi bấm Về sảnh để rời sớm. Phòng đã kết thúc có thời hạn dọn cố định 2 phút, không kéo dài khi có heartbeat. Khi người cuối cùng chủ động rời khiến phòng chỉ còn bot, server xoá phòng ngay và dừng bot. Mất mạng/tắt tab không tự đổi ghế người thành bot.
