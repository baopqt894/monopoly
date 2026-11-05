import type { BoardTile, ColorGroup, GameState } from '@typhu/contracts';
import { BOARD, GROUPS } from './board';
import { MAP_TILES, DISTRICT_MAP_TILES, COLORS } from './board32-layout';
import { BOARD_32_RENT_REFERENCE } from './board32-rents';
import { BOARD_32_PRICES, LEGACY_32_PRICES } from './board32-prices';

const groups: ColorGroup[] = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue'];
function buildBoard(layout: readonly (typeof MAP_TILES)[number][], legacyPrices = false): readonly BoardTile[] {
  let cityIndex = 0;
  return layout.map((tile, id) => {
    if (tile.kind === 'city') {
      // The approved economic ladder follows city travel order, skipping special squares.
      const index = cityIndex++;
      const pricing = BOARD_32_PRICES[index];
      const price = legacyPrices ? LEGACY_32_PRICES[index] : pricing.price;
      const houseCost = legacyPrices ? BOARD.find(entry => entry.kind === 'street' && entry.price === price)!.buildCost : pricing.houseCost;
      const reference = BOARD_32_RENT_REFERENCE[index].rents;
      return {id, name:tile.name, kind:'street', group:groups[tile.group!], price, rents:[reference[0], ...reference], buildCost:houseCost};
    }
    if (tile.kind === 'tourism') return {id, name:tile.name, kind:'railroad', price:tile.price, resort:true};
    if (tile.kind === 'island') return {id, name:tile.name, kind:'jail'};
    if (tile.kind === 'festival') return {id, name:tile.name, kind:'parking'};
    if (tile.kind === 'tax') return {id, name:tile.name, kind:'tax', tax:tile.price};
    return {id, name:tile.name, kind:tile.kind};
  });
}
/** Existing board exports preserve original positions for old callers/snapshots. */
export const BOARD_32 = buildBoard(MAP_TILES);
const LEGACY_BOARD_32 = buildBoard(MAP_TILES, true);
export const DISTRICT_BOARD_32 = buildBoard(DISTRICT_MAP_TILES);
const LEGACY_PRICE_DISTRICT_BOARD_32 = buildBoard(DISTRICT_MAP_TILES, true);
export function boardFor(state: Pick<GameState, 'boardId'> & Partial<Pick<GameState, 'propertyPricing' | 'boardLayout'>>): readonly BoardTile[] {
  if (state.boardId !== 'vietnam-32') return BOARD;
  const current = state.propertyPricing === 'business-tour-v2';
  return state.boardLayout === 'districts-v1'
    ? current ? DISTRICT_BOARD_32 : LEGACY_PRICE_DISTRICT_BOARD_32
    : current ? BOARD_32 : LEGACY_BOARD_32;
}

const regionNames = ['Miền Tây', 'Nam Bộ', 'Tây Nguyên', 'Nam Trung Bộ', 'Di sản miền Trung', 'Bắc Trung Bộ', 'Bắc Bộ', 'Hai thành phố'];
export const GROUPS_32 = Object.fromEntries(groups.map((key,index)=>[key,{name:regionNames[index],color:COLORS[index]}])) as typeof GROUPS;
export const groupsFor = (state: Pick<GameState,'boardId'>) => state.boardId === 'vietnam-32' ? GROUPS_32 : GROUPS;
