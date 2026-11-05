import type { GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { rentFor, taxFor } from '@typhu/game-engine';

/** The board shows payable rent, never the purchase listing. Quotes stay in the engine. */
export function tileAmount(game: GameState, tileId: number): number | undefined {
  const tile = boardFor(game)[tileId];
  if (tile.kind === 'tax') return taxFor(game);
  if (!tile.price || !game.properties[tileId]) return undefined;
  return rentFor(game, tileId);
}
