# Hướng dẫn làm việc trong dự án

- Đọc `docs/ARCHITECTURE.md` và `docs/CONTRIBUTING.md` trước khi thay đổi kiến trúc hoặc làm song song.
- Giữ bàn cờ 40 ô; không đổi ID các ô hoặc vị trí hai bộ thẻ. Thay đổi luật cần cập nhật test và `docs/GAMEPLAY.md`.
- Camera mặc định là 2.5D trực giao cố định. Không thêm xoay, zoom hoặc camera tự chạy nếu người dùng chưa yêu cầu.
- Luật trong `packages/game-engine`, dữ liệu trong `packages/game-content`, contracts không phụ thuộc UI. Không tính tiền hoặc sửa game state trong component.
- Feature giữ component và CSS cạnh nhau. Tránh dồn thay đổi vào App hoặc global CSS.
- Root manifest, lockfile, contracts và App là file tích hợp; điều phối một người sửa tại một thời điểm.
- Dùng npm từ root; không tạo lockfile riêng. Chạy `npm test` và `npm run build` trước khi bàn giao.
- Kiểm tra trực tiếp giao diện sau thay đổi renderer. Không coi build thành công là bằng chứng hình ảnh đúng.
- Không commit hoặc push nếu người dùng chưa yêu cầu.
- Gameplay phải là fullview board game: HUD avatar/tiền ở góc, controls nổi giữa bàn. Không đưa header/nav/card dashboard trở lại. Đặt tên và lobby là scene riêng.
- Online dùng server authoritative; client không quyết định dice hoặc tự chấp nhận giao dịch thay đối tác. Protocol nằm riêng khỏi renderer.
- Đổi server hoặc engine trong dev có thể restart server và mất phòng RAM; chú ý các phiên thử đang chạy.
- Hướng hình ảnh hiện tại: game du lịch tươi sáng, HUD đơn giản dễ nhìn; tránh phong cách premium tối. Nền chỉ có gradient và vài chi tiết nhỏ ở rìa, không dùng cảnh nhiều chi tiết gây phân tâm.
- Không tự thêm các dòng chữ nhỏ hướng dẫn thao tác/phím tắt hoặc chú thích phụ vào giao diện game. Chỉ thêm khi người dùng yêu cầu rõ ràng.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
