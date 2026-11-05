import type { GameAction, GameState } from '@typhu/contracts';
import { festivalDefaultAction } from './festivals';
import { usesFullLiquidation } from './liquidation';
import { chooseBotAction } from './bot';
import { cardResolutionAction } from './card-actions';
import { FLIGHT_FEE } from './selectors';

/** Conservative defaults for an unattended human; never buy or spend by choice. */
export function timeoutAction(state: GameState): GameAction | null {
  if (state.phase === 'finished') return null;
  if (state.debt) return usesFullLiquidation(state) ? {type:'AUTO_LIQUIDATE'} : chooseBotAction(state);
  switch (state.phase) {
    case 'festival': return festivalDefaultAction(state);
    case 'roll': return state.players[state.currentPlayer].flight === 'ready' && state.players[state.currentPlayer].cash >= FLIGHT_FEE && !state.players[state.currentPlayer].jailed ? { type: 'SKIP_FLIGHT' } : { type: 'ROLL' };
    case 'purchase': return { type: 'SKIP_PURCHASE' };
    case 'card': return state.drawnCard?.revealed ? cardResolutionAction(state, 'random') : { type: 'DRAW_CARD' };
    case 'auction': return { type: 'PASS_BID' };
    case 'end': return { type: 'END_TURN' };
  }
}
