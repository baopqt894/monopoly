import type { GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { propertyValue } from './property-rules';

export const usesFullLiquidation = (state: GameState) => state.liquidationRules === 'full-value-v1';
export const liquidationTileIds = (state: GameState, playerId = state.debt?.debtorId): number[] =>
  boardFor(state).filter(tile => tile.price !== undefined && state.properties[tile.id]?.ownerId === playerId).map(tile => tile.id);
/** Full printed land value plus all existing construction; no mortgages in this ruleset. */
export function liquidationValue(state: GameState, tileId: number): number {
  const tile = boardFor(state)[tileId], property = state.properties[tileId];
  if (!tile?.price || !property) return 0;
  return propertyValue(state, tileId);
}
export const liquidationPotential = (state: GameState): number =>
  (state.players.find(player => player.id === state.debt?.debtorId)?.cash ?? 0) +
  liquidationTileIds(state).reduce((sum, id) => sum + liquidationValue(state, id), 0);
export const selectedLiquidationValue = (state: GameState): number =>
  (state.debt?.selectedTileIds ?? []).filter(id => liquidationTileIds(state).includes(id)).reduce((sum,id) => sum + liquidationValue(state,id),0);

/** Sell the entire confirmed selection. Fallback adds only enough lots to cover the balance. */
export function liquidationPlan(state: GameState, includeFallback: boolean): number[] {
  if (!state.debt) return [];
  const available = liquidationTileIds(state);
  const selected = [...new Set(state.debt.selectedTileIds ?? [])].filter(id => available.includes(id));
  let needed = Math.max(0, state.debt.amount - (state.players.find(player => player.id === state.debt!.debtorId)?.cash ?? 0));
  const plan: number[] = [];
  for (const id of selected) {
    plan.push(id); needed -= liquidationValue(state,id);
  }
  const remaining = available.filter(id => !plan.includes(id));
  while (includeFallback && needed > 0 && remaining.length) {
    remaining.sort((a,b) => liquidationValue(state,a)-liquidationValue(state,b) || a-b);
    const id = remaining.find(id => liquidationValue(state,id) >= needed) ?? remaining.at(-1)!;
    plan.push(id); needed -= liquidationValue(state,id); remaining.splice(remaining.indexOf(id),1);
  }
  return plan;
}

/** Read-only preview of a single batch sale and the subsequent debt payment. */
export function liquidationQuote(state: GameState) {
  const selectedIds = [...new Set(state.debt?.selectedTileIds ?? [])].filter(id => liquidationTileIds(state).includes(id));
  const selectedValue = selectedIds.reduce((total, id) => total + liquidationValue(state, id), 0);
  const cash = state.players.find(player => player.id === state.debt?.debtorId)?.cash ?? 0;
  const amount = state.debt?.amount ?? 0;
  return { selectedIds, selectedValue, remainingDebt: Math.max(0, amount - cash - selectedValue), surplus: Math.max(0, cash + selectedValue - amount) };
}
