import { BOARD_32_PRICES } from './board32-prices';
/** Approved layout positions for the 32-tile design; scoped by boardId, never legacy IDs. */
export const MAP_VERSION = 'vietnam-32-board-layout-2';
export const COLORS = [
  '#a36e46',
  '#64b5c1',
  '#c781a5',
  '#e5a153',
  '#d66c57',
  '#e7c355',
  '#75a879',
  '#568da9',
];
export type MapTile = {
  name: string;
  kind: 'city' | 'tourism' | 'chance' | 'tax' | 'go' | 'island' | 'festival' | 'airport';
  model?: string;
  group?: number;
  landmark?: string;
  price?: number;
};
const city = (name: string, model: string, group: number, landmark: string): MapTile => ({
  name,
  model,
  group,
  landmark,
  kind: 'city',
});
// Seven non-corner tiles per row. Rows start after GO and follow travel clockwise.
// Current prices come from the shared P/H schedule; snapshot pricing is resolved by boardFor.
const layoutTiles: readonly MapTile[] = [
  { name: 'Xuất phát', kind: 'go' },
  city('Châu Đốc', 'temple', 0, 'Miếu Bà Chúa Xứ'),
  city('Cần Thơ', 'villa', 0, 'Nhà cổ Bình Thủy'),
  city('Sóc Trăng', 'khmer', 1, 'Chùa Khleang'),
  { name: 'Phú Quốc', kind: 'tourism', price: 200 },
  city('Bạc Liêu', 'hats', 1, 'Nhà hát Cao Văn Lầu'),
  city('Cà Mau', 'sail', 1, 'Biểu tượng Đất Mũi'),
  city('Buôn Ma Thuột', 'coffee', 2, 'Bảo tàng Thế giới Cà phê'),
  { name: 'Côn Đảo', kind: 'island' },
  city('Kon Tum', 'rong', 2, 'Nhà rông Kon Klor'),
  city('Quy Nhơn', 'cham', 3, 'Tháp Đôi'),
  city('Nha Trang', 'lotus', 3, 'Tháp Trầm Hương'),
  { name: 'Cơ hội', kind: 'chance' },
  city('Phan Thiết', 'water-tower', 3, 'Tháp nước Phan Thiết'),
  { name: 'Lăng Cô', kind: 'tourism', price: 200 },
  city('Huế', 'imperial', 4, 'Ngọ Môn'),
  { name: 'Lễ hội', kind: 'festival' },
  city('Đà Nẵng', 'dragon', 4, 'Cầu Rồng'),
  { name: 'Mỹ Khê', kind: 'tourism', price: 200 },
  city('Hội An', 'bridge', 4, 'Chùa Cầu'),
  { name: 'Cơ hội', kind: 'chance' },
  city('Vinh', 'gate', 5, 'Cổng thành cổ Vinh'),
  city('Đồng Hới', 'church', 5, 'Tháp chuông Tam Tòa'),
  city('Ninh Bình', 'pagoda', 6, 'Bảo tháp Bái Đính'),
  { name: 'Sân bay', kind: 'airport' },
  { name: 'Cô Tô', kind: 'tourism', price: 200 },
  city('Hạ Long', 'museum', 6, 'Bảo tàng Quảng Ninh'),
  city('Hải Phòng', 'theater', 6, 'Nhà hát lớn Hải Phòng'),
  { name: 'Cơ hội', kind: 'chance' },
  city('Hà Nội', 'turtle', 7, 'Tháp Rùa'),
  { name: 'Thuế', kind: 'tax', price: 200 },
  city('TP. Hồ Chí Minh', 'market', 7, 'Chợ Bến Thành'),
];

let cityNumber = 0;
export const MAP_TILES: readonly MapTile[] = layoutTiles.map((tile) =>
  tile.kind === 'city' ? { ...tile, price: BOARD_32_PRICES[cityNumber++].price } : tile,
);

/** Move complete districts into the 3–3 / 3–2 / 2–3 / 2–2 half-side slots.
 * Keep original city membership, landmarks and all special-square IDs; price follows travel order.
 */
const districtOrder = [4, 1, 3, 2, 0, 6, 5, 7];
const districtCities = districtOrder.map(group => MAP_TILES.filter(tile => tile.kind === 'city' && tile.group === group));
const districtOffsets = Array(8).fill(0);
let districtCityNumber = 0;
export const DISTRICT_MAP_TILES: readonly MapTile[] = MAP_TILES.map((tile, id) => {
  if (tile.kind !== 'city') return tile;
  const half = Math.floor(id / 8) * 2 + (id % 8 > 4 ? 1 : 0);
  const city = districtCities[half][districtOffsets[half]++];
  if (!city) throw new Error(`District does not fit half-side ${half}`);
  return {...city, price: BOARD_32_PRICES[districtCityNumber++].price};
});
export const mapTilesFor = (state: {boardLayout?: 'districts-v1'}): readonly MapTile[] =>
  state.boardLayout === 'districts-v1' ? DISTRICT_MAP_TILES : MAP_TILES;
