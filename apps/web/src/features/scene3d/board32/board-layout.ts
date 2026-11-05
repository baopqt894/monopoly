export { MAP_VERSION, COLORS, MAP_TILES, type MapTile } from '@typhu/game-content';

export const SIDE = 4.68;
export function board32Layout(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= 32)
    throw new Error('Invalid board32 index');
  const side = Math.floor(index / 8),
    step = index % 8;
  const along = step === 0 ? SIDE : 4.32 - step * 1.08;
  const x = [along, -SIDE, -along, SIDE][side];
  const z = [SIDE, along, -SIDE, -along][side];
  return {
    x,
    z,
    rotation: [Math.PI, Math.PI / 2, 0, -Math.PI / 2][side],
    width: step === 0 ? 1.8 : 1.08,
    depth: 1.8,
    corner: step === 0,
  };
}
