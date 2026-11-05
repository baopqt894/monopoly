# Nguồn Blender cho 20 landmark Việt Nam

Blender 5.2.3 LTS; giữ mesh, curve và modifier chỉnh sửa được trong `art-source/models/vietnam/`. GLB và catalog ở `assets/models/vietnam/`. Z up trong Blender, GLB xuất Y up; pivot nằm giữa footprint, chân đế ở Z=0. Chưa tích hợp vào map.

## Tái tạo

Chạy từ root bằng Blender Python (không cần cài bpy vào Python hệ thống):

```powershell
& D:/blender.exe --background --factory-startup --python-exit-code 1 --python art-source/blender/hue-v2/build.py
& D:/blender.exe --background --factory-startup --python-exit-code 1 --python art-source/blender/remaining.py
& D:/blender.exe --background --factory-startup --python-exit-code 1 --python art-source/blender/verify.py
```

- Các thư mục `*-v2/build.py` dựng 11 model đầu tương ứng; Buôn Ma Thuột dùng `buon-ma-thuot-v3/build.py`.
- `remaining.py` dựng tám model còn lại. Có thể chọn một ID sau `--`, ví dụ `-- hoi-an ha-noi`.
- `kit.py`: helper geometry/vật liệu, không tự tạo thư mục preview khi import.
- `pipeline.py`: chuẩn hóa footprint, lưu scene chỉ có model, áp modifier, gộp mesh, UV và xuất GLB. Mặc định không render.
- `verify.py`: kiểm tra đủ 20 GLB/source và cập nhật catalog/checksums. Chạy sau khi tái tạo model.

Chỉ khi QA cần ảnh, `remaining.py` nhận `--qa-dir` với thư mục ngoài các thư mục bàn giao model. Ảnh QA không được commit; repository không giữ gallery/viewer hoặc render preview. Không thay camera gameplay hoặc luật game trong bộ nguồn này.

## Tham chiếu và giới hạn

Ảnh concept là tài sản đã có trong dự án: `docs/art/concepts/vietnam/v2/landmarks-simple-revised.png`. Geometry được dựng trong Blender, không dùng ảnh concept làm billboard. Mặt khuất là phần thiết kế tiếp nối vì ảnh chỉ có một góc. Không coi render hoặc build thành công là chứng minh độ giống 1:1 hay hiệu năng trên map.
