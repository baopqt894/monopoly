import { hueLandmark, daNangLandmark } from './central-landmarks';
import { finishLandmark, fanSteps, coveredBridgeRoof, stoneBridgeBase } from './landmark-finishing';
import { marketLandmark } from './market-landmark';
import { CatmullRomCurve3, TubeGeometry, Vector3, ExtrudeGeometry, Shape } from 'three';
import {
  beam,
  lathe,
  steps,
  stairRails,
  finial,
  shutters,
  lotusShell,
  curvedSolid,
} from './landmark-craft';
import { curvedHip } from './roof-surfaces';
import { Miniature, type ModelGeometry } from '../vietnam/miniature';
import { landmarkColors } from './building-catalog';
import {
  archWall,
  archPath,
  windowDetail,
  stairs,
  tiledHip,
  pavilion,
  band,
  openingFrame,
} from './model-detail';
import { sweptGable } from './roof-surfaces';
const cache = new Map<string, ModelGeometry>();

/** Matching recessed windows on side elevations, rather than blank box walls. */
function sideWindow(m: Miniature, x: number, y: number, z: number, w: number, h: number) {
  const angle = x > 0 ? Math.PI / 2 : -Math.PI / 2;
  openingFrame(m, x, y, z, w, h, 'trim', false, 0.011, angle);
  m.arch('glass', w, h, 0.022, [x, y, z], angle);
  beam(m, 'wood', [0.028, h * 0.86, 0.007], [x + Math.sign(x) * 0.024, y + h * 0.43, z]);
  m.box('trim', [0.048, 0.017, w + 0.035], [x, y - 0.01, z]);
}
function colonial(m: Miniature, theater = false) {
  const w = theater ? 1.2 : 1.12,
    d = 0.7,
    h = theater ? 1.05 : 0.68;
  const doorXs = theater ? [-0.2, 0, 0.2] : [-0.13, 0.13];
  archWall(
    m,
    w,
    h,
    d,
    [0, 0.08, 0],
    doorXs.map((x) => ({ x, w: theater ? 0.16 : 0.22, h: theater ? 0.4 : 0.49 })),
  );

  for (const side of [-1, 1])
    for (const z of theater ? [-0.23, 0, 0.23] : [-0.2, 0.14]) {
      sideWindow(m, side * (w / 2 + 0.01), 0.15, z, 0.14, theater ? 0.33 : 0.39);
      if (theater) sideWindow(m, side * (w / 2 + 0.01), 0.66, z, 0.14, 0.32);
    }
  for (const x of [-0.43, 0.43]) {
    shutters(m, x, 0.17, 0.365, 0.12, theater ? 0.31 : 0.4);
    if (theater) shutters(m, x, 0.66, 0.365, 0.12, 0.33);
  }
  for (const x of doorXs) {
    openingFrame(
      m,
      x,
      0.095,
      0.365,
      theater ? 0.16 : 0.22,
      theater ? 0.4 : 0.49,
      'trim',
      false,
      0.023,
    );
    m.arch(theater ? 'wood' : 'glass', theater ? 0.16 : 0.22, theater ? 0.4 : 0.49, 0.018, [
      x,
      0.095,
      0.22,
    ]);
    if (theater) windowDetail(m, x, 0.66, 0.365, 0.15, 0.33);
  }
  for (const x of theater ? [-0.31, -0.1, 0.1, 0.31] : [-0.27, 0, 0.27]) {
    for (let floor = 0; floor < (theater ? 2 : 1); floor++) {
      const y = 0.12 + floor * 0.51,
        height = theater ? 0.43 : 0.51;
      m.cylinder('trim', 0.022, 0.03, height, [x, y + height / 2, 0.415], 10);
      beam(m, 'trim', [0.065, 0.04, 0.075], [x, y + 0.01, 0.415]);
      beam(m, 'trim', [0.07, 0.04, 0.08], [x, y + height, 0.415]);
    }
  }
  for (const x of [-w / 2, w / 2]) beam(m, 'trim', [0.045, h, 0.045], [x, h / 2 + 0.08, 0.35]);
  for (const y of [0.08, ...(theater ? [0.6] : []), h + 0.08])
    band(m, w + 0.07, d + 0.07, y, 0.045);
  curvedHip(
    m,
    w + 0.18,
    d + 0.19,
    theater ? 0.33 : 0.27,
    [0, h + 0.12, 0],
    'roof',
    'trim',
    false,
    0.32,
    theater ? 'trim' : 'roof',
  );
  if (theater) {
    m.panel(
      'trim',
      [
        [-0.36, 0],
        [0, 0.24],
        [0.36, 0],
      ],
      0.065,
      [0, h + 0.11, 0.375],
    );
    m.panel(
      'wall',
      [
        [-0.28, 0.035],
        [0, 0.2],
        [0.28, 0.035],
      ],
      0.02,
      [0, h + 0.12, 0.442],
    );
    for (const x of [-0.2, 0, 0.2]) {
      beam(m, 'trim', [0.18, 0.025, 0.09], [x, 0.66, 0.43]);
      for (const dx of [-0.065, 0, 0.065])
        beam(m, 'trim', [0.014, 0.07, 0.014], [x + dx, 0.7, 0.465]);
      beam(m, 'trim', [0.18, 0.02, 0.022], [x, 0.74, 0.465]);
    }
    for (const x of [-0.52, 0.52])
      for (const z of [-0.3, 0.3]) finial(m, x, h + 0.18, z, 0.65, 'trim');
    curvedHip(m, 0.49, 0.38, 0.22, [0, h + 0.32, -0.02], 'roof', 'trim', false, 0, 'trim');
    for (const x of [-0.22, 0.22]) finial(m, x, h + 0.56, -0.02, 0.8, 'trim');
  }
  steps(m, theater ? 0.79 : 0.63, 0.76, 0.14, 5, theater ? 'trim' : 'roof');
  stairRails(m, theater ? 0.79 : 0.63, 0.76, 0.14);
}
function steppedTower(m: Miniature, x: number, h: number, w: number) {
  m.box('wall', [w, h, w * 0.8], [x, h / 2 + 0.08, 0]);
  for (const y of [0.04, 0.09, 0.15, h + 0.08])
    beam(m, 'roof', [w + 0.08, 0.045, w * 0.8 + 0.08], [x, y, 0]);
  m.add(
    'wood',
    new ExtrudeGeometry(new Shape(archPath(w * 0.32, h * 0.6, true).getPoints(16)), {
      depth: 0.02,
      bevelEnabled: false,
    }),
    [x, 0.12, w * 0.4 + 0.005],
  );
  openingFrame(m, x, 0.11, w * 0.4 + 0.024, w * 0.34, h * 0.65, 'roof', true, 0.035);
  for (const side of [-1, 1]) {
    beam(m, 'roof', [0.055, h - 0.06, 0.065], [x + side * w * 0.4, h / 2 + 0.1, w * 0.42]);
    beam(m, 'roof', [0.04, h - 0.06, w * 0.7], [x + side * w * 0.46, h / 2 + 0.1, 0]);
  }
  for (let i = 0; i < 6; i++) {
    const tw = w * (1.04 - i * 0.145),
      y = h + 0.1 + i * 0.095;
    m.box('wall', [tw, 0.085, tw * 0.8], [x, y + 0.04, 0]);
    beam(m, 'roof', [tw + 0.025, 0.025, tw * 0.8 + 0.025], [x, y, 0]);
  }
}
function timberHall(m: Miniature, x: number, z: number, w: number, d: number, roofH: number) {
  beam(m, 'wall', [w, 0.27, d], [x, 0.315, z]);
  beam(m, 'wood', [w + 0.025, 0.04, d + 0.03], [x, 0.19, z]);
  for (const side of [-1, 1])
    for (const end of [-1, 1])
      beam(m, 'wood', [0.035, 0.24, 0.035], [x + side * w * 0.44, 0.12, z + end * d * 0.43]);
  const gableOutline: [number, number][] = [[-w / 2, 0]];
  for (let i = 0; i <= 20; i++) {
    const x = -w / 2 + (i * w) / 20,
      r = Math.abs(x) / (w * 0.59);
    const y =
      roofH * Math.pow(1 - r, 1.35) +
      roofH * 0.065 * r ** 6 +
      roofH * 0.12 * (d / (d + 0.16)) ** 4 * (1 - r * 0.7) -
      0.025;
    gableOutline.push([x, y]);
  }
  gableOutline.push([w / 2, 0]);
  m.panel('wall', gableOutline, 0.025, [x, 0.45, z + d / 2]);
  sweptGable(m, w * 1.18, d + 0.16, roofH, [x, 0.45, z], 'roof', 'wood');
  for (let i = -3; i <= 3; i++) {
    const dx = i * w * 0.135,
      r = Math.abs(dx) / (w * 0.59),
      h =
        roofH * Math.pow(1 - r, 1.35) +
        roofH * 0.12 * ((d + 0.04) / (d + 0.16)) ** 4 * (1 - r * 0.7) -
        0.035;
    beam(m, 'wood', [0.018, h + 0.27, 0.03], [x + dx, 0.18 + (h + 0.27) / 2, z + d / 2 + 0.02]);
  }
  for (let i = 0; i < 4; i++) {
    const h = (roofH * i) / 4,
      width = w * (1 - i / 4);
    beam(m, 'wood', [width, 0.018, 0.03], [x, 0.45 + h, z + d / 2 + 0.025]);
  }
  for (const y of [0.22, 0.43])
    beam(m, 'wood', [w + 0.015, 0.025, 0.025], [x, y, z + d / 2 + 0.025]);
}
/** Detailed native meshes follow all twenty silhouettes in landmarks-simple-revised.png. */
export function cityLandmarkGeometry(model: string): ModelGeometry {
  landmarkColors(model);
  if (cache.has(model)) return cache.get(model)!;
  const m = new Miniature();
  switch (model) {
    case 'temple':
      for (const [i, w, y, h] of [
        [0, 1.12, 0.08, 0.43],
        [1, 0.73, 0.72, 0.2],
        [2, 0.43, 1.13, 0.17],
      ]) {
        const d = w * 0.75;
        beam(m, i === 0 ? 'wall' : 'wood', [w, h, d], [0, y + h / 2, 0]);
        for (const x of [-w * 0.34, 0, w * 0.34]) {
          beam(m, 'wood', [w * 0.17, h * 0.77, 0.018], [x, y + h * 0.4, d / 2 + 0.015]);
          for (const side of [-1, 1])
            beam(
              m,
              'gold',
              [0.018, h * 0.92, 0.025],
              [x + side * w * 0.1, y + h * 0.47, d / 2 + 0.025],
            );
        }
        for (const side of [-1, 1]) {
          beam(m, 'gold', [0.035, h, 0.035], [side * w * 0.47, y + h / 2, d / 2 + 0.015]);
          beam(m, 'wood', [0.015, h * 0.65, d * 0.28], [side * (w / 2 + 0.006), y + h * 0.45, 0]);
        }
        beam(m, 'gold', [w + 0.025, 0.03, d + 0.025], [0, y + h, 0]);
        curvedHip(m, w + 0.24, d + 0.24, 0.23, [0, y + h, 0], 'roof', 'gold', true, 0, 'gold');
        for (const side of [-1, 1])
          for (const end of [-1, 1])
            m.curve(
              'gold',
              [
                [side * (w / 2 + 0.08), y + h + 0.025, end * (d / 2 + 0.12)],
                [side * (w / 2 + 0.12), y + h + 0.07, end * (d / 2 + 0.12)],
                [side * (w / 2 + 0.12), y + h + 0.11, end * (d / 2 + 0.11)],
              ],
              0.012,
            );
      }
      finial(m, 0, 1.56, 0, 1);
      steps(m, 0.56, 0.75, 0.14, 5);
      stairRails(m, 0.56, 0.75, 0.14);
      break;
    case 'villa':
      colonial(m);
      break;
    case 'theater':
      colonial(m, true);
      break;
    case 'khmer':
      m.box('wall', [0.78, 0.65, 0.79], [0, 0.405, 0]);
      beam(m, 'trim', [0.87, 0.08, 0.88], [0, 0.08, 0]);
      for (const x of [-0.29, 0.29]) {
        m.cylinder('gold', 0.03, 0.045, 0.61, [x, 0.405, 0.46], 12);
        beam(m, 'trim', [0.1, 0.055, 0.1], [x, 0.13, 0.46]);
      }
      beam(m, 'wood', [0.25, 0.43, 0.024], [0, 0.335, 0.412]);

      for (const side of [-1, 1])
        for (const z of [-0.23, 0.05, 0.27]) {
          beam(m, 'gold', [0.028, 0.39, 0.14], [side * 0.402, 0.39, z]);
          beam(m, 'wood', [0.032, 0.33, 0.095], [side * 0.419, 0.39, z]);
        }
      // Nested gable sections recede towards the back; they are not three full roofs piled vertically.
      for (let i = 0; i < 3; i++) {
        const y = 0.74 + i * 0.08,
          w = 1.03 - i * 0.13,
          z = -0.12 - i * 0.11,
          d = 1.0 - i * 0.16;
        sweptGable(m, w, d, 0.4, [0, y, z], 'roof', 'gold');
        m.panel(
          'gold',
          [
            [-w * 0.42, 0],
            [0, 0.4],
            [w * 0.42, 0],
          ],
          0.025,
          [0, y, z + d / 2 - 0.025],
        );
        m.panel(
          'wall',
          [
            [-w * 0.32, 0.025],
            [0, 0.37],
            [w * 0.32, 0.025],
          ],
          0.03,
          [0, y, z + d / 2],
        );
        for (const end of [-1, 1]) {
          const front = z + (end * d) / 2;
          m.curve(
            'gold',
            [
              [0, y + 0.4, front],
              [0, y + 0.5, front + end * 0.025],
              [0, y + 0.59, front],
            ],
            0.018,
          );
          for (const side of [-1, 1]) {
            const x = side * w * 0.49;
            m.curve(
              'gold',
              [
                [x * 0.8, y + 0.03, front],
                [x, y + 0.11, front],
                [x, y + 0.23, front],
              ],
              0.016,
            );
          }
        }
      }
      steps(m, 0.35, 0.76, 0.16, 5, 'roof');
      stairRails(m, 0.35, 0.76, 0.16);
      break;
    case 'hats':
      for (const [x, z, h, r] of [
        [0, -0.28, 0.74, 0.29],
        [-0.39, 0.22, 0.52, 0.25],
        [0.39, 0.22, 0.52, 0.25],
      ]) {
        m.cylinder('glass', r, r, h, [x, h / 2 + 0.07, z], 40);
        for (let i = 0; i < 16; i++) {
          const a = (i * Math.PI) / 8;
          beam(
            m,
            'wood',
            [0.012, h, 0.015],
            [x + Math.sin(a) * (r + 0.004), h / 2 + 0.07, z + Math.cos(a) * (r + 0.004)],
            [0, a, 0],
          );
        }
        for (const y of [0.07, h * 0.36, h * 0.69, h + 0.07])
          m.cylinder('wood', r + 0.01, r + 0.01, 0.014, [x, y, z], 40);
        for (const side of [-1, 1])
          m.cylinder('wall', 0.025, 0.03, h, [x + side * r * 0.87, h / 2 + 0.07, z + r * 0.52], 12);
        lathe(
          m,
          'trim',
          [
            [r + 0.12, 0],
            [r + 0.12, 0.02],
            [r * 0.88, 0.12],
            [r * 0.45, 0.28],
            [0.005, 0.39],
          ],
          [x, h + 0.055, z],
        );
        m.cylinder('trim', r + 0.025, r + 0.03, 0.045, [x, 0.06, z], 40);
      }
      beam(m, 'glass', [0.28, 0.38, 0.13], [0, 0.25, 0.06]);
      beam(m, 'roof', [0.25, 0.14, 0.29], [0, 0.07, 0.145]);
      fanSteps(m);
      break;
    case 'sail':
      m.box('water', [1.2, 0.012, 0.65], [0, 0.006, 0]);
      // Rounded shell hull, not a solid flat triangular prism.
      lathe(
        m,
        'trim',
        [
          [0.13, 0],
          [0.31, 0.035],
          [0.48, 0.12],
          [0.62, 0.32],
          [0.55, 0.26],
          [0.4, 0.13],
          [0.17, 0.08],
        ],
        [0, 0.015, 0],
        48,
        [1, 1, 0.38],
      );
      m.cylinder('trim', 0.012, 0.025, 1.65, [0.04, 1.02, 0.14], 14);
      for (const side of [-1, 1]) {
        const sail = new Shape();
        sail.moveTo(0.04, 0);
        sail.quadraticCurveTo(side * 0.28, 0.08, side * 0.55, 0);
        sail.quadraticCurveTo(side * 0.2, 0.62, 0.04, 1.37);
        sail.closePath();
        m.add(
          'trim',
          curvedSolid(
            new ExtrudeGeometry(sail, {
              depth: 0.025,
              bevelEnabled: true,
              bevelSegments: 1,
              bevelSize: 0.006,
              bevelThickness: 0.006,
              curveSegments: 16,
            }),
            (x, y) =>
              side * 0.1 * Math.sin((Math.PI * y) / 1.37) * (1 - Math.min(1, Math.abs(x) / 0.56)),
          ),
          [0, 0.36, 0],
        );
      }
      for (let i = 0; i < 4; i++)
        beam(m, 'trim', [0.27 - i * 0.045, 0.025, 0.04], [0.04, 0.61 + i * 0.235, 0.16]);
      m.curve(
        'trim',
        [
          [-0.58, 0.3, 0.06],
          [0.04, 1.84, 0.015],
          [0.57, 0.3, 0.06],
        ],
        0.007,
      );
      break;
    case 'coffee':
      timberHall(m, -0.39, -0.05, 0.48, 0.7, 0.59);
      timberHall(m, 0.39, -0.05, 0.48, 0.7, 0.59);
      timberHall(m, 0, 0.13, 0.59, 0.8, 0.77);
      for (const x of [-0.62, -0.3, 0, 0.3, 0.62])
        for (const z of [-0.34, 0.43]) beam(m, 'wood', [0.035, 0.32, 0.035], [x, 0.16, z]);
      break;
    case 'rong':
      for (const x of [-0.32, 0, 0.32])
        for (const z of [-0.24, 0.24]) beam(m, 'wood', [0.045, 0.28, 0.045], [x, 0.14, z]);
      m.box('wood', [0.78, 0.29, 0.6], [0, 0.4, 0]);
      beam(m, 'trim', [0.81, 0.04, 0.64], [0, 0.27, 0]);
      sweptGable(m, 0.98, 0.77, 1.15, [0, 0.55, 0], 'roof', 'roof', 0.025);
      m.box('roof', [0.05, 0.045, 0.8], [0, 1.738, 0]);
      const rongGable: [number, number][] = [[-0.39, 0]];
      for (let j = 0; j <= 20; j++) {
        const x = -0.39 + (j * 0.78) / 20,
          r = Math.abs(x) / 0.49;
        rongGable.push([
          x,
          1.15 * Math.pow(1 - r, 1.35) +
            1.15 * 0.065 * r ** 6 +
            1.15 * 0.025 * (0.61 / 0.77) ** 4 * (1 - r * 0.7) -
            0.012,
        ]);
      }
      rongGable.push([0.39, 0]);
      m.panel('wood', rongGable, 0.022, [0, 0.55, 0.305]);
      for (let i = -3; i <= 3; i++) {
        beam(m, 'trim', [0.014, 0.26, 0.025], [i * 0.11, 0.4, 0.315]);
        const h = 1.15 * (1 - Math.abs(i) / 3.5);
        beam(m, 'wood', [0.015, h, 0.02], [i * 0.1, 0.55 + h / 2, 0.33]);
      }
      for (let j = 0; j < 6; j++)
        beam(m, 'wood', [0.21, 0.04, 0.085], [0, 0.025 + j * 0.043, 0.68 - j * 0.055]);
      for (const side of [-1, 1]) beam(m, 'wood', [0.028, 0.32, 0.028], [side * 0.13, 0.16, 0.39]);
      break;
    case 'cham':
      steppedTower(m, -0.34, 0.88, 0.49);
      steppedTower(m, 0.34, 0.72, 0.44);
      break;
    case 'lotus':
      for (let i = 0; i < 3; i++)
        m.cylinder('trim', 0.48 - i * 0.03, 0.5 - i * 0.03, 0.04, [0, 0.02 + i * 0.04, 0], 48);

      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        lotusShell(m, a, i % 2 ? 1.04 : 1.25, 0.3, 0.27);
      }
      for (let i = 0; i < 3; i++)
        lotusShell(m, (i * Math.PI * 2) / 3 + Math.PI / 3, 1.59, 0.13, 0.19);
      finial(m, 0, 1.72, 0, 0.35, 'wall');
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        for (let j = 0; j < 3; j++) {
          const r = 0.09 + j * 0.035;
          const pts: [number, number, number][] = [];
          for (let k = 0; k <= 12; k++) {
            const t = (k / 12) * Math.PI;
            pts.push([
              Math.sin(a) * (0.37 + Math.sin(t) * r * 0.35) + Math.cos(a) * Math.cos(t) * r,
              0.11 + Math.sin(t) * r,
              Math.cos(a) * (0.37 + Math.sin(t) * r * 0.35) - Math.sin(a) * Math.cos(t) * r,
            ]);
          }
          m.add(
            'trim',
            new TubeGeometry(
              new CatmullRomCurve3(pts.map((p) => new Vector3(...p))),
              12,
              0.012,
              6,
              false,
            ),
            [0, 0, 0],
          );
        }
      }
      break;
    case 'water-tower': {
      lathe(
        m,
        'wall',
        [
          [0.3, 0],
          [0.3, 0.06],
          [0.26, 0.1],
          [0.23, 0.15],
          [0.19, 1.03],
          [0.3, 1.15],
          [0.36, 1.21],
          [0.36, 1.5],
          [0.38, 1.52],
        ],
        [0, 0, 0],
        8,
      );
      for (let i = 0; i < 8; i++) {
        const a = Math.PI / 8 + (i * Math.PI) / 4,
          r = 0.218;
        const x = Math.sin(a) * r,
          z = Math.cos(a) * r;
        m.arch('glass', 0.07, 0.69, 0.015, [x, 0.24, z], a);
        openingFrame(m, x, 0.24, z, 0.072, 0.7, 'trim', false, 0.015, a);
        beam(m, 'trim', [0.02, 0.25, 0.02], [Math.sin(a) * 0.356, 1.36, Math.cos(a) * 0.356]);
        beam(
          m,
          'trim',
          [0.19, 0.018, 0.024],
          [Math.sin(a) * 0.341, 1.26, Math.cos(a) * 0.341],
          [0, a, 0],
        );
        beam(
          m,
          'trim',
          [0.19, 0.018, 0.024],
          [Math.sin(a) * 0.341, 1.47, Math.cos(a) * 0.341],
          [0, a, 0],
        );
      }
      for (const y of [0.08, 1.17, 1.22, 1.51])
        m.cylinder('trim', y < 0.1 ? 0.31 : 0.38, y < 0.1 ? 0.31 : 0.38, 0.035, [0, y, 0], 8);
      for (let i = 0; i < 3; i++) {
        const r = 0.4 - i * 0.11,
          y = 1.54 + i * 0.13;
        m.cone('roof', r, 0.16, [0, y + 0.06, 0], 8);
        m.cylinder('trim', r * 0.81, r * 0.81, 0.035, [0, y, 0], 8);
      }
      break;
    }
    case 'imperial': {
      hueLandmark(m);
      break;
    }
    case 'dragon': {
      daNangLandmark(m);
      break;
    }
    case 'bridge': {
      beam(m, 'water', [1.38, 0.012, 0.72], [0, 0.022, 0]);
      stoneBridgeBase(m);
      for (const x of [-0.48, 0, 0.48]) {
        const center = x === 0,
          base = center ? 0.43 : 0.38;
        beam(m, 'wood', [0.44, 0.32, 0.47], [x, base + 0.16, 0]);
        beam(m, 'glass', [0.39, 0.25, 0.02], [x, base + 0.17, 0.245]);
        for (const dx of [-0.19, 0, 0.19])
          beam(m, 'wood', [0.025, 0.37, 0.025], [x + dx, base + 0.18, 0.27]);
        for (let j = 0; j < 7; j++)
          beam(m, 'wood', [0.009, 0.08, 0.014], [x - 0.17 + j * 0.056, base + 0.055, 0.28]);
        beam(m, 'wood', [0.43, 0.018, 0.025], [x, base + 0.1, 0.28]);
      }
      coveredBridgeRoof(m);
      beam(m, 'gold', [0.025, 0.32, 0.48], [0.697, 0.55, 0]);
      beam(m, 'wood', [0.032, 0.19, 0.16], [0.716, 0.56, 0]);
      break;
    }
    case 'gate': {
      archWall(m, 1.29, 0.68, 0.71, [0, 0, 0], [{ x: 0, w: 0.33, h: 0.48 }], 0.18);
      beam(m, 'trim', [1.01, 0.06, 0.77], [0, 0.71, 0]);
      for (const side of [-1, 1]) {
        beam(m, 'wall', [0.12, 0.12, 0.7], [side * 0.46, 0.79, 0]);
        beam(m, 'trim', [0.14, 0.03, 0.72], [side * 0.46, 0.85, 0]);
      }
      beam(m, 'wood', [0.55, 0.31, 0.46], [0, 0.91, 0]);
      beam(m, 'glass', [0.4, 0.22, 0.025], [0, 0.94, 0.242]);
      for (const side of [-1, 1])
        for (const z of [-0.23, 0.23])
          beam(m, 'trim', [0.045, 0.34, 0.045], [side * 0.25, 0.93, z]);
      for (const x of [-0.13, 0.13]) beam(m, 'wood', [0.1, 0.23, 0.025], [x, 0.96, 0.25]);
      curvedHip(m, 0.8, 0.68, 0.24, [0, 1.09, 0], 'roof', 'trim');
      for (const side of [-1, 1]) finial(m, side * 0.25, 1.34, 0, 0.5, 'trim');
      break;
    }
    case 'church': {
      archWall(m, 0.61, 0.72, 0.43, [0, 0, 0], [{ x: 0, w: 0.29, h: 0.58, pointed: true }]);
      archWall(m, 0.52, 0.86, 0.39, [0, 0.76, 0], [{ x: 0, w: 0.26, h: 0.73, pointed: true }]);
      openingFrame(m, 0, 0.015, 0.228, 0.3, 0.6, 'roof', true, 0.035);
      openingFrame(m, 0, 0.78, 0.208, 0.27, 0.75, 'roof', true, 0.03);
      m.panel(
        'wall',
        [
          [-0.27, 0],
          [0, 0.39],
          [0.27, 0],
        ],
        0.39,
        [0, 1.59, -0.195],
      );
      for (const side of [-1, 1]) {
        for (let j = 0; j < 5; j++)
          beam(m, 'roof', [0.11, 0.17, 0.5], [side * (0.39 - j * 0.025), 0.09 + j * 0.22, 0]);
        beam(m, 'roof', [0.065, 1.62, 0.47], [side * 0.25, 0.83, 0]);
        beam(m, 'roof', [0.07, 0.3, 0.07], [side * 0.2, 1.63, 0]);
      }
      for (const y of [0.08, 0.71, 0.77, 1.57]) band(m, 0.65, 0.49, y, 0.04, 'roof');
      for (let j = 0; j < 5; j++)
        beam(m, 'roof', [0.48 - j * 0.08, 0.065, 0.43], [0, 1.64 + j * 0.075, 0]);
      break;
    }
    case 'pagoda': {
      m.box('wall', [0.61, 0.29, 0.49], [0, 0.245, 0]);
      for (const x of [-0.15, 0.15]) {
        beam(m, 'wood', [0.15, 0.23, 0.025], [x, 0.22, 0.253]);
        for (const side of [-1, 1])
          beam(m, 'trim', [0.018, 0.26, 0.03], [x + side * 0.085, 0.23, 0.27]);
      }
      curvedHip(m, 0.78, 0.66, 0.11, [0, 0.4, 0], 'roof', 'gold', true, 0);
      for (let i = 0; i < 7; i++) {
        const w = 0.52 - i * 0.045,
          y = 0.52 + i * 0.19;
        beam(m, 'wall', [w, 0.14, w * 0.8], [0, y + 0.07, 0]);
        for (const x of [-w * 0.28, 0, w * 0.28]) {
          beam(m, 'wood', [w * 0.17, 0.09, 0.018], [x, y + 0.065, w * 0.4 + 0.006]);
          beam(m, 'trim', [0.01, 0.115, 0.02], [x - w * 0.095, y + 0.065, w * 0.4 + 0.015]);
        }
        for (const side of [-1, 1])
          beam(m, 'wood', [0.015, 0.09, w * 0.28], [side * (w / 2 + 0.006), y + 0.065, 0]);
        curvedHip(m, w + 0.16, w * 0.8 + 0.16, 0.09, [0, y + 0.14, 0], 'roof', 'gold', true, 0);
      }
      beam(m, 'trim', [0.72, 0.1, 0.64], [0, 0.05, 0]);
      steps(m, 0.28, 0.54, 0.12, 4);
      stairRails(m, 0.28, 0.54, 0.12);
      finial(m, 0, 1.96, 0, 0.85);
      break;
    }
    case 'museum': {
      for (const [x, z, w, h] of [
        [-0.42, 0.035, 0.46, 0.7],
        [0, -0.15, 0.51, 0.95],
        [0.42, 0.16, 0.45, 0.58],
      ]) {
        beam(m, 'glass', [w, h, 0.57], [x, h / 2, z]);
        beam(m, 'wall', [w + 0.008, 0.012, 0.58], [x, h, z]);
        for (let i = 0; i < 5; i++) {
          beam(m, 'wall', [0.009, h, 0.014], [x - w / 2 + (i * w) / 4, h / 2, z + 0.291]);
          beam(m, 'wall', [0.014, h, 0.009], [x + w / 2 + 0.006, h / 2, z - 0.285 + i * 0.1425]);
        }
        for (const y of [h * 0.3, h * 0.61]) {
          beam(m, 'wall', [w, 0.01, 0.014], [x, y, z + 0.291]);
          beam(m, 'wall', [0.014, 0.01, 0.57], [x + w / 2 + 0.006, y, z]);
        }
        for (const side of [-1, 1])
          beam(m, 'gold', [0.04, h * 0.19, 0.003], [x + side * w * 0.2, h * 0.19, z + 0.289]);
      }
      steps(m, 0.44, 0.6, 0.1, 4);
      break;
    }
    case 'turtle': {
      beam(m, 'water', [1.18, 0.012, 0.91], [0, 0.006, 0]);
      for (const [w, h, y] of [
        [0.65, 0.35, 0.05],
        [0.5, 0.3, 0.43],
        [0.32, 0.25, 0.76],
      ]) {
        const depth = w * 0.75;
        const frontHoles = (w > 0.4 ? [-w * 0.28, 0, w * 0.28] : [0]).map((x) => ({
          x,
          w: w > 0.4 ? 0.12 : 0.13,
          h: h * 0.82,
        }));
        for (const side of [-1, 1]) {
          archWall(
            m,
            w,
            h,
            0.045,
            [0, y, side * (depth / 2 - 0.0225)],
            frontHoles,
            0,
            'wood',
            side === 1 ? 0 : Math.PI,
          );
          const holes = (w > 0.4 ? [-depth * 0.25, depth * 0.25] : [0]).map((x) => ({
            x,
            w: w > 0.4 ? 0.105 : 0.1,
            h: h * 0.77,
          }));
          archWall(
            m,
            depth - 0.07,
            h,
            0.045,
            [side * (w / 2 - 0.0225), y, 0],
            holes,
            0,
            'wood',
            (side * Math.PI) / 2,
          );
        }
        beam(m, 'trim', [w + 0.08, 0.035, w * 0.75 + 0.08], [0, y + h + 0.016, 0]);
        for (const side of [-1, 1]) {
          // Side arches match the same rhythm and remain dark rather than turquoise windows.
          beam(m, 'trim', [0.025, h, 0.025], [side * w * 0.46, y + h / 2, w * 0.39]);
          finial(m, side * (w / 2 + 0.015), y + h + 0.04, w * 0.35, 0.25, 'trim');
        }
      }
      beam(m, 'trim', [0.73, 0.035, 0.57], [0, 0.035, 0]);
      curvedHip(m, 0.45, 0.39, 0.13, [0, 1.04, 0], 'roof', 'trim', false, 0);
      finial(m, 0, 1.2, 0, 0.55, 'trim');
      break;
    }
    case 'market':
      marketLandmark(m);
      break;
    default:
      throw new Error('Unknown detailed landmark: ' + model);
  }
  if (model !== 'imperial' && model !== 'dragon') finishLandmark(m, model);
  const parts = m.finish();
  if (model === 'rong')
    for (const geometry of Object.values(parts)) {
      geometry.rotateY(Math.PI / 2);
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }
  // Keep the wider final-tier models inside the existing construction zone.
  if (model === 'lotus')
    for (const geometry of Object.values(parts)) {
      geometry.scale(1.15, 0.93, 1.15);
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }
  if (model === 'market')
    for (const geometry of Object.values(parts)) {
      geometry.scale(0.94, 1, 0.87);
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }
  cache.set(model, parts);
  return parts;
}
