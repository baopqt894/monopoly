import type { BoardTile, GameState, Player } from '@typhu/contracts';
import { randomEventTileIds, festivalRentMultiplier, EVENT_RENT_MULTIPLIER } from './festivals';
import { boardFor, CITY_EVENTS } from '@typhu/game-content';
import { initialConstruction, landingBuildProblem, propertyClosed, usesLandingRules, propertyValue, constructionValue, constructionUpgradeCost } from './property-rules';

export const currentPlayer = (state: GameState): Player => state.players[state.currentPlayer];
export const managingPlayer = (state: GameState): Player => state.players.find((p) => p.id === state.debt?.debtorId) ?? currentPlayer(state);
export const ownedTiles = (state: GameState, playerId: string): BoardTile[] => boardFor(state).filter((tile) => state.properties[tile.id]?.ownerId === playerId);
export const groupTiles = (tile: BoardTile, state: Pick<GameState, 'boardId'> = {}): BoardTile[] => tile.group ? boardFor(state).filter((other) => other.group === tile.group) : [];
export const ownsGroup = (state: GameState, tile: BoardTile, playerId: string): boolean => !!tile.group && groupTiles(tile, state).every((other) => state.properties[other.id]?.ownerId === playerId);
export const bankSupply = (state: GameState) => ({ houses: 32 - Object.values(state.properties).reduce((sum, property) => sum + (property.level === 5 ? 0 : property.level), 0), hotels: 12 - Object.values(state.properties).filter((property) => property.level === 5).length });
export const cityEvent = (state: GameState) => CITY_EVENTS[state.cityEventIndex % CITY_EVENTS.length];
export const nextCityEvent = (state: GameState) => CITY_EVENTS[(state.cityEventIndex + 1) % CITY_EVENTS.length];

/** Ten percent of cash plus full current land/construction values. */
export const taxFor = (state: GameState, playerId = currentPlayer(state).id): number =>
  Math.ceil(((state.players.find(player => player.id === playerId)?.cash ?? 0) + ownedTiles(state, playerId).reduce((sum, tile) => sum + propertyValue(state, tile.id), 0)) * 0.1);
export const FLIGHT_FEE = 50;

/** Flights skip card/tax/festival/island spaces and never target opponents’ assets. */
export const flightTargets = (state: GameState): number[] =>
  boardFor(state).filter(tile => !['jail', 'chance', 'chest', 'tax', 'parking'].includes(tile.kind) && (!state.properties[tile.id] || state.properties[tile.id].ownerId === currentPlayer(state).id)).map(tile => tile.id);

export function netWorth(state: GameState, playerId: string): number {
  const player = state.players.find((entry) => entry.id === playerId)!;
  if (player.bankrupt) return 0;
  return player.cash + ownedTiles(state, playerId).reduce((sum, tile) => {
    const property = state.properties[tile.id];
    if (state.liquidationRules === 'full-value-v1') return sum + propertyValue(state,tile.id);
    return sum + (tile.price ?? 0) - (property.mortgaged ? (tile.price ?? 0) / 2 : 0) + property.level * (tile.buildCost ?? 0) / 2;
  }, 0) - (state.debt?.debtorId === playerId ? state.debt.amount : 0);
}

export function rentFor(state: GameState, tileId: number, diceTotal = state.dice[0] + state.dice[1], multiplier = 1): number {
  const tile = boardFor(state)[tileId];
  const property = state.properties[tileId];
  if (!property || property.mortgaged || propertyClosed(state, tileId)) return 0;
  if (tile.kind === 'railroad') {
    const count = ownedTiles(state, property.ownerId).filter((entry) => entry.kind === 'railroad').length;
    return Math.ceil(25 * 2 ** (count - 1) * multiplier * (randomEventTileIds(state).includes(tileId) ? EVENT_RENT_MULTIPLIER : 1));
  }
  if (tile.kind === 'utility') {
    const count = ownedTiles(state, property.ownerId).filter((entry) => entry.kind === 'utility').length;
    return Math.ceil(diceTotal * (count === 2 ? 10 : 4) * multiplier);
  }
  if (tile.kind !== 'street') return 0;
  let rent = tile.rents![property.level];
  if ((usesLandingRules(state) || !property.level) && ownsGroup(state, tile, property.ownerId)) rent *= 2;
  if (state.mode === 'city') {
    if (property.level) {
      if (property.business === 'residence') rent *= 0.7;
      if (property.business === 'hotel') rent *= 1.4;
      if (property.business === 'cafe') {
        const neighbours = [boardFor(state)[(tile.id + boardFor(state).length - 1) % boardFor(state).length], boardFor(state)[(tile.id + 1) % boardFor(state).length]];
        if (neighbours.some((entry) => {
          const neighbour = state.properties[entry.id];
          return neighbour && !neighbour.mortgaged && neighbour.level > 0 && neighbour.business === 'residence';
        })) rent *= 1.2;
      }
    }
    if (tile.group && cityEvent(state).groups.includes(tile.group)) rent *= cityEvent(state).multiplier;
  }
  if (randomEventTileIds(state).includes(tileId)) rent *= EVENT_RENT_MULTIPLIER;
  return Math.ceil(rent * multiplier * festivalRentMultiplier(state,tileId));
}

