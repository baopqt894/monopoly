import type { GameAction, GameState } from '@typhu/contracts';
import { random } from './random';
import { propertyValue } from './property-rules';
import { netWorth } from './selectors';
import { cardChoices } from './card-targets';

/** Pure planning; reducer consumes the matching PRNG steps only after valid resolution. */
export function cardResolutionAction(state: GameState, strategy: 'random' | 'richest'): GameAction {
  if (!state.drawnCard?.revealed) return { type: 'DRAW_CARD' };
  const choice = cardChoices(state),
    rng = { seed: state.seed };
  if (choice.kind === 'property' && choice.tileIds.length) {
    const targetTileId =
      strategy === 'richest'
        ? [...choice.tileIds].sort(
            (a, b) =>
              netWorth(state, state.properties[b].ownerId) -
                netWorth(state, state.properties[a].ownerId) ||
              propertyValue(state, b) - propertyValue(state, a) ||
              a - b,
          )[0]
        : choice.tileIds[Math.floor(random(rng) * choice.tileIds.length)];
    return { type: 'RESOLVE_CARD', targetTileId };
  }
  if (choice.kind === 'gift' && choice.tileIds.length && choice.recipientIds.length) {
    const targetTileId =
      strategy === 'richest'
        ? [...choice.tileIds].sort(
            (a, b) => propertyValue(state, a) - propertyValue(state, b) || a - b,
          )[0]
        : choice.tileIds[Math.floor(random(rng) * choice.tileIds.length)];
    const targetPlayerId =
      strategy === 'richest'
        ? [...choice.recipientIds].sort(
            (a, b) => netWorth(state, a) - netWorth(state, b) || a.localeCompare(b),
          )[0]
        : choice.recipientIds[Math.floor(random(rng) * choice.recipientIds.length)];
    return { type: 'RESOLVE_CARD', targetTileId, targetPlayerId };
  }
  return { type: 'RESOLVE_CARD' };
}
