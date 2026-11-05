import type { GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { rentFor } from './selectors';

/** Read-only presentation quote; never grants ownership or building permission. */
export function propertyRentPreview(
  state: GameState,
  tileId: number,
  ownerId: string,
  level: number,
): number {
  if (
    !Number.isInteger(level) ||
    level < 0 ||
    level > 5 ||
    boardFor(state)[tileId]?.kind !== 'street'
  )
    return 0;
  const projected: GameState = {
    ...state,
    properties: {
      ...state.properties,
      [tileId]: {
        ...(state.properties[tileId] ?? { mortgaged: false, business: 'residence' as const }),
        ownerId,
        level,
      },
    },
  };
  return rentFor(projected, tileId);
}

/** Collection ladder uses the same rent selector as settled game state. */
export function resortRentProgress(state: GameState, tileId: number, ownerId: string) {
  const resorts = boardFor(state).filter((tile) => tile.kind === 'railroad');
  if (!resorts.some((tile) => tile.id === tileId)) return [];
  const ordered = [tileId, ...resorts.filter((tile) => tile.id !== tileId).map((tile) => tile.id)];
  return resorts.map((_, index) => {
    const properties = { ...state.properties };
    for (const tile of resorts)
      if (properties[tile.id]?.ownerId === ownerId) delete properties[tile.id];
    for (const id of ordered.slice(0, index + 1))
      properties[id] = { ownerId, level: 0, mortgaged: false, business: 'residence' };
    return { count: index + 1, rent: rentFor({ ...state, properties }, tileId) };
  });
}
