import { VIETNAM_CITIES } from './vietnam';
import type { BoardTile, ColorGroup } from '@typhu/contracts';

export const GROUPS: Record<ColorGroup, { name: string; color: string }> = {
  brown: { name: 'Miền Tây', color: '#9a6b4c' },
  sky: { name: 'Đất phương Nam', color: '#8fc4d6' },
  pink: { name: 'Biển đảo', color: '#d58aa7' },
  orange: { name: 'Tây Nguyên', color: '#e6a257' },
  red: { name: 'Duyên hải', color: '#d36a5c' },
  yellow: { name: 'Miền Trung', color: '#ddc65e' },
  green: { name: 'Bắc Bộ', color: '#72a58b' },
  blue: { name: 'Hai thành phố', color: '#618ab4' },
};

// Clockwise, beginning at GO in the bottom-right corner. IDs are stable contracts.
const baseBoard: readonly BoardTile[] = [
  { id: 0, name: 'Xuất phát', subtitle: 'Nhận tiền qua vạch', kind: 'go' },
  { id: 1, name: 'Hàng Chiếu', kind: 'street', group: 'brown', price: 60, rents: [2, 10, 30, 90, 160, 250], buildCost: 50 },
  { id: 2, name: 'Quỹ cộng đồng', kind: 'chest' },
  { id: 3, name: 'Hàng Mã', kind: 'street', group: 'brown', price: 60, rents: [4, 20, 60, 180, 320, 450], buildCost: 50 },
  { id: 4, name: 'Thuế thu nhập', kind: 'tax', tax: 200 },
  { id: 5, name: 'Ga Hà Nội', kind: 'railroad', price: 200 },
  { id: 6, name: 'Trúc Bạch', kind: 'street', group: 'sky', price: 100, rents: [6, 30, 90, 270, 400, 550], buildCost: 50 },
  { id: 7, name: 'Cơ hội', kind: 'chance' },
  { id: 8, name: 'Hồ Tây', kind: 'street', group: 'sky', price: 100, rents: [6, 30, 90, 270, 400, 550], buildCost: 50 },
  { id: 9, name: 'Thanh Niên', kind: 'street', group: 'sky', price: 120, rents: [8, 40, 100, 300, 450, 600], buildCost: 50 },
  { id: 10, name: 'Đảo hoang', subtitle: 'Chỉ ghé thăm', kind: 'jail' },
  { id: 11, name: 'Tràng Tiền', kind: 'street', group: 'pink', price: 140, rents: [10, 50, 150, 450, 625, 750], buildCost: 100 },
  { id: 12, name: 'Công ty điện', kind: 'utility', price: 150 },
  { id: 13, name: 'Nhà Hát Lớn', kind: 'street', group: 'pink', price: 140, rents: [10, 50, 150, 450, 625, 750], buildCost: 100 },
  { id: 14, name: 'Phan Chu Trinh', kind: 'street', group: 'pink', price: 160, rents: [12, 60, 180, 500, 700, 900], buildCost: 100 },
  { id: 15, name: 'Ga Huế', kind: 'railroad', price: 200 },
  { id: 16, name: 'Chợ Đồng Xuân', kind: 'street', group: 'orange', price: 180, rents: [14, 70, 200, 550, 750, 950], buildCost: 100 },
  { id: 17, name: 'Quỹ cộng đồng', kind: 'chest' },
  { id: 18, name: 'Chợ Bến Thành', kind: 'street', group: 'orange', price: 180, rents: [14, 70, 200, 550, 750, 950], buildCost: 100 },
  { id: 19, name: 'Chợ Hội An', kind: 'street', group: 'orange', price: 200, rents: [16, 80, 220, 600, 800, 1000], buildCost: 100 },
  { id: 20, name: 'Bãi đỗ xe', subtitle: 'Nghỉ chân', kind: 'parking' },
  { id: 21, name: 'Lê Lợi', kind: 'street', group: 'red', price: 220, rents: [18, 90, 250, 700, 875, 1050], buildCost: 150 },
  { id: 22, name: 'Cơ hội', kind: 'chance' },
  { id: 23, name: 'Nguyễn Huệ', kind: 'street', group: 'red', price: 220, rents: [18, 90, 250, 700, 875, 1050], buildCost: 150 },
  { id: 24, name: 'Đồng Khởi', kind: 'street', group: 'red', price: 240, rents: [20, 100, 300, 750, 925, 1100], buildCost: 150 },
  { id: 25, name: 'Ga Đà Nẵng', kind: 'railroad', price: 200 },
  { id: 26, name: 'Làng Đại Học', kind: 'street', group: 'yellow', price: 260, rents: [22, 110, 330, 800, 975, 1150], buildCost: 150 },
  { id: 27, name: 'Bách Khoa', kind: 'street', group: 'yellow', price: 260, rents: [22, 110, 330, 800, 975, 1150], buildCost: 150 },
  { id: 28, name: 'Công ty nước', kind: 'utility', price: 150 },
  { id: 29, name: 'Văn Miếu', kind: 'street', group: 'yellow', price: 280, rents: [24, 120, 360, 850, 1025, 1200], buildCost: 150 },
  { id: 30, name: 'Máy bay', subtitle: 'Bay đến ô bất kỳ ở lượt sau', kind: 'airport' },
  { id: 31, name: 'Bến Bạch Đằng', kind: 'street', group: 'green', price: 300, rents: [26, 130, 390, 900, 1100, 1275], buildCost: 200 },
  { id: 32, name: 'Thảo Điền', kind: 'street', group: 'green', price: 300, rents: [26, 130, 390, 900, 1100, 1275], buildCost: 200 },
  { id: 33, name: 'Quỹ cộng đồng', kind: 'chest' },
  { id: 34, name: 'Phú Mỹ Hưng', kind: 'street', group: 'green', price: 320, rents: [28, 150, 450, 1000, 1200, 1400], buildCost: 200 },
  { id: 35, name: 'Ga Sài Gòn', kind: 'railroad', price: 200 },
  { id: 36, name: 'Cơ hội', kind: 'chance' },
  { id: 37, name: 'Đại Lộ Hòa Bình', kind: 'street', group: 'blue', price: 350, rents: [35, 175, 500, 1100, 1300, 1500], buildCost: 200 },
  { id: 38, name: 'Thuế xa xỉ', kind: 'tax', tax: 100 },
  { id: 39, name: 'Đại Lộ Thịnh Vượng', kind: 'street', group: 'blue', price: 400, rents: [50, 200, 600, 1400, 1700, 2000], buildCost: 200 },
];

export const BOARD: readonly BoardTile[] = baseBoard.map(tile => VIETNAM_CITIES[tile.id] ? {...tile, name: VIETNAM_CITIES[tile.id].name} : tile);
