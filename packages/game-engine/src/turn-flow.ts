import type { GameAction, GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { reduceGame } from './engine';
import { buildProblem, purchaseQuote } from './selectors';
import { buyBackQuote } from './property-rules';
import { cardChoices } from './card-targets';

/** Forced progression only; never chooses a purchase, upgrade or card target for a human. */
export function hasLandingChoice(state: GameState): boolean {
  if (state.phase !== 'end' || state.debt || state.propertyVisit?.decisionTaken) return false;
  const tileId = state.players[state.currentPlayer].position;
  return !buyBackQuote(state, tileId).error || !buildProblem(state, tileId);
}

export function automaticAction(state: GameState): GameAction | null {
  if (state.debt || state.pendingPayments.length || state.phase === 'finished') return null;
  const player = state.players[state.currentPlayer];
  // Human rolls always wait for input; old snapshots may retain automaticRoll.
  if (state.phase === 'roll') return null;
  if (state.phase === 'purchase')
    return player.cash < purchaseQuote(state, player.position).cost ? { type: 'SKIP_PURCHASE' } : null;
  if (state.phase === 'end') {
    if (hasLandingChoice(state)) return null;
    return { type: 'END_TURN' };
  }
  if (state.phase === 'card' && state.drawnCard?.revealed) {
    const choices = cardChoices(state);
    const needsTarget = choices.tileIds.length > 0 &&
      (choices.kind === 'property' || (choices.kind === 'gift' && choices.recipientIds.length > 0));
    return needsTarget ? null : { type: 'RESOLVE_CARD' };
  }
  return null;
}

/** Whether ending this turn would discard any legal gameplay choice. */
export function hasEndTurnChoices(state: GameState, onlinePlayerIds?: readonly string[]): boolean {
  if (state.phase !== 'end' || state.debt) return true;
  const player = state.players[state.currentPlayer];
  if (player.bankrupt) return false;
  if (player.flight === 'waiting') return false;
  if (state.extraRoll || state.flightRollPending) return true;
  const legal = (action: GameAction) => !reduceGame(state, action).error;
  if (legal({ type: 'BUY_BACK', tileId: player.position })) return true;
  // Money-only trades are legal too; preserve them, including requests for cash.
  for (const other of state.players) {
    if (
      other.id === player.id ||
      other.bankrupt ||
      (onlinePlayerIds && !onlinePlayerIds.includes(other.id))
    )
      continue;
    const offer = {
      fromId: player.id,
      toId: other.id,
      giveTileId: null,
      takeTileId: null,
      giveCash: 0,
      takeCash: 0,
    };
    if (player.cash > 0 && legal({ type: 'TRADE', offer: { ...offer, giveCash: 1 } })) return true;
    if (other.cash > 0 && legal({ type: 'TRADE', offer: { ...offer, takeCash: 1 } })) return true;
    for (const tile of boardFor(state)) {
      const owner = state.properties[tile.id]?.ownerId;
      if (owner === player.id && legal({ type: 'TRADE', offer: { ...offer, giveTileId: tile.id } }))
        return true;
      if (owner === other.id && legal({ type: 'TRADE', offer: { ...offer, takeTileId: tile.id } }))
        return true;
    }
  }
  for (const tile of boardFor(state)) {
    if (state.properties[tile.id]?.ownerId !== player.id) continue;
    for (const type of ['BUILD', 'SELL_BUILDING', 'MORTGAGE', 'UNMORTGAGE'] as const) {
      if (legal({ type, tileId: tile.id })) return true;
    }
  }
  return false;
}

export function finishIdleTurn(state: GameState, onlinePlayerIds?: readonly string[]): GameState {
  // Also settle unaffordable purchases restored from an older room snapshot.
  const player = state.players[state.currentPlayer];
  if (state.phase === 'purchase' && !state.debt && player.cash < purchaseQuote(state, player.position).cost)
    return reduceGame(state, { type: 'SKIP_PURCHASE' });
  return state.phase === 'end' && !state.debt && !hasEndTurnChoices(state, onlinePlayerIds)
    ? reduceGame(state, { type: 'END_TURN' })
    : state;
}
