import type { PawnMovement } from '@typhu/contracts';
import { pawnStepMs, pawnTravelMs } from '@typhu/game-content';

/** Stable per-tile timing with a short pause after every landing. */
export function pawnMotionFrame(movement: PawnMovement, origin: number, elapsedMs: number) {
  if (!movement.path.length) return { from: origin, to: origin, progress: 1, hop: 0, done: true };
  const duration = pawnStepMs(movement);
  const index = Math.min(movement.path.length - 1, Math.floor(Math.max(0, elapsedMs) / duration));
  const done = elapsedMs >= pawnTravelMs(movement);
  const travel = Math.min(1, Math.max(0, (elapsedMs - index * duration) / (duration * 0.8)));
  return {
    from: index ? movement.path[index - 1] : origin,
    to: movement.path[index],
    progress: done ? 1 : travel * travel * (3 - 2 * travel),
    hop: done ? 0 : Math.sin(travel * Math.PI) * 0.15,
    done,
  };
}

/** Latest tile actually reached, including steps skipped by a slow animation frame. */
export function pawnReachedStep(movement: PawnMovement, elapsedMs: number) {
  const duration = pawnStepMs(movement);
  return Math.min(movement.path.length - 1, Math.max(-1, Math.floor(elapsedMs / duration - 0.8 + 1e-9)));
}
