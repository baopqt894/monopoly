import { randomInt } from 'node:crypto';
import { VIETNAM_PAWNS, type VietnamPawnKind } from '@typhu/game-content';

/** Cosmetic draw is independent of dice/deck PRNG and is only made at START_GAME. */
export function drawPawnTokens(
  count: number,
  draw: (max: number) => number = randomInt,
): VietnamPawnKind[] {
  if (!Number.isInteger(count) || count < 2 || count > 4)
    throw new Error('Invalid pawn seat count');
  const remaining = VIETNAM_PAWNS.map((pawn) => pawn.id);
  return Array.from({ length: count }, () => remaining.splice(draw(remaining.length), 1)[0]);
}
