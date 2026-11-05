import type { GameState } from '@typhu/contracts';

export function random(state: Pick<GameState, 'seed'>): number {
  let value = state.seed | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state.seed = value >>> 0;
  return state.seed / 4294967296;
}

export function shuffle<T>(state: Pick<GameState, 'seed'>, input: readonly T[]): T[] {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
