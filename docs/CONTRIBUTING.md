# Làm việc song song và giảm conflict

## Chia phạm vi trước khi sửa

| Phạm vi                    | Thư mục chịu trách nhiệm                  | Phối hợp khi                  |
| -------------------------- | ----------------------------------------- | ----------------------------- |
| Luật và kinh tế            | `packages/game-engine`                    | Đổi state/action/semantics    |
| Bàn cờ, thẻ, sự kiện       | `packages/game-content`                   | Đổi IDs hoặc cấu trúc dữ liệu |
| Renderer 2.5D và mô hình   | `features/scene3d`                        | Cần field state mới           |
| Tài sản và giao dịch       | `features/properties`, `features/trading` | Đổi action hoặc API component |
| Lượt chơi và modal sự kiện | `features/game`                           | Đổi các phase                 |
| Online và lobby            | `features/multiplayer`, `apps/server`     | Đổi protocol và phân quyền    |
| Tích hợp                   | `src/app`, `styles`, root config          | Tích hợp các nhánh            |

Một người có thể phụ trách nhiều phạm vi; tránh hai nhánh cùng sửa một file tại một thời điểm. Đặt component/CSS mới trong đúng feature thay vì thêm hết vào App.

## Các file cần một người điều phối

- `packages/contracts/src/index.ts` và `multiplayer.ts`: thỏa thuận hợp đồng trước; merge thay đổi nền trước các nhánh sử dụng.
- Root `package.json`, workspace manifests và `package-lock.json`: chỉ một nhánh thêm dependency trong cùng đợt tích hợp. Dùng npm workspaces và một lockfile ở root, không tạo lockfile riêng cho feature.
- `apps/web/src/app/App.tsx`: người tích hợp nối các component. Người làm feature cung cấp API props rõ ràng.
- `styles/tokens.css`: thay đổi design system cần thống nhất, không sửa toàn cục chỉ để phục vụ một component.

## Quy trình gợi ý

1. Khi repo được khởi tạo, dùng một branch hoặc Git worktree riêng cho mỗi hạng mục. Không có nhiều người cùng thao tác trực tiếp trên một working tree.
2. Ghi phạm vi và API đầu ra trong mô tả công việc. Nếu cần đổi contract, báo người tích hợp trước khi triển khai phụ thuộc.
3. Giữ PR nhỏ, một mục đích; không reformat file ngoài phạm vi.
4. Chạy `npm test` và `npm run build` trước khi tích hợp. Luật mới phải có test cho tiền, tài sản, lượt, sự kiện hoặc edge case liên quan.
5. Rebase/merge nhánh nền rồi giải quyết conflict theo ý nghĩa của luật, không chỉ chọn toàn bộ “ours/theirs”. Chạy lại kiểm tra sau merge.
6. Đối với lockfile bị conflict, thống nhất manifest cuối cùng rồi chạy `npm install` từ root để tạo lại lockfile, không ghép thủ công các mục tùy ý.

## Định nghĩa hoàn thành

- Engine không phụ thuộc UI; component không lặp lại luật tính tiền.
- Giữ 40 ô và các vị trí Cơ hội/Quỹ Cộng đồng đúng kiểm thử.
- TypeScript và production build thành công.
- Test tương ứng luật mới thành công; kiểm tra ván cũ đang ở phase liên quan nếu có persistence.
- Thay đổi giao diện được xem trực tiếp trong trình duyệt, gồm màn hình nhỏ.
- Không đưa build output, node_modules, ảnh QA hoặc dữ liệu ván local vào commit.

Không có cấu trúc thư mục nào bảo đảm tuyệt đối không conflict. Ranh giới module, quyền sở hữu file và quy trình tích hợp mới là phần quyết định.
