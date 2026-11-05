# Landmark Việt Nam

20 model GLB dựng trong Blender theo `docs/art/concepts/vietnam/v2/landmarks-simple-revised.png`.

- `manifest.json`: danh sách thành phố/công trình, revision, đường dẫn source, kích thước, số tam giác/vật liệu và SHA-256.
- `validation.json`: kiểm tra nhập lại GLB, dữ liệu geometry/normal/UV hữu hạn, footprint/ground và source Blender sạch.
- File `.blend` chỉnh sửa được và metadata từng model: `art-source/models/vietnam/`.
- Source dựng và hướng dẫn: `art-source/blender/README.md`.

Mười hai công trình đầu đã được đồng ý hướng hình ảnh qua các lần xem riêng. Tám công trình từ Hội An đến TP.HCM được hoàn thành cùng đợt theo yêu cầu ngày 28/10/2026, đã kiểm tra hình ảnh và kỹ thuật nhưng chưa được người dùng duyệt riêng từng cái.

Đã tải cả 20/20 GLB bằng Three.js trong phiên QA tạm, không có console warning/error. Server, trang xem và ảnh QA không nằm trong bộ tài sản này.

Bộ này chưa được ghép vào renderer/map, chưa có LOD hoặc collision và chưa đo hiệu năng trong ván chơi. Các GLB nằm ngoài `public`, không tự tăng tài sản tải xuống của deployment hiện tại. Không giữ ảnh render, gallery, viewer hoặc file preview trong bộ bàn giao.
