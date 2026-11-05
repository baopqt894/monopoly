import type { CardEffect, DeckKind, GameAction, GameState } from '@typhu/contracts';
import { boardFor, getCard } from '@typhu/game-content';
import { propertyEventTargets } from './property-events';
import { usesLandingRules } from './property-rules';

export function specialCardDestination(
  state: GameState,
  effect: Extract<CardEffect, { type: 'move-special' }>,
): number | undefined {
  const board = boardFor(state);
  if (effect.destination === 'festival-city') {
    const id = state.festivalTileId;
    return id !== null && id !== undefined && board[id]?.kind === 'street' ? id : undefined;
  }
  const kind =
    effect.destination === 'festival-corner'
      ? 'parking'
      : effect.destination === 'airport'
        ? 'airport'
        : 'tax';
  return [...board, ...board].find(
    (tile, index) => index > state.players[state.currentPlayer].position && tile.kind === kind,
  )?.id;
}
export function cardChoices(state: GameState): {
  kind: 'none' | 'property' | 'gift';
  tileIds: number[];
  recipientIds: string[];
} {
  const drawn = state.drawnCard;
  if (!drawn?.revealed) return { kind: 'none', tileIds: [], recipientIds: [] };
  const effect = getCard(drawn.deck, drawn.cardId, state.boardId, state.boardLayout).effect;
  if (effect.type === 'property-event')
    return {
      kind: 'property',
      tileIds: propertyEventTargets(state, effect.event),
      recipientIds: [],
    };
  if (effect.type === 'gift-property') {
    const actor = state.players[state.currentPlayer];
    return {
      kind: 'gift',
      tileIds: boardFor(state)
        .filter(
          (tile) => tile.price !== undefined && state.properties[tile.id]?.ownerId === actor.id,
        )
        .map((tile) => tile.id),
      recipientIds: state.players
        .filter((player) => player.id !== actor.id && !player.bankrupt)
        .map((player) => player.id),
    };
  }
  return { kind: 'none', tileIds: [], recipientIds: [] };
}
export function cardSelectionProblem(
  state: GameState,
  action: Extract<GameAction, { type: 'RESOLVE_CARD' }>,
): string | null {
  const choice = cardChoices(state);
  if (choice.kind === 'property') {
    if (!usesLandingRules(state)) return 'Ván cũ không có thẻ tác động bất động sản.';
    if (action.targetPlayerId !== undefined) return 'Thẻ này không chọn người nhận tài sản.';
    if (
      (choice.tileIds.length > 0 && action.targetTileId === undefined) ||
      (action.targetTileId !== undefined &&
        (!Number.isInteger(action.targetTileId) || !choice.tileIds.includes(action.targetTileId)))
    )
      return 'Cần chọn một thành phố đối thủ hợp lệ cho thẻ.';
    return null;
  }
  if (choice.kind === 'gift') {
    if (!usesLandingRules(state)) return 'Ván cũ không có thẻ tặng bất động sản.';
    const eligible = choice.tileIds.length > 0 && choice.recipientIds.length > 0;
    if (!eligible)
      return action.targetTileId !== undefined || action.targetPlayerId !== undefined
        ? 'Không có tài sản hoặc người nhận hợp lệ.'
        : null;
    if (
      !Number.isInteger(action.targetTileId) ||
      !choice.tileIds.includes(action.targetTileId!) ||
      typeof action.targetPlayerId !== 'string' ||
      !choice.recipientIds.includes(action.targetPlayerId)
    )
      return 'Chọn đúng một ô của mình và một người chơi khác chưa phá sản.';
    return null;
  }
  return action.targetTileId !== undefined || action.targetPlayerId !== undefined
    ? 'Thẻ này không chọn mục tiêu.'
    : null;
}
export const cardDeckSize = (state: GameState, deck: DeckKind): number =>
  state.decks[deck].length +
  (state.drawnCard?.deck === deck ? 1 : 0) +
  state.players.reduce(
    (sum, player) => sum + player.jailCards.filter((value) => value === deck).length,
    0,
  );
