import type { GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';

/** Rendering follows public ownership only; no preview level leaks into a real room. */
export function ownedBuildingLevel(game: GameState, tileId: number): number {
  const property = game.properties[tileId];
  if (boardFor(game)[tileId]?.kind !== 'street' || !property) return 0;
  const owner = game.players.find((player) => player.id === property.ownerId);
  return owner && !owner.bankrupt ? property.level : 0;
}
