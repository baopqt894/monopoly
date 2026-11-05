export const CONSTRUCTION_DURATION = 1.15;

/** Snapshot-only presentation: reconnect, transfers and downgrades never replay a build. */
export function isNewConstruction(
  previous: { city: string; level: number },
  next: { city: string; level: number },
) {
  return previous.city === next.city && next.level > previous.level && next.level > 0;
}
export function constructionPose(elapsed: number) {
  const progress = Math.max(0, Math.min(1, elapsed / CONSTRUCTION_DURATION));
  const t = Math.min(1, progress / 0.72);
  const back = 1 + 2.05 * Math.pow(t - 1, 3) + 1.05 * Math.pow(t - 1, 2);
  return {
    progress,
    scaleY: 0.06 + 0.94 * back,
    scaleXZ: 0.92 + 0.08 * (1 - Math.pow(1 - t, 3)),
    opacity: Math.sin(Math.PI * progress) * (1 - progress * 0.4),
  };
}
