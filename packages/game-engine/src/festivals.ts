import type { GameAction, GameState } from '@typhu/contracts';
import { propertyValue } from './property-rules';
import { boardFor, BOARD_32 } from '@typhu/game-content';

/** Event bonus is +25%; festival multiplies the resulting rent. */
export const EVENT_RENT_MULTIPLIER = 1.25;

/** Random event bonuses: 20 city lots and four resorts on the selected 32-tile design. */
export const EVENT_ELIGIBLE_TILE_IDS = BOARD_32.filter(
  (tile) => tile.kind === 'street' || tile.resort,
).map((tile) => tile.id);
export const MAX_EVENT_TILES = EVENT_ELIGIBLE_TILE_IDS.length;
export const eventEligibleTileIds = (state: Pick<GameState, 'boardId'>) =>
  boardFor(state)
    .filter((tile) => tile.kind === 'street' || tile.resort)
    .map((tile) => tile.id);
export const randomEventTileIds = (state: GameState): readonly number[] =>
  state.eventTileIds ?? state.festivalTileIds ?? [];
export function resolveEventSettings(options: {
  eventTileCount?: number;
  festivalTileCount?: number;
  boardId?: 'vietnam-32';
}) {
  if (options.boardId !== undefined && options.boardId !== 'vietnam-32')
    throw new Error('Bàn cờ không hợp lệ.');
  if (
    options.eventTileCount !== undefined &&
    options.festivalTileCount !== undefined &&
    options.eventTileCount !== options.festivalTileCount
  )
    throw new Error('Hai giá trị số ô sự kiện không khớp.');
  const eventTileCount =
    options.eventTileCount === undefined
      ? options.festivalTileCount === undefined
        ? 0
        : options.festivalTileCount
      : options.eventTileCount;
  const max = eventEligibleTileIds(options).length;
  if (!Number.isSafeInteger(eventTileCount) || eventTileCount < 0 || eventTileCount > max)
    throw new Error(`Số ô sự kiện phải là số nguyên từ 0 đến ${max}.`);
  return { eventTileCount };
}
/** Shared room/factory validation; old saves retain the original +50% per hosting. */
export function resolveFestivalIncrement(options: { festivalIncrement?: unknown }): { festivalIncrement: 0.25 | 0.5 } {
  const festivalIncrement = options.festivalIncrement === undefined ? 0.5 : options.festivalIncrement;
  if (festivalIncrement !== 0.25 && festivalIncrement !== 0.5)
    throw new Error('Mức tăng Lễ hội chỉ có thể là 0,25 hoặc 0,5.');
  return { festivalIncrement };
}
/** Legacy API aliases for callers from the earlier random-festival prototype. */
export const FESTIVAL_ELIGIBLE_TILE_IDS = EVENT_ELIGIBLE_TILE_IDS;
export const MAX_FESTIVAL_TILES = MAX_EVENT_TILES;
export const festivalEligibleTileIds = eventEligibleTileIds;
export const resolveFestivalSettings = (options: Parameters<typeof resolveEventSettings>[0]) => ({
  festivalTileCount: resolveEventSettings(options).eventTileCount,
});

/** A festival can only be hosted on one of the current player's city lots. */
export const festivalTargets = (state: GameState, requestingPlayerId?: string): number[] => {
  const actor = state.players[state.currentPlayer];
  return actor.bankrupt || (requestingPlayerId !== undefined && requestingPlayerId !== actor.id)
    ? []
    : boardFor(state)
        .filter((tile) => tile.kind === 'street' && state.properties[tile.id]?.ownerId === actor.id)
        .map((tile) => tile.id);
};

export const festivalRentMultiplier = (state: GameState, tileId: number): number =>
  state.festivalTileId === tileId && boardFor(state)[tileId]?.kind === 'street'
    ? 1 + (state.festivalIncrement ?? 0.5) * (state.festivalLevel ?? 0)
    : 1;
export const nextFestivalMultiplier = (state: GameState): number =>
  1 + (state.festivalIncrement ?? 0.5) * ((state.festivalLevel ?? 0) + 1);
export function festivalDefaultAction(state: GameState): GameAction {
  const targets = festivalTargets(state).sort(
    (a, b) => propertyValue(state, b) - propertyValue(state, a) || a - b,
  );
  return targets.length ? { type: 'HOST_FESTIVAL', tileId: targets[0] } : { type: 'SKIP_FESTIVAL' };
}
