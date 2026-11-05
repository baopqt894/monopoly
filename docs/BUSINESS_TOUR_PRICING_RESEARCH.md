# Đối chiếu kinh tế Business Tour — 28/10/2026

## Phạm vi và trạng thái

**Bảng thuê đang được audit lại theo yêu cầu người dùng, đặc biệt Tokyo và Osaka. Không coi bảng trước là dữ liệu chuẩn đã được xác minh của Business Tour hiện tại.** Bảng đã được đưa vào thay đổi local của `vietnam-32` trước khi có yêu cầu audit; chưa có bảng thay thế đủ bằng chứng và đợt audit này chưa sửa thêm số tiền trong engine/content. Bảng và ánh xạ cấp hiện có nằm trong [GAMEPLAY.md](GAMEPLAY.md#tiền-thuê-bàn-32-ô--cập-nhật-28102026). Đơn vị 1k của nguồn chuyển thành ₫1 trong game này.

Chưa tìm được nguồn đủ tin cậy cho bảng **giá mua đất trống + tổng giá mua mới ở từng cấp + phí nâng cấp + khách sạn** của cả 20 thành phố. Không suy giá mua từ tiền thuê. Không coi các ví dụ riêng lẻ là công thức chung hoặc lấy dữ liệu map tùy chỉnh làm dữ liệu map mặc định. Không áp dụng bảng phần trăm đã được gửi trước khi nghiên cứu vì chưa xác minh được.

## Nguồn trực tiếp đã kiểm tra

| Nguồn | Thời điểm dữ liệu | Nội dung dùng được | Giới hạn |
|---|---|---|---|
| [Strategy Guide for best win% — ilares](https://steamcommunity.com/sharedfiles/filedetails/?id=3071915108) | 04/11/2023 | Tác giả ghi mua 3 nhà Granada 210k, Tokyo 1000k; thuê tương ứng 75k và 600k. Resort mua 200k, một resort thu 25k, hai resort thu 50k/ô. | Không có bảng mua từng cấp đầy đủ trong phần đọc được. Tác giả nhắc bảng Excel nhưng không lấy được bảng đó. Là guide người chơi, không phải dữ liệu phát hành chính thức. |
| [Rent prices — Steam discussion](https://steamcommunity.com/app/397900/discussions/0/3557193237105034663/) | 2019–2020 | Developer chỉ cách xem thuê theo cấp; người chơi đăng bảng đã đối chiếu trong game; moderator xác nhận thuê khách sạn Tokyo đúng 1,1 triệu. | Chủ yếu là thuê, không có bảng giá xây. |
| [Ảnh ghi tay bảng thuê](https://imgur.com/FWvaZjA) | 03/05/2020 | Đã đọc ảnh bằng trình duyệt: đủ 20 thành phố, 5 cột thuê. | Chỉ ghi số nguyên k, có điểm cần đối chiếu như Beijing và chữ viết tay có thể gây nhầm. Người dùng đã yêu cầu audit lại; không bảo đảm khớp bản Business Tour hiện tại. |
| [in depth strategy guide (no gadgets) — cakemix](https://steamcommunity.com/sharedfiles/filedetails/?id=2909896451) | 30/12/2022 | Hai resort tổng đầu tư 400k thu 50k/ô; ba resort 600k thu 100k/ô. Mô tả giới hạn nhà theo vòng cá nhân. | Không có giá xây chi tiết từng thành phố. |
| [The absolute beginners guide! — Bash](https://steamcommunity.com/sharedfiles/filedetails/?id=1091085897) | 27/07/2017 | Mô tả nhà theo vòng, quay lại ô mới xây khách sạn, giá tăng theo chiều đi. | Không cung cấp bảng mua/nâng cấp. |
| [[ENG] HOW TO WIN? STARTER GUIDE — Manul](https://steamcommunity.com/sharedfiles/filedetails/?id=2510294679) | 2021–2022 | Mô tả phát triển tài sản và khách sạn. | Không đủ dữ liệu số để suy công thức giá. |
| [Buildings theme — developer reply](https://steamcommunity.com/app/397900/discussions/0/3729575504110417071/) | 31/12/2022 | Developer xác nhận Map Editor tạo bàn tùy chỉnh. | Không công bố giá mặc định. |
| [Rent Glitch — Steam discussion](https://steamcommunity.com/app/397900/discussions/0/3951406749564973803/) | 11/2023 | Có báo cáo sửa giá thuê trong map tự tạo và lỗi giá. | Không dùng ảnh từ map đó để xác định bảng giá mặc định. |
| [Lịch sử phiên bản chính thức trên App Store](https://apps.apple.com/ca/app/business-tour/id1468486788) | 2.19.7, 01/08/2024 | Ghi đã sửa lỗi giá thuê/mua lại trên map tiêu chuẩn; sửa lỗi giá mua lại giảm 10 lần khi lưu Map Editor. | Cho thấy cần xác định phiên bản; không phải chứng cứ về một bảng giá mới cụ thể hoặc công thức xây. |
| [Video gameplay MISTHY PLAY](https://www.youtube.com/watch?v=RKqW4h-oXH0) | 2021 | Đã kiểm tra một số đoạn đầu ván và khoảng 03:15, 04:42–04:52. | Video có cắt cảnh/zoom và che giao diện; các khung đã xem không đủ thông tin xác định giá mua/xây. Không trích số tiền chưa đọc được. |

## Kết luận về giá mua

- Ví dụ mua 3 nhà được guide ghi nhận: Granada 210k, Tokyo 1000k. Đây không phải bằng chứng về chi phí nâng riêng từng bước.
- Đã xác minh một số giá mua đất và mua kèm nhà từ video (xem cập nhật dưới đây); chưa có bảng đủ các cấp của toàn bộ thành phố hoặc phí nâng khách sạn.
- Bảng trước ghi Tokyo 3 nhà 1400k mâu thuẫn ví dụ 1000k của guide. Không tự kết luận guide hoặc bảng nào phản ánh mọi phiên bản.
- Phần còn thiếu cần ảnh/video đọc rõ màn hình mua/nâng từng thành phố trên map mặc định, kèm cấp hiện có, tiền trước/sau và phiên bản. Ảnh chỉ thấy tiền thuê trên bàn không chứng minh giá mua.

## Phạm vi tìm kiếm

Đã tìm guide/thảo luận Steam theo tên game và app 397900, từ khóa giá mua/xây/khách sạn, truy vấn tiếng Anh/tiếng Nga, kết quả cộng đồng Reddit, kết quả video Google/YouTube, và lịch sử cập nhật chính thức. Tìm kiếm mở có nhiều kết quả nhầm với du lịch/bất động sản thật; đã loại các kết quả đó. Việc rà soát này không có nghĩa mọi trang web/video trên Internet đã được kiểm tra, cũng không chứng minh một bảng đầy đủ không tồn tại. Một số trang Steam không truy cập được qua trình duyệt/curl; phần văn bản đã đọc được bằng công cụ web. Không tải/chạy game hoặc đăng bài hỏi người khác trong quá trình nghiên cứu.

## Cập nhật: đọc trực tiếp bảng mua từ gameplay

Đây là số **đọc trên nút BUY FOR / ADQUIRIR POR**, không phải giá thuê trên mặt bàn. Những ô không có dữ liệu không được suy điền. Tổng mua kèm nhà đã gồm đất; không cộng giá đất thêm lần nữa.

| Thành phố | Chỉ đất | Đất + 2 nhà | Đất + 3 nhà | Mốc video |
|---|---:|---:|---:|---|
| Madrid | 60.000 | Chưa đọc | 210.000 | [02:11–02:13, FullThrough, 2020](https://www.youtube.com/watch?v=hk0v9UGkVWg&t=131s) |
| Lyon | 300.000 | 700.000 | Chưa đọc | [02:17–02:19, Piotreks, 2024](https://www.youtube.com/watch?v=sSdk6yiiDQI&t=137s) |
| Sydney | 240.000 | Chưa đọc | 690.000 | [04:57–04:59, Piotreks, 2024](https://www.youtube.com/watch?v=sSdk6yiiDQI&t=297s) |
| Beijing | 100.000 | Chưa đọc | 250.000 | [08:24–08:27, Piotreks, 2024](https://www.youtube.com/watch?v=sSdk6yiiDQI&t=504s) |

Nguồn thứ nhất: [Business Tour Gameplay HD (PC) | NO COMMENTARY — FullThrough](https://www.youtube.com/watch?v=hk0v9UGkVWg), đăng 30/09/2020. UI tiếng Tây Ban Nha: Terreno, Casa 1/2/3. Madrid lúc chỉ chọn đất ghi thuê 4.000, mua 60.000, mua lại 120.000; sau chọn đủ ba nhà ghi thuê 90.000, mua 210.000, mua lại 420.000.

Nguồn thứ hai: [Business tour #101 no commentary gameplay — Piotreks](https://www.youtube.com/watch?v=sSdk6yiiDQI), đăng 23/09/2024. Footer trong video ghi **2.19.7 7F0624AF7C**. Lyon lúc chọn Land ghi thuê 26.000, mua 300.000; chọn House 2 thì Land/House 1/House 2 đều tích, thuê 340.000, mua 700.000, mua lại 1.400.000. Sau giao dịch, số dư 1.800.000 giảm còn 1.100.000. Sydney chọn Land: thuê 20.000, mua 240.000; chọn House 3: thuê 360.000, mua 690.000. Beijing chọn Land: thuê 6.000, mua 100.000; chọn House 3: thuê 105.000, mua 250.000.

### Những gì có thể và chưa thể kết luận

- Phần xây trong các gói được nhìn thấy: Madrid 3 nhà = 150.000; Beijing 3 nhà = 150.000; Sydney 3 nhà = 450.000; Lyon 2 nhà = 400.000 (lấy tổng trên nút mua trừ giá đất được quan sát riêng).
- Nếu phí mỗi nhà bằng nhau trong cùng thành phố, các ví dụ này tương ứng 50.000/nhà ở Madrid và Beijing, 150.000/nhà ở Sydney, 200.000/nhà ở Lyon. Đây mới là **suy luận từ gói nhiều nhà**, chưa có khung chỉ chọn một nhà để xác nhận từng bước.
- Không có căn cứ dùng công thức cố định “giá nhà = phần trăm giá đất” từ bảng được gửi ban đầu: riêng Sydney đất + 3 nhà quan sát được là 690.000, không phải 700.000; giá đất cũng là 240.000 thay vì 200.000 trong bảng cũ.
- Trong những đoạn đã đọc, chưa xác minh phí nâng tài sản có sẵn hoặc khách sạn; không đồng nhất phần xây trong gói mua mới với giá nâng riêng khi quay lại ô.
- Chưa sửa giá mua/xây trong code. Đây là dữ liệu lịch sử từ hai video, chưa phải bộ dữ liệu đầy đủ hoặc xác minh trên bản phát hành hiện tại.

## Audit lại toàn bộ tiền thuê: trạng thái bằng chứng

Người dùng phản hồi bảng có thể sai ở Tokyo/Osaka và yêu cầu kiểm tra cả bảng. Phạm vi cần kiểm chứng là **20 thành phố × 5 mức = 100 giá thuê gốc**. Bảng dưới chỉ đánh dấu bằng chứng thực sự đọc được, không nội suy các ô còn thiếu. Các số là tiền trong Business Tour, chưa quy đổi sang game của dự án.

| Thành phố | Đã đọc trực tiếp Rent rate trong popup gameplay | Các mức chưa được xác minh bằng popup |
|---|---|---|
| Granada | Chưa có | Cả 5 mức |
| Seville | Chưa có | Cả 5 mức |
| Madrid | Đất trống 4.000; 3 nhà 90.000 | 1 nhà, 2 nhà, khách sạn |
| Hong Kong | Chưa có | Cả 5 mức |
| Beijing | Đất trống 6.000; 3 nhà 105.000 | 1 nhà, 2 nhà, khách sạn |
| Shanghai | Chưa có | Cả 5 mức |
| Venice | Chưa có | Cả 5 mức |
| Milan | Chưa có | Cả 5 mức |
| Rome | Chưa có | Cả 5 mức |
| Hamburg | Chưa có | Cả 5 mức |
| Berlin | Chưa có | Cả 5 mức |
| London | Chưa có | Cả 5 mức |
| Sydney | Đất trống 20.000; 3 nhà 360.000 | 1 nhà, 2 nhà, khách sạn |
| Chicago | Chưa có | Cả 5 mức |
| Las Vegas | Chưa có | Cả 5 mức |
| New York | Chưa có | Cả 5 mức |
| Lyon | Đất trống 26.000; 2 nhà 340.000 | 1 nhà, 3 nhà, khách sạn |
| Paris | Chưa có | Cả 5 mức |
| Osaka | Đất trống 35.000; 2 nhà 380.000 | 1 nhà, 3 nhà, khách sạn |
| Tokyo | Đất trống 50.000; 2 nhà 400.000 | 1 nhà, 3 nhà, khách sạn |

### Tokyo và Osaka: bằng chứng mới

Nguồn: [BUSINESS TOUR | Tầm nhìn đầu tư tại TOKYO và cái kết!!! — KiwinGaming](https://www.youtube.com/watch?v=H02o78TWyVA). Footer đọc được phiên bản **2.18.2**, vì vậy đây là chứng cứ lịch sử, không phải xác nhận bản phát hành hiện tại.

- [Khoảng 01:25–01:26](https://www.youtube.com/watch?v=H02o78TWyVA&t=85s): popup có tiêu đề Tokyo. Chỉ Land được tích: Rent rate **50.000**. Khi Land, House 1 và House 2 được tích: Rent rate **400.000**; tổng mua **800.000**, mua lại **1.600.000**. House 3 đang khóa ở vòng đầu.
- [Khoảng 03:53–03:54](https://www.youtube.com/watch?v=H02o78TWyVA&t=233s): popup có tiêu đề Osaka. Chỉ Land được tích: Rent rate **35.000**. Khi Land, House 1 và House 2 được tích: Rent rate **380.000**; tổng mua **750.000**, mua lại **1.500.000**.
- Trên mặt bàn sau mua có Tokyo **800K**, Osaka **760K**. Các số trên mặt bàn khác số Rent rate trong popup; không dùng chúng để thay thế giá thuê gốc khi chưa tách rõ hệ số của ô/nhóm/lễ hội.
- Guide ilares năm 2023 ghi Tokyo 3 nhà thuê **600.000**. Moderator trong thảo luận Steam ngày 03/05/2020 xác nhận khách sạn Tokyo **1.100.000**. Hai thông tin bổ sung này chưa được đối chiếu bằng popup khách sạn trong gameplay mới.

### Những điểm chưa được phép kết luận

1. **Chưa chứng minh được giá Tokyo/Osaka sai ở mức cụ thể nào.** Bốn giá trong popup vừa đọc khớp bảng cũ; các mức còn lại chưa đủ chứng cứ để xác nhận hoặc bác bỏ.
2. Beijing 2 nhà **75.000** là điểm cần kiểm tra lại: bảng ghi tay ghi 1 nhà 35k và 3 nhà 105k. Quan hệ này bất nhất nếu giả định tăng tuyến tính, nhưng giả định đó chưa phải chứng cứ. **Không tự đổi thành 70.000.**
3. Các giá nguyên k như Seville 28/83, Hong Kong 33/98, London 113/338/619, Chicago 128/383, New York 143/428 và một số giá khách sạn cần kiểm tra độ chính xác. Chưa xác minh được đó là số chính xác, số UI rút gọn hay số người ghi tự làm tròn. **Không tự suy các giá lẻ 500/750 từ quy luật toán học.**
4. Đã rà nguồn gốc của toàn bảng, nhưng chỉ có **12/100 ô giá** được đọc trực tiếp từ popup trong các video nêu trên. Chưa hoàn thành xác minh toàn bộ 100 ô giá, và chưa có bảng đầy đủ đủ tin cậy để công bố là giá hiện hành.
5. Đã xem thêm gameplay [MixiGaming #15](https://www.youtube.com/watch?v=159qv1vKLIo), footer **2.20.1**. Những đoạn đã kiểm tra chủ yếu chỉ thấy số rút gọn trên mặt bàn, không đủ thành phố/cấp/hệ số để xác nhận các ô giá còn thiếu. Không lấy ngày đăng mới thay cho bằng chứng số tiền.

Đợt audit này chỉ cập nhật ghi chú nghiên cứu, không đổi scene, không thay tiếp bảng giá trong code và không đụng production. Bảng local đã thêm trước đó vẫn cần được giải quyết sau khi có số thay thế được xác minh.


## Bảng được chọn cho dự án sau yêu cầu thay toàn bộ P/H

Ngày 28/10/2026, người dùng yêu cầu thay P/H, thay cho việc chỉ đổi phí khách sạn. `board32-prices.ts` chứa bảng áp dụng cho dự án: sáu gói mua kiểm tra trực tiếp từ gameplay được khớp đúng tổng; H suy ra theo mô hình cộng đều; 14 thành phố còn lại theo thang giá suy ra. Không đánh dấu các dòng suy ra là số đã xác minh trực tiếp hoặc giá Business Tour hiện hành. Xem bảng đầy đủ trong GAMEPLAY.md. Khách sạn 3H là lựa chọn thiết kế của dự án, không phải kết luận nghiên cứu về Business Tour. Thuê giữ nguyên theo yêu cầu.
