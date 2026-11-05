# Bộ thẻ Cơ hội — bàn 32 ô

Ván mới có **23 thẻ**, xáo đầu ván và quay vòng sau sử dụng. Thẻ thoát đảo được giữ khỏi queue tới khi dùng. Phòng cũ giữ số lượng/thứ tự đang lưu; không tự chèn thêm thẻ vào giữa ván. Giữ ID 01–20, bổ sung 21–23.

| ID | Thẻ | Hiệu ứng |
| --- | --- | --- |
| 01 | Khởi đầu mới | Tiến đến Xuất phát |
| 02 | Thành phố chờ bạn | Đến TP. Hồ Chí Minh |
| 03 | Hẹn tại trung tâm | Đến Đà Nẵng |
| 04 | Một tối nghệ thuật | Đến Huế |
| 05 | Chuyến tàu bất ngờ | Đến resort gần nhất; nếu có chủ trả thuê gấp đôi |
| 06 | Đến quảng trường Lễ hội | Đến ô Lễ hội góc bàn, chọn thành phố của mình để tổ chức |
| 07 | Chuyến bay sắp tới | Đến Sân bay, lấy vé cho lượt chính sau; chưa thu phí bay |
| 08 | Cổ tức đầu tư | Nhận 50 |
| 09 | Thẻ thoát đảo | Giữ lại, thoát đảo miễn phí khi dùng |
| 10 | Lùi lại một chút | Lùi 3 ô và xử lý ô đến; không nhận tiền/cộng vòng khi lùi qua Xuất phát |
| 11 | Lạc ra đảo | Đi thẳng ra đảo, không nhận tiền/cộng vòng |
| 12 | Bảo trì công trình | Trả 25 mỗi cấp nhà lv1–4, 100 mỗi công trình cấp 5 |
| 13 | Phí giao thông | Trả 15 |
| 14 | Về ga đầu tiên | Đến Phú Quốc trên bàn 32 |
| 15 | Chủ trì hội đồng | Trả 50 cho mỗi đối thủ chưa phá sản |
| 16 | Khoản đầu tư đáo hạn | Nhận 150 |
| 17 | Động đất | Chọn thành phố đối thủ lv1–4, xóa cả đất và công trình, không hoàn tiền |
| 18 | Hỏa hoạn | Chọn thành phố đối thủ lv1–4, hạ 1 cấp |
| 19 | Buộc bán nhà | Chọn thành phố đối thủ chưa có công trình cấp 5, trả ô về ngân hàng, hoàn toàn bộ giá trị hiện có |
| 20 | Cúp điện | Thành phố đối thủ ngừng thu đến khi chủ hiện tại qua Xuất phát thêm 3 lần; được nhắm cấp 5 |
| 21 | Hẹn ở Lễ hội | Đến đúng thành phố đang tổ chức Lễ hội duy nhất; chưa có nơi tổ chức thì tiêu thụ mà không di chuyển |
| 22 | Đến cơ quan thuế | Đến ô Thuế tiếp theo theo chiều đi và đóng thuế theo luật |
| 23 | Quà tặng bất động sản | Chọn đúng một tài sản của mình và một người khác chưa phá sản; chuyển nguyên ô/cấp/cúp điện, không trao tiền |

Thẻ di chuyển tiến qua/đến Xuất phát nhận đủ tiền theo cấu hình và cộng vòng cá nhân. Ô đến xử lý bình thường (mua/thuê/thẻ/thuế/đảo/Lễ hội/Sân bay); thẻ 7 chưa phải thao tác FLY nên không thu phí 50 tại lúc dùng thẻ. Tặng được resort hoặc cấp 5; chỉ 4 thẻ tác động đối thủ 17–20 giới hạn ở thành phố và chỉ Cúp điện nhắm được cấp 5. Không tặng khi đang nợ; tặng có thể làm người nhận thắng tức thì.

Mục tiêu sai/thiếu khi có lựa chọn bị từ chối trước khi tiêu thụ thẻ; không có mục tiêu hợp lệ thì tiêu thụ không gây tác động. Bot tặng ô rẻ nhất cho người có tài sản ròng thấp nhất; timeout chọn ngẫu nhiên có seed. Thẻ tác động đối thủ giữ cách bot ưu tiên chủ giàu nhất và tài sản giá trị nhất; timeout chọn ngẫu nhiên. Người nhận không cần chấp thuận vì đây là thẻ tặng, không phải giao dịch mua bán.

**Ô sự kiện** là các ô ngẫu nhiên x1,5 được cấu hình trước ván; **Lễ hội** là một địa điểm do người đến ô góc chọn, thưởng thêm 25% hoặc 50% mỗi lần tổ chức trên bộ đếm chung, theo cấu hình phòng (mặc định 50%). Hai cơ chế độc lập. Chi tiết công thức, chuyển nơi và API: [GAMEPLAY.md](GAMEPLAY.md).
