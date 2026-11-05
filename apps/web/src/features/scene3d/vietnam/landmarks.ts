import { Miniature } from './miniature';

function plinth(m: Miniature, w = 1.32, d = 1.0) {
  m.box('trim', [w, 0.08, d], [0, 0.04, 0]);
  m.box('wall', [w - 0.1, 0.055, d - 0.1], [0, 0.105, 0]);
}
function pavilion(
  m: Miniature,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
  roofH = 0.26,
) {
  m.box('wall', [w, h, d], [x, y + h / 2, z]);
  m.roof(w + 0.16, d + 0.16, roofH, [x, y + h + 0.015, z]);
  for (const side of [-1, 1])
    m.cylinder('trim', 0.025, 0.035, h, [x + side * w * 0.44, y + h / 2, z + d * 0.51], 10);
  m.window(x, y + 0.04, z + d * 0.51, w * 0.22, h * 0.77);
}
function pagoda(m: Miniature, tiers: number, slender = false) {
  plinth(m);
  const step = slender ? 0.19 : 0.23;
  for (let i = 0; i < tiers; i++) {
    const w = (slender ? 0.6 : 0.85) * (1 - i * 0.065),
      y = 0.15 + i * step;
    m.box('wall', [w, step * 0.9, w * 0.8], [0, y + step * 0.45, 0]);
    for (const x of [-w * 0.3, 0, w * 0.3]) m.window(x, y + 0.025, w * 0.405, 0.09, step * 0.65);
    m.roof(w + 0.16, w * 0.8 + 0.16, 0.12, [0, y + step * 0.9, 0], false);
  }
  m.cylinder('gold', 0.013, 0.025, 0.28, [0, 0.18 + tiers * step, 0], 12);
  m.ball('gold', [0.045, 0.045, 0.045], [0, 0.34 + tiers * step, 0]);
}
function cham(m: Miniature, x: number, z: number, h: number, w = 0.52) {
  m.box('roof', [w + 0.12, 0.1, w + 0.11], [x, 0.18, z]);
  m.box('roof', [w, h, w * 0.82], [x, 0.22 + h / 2, z]);
  for (const sign of [-1, 1]) {
    m.box('wall', [0.055, h - 0.04, 0.05], [x + sign * w * 0.41, 0.22 + h / 2, z + w * 0.43]);
    m.box('wall', [0.045, h - 0.04, 0.08], [x + sign * w * 0.51, 0.22 + h / 2, z]);
  }
  m.arch('wood', w * 0.3, h * 0.45, 0.02, [x, 0.22, z + w * 0.43]);
  for (let tier = 0; tier < 4; tier++) {
    const size = w * (1 - tier * 0.17);
    m.box('roof', [size, 0.11, size * 0.85], [x, 0.22 + h + tier * 0.105, z]);
    m.box('wall', [size + 0.035, 0.022, size * 0.85 + 0.035], [x, 0.27 + h + tier * 0.105, z]);
  }
  m.cone('roof', 0.08, 0.19, [x, 0.7 + h, z], 8);
}
function colonial(m: Miniature, clock = false) {
  plinth(m, 1.5, 1.05);
  m.box('wall', [1.28, 0.65, 0.68], [0, 0.48, 0]);
  m.roof(1.45, 0.86, 0.28, [0, 0.82, 0]);
  for (const x of [-0.5, -0.25, 0, 0.25, 0.5]) {
    m.window(x, 0.28, 0.35, 0.13, 0.35);
    m.cylinder('trim', 0.025, 0.035, 0.55, [x, 0.43, 0.44], 12);
  }
  m.box('trim', [1.48, 0.08, 0.22], [0, 0.18, 0.43]);
  m.box('trim', [1.45, 0.07, 0.17], [0, 0.75, 0.43]);
  m.steps(0.65, 0.61, 0.18);
  if (clock) {
    m.box('wall', [0.34, 0.53, 0.38], [0, 1.0, 0.11]);
    m.roof(0.44, 0.5, 0.19, [0, 1.28, 0.11]);
    m.cylinder('gold', 0.06, 0.07, 0.08, [0, 1.51, 0.11]);
  } else {
    for (const x of [-0.51, 0.51]) m.box('gold', [0.12, 0.04, 0.12], [x, 1.12, 0]);
  }
  m.shrub(-0.62, 0.45, 0.7);
  m.shrub(0.62, 0.45, 0.7);
}
function bridge(m: Miniature, covered = false) {
  plinth(m, 1.5, 1.05);
  m.box('water', [1.34, 0.025, 0.81], [0, 0.14, 0]);
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const x = -0.68 + i * 0.085,
      y = 0.27 + 0.16 * Math.sin((Math.PI * i) / 16);
    pts.push([x, y, 0]);
    m.box('trim', [0.087, 0.06, 0.48], [x, y, 0]);
    if (i % 3 === 0)
      for (const side of [-1, 1]) m.box('wall', [0.035, 0.18, 0.035], [x, y + 0.09, side * 0.24]);
  }
  for (const side of [-1, 1])
    m.curve(
      'roof',
      pts.map(([x, y]) => [x, y + 0.19, side * 0.24]),
      0.025,
    );
  for (const x of [-0.48, 0.48]) m.box('wall', [0.11, 0.22, 0.6], [x, 0.23, 0]);
  if (covered) {
    for (const x of [-0.48, -0.16, 0.16, 0.48])
      for (const z of [-0.23, 0.23]) m.cylinder('wood', 0.025, 0.03, 0.42, [x, 0.67, z], 10);
    m.roof(1.48, 0.73, 0.26, [0, 0.88, 0]);
    m.box('wall', [0.3, 0.18, 0.42], [0, 0.71, -0.3]);
    m.roof(0.43, 0.59, 0.15, [0, 0.82, -0.3], false);
  }
}
function clock(m: Miniature, x: number, y: number, z: number, r = 0.11) {
  // Front-facing enamel dial and hands.
  m.ball('trim', [r, r, 0.019], [x, y, z]);
  m.box('wood', [0.018, r * 0.7, 0.025], [x, y + r * 0.2, z + 0.02]);
  m.box('wood', [r * 0.65, 0.018, 0.025], [x + r * 0.2, y, z + 0.022]);
}
function gate(m: Miniature, imperial: boolean) {
  plinth(m, 1.5, 1.05);
  for (const x of [-0.56, 0, 0.56]) {
    m.box('wall', [0.24, 0.52, 0.54], [x, 0.39, 0]);
    m.arch('wood', 0.19, 0.35, 0.03, [x, 0.15, 0.285]);
  }
  m.box('wall', [1.42, 0.17, 0.58], [0, 0.7, 0]);
  const wings = imperial ? [-0.52, 0, 0.52] : [0];
  for (const x of wings)
    pavilion(m, x, 0.79, 0, x === 0 ? 0.5 : 0.35, 0.48, 0.32, x === 0 ? 0.24 : 0.17);
  if (imperial) for (const x of [-0.24, 0.24]) m.roof(0.26, 0.63, 0.13, [x, 1.03, 0], false);
  m.steps(0.85, 0.56, 0.14);
}

