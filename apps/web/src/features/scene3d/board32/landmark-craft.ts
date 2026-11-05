import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Shape,
  ExtrudeGeometry,
  BoxGeometry,
  LatheGeometry,
  Vector2,
} from 'three';
import { Miniature, type Surface } from '../vietnam/miniature';
import { openingFrame, archPath } from './model-detail';
type V = [number, number, number];
/** Small structural details use six flat faces, keeping the close-up mesh affordable. */
export function beam(m: Miniature, part: Surface, size: V, at: V, rotation: V = [0, 0, 0]) {
  m.add(part, new BoxGeometry(...size), at, rotation);
}
export function lathe(
  m: Miniature,
  part: Surface,
  profile: [number, number][],
  at: V,
  segments = 48,
  scale: V = [1, 1, 1],
) {
  const g = new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r, y)),
    segments,
  );
  g.scale(...scale);
  m.add(part, g, at);
}
export function steps(
  m: Miniature,
  w: number,
  front: number,
  height: number,
  count = 5,
  part: Surface = 'trim',
) {
  for (let i = 0; i < count; i++) {
    const h = (height * (i + 1)) / count;
    beam(m, part, [w, h, 0.09], [0, h / 2, front - i * 0.065]);
  }
}
export function stairRails(m: Miniature, w: number, front: number, height: number) {
  for (const side of [-1, 1]) {
    beam(
      m,
      'trim',
      [0.085, height + 0.06, 0.1],
      [side * (w / 2 + 0.045), height / 2, front - 0.26],
    );
    beam(
      m,
      'trim',
      [0.09, 0.07, 0.38],
      [side * (w / 2 + 0.045), height / 2 + 0.04, front - 0.13],
      [Math.atan2(height, 0.38), 0, 0],
    );
  }
}
export function finial(
  m: Miniature,
  x: number,
  y: number,
  z: number,
  s = 1,
  part: Surface = 'gold',
) {
  m.cylinder(part, 0.035 * s, 0.05 * s, 0.035 * s, [x, y, z], 10);
  m.ball(part, [0.034 * s, 0.043 * s, 0.034 * s], [x, y + 0.045 * s, z]);
  m.cone(part, 0.026 * s, 0.09 * s, [x, y + 0.1 * s, z], 10);
}
export function shutters(
  m: Miniature,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  part: Surface = 'glass',
) {
  openingFrame(m, x, y, z, w, h, 'trim', false, 0.02);
  m.arch(part, w, h, 0.018, [x, y, z + 0.008]);
  for (let i = 1; i < 7; i++)
    beam(m, part, [w - 0.022, 0.008, 0.025], [x, y + (h * i) / 8, z + 0.024]);
  beam(m, 'wood', [0.008, h * 0.85, 0.025], [x, y + h * 0.43, z + 0.025]);
}
/** Subdivide broad faces before bending and share normals for a smooth architectural shell. */
export function curvedSolid(source: BufferGeometry, bend: (x: number, y: number) => number) {
  const p = source.getAttribute('position'),
    tex = source.getAttribute('uv'),
    normal = source.getAttribute('normal');
  type Vertex = [number, number, number, number, number];
  const positions: number[] = [],
    uv: number[] = [];
  const midpoint = (a: Vertex, b: Vertex) => a.map((v, i) => (v + b[i]) / 2) as Vertex;
  const edge = (a: Vertex, b: Vertex) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const triangle = (a: Vertex, b: Vertex, c: Vertex, cap: boolean, level = 0) => {
    if (cap && level < 1 && Math.max(edge(a, b), edge(b, c), edge(c, a)) > 0.035) {
      const ab = midpoint(a, b),
        bc = midpoint(b, c),
        ca = midpoint(c, a);
      triangle(a, ab, ca, cap, level + 1);
      triangle(ab, b, bc, cap, level + 1);
      triangle(ca, bc, c, cap, level + 1);
      triangle(ab, bc, ca, cap, level + 1);
    } else
      for (const v of [a, b, c]) {
        positions.push(v[0], v[1], v[2] + bend(v[0], v[1]));
        uv.push(v[3], v[4]);
      }
  };
  for (let i = 0; i < p.count; i += 3) {
    const vertices = [0, 1, 2].map(
      (j) =>
        [p.getX(i + j), p.getY(i + j), p.getZ(i + j), tex.getX(i + j), tex.getY(i + j)] as Vertex,
    );
    triangle(vertices[0], vertices[1], vertices[2], Math.abs(normal.getZ(i)) > 0.99);
  }
  const raw = new BufferGeometry();
  raw.setAttribute('position', new Float32BufferAttribute(positions, 3));
  raw.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  const smooth = mergeVertices(raw, 0.00001);
  raw.dispose();
  source.dispose();
  smooth.computeVertexNormals();
  return smooth;
}
/** Curved, thick lotus shell with a glazed pointed opening. No flat intersecting petals. */
export function lotusShell(
  m: Miniature,
  angle: number,
  height: number,
  radius: number,
  width: number,
) {
  const outer = new Shape();
  outer.moveTo(-width * 0.8, 0);
  outer.bezierCurveTo(-width * 1.1, height * 0.35, -width * 0.7, height * 0.77, 0, height);
  outer.bezierCurveTo(width * 0.72, height * 0.77, width * 1.05, height * 0.36, width * 0.8, 0);
  outer.closePath();
  const outline = outer.getPoints(20);
  outer.holes.push(archPath(width * 0.65, height * 0.66, true));
  const bend = (x: number, y: number) =>
    Math.sin((y / height) * Math.PI) * 0.05 - (y / height) * 0.13 + (1 - (x / width) ** 2) * 0.025;
  const at: V = [Math.sin(angle) * radius, 0.1, Math.cos(angle) * radius];
  const make = (shape: Shape, depth: number, part: Surface, bevel: boolean) => {
    const g = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel,
      bevelSize: 0.008,
      bevelThickness: 0.008,
      bevelSegments: 2,
      curveSegments: 16,
    });
    const smooth = curvedSolid(g, bend);
    m.add(part, smooth, at, [0, angle, 0]);
  };
  make(outer, 0.045, 'wall', true);
  make(new Shape(archPath(width * 0.65, height * 0.66, true).getPoints(20)), 0.008, 'glass', false);
  const sine = Math.sin(angle),
    cosine = Math.cos(angle);
  m.curve(
    'trim',
    outline.map((p) => {
      const z = bend(p.x, p.y) + 0.048;
      return [p.x * cosine + z * sine + at[0], p.y + 0.1, z * cosine - p.x * sine + at[2]] as V;
    }),
    0.007,
  );
  for (let i = 1; i < 5; i++) {
    const y = height * 0.11 * i,
      z = bend(0, y) + 0.012;
    beam(
      m,
      'wood',
      [width * 0.55, 0.009, 0.013],
      [Math.sin(angle) * (radius + z), y + 0.1, Math.cos(angle) * (radius + z)],
      [0, angle, 0],
    );
  }
}
