import { BufferGeometry, Float32BufferAttribute } from 'three';
import { Miniature, type Surface } from '../vietnam/miniature';
type V = [number, number, number];
function grid(
  m: Miniature,
  part: Surface,
  at: V,
  nu: number,
  nv: number,
  point: (u: number, v: number) => V,
  reverse = false,
) {
  const positions: number[] = [],
    uv: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const u = i / nu,
        v = j / nv;
      positions.push(...point(u, v));
      uv.push(u, v);
    }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i,
        b = a + 1,
        c = b + nu + 1,
        d = a + nu + 1;
      indices.push(...(reverse ? [a, c, b, a, d, c] : [a, b, c, a, c, d]));
    }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  m.add(part, g, at);
}
function ribbon(m: Miniature, part: Surface, at: V, point: (u: number) => V, width = 0.026) {
  grid(m, part, at, 16, 1, (u, v) => {
    const [x, y, z] = point(u);
    return [x, y + (v - 0.5) * width, z];
  });
}
/** Curved hip surfaces with a raised eave and actual low-relief tile crowns. */
export function curvedHip(
  m: Miniature,
  w: number,
  d: number,
  h: number,
  at: V,
  part: Surface = 'roof',
  edge: Surface = 'trim',
  upturned = true,
  ridge = 0.32,
  hipEdge: Surface = part,
) {
  const profile = (t: number, u: number) =>
    h * Math.pow(1 - t, upturned ? 1.55 : 1) +
    (upturned ? h * 0.1 * Math.pow(t, 7) : 0) +
    (upturned ? h * 0.1 * Math.pow(Math.abs(u * 2 - 1), 5) * t * t : 0);
  for (const side of [-1, 1]) {
    grid(
      m,
      part,
      at,
      16,
      6,
      (u, t) => {
        const half = w * (ridge + (0.5 - ridge) * t),
          ripple =
            0.006 *
            Math.pow(Math.sin(u * Math.PI * 12), 2) *
            Math.pow(Math.sin(t * Math.PI * 4), 2);
        return [(u * 2 - 1) * half, profile(t, u) + ripple, (side * t * d) / 2];
      },
      side === 1,
    );
    ribbon(m, edge, at, (u) => [((u * 2 - 1) * w) / 2, profile(1, u) - 0.012, (side * d) / 2]);
    // Continuous rounded hips outline the silhouette without a dense wire cage.
    for (const end of [-1, 1])
      ribbon(
        m,
        hipEdge,
        at,
        (t) => [
          end * w * (ridge + (0.5 - ridge) * t),
          profile(t, end < 0 ? 0 : 1) + 0.009,
          (side * t * d) / 2,
        ],
        0.019,
      );
  }
  for (const side of [-1, 1]) {
    grid(
      m,
      part,
      at,
      8,
      6,
      (u, t) => {
        const ripple =
          0.005 * Math.pow(Math.sin(u * Math.PI * 6), 2) * Math.pow(Math.sin(t * Math.PI * 4), 2);
        return [
          side * w * (ridge + (0.5 - ridge) * t),
          profile(t, u) + ripple,
          ((u * 2 - 1) * t * d) / 2,
        ];
      },
      side === -1,
    );
    ribbon(m, edge, at, (u) => [(side * w) / 2, profile(1, u) - 0.012, ((u * 2 - 1) * d) / 2]);
  }
  if (ridge > 0.05) m.box(part, [w * ridge * 2, 0.035, 0.045], [at[0], at[1] + h + 0.012, at[2]]);
}
/** Concave timber/thatch roof; front and rear ridges sweep upward as in the concept. */
export function sweptGable(
  m: Miniature,
  w: number,
  d: number,
  h: number,
  at: V,
  part: Surface = 'roof',
  edge: Surface = 'trim',
  endSweep = 0.12,
) {
  const height = (u: number, v: number) => {
    const r = Math.abs(u * 2 - 1);
    return (
      h * Math.pow(1 - r, 1.35) +
      h * 0.065 * Math.pow(r, 6) +
      h * endSweep * Math.pow(Math.abs(v * 2 - 1), 4) * (1 - r * 0.7)
    );
  };
  grid(
    m,
    part,
    at,
    24,
    12,
    (u, v) => {
      const bump =
        0.006 * Math.pow(Math.sin(u * Math.PI * 12), 2) * Math.pow(Math.sin(v * Math.PI * 6), 2);
      return [(u - 0.5) * w, height(u, v) + bump, (v - 0.5) * d];
    },
    true,
  );
  for (let k = 1; k < 20; k++) {
    const v0 = k / 20;
    grid(
      m,
      part,
      at,
      24,
      2,
      (u, across) => {
        const v = v0 + (across - 0.5) * 0.012;
        return [
          (u - 0.5) * w,
          height(u, v) + 0.004 + Math.sin(across * Math.PI) * 0.009,
          (v - 0.5) * d,
        ];
      },
      true,
    );
  }
  for (const v of [0, 1])
    ribbon(m, edge, at, (u) => [(u - 0.5) * w, height(u, v) - 0.008, (v - 0.5) * d], 0.032);
  for (const u of [0, 1])
    ribbon(m, edge, at, (v) => [(u - 0.5) * w, height(u, v) - 0.008, (v - 0.5) * d], 0.024);
  ribbon(m, part, at, (v) => [0, height(0.5, v) + 0.014, (v - 0.5) * d], 0.035);
}
