import type { GameState } from '@typhu/contracts';

/** Persisted history is not a presentation event on a later roll/turn. */
export function activeCardReveal(game: GameState) {
  const card = game.drawnCard;
  const event = game.lastRevealedCard;
  if (game.phase === 'card' && card?.revealed && !event) {
    // Older saves can have an open card without the optional reveal event.
    return { ...card, id: game.nextLogId, playerId: game.players[game.currentPlayer].id };
  }
  if (
    game.phase !== 'card' ||
    !card?.revealed ||
    !event ||
    event.playerId !== game.players[game.currentPlayer].id ||
    event.cardId !== card.cardId ||
    event.deck !== card.deck
  )
    return null;
  return event;
}

export function cardPresentationKey(game: GameState): string {
  const card = game.drawnCard;
  return `${game.players[game.currentPlayer].id}:${game.lastRevealedCard?.id ?? game.nextLogId}:${card?.deck}:${card?.cardId}`;
}
