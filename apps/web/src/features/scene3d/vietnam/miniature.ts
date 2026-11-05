import {
  Box3,
  BufferGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Surface = 'wall' | 'roof' | 'trim' | 'glass' | 'gold' | 'green' | 'water' | 'wood';
type XYZ = [number, number, number];
export type ModelGeometry = Partial<Record<Surface, BufferGeometry>>;

/** Editable, code-authored miniature mesh source. Each surface is merged once. */
export class Miniature {
  private parts = new Map<Surface, BufferGeometry[]>();
  add(part: Surface, g: BufferGeometry, at: XYZ, rotation: XYZ = [0, 0, 0]) {
    if (g.index) {
      const flat = g.toNonIndexed();
      g.dispose();
      g = flat;
    }
    g.rotateX(rotation[0]);
    g.rotateY(rotation[1]);
    g.rotateZ(rotation[2]);
    g.translate(...at);
    const list = this.parts.get(part) ?? [];
    list.push(g);
    this.parts.set(part, list);
  }
  box(part: Surface, size: XYZ, at: XYZ, rotation: XYZ = [0, 0, 0]) {
    this.add(
      part,
      new RoundedBoxGeometry(...size, 1, Math.min(0.025, ...size.map((v) => v / 4))),
      at,
      rotation,
    );
  }
  cylinder(part: Surface, top: number, bottom: number, h: number, at: XYZ, sides = 24) {
    this.add(part, new CylinderGeometry(top, bottom, h, sides), at);
  }
  ball(part: Surface, size: XYZ, at: XYZ) {
    const g = new SphereGeometry(1, 12, 8);
    g.scale(...size);
    this.add(part, g, at);
  }
  cone(part: Surface, radius: number, h: number, at: XYZ, sides = 24, tilt = 0) {
    this.add(part, new ConeGeometry(radius, h, sides), at, [0, 0, tilt]);
  }
  panel(part: Surface, points: [number, number][], depth: number, at: XYZ) {
    const shape = new Shape();
    shape.moveTo(...points[0]);
    points.slice(1).forEach((point) => shape.lineTo(...point));
    shape.closePath();
    this.add(part, new ExtrudeGeometry(shape, { depth, bevelEnabled: false }), at);
  }
  curve(part: Surface, points: XYZ[], radius: number) {
    this.add(
      part,
      new TubeGeometry(
        new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
        32,
        radius,
        6,
        false,
      ),
      [0, 0, 0],
    );
  }
  arch(part: Surface, w: number, h: number, d: number, at: XYZ, rotationY = 0) {
    const s = new Shape(),
      r = w / 2;
    s.moveTo(-r, 0);
    s.lineTo(r, 0);
    s.lineTo(r, h - r);
    s.absarc(0, h - r, r, 0, Math.PI, false);
    s.closePath();
    this.add(
      part,
      new ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 10 }),
      at,
      [0, rotationY, 0],
    );
  }
  roof(w: number, d: number, h: number, at: XYZ, tiled = true, surface: Surface = 'roof') {
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
          w / 2,
          0,
          d / 2,
          -w / 2,
          0,
          d / 2,
          -w * 0.32,
          h,
          0,
          w * 0.32,
          h,
          0,
        ],
        3,
      ),
    );
    g.setIndex([3, 2, 5, 3, 5, 4, 0, 4, 5, 0, 5, 1, 0, 3, 4, 1, 5, 2, 0, 1, 2, 0, 2, 3]);
    const flat = g.toNonIndexed();
    g.dispose();
    flat.computeVertexNormals();
    flat.setAttribute(
      'uv',
      new Float32BufferAttribute(new Float32Array(flat.getAttribute('position').count * 2), 2),
    );
    this.add(surface, flat, at);
    this.box('trim', [w + 0.025, 0.045, d + 0.025], [at[0], at[1] - 0.015, at[2]]);
    this.box(surface, [w * 0.65, 0.055, 0.055], [at[0], at[1] + h, at[2]]);
    if (tiled)
      for (let i = 1; i < 9; i++)
        for (const side of [-1, 1]) {
          const pitch = Math.atan2(h, d / 2),
            length = Math.hypot(h, d / 2);
          this.box(
            surface,
            [0.018, 0.018, length],
            [at[0] - w * 0.4 + i * w * 0.08, at[1] + h * 0.49 + 0.012, at[2] + side * d * 0.25],
            [side * pitch, 0, 0],
          );
        }
  }
  window(x: number, y: number, z: number, w = 0.22, h = 0.3, side = 0) {
    this.arch('trim', w + 0.055, h + 0.045, 0.025, [x, y, z], side);
    this.arch('glass', w, h, 0.029, [x, y + 0.018, z + 0.018], side);
    if (!side) this.box('trim', [0.018, h - 0.05, 0.035], [x, y + h * 0.5, z + 0.05]);
  }
  steps(w: number, z: number, height = 0.18) {
    for (let i = 0; i < 3; i++)
      this.box(
        'trim',
        [w - i * 0.035, height / 3, 0.15],
        [0, ((i + 0.5) * height) / 3, z - i * 0.11],
      );
  }
  shrub(x: number, z: number, scale = 1) {
    this.box('trim', [0.25 * scale, 0.1, 0.23 * scale], [x, 0.08, z]);
    this.ball('green', [0.11 * scale, 0.12 * scale, 0.1 * scale], [x, 0.2, z]);
  }
  finish(): ModelGeometry {
    const merged: ModelGeometry = {};
    const bounds = new Box3();
    for (const [part, items] of this.parts) {
      const g = mergeGeometries(items)!;
      items.forEach((item) => item.dispose());
      g.computeBoundingBox();
      bounds.union(g.boundingBox!);
      merged[part] = g;
    }
    const size = bounds.getSize(new Vector3()),
      center = bounds.getCenter(new Vector3());
    const scale = Math.min(1, 1.42 / size.x, 1.12 / size.z, 2.05 / size.y);
    for (const g of Object.values(merged)) {
      g.translate(-center.x, -bounds.min.y, -center.z);
      g.scale(scale, scale, scale);
      g.computeBoundingBox();
      g.computeBoundingSphere();
    }
    return merged;
  }
}
