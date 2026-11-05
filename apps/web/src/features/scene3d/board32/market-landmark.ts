import {
  BufferGeometry,
  CircleGeometry,
  Float32BufferAttribute,
  ExtrudeGeometry,
  Shape,
} from 'three';
import { Miniature } from '../vietnam/miniature';
import { beam, finial } from './landmark-craft';
import { archWall, openingFrame } from './model-detail';
type V = [number, number, number];

/** Planar hip roofs with one clean ridge, without stacked roofs or projecting ridge blocks. */
function marketRoof(m: Miniature, w: number, d: number, h: number, at: V, pyramid = false) {
  const r = pyramid ? 0 : d * 0.23;
  const vertices: V[] = [
    [-w / 2, 0, -d / 2],
    [w / 2, 0, -d / 2],
    [w / 2, 0, d / 2],
    [-w / 2, 0, d / 2],
    [0, h, -r],
    [0, h, r],
  ];
  const faces = [0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 3, 3, 5, 4, 3, 4, 0];
  const positions: number[] = [],
    uv: number[] = [];
  for (const i of faces) {
    const [x, y, z] = vertices[i];
    positions.push(x, y, z);
    uv.push(x / w + 0.5, z / d + 0.5);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  m.add('roof', g, at);
  for (const side of [-1, 1]) {
    m.box('trim', [w + 0.006, 0.014, 0.018], [at[0], at[1] - 0.009, at[2] + (side * d) / 2]);
    m.box('trim', [0.018, 0.014, d + 0.006], [at[0] + (side * w) / 2, at[1] - 0.009, at[2]]);
  }
  if (!pyramid) m.box('roof', [0.016, 0.015, r * 2 + 0.012], [at[0], at[1] + h, at[2]]);
}
function window(m: Miniature, at: V, angle = 0) {
  const [x, y, z] = at,
    w = 0.096,
    h = 0.254;
  // Dark slim frames and mullions, matching the market sheet instead of white bars.
  openingFrame(m, x, y, z, w, h, 'trim', false, 0.007, angle);
  m.arch(
    'glass',
    w,
    h,
    0.009,
    [x + Math.sin(angle) * 0.006, y, z + Math.cos(angle) * 0.006],
    angle,
  );
  const position = (dx: number, dy: number, dz: number): V => [
    x + dx * Math.cos(angle) + dz * Math.sin(angle),
    y + dy,
    z - dx * Math.sin(angle) + dz * Math.cos(angle),
  ];
  beam(m, 'wood', [0.005, h * 0.88, 0.011], position(0, h * 0.44, 0.018), [0, angle, 0]);
  beam(m, 'wood', [w, 0.006, 0.011], position(0, h * 0.64, 0.018), [0, angle, 0]);
}
function clock(m: Miniature, at: V, angle: number) {
  const position = (x: number, y: number, z: number): V => [
    at[0] + x * Math.cos(angle) + z * Math.sin(angle),
    at[1] + y,
    at[2] - x * Math.sin(angle) + z * Math.cos(angle),
  ];
  m.add('trim', new CircleGeometry(0.12, 64), position(0, 0, 0), [0, angle, 0]);
  m.add('green', new CircleGeometry(0.112, 64), position(0, 0, 0.002), [0, angle, 0]);
  for (const [theta, length, width] of [
    [-Math.PI / 3, 0.063, 0.007],
    [Math.PI / 3, 0.088, 0.005],
  ]) {
    beam(
      m,
      'gold',
      [width, length, 0.008],
      position((Math.sin(theta) * length) / 2, (Math.cos(theta) * length) / 2, 0.009),
      [0, angle, -theta],
    );
  }
  m.ball('gold', [0.008, 0.008, 0.008], position(0, 0, 0.014));
}

/** Dedicated Ben Thanh composition, measured against the approved v2 close-up. */
export function marketLandmark(m: Miniature) {
  // Four low wings leave the entrance and tower separate and keep valleys out of sight.
  for (const side of [-1, 1]) {
    const x = side * 0.409;
    m.box('wall', [0.427, 0.4, 0.9], [x, 0.2, -0.01]);
    marketRoof(m, 0.53, 0.55, 0.175, [x, 0.412, 0.215]);
    marketRoof(m, 0.53, 0.51, 0.165, [x, 0.49, -0.285]);
    // Rear wings rise only at the rear and do not intersect the front facade.
    m.box('wall', [0.427, 0.08, 0.43], [x, 0.44, -0.245]);
    for (const dx of [-0.103, 0.103]) window(m, [x + dx, 0.023, 0.445]);
    for (const z of [-0.29, 0.02, 0.33]) window(m, [side * 0.628, 0.023, z], (side * Math.PI) / 2);
    // Thin corner piers, foundation and cornice bands stay flush with the wall.
    for (const dx of [-0.207, 0.207]) m.box('trim', [0.018, 0.392, 0.021], [x + dx, 0.201, 0.444]);
    m.box('trim', [0.435, 0.022, 0.91], [x, 0.018, -0.01]);
  }
  // A slim square clock tower, recessed ventilation strip and a true pyramidal roof.
  const towerZ = -0.085;
  m.box('wall', [0.37, 1.035, 0.37], [0, 0.5175, towerZ]);
  for (const side of [-1, 1])
    for (const end of [-1, 1])
      m.box('trim', [0.014, 0.59, 0.014], [side * 0.18, 0.745, towerZ + end * 0.18]);
  for (const y of [1.006, 1.08]) m.box('trim', [0.405, 0.022, 0.405], [0, y, towerZ]);
  m.box('wall', [0.37, 0.062, 0.37], [0, 1.045, towerZ]);
  beam(m, 'glass', [0.283, 0.035, 0.012], [0, 1.044, towerZ + 0.188]);
  beam(m, 'glass', [0.012, 0.035, 0.283], [0.188, 1.044, towerZ]);
  for (const side of [-1, 1])
    for (const end of [-1, 1])
      beam(m, 'trim', [0.015, 0.06, 0.015], [side * 0.177, 1.045, towerZ + end * 0.177]);
  marketRoof(m, 0.495, 0.495, 0.187, [0, 1.105, towerZ], true);
  finial(m, 0, 1.305, towerZ, 0.32, 'trim');
  clock(m, [0, 0.858, towerZ + 0.189], 0);
  clock(m, [0.189, 0.858, towerZ], Math.PI / 2);

  // Deep entrance portal and a thin front pediment; the roof runs back to the tower.
  archWall(m, 0.397, 0.497, 0.195, [0, 0, 0.42], [{ x: 0, w: 0.244, h: 0.407 }]);
  beam(m, 'wood', [0.242, 0.407, 0.008], [0, 0.211, 0.326]);
  for (const side of [-1, 1]) {
    m.box('trim', [0.019, 0.474, 0.026], [side * 0.18, 0.243, 0.527]);
    m.box('wall', [0.016, 0.465, 0.016], [side * 0.145, 0.239, 0.532]);
  }
  const front = new Shape();
  front.moveTo(-0.222, 0);
  front.lineTo(0, 0.147);
  front.lineTo(0.222, 0);
  front.closePath();
  m.add(
    'wall',
    new ExtrudeGeometry(front, { depth: 0.022, bevelEnabled: false }),
    [0, 0.498, 0.511],
  );
  const roof = new BufferGeometry();
  roof.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        -0.238, 0.496, 0.548, 0, 0.66, 0.548, 0, 0.66, 0.087, -0.238, 0.496, 0.548, 0, 0.66, 0.087,
        -0.238, 0.496, 0.087, 0, 0.66, 0.548, 0.238, 0.496, 0.548, 0.238, 0.496, 0.087, 0, 0.66,
        0.548, 0.238, 0.496, 0.087, 0, 0.66, 0.087,
      ],
      3,
    ),
  );
  roof.setAttribute(
    'uv',
    new Float32BufferAttribute(
      [0, 0, 0.5, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0.5, 1, 1, 1, 0, 0, 1, 1, 1, 0],
      2,
    ),
  );
  roof.computeVertexNormals();
  m.add('trim', roof, [0, 0, 0]);
  beam(m, 'glass', [0.053, 0.066, 0.008], [0, 0.527, 0.54]);
  for (const side of [-1, 1])
    m.box(
      'trim',
      [0.291, 0.018, 0.025],
      [side * 0.119, 0.582, 0.552],
      [0, 0, -side * Math.atan2(0.164, 0.238)],
    );
}
