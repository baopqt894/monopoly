import type { GameAction, GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { festivalDefaultAction } from './festivals';
import { usesFullLiquidation } from './liquidation';
import { reduceGame } from './engine';
import { managingPlayer, ownedTiles, FLIGHT_FEE, flightTargets } from './selectors';
import { cardResolutionAction } from './card-actions';

/** Deterministic, intentionally eager spender. Only the authoritative server executes it. */
export function chooseBotAction(state: GameState): GameAction | null {
  if (state.phase === 'finished') return null;
  const player = managingPlayer(state);
  const legal = (action: GameAction) => !reduceGame(state, action).error;
  const firstLegal = (actions: GameAction[]) => actions.find(legal) ?? null;
  const assets = ownedTiles(state, player.id);
  if (state.debt && usesFullLiquidation(state)) return {type:'AUTO_LIQUIDATE'};
  if (state.debt) return firstLegal([
    ...assets.map((tile): GameAction => ({ type: 'SELL_BUILDING', tileId: tile.id })),
    ...assets.map((tile): GameAction => ({ type: 'MORTGAGE', tileId: tile.id })),
    { type: 'DECLARE_BANKRUPTCY' },
  ]);
  if (state.phase === 'auction' && state.auction) {
    const bidder = state.players[state.auction.bidderIndex];
    const amount = Math.min(bidder.cash, boardFor(state)[state.auction.tileId].price!);
    return legal({ type: 'BID', amount }) ? { type: 'BID', amount } : { type: 'PASS_BID' };
  }
  if (state.phase === 'purchase') return legal({ type: 'BUY' }) ? { type: 'BUY' } : { type: 'SKIP_PURCHASE' };
  if (state.phase === 'festival') return festivalDefaultAction(state);
  if (state.phase === 'card') return state.drawnCard?.revealed ? cardResolutionAction(state, 'richest') : { type: 'DRAW_CARD' };
  if (player.bankrupt) return { type: 'END_TURN' };
  if (state.phase === 'end' && legal({ type: 'BUY_BACK', tileId: player.position })) return { type: 'BUY_BACK', tileId: player.position };
  if (state.phase === 'roll' && player.jailed) {
    return firstLegal([{ type: 'PAY_BAIL' }, { type: 'USE_JAIL_CARD' }, { type: 'ROLL' }]);
  }
  const spend = firstLegal([
    ...assets.map((tile): GameAction => ({ type: 'UNMORTGAGE', tileId: tile.id })),
    ...assets.map((tile): GameAction => ({ type: 'BUILD', tileId: tile.id, business: 'residence' })),
  ]);
  if (spend) return spend;
  if (state.phase === 'roll') {
    if (player.flight === 'ready' && player.cash >= FLIGHT_FEE) {
      const destination = boardFor(state).filter((tile) => flightTargets(state).includes(tile.id) && tile.price && tile.price <= player.cash - FLIGHT_FEE && !state.properties[tile.id])
        .sort((a, b) => b.price! - a.price!)[0];
      return { type: 'FLY', tileId: destination?.id ?? flightTargets(state)[0] };
    }
    return { type: 'ROLL' };
  }
  return state.phase === 'end' ? { type: 'END_TURN' } : null;
}
