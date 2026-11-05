import type { GameState, PropertyEventKind } from '@typhu/contracts';
import { changeCash } from './cash-events';
import { boardFor } from '@typhu/game-content';
import { propertyValue, usesLandingRules } from './property-rules';

export function propertyEventTargets(state: GameState, event: PropertyEventKind): number[] {
  if (!usesLandingRules(state)) return [];
  const actor = state.players[state.currentPlayer];
  return boardFor(state).filter((tile) => {
    const property = state.properties[tile.id];
    const owner = property && state.players.find((p) => p.id === property.ownerId);
    if (tile.kind !== 'street' || !property || !owner || property.ownerId === actor.id || owner.bankrupt) return false;
    if (event === 'power-outage') return true;
    return property.level < 5 && (event === 'forced-sale' || property.level > 0);
  }).map((tile) => tile.id);
}

/** Caller must validate a revealed event and eligible target before applying it. */
export function applyPropertyEvent(state: GameState, event: PropertyEventKind, tileId: number): void {
  const property = state.properties[tileId];
  switch (event) {
    case 'earthquake': delete state.properties[tileId]; break;
    case 'fire': property.level--; break;
    case 'forced-sale': {
      changeCash(state, [{ player: state.players.find((p) => p.id === property.ownerId)!, amount: propertyValue(state, tileId) }], `Buộc bán ${boardFor(state)[tileId].name}`);
      delete state.properties[tileId]; break;
    }
    case 'power-outage': property.disabledLaps = 3; break;
  }
}