/** Each landmark has its own silhouette, not a recolored generic hotel. */
export function landmark(m: Miniature, id: string) {
  switch (id) {
    case 'chau-doc':
      plinth(m, 1.45, 1.1);
      pavilion(m, 0, 0.15, 0, 0.91, 0.68, 0.5, 0.3);
      m.roof(0.75, 0.65, 0.22, [0, 0.96, 0]);
      for (const x of [-0.48, 0.48]) pavilion(m, x, 0.15, 0.1, 0.27, 0.42, 0.28, 0.16);
      m.steps(0.55, 0.64, 0.15);
      break;
    case 'can-tho':
      colonial(m);
      for (const x of [-0.44, 0.44]) m.arch('trim', 0.24, 0.1, 0.03, [x, 0.94, 0.35]);
      break;
    case 'bac-lieu':
      plinth(m, 1.48, 1.08);
      for (const [x, z, r, h] of [
        [-0.43, 0.1, 0.43, 0.48],
        [0.38, 0.12, 0.4, 0.43],
        [0, -0.28, 0.45, 0.57],
      ]) {
        m.cylinder('glass', r * 0.69, r * 0.69, 0.29, [x, 0.29, z]);
        m.cone('trim', r, h, [x, 0.44 + h / 2, z], 32, x < 0 ? -0.12 : 0.12);
        m.cylinder('gold', r * 0.99, r * 0.99, 0.025, [x, 0.44, z], 32);
      }
      break;
    case 'soc-trang':
      plinth(m);
      pavilion(m, 0, 0.15, 0, 0.78, 0.65, 0.6, 0.38);
      m.roof(0.7, 0.61, 0.31, [0, 1.04, 0], false, 'gold');
      m.cone('gold', 0.045, 0.27, [0, 1.48, 0], 8);
      for (const x of [-0.4, 0.4]) m.cone('gold', 0.04, 0.24, [x, 1.03, 0.3], 8);
      break;
    case 'ca-mau':
      plinth(m, 1.45, 1.02);
      m.box('water', [1.29, 0.03, 0.84], [0, 0.14, 0]);
      m.curve(
        'trim',
        [
          [-0.61, 0.28, 0.1],
          [-0.3, 0.22, 0.1],
          [0.2, 0.29, 0.1],
          [0.59, 0.43, 0.1],
        ],
        0.11,
      );
      m.cylinder('wood', 0.023, 0.025, 0.9, [0, 0.7, 0.1], 12);
      m.panel(
        'trim',
        [
          [0, 0],
          [0.45, 0.08],
          [0.04, 0.85],
        ],
        0.045,
        [0.04, 0.31, 0.08],
      );
      m.panel(
        'trim',
        [
          [0, 0],
          [-0.36, 0.07],
          [-0.02, 0.62],
        ],
        0.045,
        [-0.04, 0.32, 0.08],
      );
      m.box('gold', [0.17, 0.04, 0.05], [0.08, 1.18, 0.1]);
      break;
    case 'vung-tau':
      plinth(m);
      m.cylinder('trim', 0.22, 0.3, 1.1, [0, 0.72, 0]);
      m.cylinder('roof', 0.29, 0.29, 0.07, [0, 1.27, 0]);
      m.cylinder('glass', 0.17, 0.17, 0.2, [0, 1.41, 0], 16);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        m.cylinder('trim', 0.012, 0.015, 0.22, [Math.cos(a) * 0.18, 1.41, Math.sin(a) * 0.18], 8);
      }
      m.cone('roof', 0.27, 0.17, [0, 1.59, 0], 24);
      m.window(0, 0.22, 0.28, 0.12, 0.25);
      break;
    case 'phan-thiet':
      plinth(m);
      cham(m, -0.2, 0, 0.8, 0.54);
      cham(m, 0.43, -0.12, 0.4, 0.27);
      break;
    case 'phu-quoc':
      plinth(m);
      m.box('wall', [0.46, 1.2, 0.46], [0, 0.76, 0]);
      for (let i = 0; i < 4; i++) m.box('trim', [0.51, 0.055, 0.51], [0, 0.35 + i * 0.29, 0]);
      m.window(0, 0.28, 0.24, 0.19, 0.35);
      clock(m, 0, 1.12, 0.255, 0.15);
      m.box('trim', [0.62, 0.08, 0.62], [0, 1.4, 0]);
      m.roof(0.65, 0.65, 0.28, [0, 1.45, 0]);
      m.cylinder('gold', 0.015, 0.025, 0.16, [0, 1.8, 0]);
      break;
    case 'da-lat':
      plinth(m, 1.5, 1.05);
      m.box('wall', [1.32, 0.51, 0.62], [0, 0.4, 0]);
      for (const x of [-0.45, 0, 0.45]) {
        m.roof(0.49, 0.82, 0.42, [x, 0.67, 0]);
        m.window(x, 0.22, 0.32, 0.22, 0.31);
      }
      clock(m, 0, 0.89, 0.19, 0.09);
      m.box('trim', [1.46, 0.06, 0.18], [0, 0.18, 0.43]);
      break;
    case 'buon-ma-thuot':
      plinth(m, 1.5, 1.07);
      for (const x of [-0.43, 0.43]) {
        m.box('glass', [0.45, 0.46, 0.68], [x, 0.4, 0]);
        // Curved longhouse roof profiles as broad overlapping vaulted strips.
        for (let i = 0; i < 9; i++) {
          const z = -0.43 + i * 0.107;
          const y = 0.68 + 0.28 * Math.cos(((z / 0.43) * Math.PI) / 2);
          m.box('wood', [0.62, 0.065, 0.13], [x, y, z], [z > 0 ? 0.45 : -0.45, 0, 0]);
        }
        m.box('trim', [0.64, 0.055, 0.89], [x, 0.17, 0]);
      }
      m.box('trim', [0.28, 0.32, 0.33], [0, 0.34, 0.08]);
      break;
    case 'pleiku':
      pagoda(m, 7);
      break;
    case 'nha-trang':
      plinth(m);
      m.cylinder('wall', 0.3, 0.4, 0.55, [0, 0.43, 0], 24);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3,
          x = Math.cos(a) * 0.24,
          z = Math.sin(a) * 0.24;
        m.ball('wall', [0.12, 0.52, 0.15], [x, 0.91, z]);
        m.cone('roof', 0.13, 0.55, [x, 1.38, z], 16);
      }
      m.cone('gold', 0.16, 0.78, [0, 1.43, 0], 24);
      break;
    case 'quy-nhon':
      plinth(m, 1.43, 1.0);
      cham(m, -0.33, 0, 0.83, 0.48);
      cham(m, 0.33, 0, 0.69, 0.45);
      break;
    case 'hoi-an':
      bridge(m, true);
      break;
    case 'hue':
      gate(m, true);
      break;
    case 'da-nang':
      bridge(m);
      m.curve(
        'gold',
        [
          [-0.66, 0.48, 0],
          [-0.4, 0.82, 0],
          [-0.08, 0.5, 0],
          [0.21, 0.77, 0],
          [0.55, 0.62, 0],
        ],
        0.055,
      );
      m.ball('gold', [0.14, 0.12, 0.09], [0.58, 0.68, 0]);
      m.box('gold', [0.22, 0.07, 0.14], [0.66, 0.64, 0]);
      for (const z of [-0.07, 0.07]) {
        m.ball('wood', [0.018, 0.02, 0.018], [0.6, 0.73, z]);
        m.cone('gold', 0.035, 0.18, [0.5, 0.86, z], 8, -0.25);
      }
      break;
    case 'dong-hoi':
      gate(m, false);
      for (const x of [-0.64, 0.64]) m.box('wall', [0.12, 0.15, 0.62], [x, 0.84, 0]);
      break;
    case 'ninh-binh':
      pagoda(m, 9, true);
      break;
    case 'ha-long':
      plinth(m, 1.48, 1.05);
      for (const [x, w, h] of [
        [-0.46, 0.4, 0.7],
        [0, 0.43, 0.91],
        [0.46, 0.4, 0.77],
      ]) {
        m.box('glass', [w, h, 0.72], [x, 0.16 + h / 2, 0]);
        m.box('wood', [w + 0.025, 0.035, 0.745], [x, 0.18 + h, 0]);
        for (let row = 1; row < 4; row++)
          m.box('trim', [w, 0.012, 0.016], [x, 0.16 + (row * h) / 4, 0.368]);
      }
      m.box('trim', [1.4, 0.07, 0.17], [0, 0.16, 0.46]);
      break;
    case 'hai-phong':
      colonial(m, true);
      for (const x of [-0.55, 0.55]) {
        m.box('wall', [0.25, 0.22, 0.68], [x, 0.9, 0]);
        m.roof(0.36, 0.82, 0.19, [x, 1.02, 0]);
      }
      break;
    case 'ha-noi':
      plinth(m, 1.18, 1.05);
      m.box('water', [1.03, 0.025, 0.88], [0, 0.145, 0]);
      for (let floor = 0; floor < 3; floor++) {
        const w = 0.7 - floor * 0.11,
          h = floor === 2 ? 0.28 : 0.34,
          y = 0.19 + floor * 0.37;
        m.box('wall', [w, h, w * 0.75], [0, y + h / 2, 0]);
        for (const x of [-w * 0.28, 0, w * 0.28]) m.window(x, y + 0.02, w * 0.38, 0.105, h * 0.7);
        m.box('trim', [w + 0.1, 0.055, w * 0.75 + 0.1], [0, y + h, 0]);
        if (floor === 2) m.roof(w + 0.19, w * 0.75 + 0.19, 0.22, [0, y + h + 0.05, 0], false);
      }
      m.box('gold', [0.12, 0.075, 0.12], [0, 1.5, 0]);
      break;
    case 'ho-chi-minh':
      plinth(m, 1.5, 1.04);
      m.box('wall', [1.3, 0.46, 0.68], [0, 0.38, 0]);
      m.roof(1.48, 0.86, 0.28, [0, 0.63, 0]);
      for (const x of [-0.53, -0.33, 0.33, 0.53]) m.window(x, 0.22, 0.35, 0.13, 0.26);
      m.box('wall', [0.39, 0.9, 0.42], [0, 0.61, 0.19]);
      m.window(0, 0.16, 0.415, 0.23, 0.4);
      m.box('trim', [0.46, 0.07, 0.47], [0, 0.9, 0.19]);
      clock(m, 0, 0.96, 0.43, 0.13);
      m.roof(0.51, 0.56, 0.3, [0, 1.08, 0.19]);
      m.steps(0.45, 0.64, 0.15);
      break;
    default:
      throw new Error('Missing landmark model ' + id);
  }
}
