# Bộ thẻ hoạt hình v1

Hướng minh họa được duyệt ngày 01/11/2026: hoạt hình 2D nét viền xanh đậm, nhân vật biểu cảm, màu xanh trời/xanh ngọc/cam san hô/vàng. Mẫu duyệt nằm ở `concepts/cards/cartoon-v1-approved.png`.

- 23 thẻ Cơ hội và 16 thẻ Quỹ cộng đồng, mỗi ID có một minh họa riêng.
- Ảnh không chứa tên thẻ hoặc luật; `CardArtwork` dựng chữ từ `getCard`, giữ nguyên nội dung theo từng bàn cờ.
- Header xanh cho Cơ hội, san hô cho Quỹ cộng đồng. Hai mặt sau dựng SVG riêng, không tải ảnh raster.
- Ảnh luôn giữ đủ tỷ lệ bằng `meet`, tách khỏi vùng chữ. Không dùng mặt thẻ chứa chữ được sinh sẵn hoặc cắt ảnh từ contact sheet.
- Ảnh được tạo bằng công cụ image_gen tích hợp. Manifest `cards-cartoon-v1.json` lưu prompt chung, brief riêng, tên nguồn và SHA-256; PNG gốc được giữ trong bộ nguồn của công cụ.
- WebP runtime nằm trong `public/assets/cards/cartoon-v1`, kích thước 512×512; ngân sách cả 39 ảnh dưới 2,5 MB.

Tạo lại WebP từ thư mục PNG nguồn đã ghi trong manifest:

```powershell
node scripts/build-card-art.mjs <source-png-directory>
```

Xuất bộ xem HTML độc lập chứa cả 39 thẻ, hai mặt sau và biến thể đích Lễ hội:

```powershell
node --import tsx scripts/export-card-review.tsx
```

HTML mặc định nằm ở `artifacts/cards-cartoon-v1/all-cards.html`; hỗ trợ `?sheet=1` đến `?sheet=7` và `?overview` để chụp ảnh rà soát. Các ảnh WebP được nhúng trong HTML, không phụ thuộc máy chủ game.
