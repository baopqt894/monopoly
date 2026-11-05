import { BufferGeometry, Vector2, ExtrudeGeometry, Float32BufferAttribute, Shape } from 'three';
import { Miniature, type Surface } from '../vietnam/miniature';
import { beam, finial } from './landmark-craft';
import { archPath, openingFrame } from './model-detail';
type V = [number, number, number];
function frontBand(m: Miniature, w: number, y: number, z: number, part: Surface = 'trim') {
  m.box(part, [w, 0.018, 0.028], [0, y, z]);
}
function post(
  m: Miniature,
  x: number,
  y: number,
  z: number,
  h: number,
  part: Surface = 'trim',
  r = 0.018,
) {
  m.cylinder(part, r, r * 1.12, h, [x, y + h / 2, z], 10);
  m.box(part, [r * 3, 0.025, r * 3], [x, y + 0.012, z]);
  m.box(part, [r * 3.1, 0.025, r * 3.1], [x, y + h - 0.012, z]);
}
/** Semicircular entry steps, stopping at the facade rather than passing through the glass. */
export function fanSteps(m: Miniature) {
  for (let i = 0; i < 4; i++) {
    const r = 0.36 - i * 0.036,
      h = 0.035 * (i + 1),
      s = new Shape();
    s.moveTo(-r, 0);
    s.absarc(0, 0, r, Math.PI, 0, true);
    s.closePath();
    const g = new ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 32 });
    g.rotateX(Math.PI / 2);
    m.add('roof', g, [0, h, 0.28]);
  }
}
/** Raised middle arch and sloped stone parapet follow the bridge's curved walking deck. */
export function stoneBridgeBase(m: Miniature) {
  const shape = new Shape();
  shape.moveTo(-0.68, 0);
  shape.lineTo(0.68, 0);
  shape.lineTo(0.68, 0.3);
  shape.quadraticCurveTo(0.35, 0.405, 0, 0.447);
  shape.quadraticCurveTo(-0.35, 0.405, -0.68, 0.3);
  shape.closePath();
  for (const [x, w, h] of [
    [-0.45, 0.24, 0.22],
    [0, 0.42, 0.315],
    [0.45, 0.24, 0.22],
  ]) {
    const path = archPath(w, h),
      points = path.getPoints(16);
    const shifted = new Shape(points.map((p) => p.clone().add(new Vector2(x, 0.012))));
    shape.holes.push(shifted);
    openingFrame(m, x, 0.012, 0.271, w, h, 'trim', false, 0.011);
  }
  m.add(
    'wall',
    new ExtrudeGeometry(shape, { depth: 0.53, bevelEnabled: false, curveSegments: 16 }),
    [0, 0, -0.265],
  );
  for (const z of [-0.28, 0.28])
    m.curve(
      'trim',
      [
        [-0.68, 0.315, z],
        [-0.35, 0.414, z],
        [0, 0.457, z],
        [0.35, 0.414, z],
        [0.68, 0.315, z],
      ],
      0.012,
    );
}
/** One connected three-bay roof instead of overlapping hip roofs on Chua Cau. */
export function coveredBridgeRoof(m: Miniature) {
  const positions: number[] = [],
    uv: number[] = [];
  const point = (u: number, v: number): V => {
    const x = (u - 0.5) * 1.46,
      z = (v - 0.5) * 0.7,
      t = Math.abs(v * 2 - 1);
    const crown = 0.11 * (1 - Math.min(1, Math.abs(x) / 0.64));
    return [x, 0.735 + crown + 0.21 * Math.pow(1 - t, 1.3) + 0.02 * Math.pow(t, 6), z];
  };
  const nx = 32,
    nz = 16;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++)
      for (const [a, b] of [
        [0, 0],
        [1, 1],
        [1, 0],
        [0, 0],
        [0, 1],
        [1, 1],
      ]) {
        const u = (i + a) / nx,
          v = (j + b) / nz;
        positions.push(...point(u, v));
        uv.push(u, v);
      }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  m.add('roof', g, [0, 0, 0]);
  for (const v of [0, 0.5, 1]) {
    const pts: V[] = [];
    for (let i = 0; i <= 16; i++) {
      const p = point(i / 16, v);
      p[1] += 0.012;
      pts.push(p);
    }
    m.curve('trim', pts, v === 0.5 ? 0.016 : 0.012);
  }
  for (const u of [0, 0.34, 0.66, 1]) {
    const pts: V[] = [];
    for (let i = 0; i <= 16; i++) {
      const p = point(u, i / 16);
      p[1] += 0.015;
      pts.push(p);
    }
    m.curve('trim', pts, 0.012);
    const p = point(u, 0.5);
    finial(m, p[0], p[1] + 0.02, 0, 0.3, 'trim');
  }
}
function pointedHood(
  m: Miniature,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  part: Surface = 'roof',
) {
  const length = Math.hypot(w / 2, h),
    angle = Math.atan2(h, w / 2);
  for (const side of [-1, 1])
    m.box('roof', [length, 0.032, 0.05], [x + (side * w) / 4, y + h / 2, z], [0, 0, -side * angle]);
}
/** Per-city architectural finish; no arbitrary decorations or extra property plinths. */
export function finishLandmark(m: Miniature, model: string) {
  switch (model) {
    case 'temple':
      for (const x of [-0.48, -0.23, 0.23, 0.48]) {
        post(m, x, 0.085, 0.455, 0.414, 'gold', 0.018);
        m.box('trim', [0.065, 0.04, 0.07], [x, 0.1, 0.455]);
      }
      frontBand(m, 1.15, 0.1, 0.44);
      frontBand(m, 1.15, 0.49, 0.44, 'gold');
      for (const side of [-1, 1])
        for (const z of [-0.25, 0.25])
          beam(m, 'gold', [0.024, 0.39, 0.024], [side * 0.566, 0.29, z]);
      break;
    case 'villa':
      for (const x of [-0.56, 0.56])
        for (const z of [-0.34, 0.34]) m.box('trim', [0.085, 0.07, 0.085], [x, 0.12, z]);
      for (const y of [0.61, 0.67, 0.73]) frontBand(m, 1.19, y, 0.369);
      for (const x of [-0.27, 0, 0.27]) m.box('trim', [0.075, 0.032, 0.085], [x, 0.64, 0.414]);
      for (const x of [-0.43, 0.43]) m.box('trim', [0.17, 0.018, 0.055], [x, 0.155, 0.38]);
      break;
    case 'khmer':
      for (const x of [-0.16, 0.16]) post(m, x, 0.12, 0.437, 0.44, 'gold', 0.016);
      m.box('gold', [0.37, 0.055, 0.06], [0, 0.585, 0.44]);
      pointedHood(m, 0, 0.58, 0.447, 0.42, 0.18, 'gold');
      for (const side of [-1, 1])
        for (const z of [-0.33, -0.08, 0.18, 0.36])
          post(m, side * 0.425, 0.13, z, 0.54, 'gold', 0.013);
      // Gable relief follows the layered triangular pediment on the sheet.
      for (let i = -2; i <= 2; i++) {
        const h = 0.21 * (1 - Math.abs(i) * 0.3);
        beam(m, 'gold', [0.012, h, 0.025], [i * 0.062, 0.77 + h / 2, 0.398]);
      }
      break;
    case 'hats':
      for (const [x, z, h, r] of [
        [0, -0.28, 0.74, 0.29],
        [-0.39, 0.22, 0.52, 0.25],
        [0.39, 0.22, 0.52, 0.25],
      ]) {
        for (const side of [-1, 1]) {
          const px = x + side * r * 0.87,
            pz = z + r * 0.52;
          m.cylinder('trim', 0.039, 0.039, 0.028, [px, 0.085, pz], 12);
          m.cylinder('trim', 0.035, 0.035, 0.025, [px, h + 0.045, pz], 12);
        }
      }
      break;
    case 'sail':
      // Two raised gunwales read as a shell hull rather than a flat canoe cutout.
      for (const z of [-0.13, 0.13])
        m.curve(
          'trim',
          [
            [-0.6, 0.335, z * 0.24],
            [-0.36, 0.23, z],
            [0, 0.205, z * 1.32],
            [0.36, 0.23, z],
            [0.6, 0.335, z * 0.24],
          ],
          0.018,
        );
      m.curve(
        'trim',
        [
          [-0.48, 0.12, 0.04],
          [0, 0.065, 0.1],
          [0.48, 0.12, 0.04],
        ],
        0.014,
      );
      m.cylinder('trim', 0.17, 0.22, 0.045, [0, 0.034, 0], 32);
      break;
    case 'coffee':
      for (const [x, z, w, d] of [
        [-0.39, -0.05, 0.48, 0.7],
        [0.39, -0.05, 0.48, 0.7],
        [0, 0.13, 0.59, 0.8],
      ]) {
        for (const side of [-1, 1])
          for (let j = 0; j < 5; j++)
            beam(
              m,
              'wood',
              [0.016, 0.26, 0.018],
              [x + (side * w) / 2, 0.315, z - d * 0.4 + j * d * 0.2],
            );
        for (const y of [0.2, 0.43])
          for (const side of [-1, 1])
            beam(m, 'wood', [0.024, 0.023, d], [x + side * (w / 2 + 0.006), y, z]);
      }
      break;
    case 'rong':
      for (const side of [-1, 1]) {
        for (let i = 0; i < 6; i++)
          beam(m, 'trim', [0.024, 0.24, 0.017], [side * 0.399, 0.4, -0.25 + i * 0.1]);
        for (const y of [0.29, 0.51]) beam(m, 'wood', [0.028, 0.025, 0.64], [side * 0.4, y, 0]);
        beam(m, 'wood', [0.024, 0.024, 0.38], [side * 0.1, 0.12, 0.52], [0.66, 0, 0]);
      }
      beam(m, 'glass', [0.14, 0.2, 0.012], [0, 0.39, 0.319]);
      for (let i = 1; i < 8; i++)
        beam(m, 'trim', [0.73 * (1 - i / 8), 0.012, 0.016], [0, 0.55 + i * 0.13, 0.328]);
      break;
    case 'cham':
      for (const [x, h, w] of [
        [-0.34, 0.88, 0.49],
        [0.34, 0.72, 0.44],
      ]) {
        pointedHood(m, x, 0.12 + h * 0.52, w * 0.4 + 0.056, w * 0.46, h * 0.21);
        for (const side of [-1, 1])
          for (const z of [-w * 0.2, w * 0.2])
            beam(
              m,
              'roof',
              [0.018, h * 0.76, 0.034],
              [x + side * (w / 2 + 0.004), h * 0.46 + 0.1, z],
            );
        m.box('roof', [w * 0.48, 0.04, 0.09], [x, 0.115, w * 0.4 + 0.04]);
      }
      break;
    case 'lotus':
      // Narrow centre mullions inside the glazed petals, kept behind the cream rim.
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        beam(
          m,
          'wood',
          [0.007, 0.59, 0.012],
          [Math.sin(a) * 0.326, 0.4, Math.cos(a) * 0.326],
          [0, a, 0],
        );
      }
      break;
    case 'water-tower':
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const dx = Math.sin(a) * 0.022,
          dz = Math.cos(a) * 0.022;
        beam(
          m,
          'trim',
          [0.02, 0.91, 0.02],
          [Math.sin(a) * 0.231, 0.595, Math.cos(a) * 0.231],
          [dz, 0, -dx],
        );
        for (const y of [1.265, 1.465])
          beam(
            m,
            'trim',
            [0.22, 0.014, 0.018],
            [Math.sin(a + Math.PI / 8) * 0.343, y, Math.cos(a + Math.PI / 8) * 0.343],
            [0, a + Math.PI / 8, 0],
          );
      }
      break;
    case 'imperial':
      for (const x of [-0.69, -0.34, 0.34, 0.69]) m.box('trim', [0.07, 0.035, 0.72], [x, 0.56, 0]);
      for (const [x, w] of [
        [-0.52, 0.28],
        [0, 0.62],
        [0.52, 0.28],
      ]) {
        frontBandAt(m, x, w + 0.05, 0.66, 0.26, 'gold');
        for (const dx of [-w * 0.45, w * 0.45])
          post(m, x + dx, 0.645, 0.27, x === 0 ? 0.3 : 0.24, 'wood', 0.015);
      }
      break;
    case 'dragon':
      // Brow, nostril, split lips and teeth provide the sculpted facial landmarks.
      for (const side of [-1, 1]) {
        m.ball('gold', [0.072, 0.035, 0.018], [0.585, 0.645, side * 0.075]);
        m.ball('wood', [0.009, 0.012, 0.01], [0.681, 0.637, side * 0.07]);
        m.curve(
          'gold',
          [
            [0.63, 0.52, side * 0.058],
            [0.75, 0.54, side * 0.07],
            [0.77, 0.58, side * 0.06],
          ],
          0.009,
        );
        for (const x of [0.641, 0.688])
          m.cone('trim', 0.007, 0.025, [x, 0.521, side * 0.05], 5, Math.PI);
      }
      break;
    case 'bridge':
      for (const side of [-1, 1]) {
        beam(m, 'trim', [1.37, 0.025, 0.03], [0, 0.373, side * 0.283]);
        for (const x of [-0.66, -0.23, 0.23, 0.66])
          m.box('wood', [0.04, 0.045, 0.06], [x, 0.4, side * 0.275]);
      }
      break;
    case 'gate':
      openingFrame(m, 0, 0.012, 0.359, 0.335, 0.485, 'trim', false, 0.027);
      for (const z of [-0.34, 0.34]) {
        beam(m, 'wall', [0.93, 0.065, 0.055], [0, 0.785, z]);
        beam(m, 'trim', [0.96, 0.02, 0.065], [0, 0.825, z]);
      }
      for (const side of [-1, 1])
        for (const z of [-0.235, 0.235])
          m.box('trim', [0.07, 0.032, 0.07], [side * 0.25, 0.785, z]);
      break;
    case 'church':
      openingFrame(m, 0, 0.772, 0.233, 0.272, 0.755, 'roof', true, 0.014);
      pointedHood(m, 0, 1.585, 0.237, 0.55, 0.377);
      for (const side of [-1, 1])
        for (const y of [0.14, 0.73, 1.54])
          m.box('roof', [0.095, 0.035, 0.53], [side * 0.267, y, 0]);
      break;
    case 'pagoda':
      for (let i = 0; i < 7; i++) {
        const w = 0.52 - i * 0.045,
          y = 0.52 + i * 0.19;
        for (const side of [-1, 1])
          for (const z of [-w * 0.28, w * 0.28])
            beam(m, 'trim', [0.012, 0.14, 0.014], [side * (w / 2 + 0.006), y + 0.07, z]);
        beam(m, 'gold', [w + 0.03, 0.014, w * 0.8 + 0.03], [0, y + 0.133, 0]);
      }
      break;
    case 'museum':
      for (const [x, z, w, h] of [
        [-0.42, 0.035, 0.46, 0.7],
        [0, -0.15, 0.51, 0.95],
        [0.42, 0.16, 0.45, 0.58],
      ]) {
        beam(m, 'roof', [w + 0.005, 0.012, 0.577], [x, h + 0.008, z]);
        for (const side of [-1, 1])
          beam(m, 'wall', [0.01, h, 0.015], [x + (side * w) / 2, h / 2, z + 0.291]);
      }
      beam(m, 'wood', [0.21, 0.36, 0.016], [0, 0.19, 0.143]);
      beam(m, 'glass', [0.19, 0.32, 0.019], [0, 0.19, 0.151]);
      beam(m, 'wall', [0.009, 0.34, 0.022], [0, 0.19, 0.163]);
      break;
    case 'theater':
      for (let i = 0; i < 19; i++)
        beam(m, 'trim', [0.026, 0.03, 0.042], [-0.57 + i * 0.063, 1.125, 0.377]);
      for (const side of [-1, 1])
        for (let i = 0; i < 10; i++)
          beam(m, 'trim', [0.04, 0.03, 0.026], [side * 0.62, 1.125, -0.3 + i * 0.066]);
      m.ball('trim', [0.037, 0.047, 0.012], [0, 1.305, 0.472]);
      for (const side of [-1, 1])
        m.curve(
          'trim',
          [
            [side * 0.04, 1.28, 0.475],
            [side * 0.12, 1.27, 0.475],
            [side * 0.13, 1.31, 0.475],
            [side * 0.085, 1.32, 0.475],
          ],
          0.009,
        );
      break;
    case 'turtle':
      for (const [w, h, y] of [
        [0.65, 0.35, 0.05],
        [0.5, 0.3, 0.43],
        [0.32, 0.25, 0.76],
      ]) {
        const xs = w > 0.4 ? [-w * 0.28, 0, w * 0.28] : [0];
        for (const x of xs)
          openingFrame(
            m,
            x,
            y + 0.012,
            w * 0.375 + 0.003,
            w > 0.4 ? 0.12 : 0.13,
            h * 0.82,
            'trim',
            false,
            0.01,
          );
      }
      break;
  }
}
function frontBandAt(m: Miniature, x: number, w: number, y: number, z: number, part: Surface) {
  m.box(part, [w, 0.019, 0.03], [x, y, z]);
}
