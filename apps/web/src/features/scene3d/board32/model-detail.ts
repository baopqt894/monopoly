import { BufferGeometry, Float32BufferAttribute, ExtrudeGeometry, Path, Shape } from 'three';
import { curvedHip } from './roof-surfaces';
import { Miniature, type Surface } from '../vietnam/miniature';

export function archPath(w: number, h: number, pointed = false) {
  const p = new Path(),
    r = w / 2;
  p.moveTo(-r, 0);
  p.lineTo(-r, h - (pointed ? w * 0.85 : r));
  if (pointed) {
    p.quadraticCurveTo(-r, h - w * 0.4, 0, h);
    p.quadraticCurveTo(r, h - w * 0.4, r, h - w * 0.85);
  } else p.absarc(0, h - r, r, Math.PI, 0, true);
  p.lineTo(r, 0);
  p.closePath();
  return p;
}
export function archWall(
  m: Miniature,
  w: number,
  h: number,
  d: number,
  at: [number, number, number],
  holes: { x: number; w: number; h: number; pointed?: boolean }[],
  taper = 0,
  revealPart: Surface = 'wood',
  rotationY = 0,
) {
  const s = new Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2 - taper, h);
  s.lineTo(-w / 2 + taper, h);
  s.closePath();
  for (const hole of holes) {
    const path = archPath(hole.w, hole.h, hole.pointed);
    const pts = path.getPoints(16);
    const p = new Path();
    pts.forEach((v, i) =>
      i ? p.lineTo(v.x + hole.x, v.y + 0.012) : p.moveTo(v.x + hole.x, v.y + 0.012),
    );
    p.closePath();
    s.holes.push(p);
    // A separate dark inner reveal gives the opening real tunnel depth.
    const positions: number[] = [],
      uv: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i],
        b = pts[i + 1];
      if (a.distanceToSquared(b) < 1e-10) continue;
      // Move the lining just into the opening, avoiding coplanar flicker with its wall.
      const length = a.distanceTo(b),
        nx = ((b.y - a.y) / length) * 0.0015,
        ny = ((a.x - b.x) / length) * 0.0015;
      const x0 = a.x + hole.x + nx,
        x1 = b.x + hole.x + nx,
        y0 = a.y + 0.012 + ny,
        y1 = b.y + 0.012 + ny;
      positions.push(
        x0,
        y0,
        d / 2 + 0.001,
        x1,
        y1,
        -d / 2,
        x1,
        y1,
        d / 2 + 0.001,
        x0,
        y0,
        d / 2 + 0.001,
        x0,
        y0,
        -d / 2,
        x1,
        y1,
        -d / 2,
      );
      uv.push(0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1);
    }
    const reveal = new BufferGeometry();
    reveal.setAttribute('position', new Float32BufferAttribute(positions, 3));
    reveal.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    reveal.computeVertexNormals();
    m.add(revealPart, reveal, at, [0, rotationY, 0]);
  }
  const geometry = new ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 12 });
  geometry.translate(0, 0, -d / 2);
  m.add('wall', geometry, at, [0, rotationY, 0]);
}
export function openingFrame(
  m: Miniature,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  part: Surface = 'trim',
  pointed = false,
  border = 0.025,
  rotationY = 0,
) {
  const outline = archPath(w + border * 2, h + border, pointed);
  const shape = new Shape(outline.getPoints(10));
  const hole = archPath(w, h, pointed);
  const p = new Path();
  hole
    .getPoints(10)
    .forEach((v, i) => (i ? p.lineTo(v.x, v.y + 0.007) : p.moveTo(v.x, v.y + 0.007)));
  p.closePath();
  shape.holes.push(p);
  m.add(
    part,
    new ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false, curveSegments: 12 }),
    [x, y - 0.008, z],
    [0, rotationY, 0],
  );
}
export function windowDetail(
  m: Miniature,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  arched = true,
  part: Surface = 'glass',
) {
  if (arched) {
    openingFrame(m, x, y, z + 0.014, w, h);
    m.arch(part, w, h, 0.026, [x, y, z + 0.018]);
  } else {
    m.box('trim', [w + 0.055, h + 0.045, 0.026], [x, y + h / 2, z]);
    m.box(part, [w, h, 0.03], [x, y + h / 2, z + 0.019]);
  }
  m.box('trim', [0.018, h * 0.78, 0.025], [x, y + h * 0.41, z + 0.045]);
  m.box('trim', [w + 0.065, 0.025, 0.065], [x, y - 0.014, z + 0.024]);
}
export function stairs(m: Miniature, w: number, front: number, h: number, steps = 3, x = 0) {
  for (let i = 0; i < steps; i++)
    m.box(
      'trim',
      [w, 0.04 + (i * h) / steps, 0.095],
      [x, (0.04 + (i * h) / steps) / 2, front - i * 0.075],
    );
}
export function tiledHip(
  m: Miniature,
  w: number,
  d: number,
  h: number,
  at: [number, number, number],
  part: Surface = 'roof',
  upturned = true,
) {
  curvedHip(m, w, d, h, at, part, part === 'gold' ? 'gold' : 'trim', upturned);
}
export function pavilion(
  m: Miniature,
  x: number,
  z: number,
  y: number,
  w: number,
  d: number,
  h: number,
  roofH = 0.23,
  roofPart: Surface = 'roof',
) {
  m.box('wall', [w, h, d], [x, y + h / 2, z]);
  tiledHip(m, w + 0.15, d + 0.15, roofH, [x, y + h, z], roofPart);
  windowDetail(m, x, y + 0.04, z + d / 2 + 0.01, w * 0.28, h * 0.75);
  for (const side of [-1, 1])
    m.box('trim', [0.04, h, 0.05], [x + side * w * 0.43, y + h / 2, z + d / 2 + 0.025]);
}
export function band(
  m: Miniature,
  w: number,
  d: number,
  y: number,
  h = 0.035,
  part: Surface = 'trim',
) {
  m.box(part, [w, h, d], [0, y, 0]);
}
