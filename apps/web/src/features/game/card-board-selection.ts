import type { GameAction, GameState } from '@typhu/contracts';
import { cardChoices } from '@typhu/game-engine';

/** The engine remains the source of eligible tiles and recipients. */
export function cardBoardChoices(game: GameState) {
  if (game.phase !== 'card' || game.debt || !game.drawnCard?.revealed) return null;
  const choices = cardChoices(game);
  return choices.tileIds.length &&
    (choices.kind === 'property' || (choices.kind === 'gift' && choices.recipientIds.length))
    ? choices
    : null;
}

export function cardBoardAction(
  game: GameState,
  tileId: number | null,
  recipientId: string,
): GameAction | null {
  const choices = cardBoardChoices(game);
  if (!choices || tileId === null || !choices.tileIds.includes(tileId)) return null;
  if (choices.kind === 'gift') {
    if (!choices.recipientIds.includes(recipientId)) return null;
    return { type: 'RESOLVE_CARD', targetTileId: tileId, targetPlayerId: recipientId };
  }
  return { type: 'RESOLVE_CARD', targetTileId: tileId };
}
