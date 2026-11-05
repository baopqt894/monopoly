# Dọn preview — 28/10/2026

## Thay đổi

- Tách renderer 32 ô và test theo nó vào `apps/web/src/features/scene3d/board32/`: BoardTiles, BoardCenter, HouseModel, model/material, texture paint và bố cục. Gameplay không còn import feature preview.
- Bỏ 7 route preview cùng component, CSS, geometry chỉ phục vụ preview; thumbnail landmark không còn consumer cũng được bỏ.
- Chuyển atlas 4 góc sang `public/assets/board/corners-go-arrow.png`, SHA-256 khớp chính xác file trước khi chuyển. Giữ hai ảnh mẫu hiện hành cho việc chỉnh nhà/landmark và prompt/provenance còn liên quan.
- Giữ nguyên ảnh thẻ PNG/WebP, nền, nhân vật, nguồn Blender và GLB. Không sửa luật, dữ liệu bàn cờ hoặc giá tiền trong lần dọn này.
- Ảnh QA ignored và build Vite cũ được chuyển ra `/tmp/monopoly-preview-cleanup-20261028` để không mất ngay dữ liệu local. Các file tracked đã bỏ vẫn khôi phục được từ Git.

Đã bỏ 111 file chỉ dùng cho preview/concept cũ, khoảng 94.93 MiB; không tính các module runtime được di chuyển.

## Kiểm tra

- `npm test`: 251 đạt, 3 MongoDB integration test bỏ qua do môi trường local.
- `node --import tsx --test apps/web/src/features/scene3d/board32/*.test.ts apps/web/tests/card-art-assets.test.ts`: 12 đạt, gồm footprint, nhà/landmark, ownership theo cấp và tọa độ quân/bay.
- HTTP QA: `/` và atlas góc trả 200; cả 7 route preview trả 404.
- `npm run build`: đạt; route manifest chỉ còn `/`, not-found, API phòng/events và health.
- Browser trên production build QA local cổng 3025 với MemoryRoomStore riêng: tạo/join/start 2 client; di chuyển; mua Cà Mau cấp 1 và nâng cấp 3; hai client hiển thị nhà, viền màu chủ, tiền và ô góc đúng; không ghi nhận console error ở client đã kiểm tra. Không thay kích thước cửa sổ hay zoom.

Không coi QA local là kiểm chứng MongoDB/production. Không deploy, commit hoặc push trong bước này.