export function buildProblem(state: GameState, tileId: number, targetLevel?: number): string | null {
  const tile = boardFor(state)[tileId];
  const property = state.properties[tileId];
  const player = managingPlayer(state);
  if (usesLandingRules(state)) {
    return landingBuildProblem(state, tileId, targetLevel ?? (property?.level ?? 0) + 1);
  }
  if (!tile || tile.kind !== 'street' || !property || property.ownerId !== player.id) return 'Bạn không sở hữu đường phố này.';
  if (state.debt || !['roll', 'end'].includes(state.phase)) return 'Chỉ xây trước hoặc sau khi di chuyển, khi đã trả hết nợ.';
  if (property.level >= 5) return 'Công trình đã đạt cấp tối đa.';
  if (groupTiles(tile, state).some((entry) => state.properties[entry.id]?.ownerId === player.id && state.properties[entry.id]?.mortgaged)) return 'Cần giải chấp toàn bộ khu trước khi xây.';
  const complete = ownsGroup(state, tile, player.id);
  if (!complete && (state.mode === 'classic' || property.level >= 2)) return state.mode === 'classic' ? 'Cần sở hữu trọn nhóm màu để xây.' : 'Sở hữu trọn khu để xây từ cấp 3.';
  if (complete && groupTiles(tile, state).some((entry) => state.properties[entry.id].level < property.level)) return 'Hãy xây đều các lô trong nhóm màu.';
  if (player.cash < tile.buildCost!) return 'Không đủ tiền xây công trình.';
  const supply = bankSupply(state);
  if (property.level < 4 && supply.houses < 1) return 'Ngân hàng đã hết nhà.';
  if (property.level === 4 && supply.hotels < 1) return 'Ngân hàng đã hết khách sạn.';
  return null;
}

/** Shared display quotes; UI never supplies a price to a command. */
export function purchaseQuote(state: GameState, tileId: number, level?: number) {
  const player = currentPlayer(state),
    tile = boardFor(state)[tileId];
  const quote = usesLandingRules(state)
    ? initialConstruction(state, tileId, level)
    : { level: 0, cost: tile?.price ?? 0 };
  const error =
    quote.error ??
    (!tile?.price ||
    state.phase !== 'purchase' ||
    player.position !== tileId ||
    state.properties[tileId]
      ? 'Không thể mua tài sản này.'
      : player.cash < quote.cost
        ? 'Không đủ tiền mua đất và xây nhà.'
        : !usesLandingRules(state) && quote.level > bankSupply(state).houses
          ? 'Ngân hàng không đủ nhà.'
          : null);
  return { ...quote, error };
}
/** Display all four purchase tiers, including locked ones, without granting permission. */
export function purchaseLevelQuotes(state: GameState, tileId: number) {
  const tile = boardFor(state)[tileId];
  if (!usesLandingRules(state) || tile?.kind !== 'street') return [];
  return [1, 2, 3, 4].map(level => ({
    ...purchaseQuote(state, tileId, level),
    level,
    cost: (tile.price ?? 0) + constructionValue(state, tileId, level),
  }));
}

export function upgradeQuote(state: GameState, tileId: number, level: number) {
  const property = state.properties[tileId];
  return {
    level,
    cost: constructionUpgradeCost(state, tileId, property?.level ?? 0, level),
    error: buildProblem(state, tileId, level),
  };
}
