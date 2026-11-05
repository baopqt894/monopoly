import { BufferGeometry, Float32BufferAttribute } from 'three';
import { tiledHip } from './model-detail';
import { Miniature, type ModelGeometry } from '../vietnam/miniature';

// Proportions and silhouettes follow houses-simple-overview.png (eight groups,
// four columns per group). No plants, invented towers or decorative plinths.
// Warm walls, terracotta, jade roofs and blue shutters follow the v2 concept sheet.
export const HOUSE_PALETTES = [
  { wall: '#f6cf78', roof: '#e8491f', trim: '#fff1d2', glass: '#246840', wood: '#8b451b' },
  { wall: '#78a68a', roof: '#075a43', trim: '#d18a40', glass: '#174d3d', wood: '#924617' },
  { wall: '#c68134', roof: '#8b4325', trim: '#e0a44f', glass: '#4b4226', wood: '#793a16' },
  { wall: '#fff3e5', roof: '#ed4e20', trim: '#fff8ee', glass: '#0866a5', wood: '#784323' },
  { wall: '#f0b02f', roof: '#48443d', trim: '#f7cb68', glass: '#573516', wood: '#78421c' },
  { wall: '#fae9cb', roof: '#df421d', trim: '#fff3df', glass: '#654025', wood: '#84411e' },
  { wall: '#f5dfb5', roof: '#d94d20', trim: '#fff0d2', glass: '#6c4225', wood: '#793c1b' },
  { wall: '#fff2de', roof: '#608f93', trim: '#fff9ee', glass: '#087b9b', wood: '#247f86' },
] as const;
const cache = new Map<string, ModelGeometry>();
function gable(m: Miniature, w: number, d: number, h: number, x: number, y: number, z: number) {
  const g = new BufferGeometry();
  g.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        -w / 2,
        0,
        -d / 2,
        w / 2,
        0,
        -d / 2,
        0,
        h,
        -d / 2,
        -w / 2,
        0,
        d / 2,
        w / 2,
        0,
        d / 2,
        0,
        h,
        d / 2,
      ],
      3,
    ),
  );
  g.setAttribute('uv', new Float32BufferAttribute(new Float32Array(12), 2));
  g.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4, 0, 1, 4, 0, 4, 3]);
  g.computeVertexNormals();
  m.add('roof', g, [x, y, z]);
  m.box('trim', [w + 0.025, 0.035, 0.045], [x, y, z + d / 2 + 0.01]);
  m.box('roof', [0.055, 0.04, d + 0.03], [x, y + h, z]);
  const slope = Math.atan2(h, w / 2),
    length = Math.hypot(h, w / 2);
  for (const side of [-1, 1]) {
    m.box(
      'trim',
      [length, 0.028, 0.03],
      [x + (side * w) / 4, y + h / 2, z + d / 2 + 0.018],
      [0, 0, -side * slope],
    );
    for (let i = 1; i <= 4; i++)
      m.box(
        'roof',
        [length, 0.012, 0.012],
        [x + (side * w) / 4, y + h / 2 + 0.02, z - d * 0.42 + i * d * 0.17],
        [0, 0, -side * slope],
      );
  }
}
function roof(m: Miniature, group: number, w: number, d: number, x: number, y: number, z: number) {
  if (group === 7) {
    m.box('roof', [w, 0.055, d], [x, y + 0.025, z]);
    for (const side of [-1, 1])
      m.box('trim', [w, 0.09, 0.04], [x, y + 0.08, z + side * (d / 2 - 0.02)]);
    for (const side of [-1, 1])
      m.box('trim', [0.04, 0.09, d], [x + side * (w / 2 - 0.02), y + 0.08, z]);
  } else if ([1, 2, 4].includes(group)) {
    gable(m, w, d, group === 4 ? 0.29 : 0.34, x, y, z);
    if (group === 4)
      for (const side of [-1, 1])
        m.box(
          'roof',
          [0.06, 0.11, d + 0.06],
          [x + side * w * 0.47, y + 0.035, z],
          [0, 0, side * 0.3],
        );
  } else tiledHip(m, w, d, 0.25, [x, y, z]);
}
function opening(
  m: Miniature,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  group: number,
  door = false,
) {
  m.box('wood', [w + 0.075, h + 0.065, 0.04], [x, y + h / 2, z - 0.008]);
  m.box('trim', [w + 0.055, h + 0.045, 0.028], [x, y + h / 2, z]);
  m.box(door ? 'wood' : 'glass', [w, h, 0.032], [x, y + h / 2, z + 0.018]);
  m.box('trim', [0.017, h, 0.038], [x, y + h / 2, z + 0.04]);
  m.box('trim', [w + 0.08, 0.022, 0.09], [x, y - 0.016, z + 0.035]);
  if (door) {
    for (const yy of [0.24, 0.69])
      m.box('trim', [w * 0.75, 0.012, 0.012], [x, y + h * yy, z + 0.041]);
    m.ball('gold', [0.012, 0.012, 0.012], [x + w * 0.25, y + h * 0.48, z + 0.045]);
  } else {
    m.box('trim', [w, 0.015, 0.03], [x, y + h * 0.5, z + 0.041]);
    if (group !== 7)
      for (const side of [-1, 1]) {
        const shutter = group === 0 ? 'glass' : 'wood';
        m.box(shutter, [w * 0.25, h, 0.038], [x + side * w * 0.67, y + h / 2, z + 0.025]);
        for (let i = 1; i <= 3; i++)
          m.box(
            'trim',
            [w * 0.21, 0.012, 0.016],
            [x + side * w * 0.67, y + (i * h) / 4, z + 0.047],
          );
      }
  }
}
function block(
  m: Miniature,
  group: number,
  level: number,
  x: number,
  z: number,
  w: number,
  d: number,
  floors: number,
  bottom: number,
) {
  const floorHeight = 0.4;
  const wood = [1, 2].includes(group);
  m.box('wall', [w, floors * floorHeight, d], [x, bottom + (floors * floorHeight) / 2, z]);
  for (let f = 0; f < floors; f++) {
    const y = bottom + f * floorHeight;
    m.box(wood ? 'wood' : 'trim', [w + 0.025, 0.035, d + 0.025], [x, y + 0.015, z]);
    if (f === 0 && level === 1) {
      opening(m, x - w * 0.19, y + 0.03, z + d / 2 + 0.015, 0.19, 0.29, group, true);
      opening(m, x + w * 0.27, y + 0.085, z + d / 2 + 0.015, 0.15, 0.21, group);
    } else
      for (const side of [-1, 1])
        opening(
          m,
          x + side * w * 0.25,
          y + 0.06,
          z + d / 2 + 0.015,
          0.15,
          0.26,
          group,
          f === 0 && side === -1,
        );
    for (const side of [-1, 1])
      for (const dz of [-0.22, 0.22]) {
        m.box('trim', [0.027, 0.245, 0.18], [x + side * (w / 2 + 0.008), y + 0.19, z + dz * d]);
        m.box('glass', [0.033, 0.205, 0.135], [x + side * (w / 2 + 0.025), y + 0.19, z + dz * d]);
      }
    if (wood) {
      for (let i = 1; i <= 3; i++)
        m.box('wood', [w, 0.012, 0.012], [x, y + (i * floorHeight) / 4, z + d / 2 + 0.004]);
      for (const side of [-1, 1])
        m.box(
          'wood',
          [0.032, floorHeight, 0.032],
          [x + side * w * 0.46, y + floorHeight / 2, z + d / 2 + 0.026],
        );
    }
    if (f > 0) {
      const balcony = wood ? 0.19 : 0.12;
      m.box(
        wood ? 'wood' : 'trim',
        [w + 0.03, 0.045, balcony],
        [x, y + 0.025, z + d / 2 + balcony / 2],
      );
      m.box(wood ? 'wood' : 'roof', [w + 0.025, 0.035, 0.025], [x, y + 0.17, z + d / 2 + balcony]);
      for (const dx of [-0.46, -0.23, 0, 0.23, 0.46])
        m.box(
          wood ? 'wood' : 'trim',
          [0.025, 0.14, 0.025],
          [x + w * dx, y + 0.095, z + d / 2 + balcony],
        );
    }
  }
  if (group === 7 && level === 3)
    tiledHip(m, w + 0.14, d + 0.16, 0.17, [x, bottom + floors * floorHeight, z]);
  else roof(m, group, w + 0.14, d + 0.16, x, bottom + floors * floorHeight, z);
}
export function assetHouseGeometry(group: number, level: number): ModelGeometry {
  if (
    !Number.isInteger(group) ||
    group < 0 ||
    group > 7 ||
    !Number.isInteger(level) ||
    level < 1 ||
    level > 4
  )
    throw new Error('Invalid house group or level');
  const key = `${group}:${level}`;
  if (cache.has(key)) return cache.get(key)!;
  const m = new Miniature();
  const raised = group === 1 || group === 2;
  const bottom = raised ? 0.21 : 0.025;
  const floors = level === 1 ? 1 : level === 4 ? 3 : 2;
  const wing = level >= 3;
  const width = wing ? 0.67 : 0.83,
    depth = 0.62,
    x = wing ? -0.19 : 0;
  if (raised) {
    m.box('wood', [width + 0.035, 0.045, depth + 0.15], [x, bottom - 0.025, 0.035]);
    for (const dx of [-1, 1])
      for (const dz of [-1, 1])
        m.box(
          'wood',
          [0.045, bottom, 0.045],
          [x + dx * width * 0.43, bottom / 2, dz * depth * 0.43],
        );
    for (let i = 0; i < 3; i++)
      m.box('wood', [0.24, 0.045, 0.105], [x - 0.16, 0.04 + i * 0.055, 0.59 - i * 0.075]);
  }
  block(m, group, level, x, 0, width, depth, floors, bottom);
  if (wing) {
    const wx = 0.32,
      ww = 0.37,
      wf = level === 4 ? 2 : 1;
    if (raised)
      for (const dx of [-1, 1])
        for (const dz of [-1, 1])
          m.box('wood', [0.04, bottom, 0.04], [wx + dx * ww * 0.4, bottom / 2, dz * 0.25]);
    block(m, group, 1, wx, -0.015, ww, 0.57, wf, bottom);
  }
  const parts = m.finish();
  cache.set(key, parts);
  return parts;
}
