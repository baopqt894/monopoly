import type { LogEntry } from '@typhu/contracts';
export type PropertyExitKind = 'destroy' | 'sell';
export function propertyExitCue(
  previous: { city: string; level: number; logId: number },
  next: { city: string; level: number },
  tileId: number,
  log: readonly LogEntry[],
) {
  if (previous.city !== next.city || previous.level <= 0 || next.level >= previous.level)
    return null;
  const entry = log.find((e) => e.id > previous.logId && e.propertyChange?.tileId === tileId);
  return entry?.propertyChange
    ? { id: entry.id, kind: entry.propertyChange.kind, city: previous.city, level: previous.level }
    : null;
}
export function exitPose(kind: PropertyExitKind, elapsed: number) {
  const progress = Math.max(0, Math.min(1, elapsed / (kind === 'destroy' ? 1.15 : 0.9)));
  if (kind === 'sell')
    return {
      progress,
      scale: Math.max(0.01, 1 - progress * progress),
      scaleY: 1,
      lift: progress * 0.24,
      shake: 0,
      tilt: 0,
      opacity: Math.max(0, 1 - progress * 1.15),
    };
  const collapse = Math.max(0, Math.min(1, (progress - 0.18) / 0.65));
  const shake = progress < 0.28 ? Math.sin(progress * 95) * 0.018 * (1 - progress / 0.28) : 0;
  return {
    progress,
    scale: 1 - collapse * 0.18,
    scaleY: Math.max(0.02, 1 - collapse * collapse),
    lift: 0,
    shake,
    tilt: shake * 1.8,
    opacity: Math.max(0, 1 - Math.max(0, progress - 0.5) * 2),
  };
}

/** Model motion finishes first; dust gets time to dissipate without delaying gameplay. */
export const exitEffectDuration = (kind: PropertyExitKind) => (kind === 'destroy' ? 1.7 : 1.3);
