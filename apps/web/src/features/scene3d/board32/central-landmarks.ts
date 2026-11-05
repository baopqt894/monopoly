import { CatmullRomCurve3, ExtrudeGeometry, Shape, TubeGeometry, Vector3 } from 'three';
import { Miniature, type Surface } from '../vietnam/miniature';
import { beam, finial } from './landmark-craft';
import { archWall } from './model-detail';
import { curvedHip } from './roof-surfaces';
type V = [number, number, number];
function line(m: Miniature, part: Surface, points: V[], radius: number) {
  m.add(
    part,
    new TubeGeometry(
      new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
      14,
      radius,
      6,
      false,
    ),
    [0, 0, 0],
  );
}
function sculpture(
  m: Miniature,
  shape: Shape,
  depth: number,
  z = 0,
  part: Surface = 'gold',
  segments = 12,
) {
  m.add(
    part,
    new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      curveSegments: segments,
    }),
    [0, 0, z - depth / 2],
  );
}
/** Ngo Mon: the lower gallery, clerestory and roof are separate, readable storeys. */
export function hueLandmark(m: Miniature) {
  archWall(
    m,
    1.4,
    0.51,
    0.59,
    [0, 0, 0],
    [
      { x: -0.43, w: 0.19, h: 0.36 },
      { x: 0, w: 0.22, h: 0.39 },
      { x: 0.43, w: 0.19, h: 0.36 },
    ],
    0.045,
    'glass',
  );
  beam(m, 'trim', [1.45, 0.035, 0.65], [0, 0.525, 0]);
  // A low coping instead of a fence across the red timber facade.
  for (const z of [-0.306, 0.306]) beam(m, 'trim', [1.42, 0.022, 0.025], [0, 0.55, z]);
  function gallery(x: number, y: number, w: number, h: number, d: number, bays: number) {
    beam(m, 'wood', [w, h, d], [x, y + h / 2, 0]);
    for (const side of [-1, 1]) {
      for (let i = 0; i < bays; i++) {
        const dx = ((i - (bays - 1) / 2) * w) / bays;
        beam(
          m,
          'glass',
          [(w / bays) * 0.48, h * 0.69, 0.012],
          [x + dx, y + h * 0.51, side * (d / 2 + 0.003)],
        );
        beam(
          m,
          'gold',
          [0.008, h * 0.73, 0.014],
          [x + dx - (w / bays) * 0.31, y + h * 0.51, side * (d / 2 + 0.012)],
        );
      }
      for (let i = 0; i <= bays; i++)
        m.cylinder(
          'wood',
          0.012,
          0.014,
          h + 0.016,
          [x - w / 2 + (i * w) / bays, y + h / 2, side * (d / 2 + 0.017)],
          8,
        );
      beam(m, 'gold', [w + 0.016, 0.014, 0.025], [x, y + 0.025, side * (d / 2 + 0.012)]);
    }
    for (const side of [-1, 1]) {
      beam(m, 'glass', [0.012, h * 0.67, d * 0.62], [x + side * (w / 2 + 0.003), y + h * 0.52, 0]);
      for (const dz of [-d * 0.39, 0, d * 0.39])
        beam(m, 'wood', [0.025, h, 0.022], [x + side * (w / 2 + 0.011), y + h / 2, dz]);
    }
  }
  // Side pavilions have single-point pyramidal green roofs, not long ridges.
  for (const x of [-0.51, 0.51]) {
    beam(m, 'trim', [0.33, 0.023, 0.48], [x, 0.57, 0]);
    gallery(x, 0.585, 0.29, 0.22, 0.41, 2);
    curvedHip(m, 0.44, 0.48, 0.17, [x, 0.815, 0], 'roof', 'gold', false, 0, 'gold');
    finial(m, x, 0.99, 0, 0.42);
  }
  gallery(0, 0.565, 0.65, 0.205, 0.4, 5);
  // The lower eave ends below the upper windows, keeping both tiers visible.
  curvedHip(m, 0.77, 0.5, 0.105, [0, 0.77, 0], 'gold', 'gold', false, 0.32);
  gallery(0, 0.875, 0.56, 0.19, 0.36, 5);
  curvedHip(m, 0.81, 0.48, 0.18, [0, 1.065, 0], 'gold', 'gold', false, 0.31);
  // Narrow cylindrical tile rolls cast visible relief at preview scale.
  for (let i = -12; i <= 12; i++) {
    const x = i * 0.019;
    for (const side of [-1, 1])
      line(
        m,
        'gold',
        [
          [x, 1.252, 0],
          [x, 1.162, side * 0.12],
          [x, 1.072, side * 0.24],
        ],
        0.0028,
      );
  }
  // Small upward ridge scrolls and eave tips in the silhouette of the concept.
  for (const x of [-0.25, 0.25]) {
    line(
      m,
      'gold',
      [
        [x, 1.25, 0],
        [x * 1.1, 1.28, 0],
        [x * 1.09, 1.32, 0],
      ],
      0.013,
    );
    for (const z of [-0.234, 0.234])
      line(
        m,
        'gold',
        [
          [Math.sign(x) * 0.37, 1.072, z],
          [Math.sign(x) * 0.406, 1.085, z],
          [Math.sign(x) * 0.414, 1.116, z],
        ],
        0.009,
      );
  }
  finial(m, 0, 1.25, 0, 0.25);
}
/** Sculpted gold dragon: connected leaf tail, swept mane, open mouth and inset eyes. */
export function daNangLandmark(m: Miniature) {
  beam(m, 'trim', [1.48, 0.045, 0.63], [0, 0.0225, 0]);
  beam(m, 'water', [1.42, 0.012, 0.57], [0, 0.051, 0]);
  for (const x of [-0.59, -0.2, 0.23, 0.62]) beam(m, 'wall', [0.105, 0.21, 0.35], [x, 0.163, 0]);
  beam(m, 'trim', [1.46, 0.045, 0.43], [0, 0.285, 0]);
  const arch = new Shape();
  arch.moveTo(-0.46, 0.31);
  arch.bezierCurveTo(-0.25, 0.96, 0.08, 0.96, 0.32, 0.31);
  arch.lineTo(0.21, 0.31);
  arch.bezierCurveTo(0.02, 0.77, -0.22, 0.77, -0.35, 0.31);
  arch.closePath();
  sculpture(m, arch, 0.11, 0, 'gold', 40);
  for (const z of [-0.066, 0.066])
    line(
      m,
      'gold',
      [
        [-0.435, 0.32, z],
        [-0.29, 0.66, z],
        [-0.09, 0.79, z],
        [0.13, 0.65, z],
        [0.29, 0.32, z],
      ],
      0.012,
    );
  for (const z of [-0.066, 0.066])
    line(
      m,
      'gold',
      [
        [-0.366, 0.32, z],
        [-0.25, 0.56, z],
        [-0.08, 0.69, z],
        [0.08, 0.55, z],
        [0.225, 0.32, z],
      ],
      0.009,
    );
  for (const [x, top] of [
    [-0.31, 0.52],
    [-0.2, 0.64],
    [-0.08, 0.68],
    [0.05, 0.63],
    [0.17, 0.5],
  ])
    beam(m, 'wall', [0.012, top - 0.31, 0.014], [x, (top + 0.31) / 2, 0]);
  // Smooth tapering tail stem, all the leaf roots overlap it.
  const tail = new Shape();
  tail.moveTo(-0.62, 0.31);
  tail.bezierCurveTo(-0.62, 0.4, -0.68, 0.49, -0.67, 0.58);
  tail.quadraticCurveTo(-0.63, 0.63, -0.6, 0.57);
  tail.bezierCurveTo(-0.62, 0.48, -0.55, 0.39, -0.56, 0.31);
  tail.closePath();
  sculpture(m, tail, 0.085);
  function leaf(root: [number, number], tip: [number, number], width: number, z = 0) {
    const [x, y] = root,
      [tx, ty] = tip,
      dx = tx - x,
      dy = ty - y,
      len = Math.hypot(dx, dy),
      nx = (-dy / len) * width,
      ny = (dx / len) * width;
    const s = new Shape();
    s.moveTo(x, y);
    s.bezierCurveTo(x + dx * 0.3 + nx, y + dy * 0.3 + ny, tx + nx * 0.65, ty + ny * 0.65, tx, ty);
    s.bezierCurveTo(tx - nx * 0.4, ty - ny * 0.4, x + dx * 0.3 - nx, y + dy * 0.3 - ny, x, y);
    s.closePath();
    sculpture(m, s, 0.025, z);
  }
  for (const [x, y] of [
    [-0.77, 0.55],
    [-0.79, 0.65],
    [-0.76, 0.74],
    [-0.68, 0.79],
    [-0.61, 0.77],
    [-0.55, 0.7],
  ])
    leaf([-0.648, 0.565], [x, y], 0.035);
  // A curved double neck flows into the cheek rather than an upright cuboid.
  const neck = new Shape();
  neck.moveTo(0.435, 0.31);
  neck.bezierCurveTo(0.46, 0.4, 0.45, 0.49, 0.49, 0.56);
  neck.lineTo(0.59, 0.55);
  neck.bezierCurveTo(0.52, 0.46, 0.53, 0.37, 0.51, 0.31);
  neck.closePath();
  sculpture(m, neck, 0.105);
  line(
    m,
    'gold',
    [
      [0.455, 0.315, -0.062],
      [0.475, 0.42, -0.062],
      [0.51, 0.525, -0.062],
    ],
    0.009,
  );
  // Layered, flattened flame leaves follow the radial fan in the approved crop.
  for (const [x, y] of [
    [0.36, 0.415],
    [0.31, 0.47],
    [0.285, 0.54],
    [0.29, 0.61],
    [0.34, 0.68],
    [0.395, 0.726],
  ])
    leaf([0.493, 0.568], [x, y], 0.034);
  for (const side of [-1, 1]) {
    leaf([0.512, 0.672], [0.371, 0.731], 0.023, side * 0.036);
    leaf([0.576, 0.66], [0.474, 0.737], 0.021, side * 0.028);
  }
  const skull = new Shape();
  skull.moveTo(0.455, 0.505);
  skull.bezierCurveTo(0.418, 0.536, 0.418, 0.63, 0.456, 0.664);
  skull.bezierCurveTo(0.487, 0.692, 0.538, 0.668, 0.58, 0.646);
  skull.quadraticCurveTo(0.636, 0.626, 0.692, 0.645);
  skull.quadraticCurveTo(0.725, 0.655, 0.735, 0.681);
  skull.bezierCurveTo(0.778, 0.691, 0.781, 0.638, 0.759, 0.611);
  skull.quadraticCurveTo(0.725, 0.596, 0.696, 0.593);
  skull.lineTo(0.677, 0.579);
  skull.lineTo(0.646, 0.582);
  skull.lineTo(0.621, 0.563);
  skull.lineTo(0.594, 0.57);
  skull.quadraticCurveTo(0.536, 0.499, 0.455, 0.505);
  skull.closePath();
  // Taper the muzzle in depth so it is a sculpted wedge rather than an extruded slab.
  const head = new ExtrudeGeometry(skull, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    curveSegments: 18,
  });
  const hp = head.getAttribute('position');
  for (let i = 0; i < hp.count; i++) {
    const taper = 1 - Math.max(0, Math.min(1, (hp.getX(i) - 0.55) / 0.23)) * 0.22;
    hp.setZ(i, (hp.getZ(i) - 0.09) * taper);
  }
  head.computeVertexNormals();
  m.add('gold', head, [0, 0, 0]);
  const jaw = new Shape();
  jaw.moveTo(0.49, 0.508);
  jaw.quadraticCurveTo(0.57, 0.469, 0.706, 0.513);
  jaw.quadraticCurveTo(0.745, 0.525, 0.757, 0.548);
  jaw.quadraticCurveTo(0.764, 0.505, 0.737, 0.481);
  jaw.quadraticCurveTo(0.637, 0.443, 0.544, 0.448);
  jaw.quadraticCurveTo(0.499, 0.454, 0.49, 0.508);
  jaw.closePath();
  sculpture(m, jaw, 0.135);
  // Recessed mouth cavity lets the upper and lower silhouettes read separately.
  const mouth = new Shape();
  mouth.moveTo(0.55, 0.538);
  mouth.quadraticCurveTo(0.665, 0.567, 0.747, 0.598);
  mouth.quadraticCurveTo(0.744, 0.529, 0.704, 0.513);
  mouth.quadraticCurveTo(0.622, 0.484, 0.55, 0.507);
  mouth.closePath();
  sculpture(m, mouth, 0.105, 0, 'glass');
  // The reference has gold beard points along the chin, not oversized white fangs.
  for (const [x, y] of [
    [0.56, 0.422],
    [0.61, 0.415],
    [0.668, 0.433],
    [0.717, 0.456],
  ])
    for (const side of [-1, 1]) leaf([x + 0.009, 0.476], [x, y], 0.015, side * 0.064);
  for (const side of [-1, 1]) {
    m.ball('gold', [0.028, 0.026, 0.012], [0.525, 0.611, side * 0.094]);
    m.ball('glass', [0.018, 0.017, 0.005], [0.529, 0.612, side * 0.106]);
    m.ball('gold', [0.01, 0.012, 0.004], [0.532, 0.612, side * 0.111]);
    m.ball('glass', [0.005, 0.009, 0.003], [0.535, 0.612, side * 0.115]);
    m.ball('trim', [0.003, 0.003, 0.002], [0.537, 0.619, side * 0.118]);
    // A fine swept lid and cheek crease preserve the round eye without hiding it.
    line(
      m,
      'gold',
      [
        [0.498, 0.633, side * 0.097],
        [0.521, 0.642, side * 0.104],
        [0.551, 0.633, side * 0.101],
      ],
      0.006,
    );
    line(
      m,
      'gold',
      [
        [0.475, 0.566, side * 0.096],
        [0.511, 0.55, side * 0.098],
        [0.557, 0.562, side * 0.098],
      ],
      0.005,
    );
    m.ball('glass', [0.0065, 0.006, 0.003], [0.674, 0.623, side * 0.082]);
    m.ball('glass', [0.006, 0.005, 0.003], [0.729, 0.649, side * 0.074]);
    // Short gold teeth sit just inside the open lip.
    for (const x of [0.627, 0.704])
      m.cone('gold', 0.007, 0.021, [x, 0.574 + (x - 0.627) * 0.24, side * 0.051], 7, Math.PI);
    line(
      m,
      'gold',
      [
        [0.576, 0.484, side * 0.071],
        [0.659, 0.481, side * 0.071],
        [0.725, 0.511, side * 0.068],
      ],
      0.006,
    );
    // Parallel neck ribs are visible on either elevation of the miniature.
    for (const dx of [0, 0.035])
      line(
        m,
        'gold',
        [
          [0.445 + dx, 0.319, side * 0.058],
          [0.463 + dx, 0.402, side * 0.061],
          [0.488 + dx, 0.494, side * 0.065],
        ],
        0.007,
      );
  }
}
