import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  Shape,
  Quaternion,
  Vector3,
} from 'three';
import { canvasMap } from './board-paint';

/** Open beach in the middle; all scenery stays on the outside edge. */
function shoreline() {
  const s = new Shape();
  s.moveTo(-0.69, -0.18);
  s.bezierCurveTo(-0.74, 0.15, -0.55, 0.52, -0.24, 0.56);
  s.bezierCurveTo(0.05, 0.65, 0.18, 0.41, 0.38, 0.39);
  s.bezierCurveTo(0.65, 0.39, 0.73, 0.09, 0.56, -0.12);
  s.bezierCurveTo(0.44, -0.29, 0.53, -0.48, 0.18, -0.53);
  s.bezierCurveTo(-0.1, -0.59, -0.2, -0.38, -0.39, -0.39);
  s.bezierCurveTo(-0.57, -0.43, -0.67, -0.36, -0.69, -0.18);
  return s;
}
function Frond({ angle, length, tilt }: { angle: number; length: number; tilt: number }) {
  const { geometry, rib } = useMemo(() => {
    const vertices: number[] = [];
    const indices: number[] = [];
    const points: Vector3[] = [];
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = t * length;
      const y = Math.sin(t * Math.PI) * 0.16 - t * t * 0.23;
      // Broad, paired leaflets form a recognisable palm silhouette at game scale.
      const envelope = Math.pow(Math.sin(t * Math.PI), 0.8) * 0.074;
      const width = envelope * (i % 2 ? 0.68 : 1);
      vertices.push(
        x - 0.018 * Math.sin(t * Math.PI),
        y - 0.025,
        -width,
        x,
        y,
        0,
        x - 0.018 * Math.sin(t * Math.PI),
        y - 0.025,
        width,
      );
      points.push(new Vector3(x, y + 0.003, 0));
      if (i < steps) {
        const n = i * 3;
        indices.push(
          n,
          n + 3,
          n + 1,
          n + 1,
          n + 3,
          n + 4,
          n + 1,
          n + 4,
          n + 2,
          n + 2,
          n + 4,
          n + 5,
        );
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return { geometry: g, rib: new CatmullRomCurve3(points) };
  }, [length]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group rotation={[0, angle, tilt]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color={angle > 3 ? '#23996b' : '#42b575'}
          side={DoubleSide}
          roughness={0.85}
        />
      </mesh>
      <mesh>
        <tubeGeometry args={[rib, 20, 0.004, 4, false]} />
        <meshStandardMaterial color="#91c65a" />
      </mesh>
    </group>
  );
}
function IslandPalm() {
  const { segments, rings } = useMemo(() => {
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0.015, 0.23, 0.01),
      new Vector3(0.095, 0.5, -0.015),
      new Vector3(0.245, 0.79, -0.055),
    ]);
    const up = new Vector3(0, 1, 0);
    const segments = Array.from({ length: 12 }, (_, i) => {
      const start = curve.getPointAt(i / 12),
        end = curve.getPointAt((i + 1) / 12);
      return {
        position: start.clone().add(end).multiplyScalar(0.5),
        rotation: new Quaternion().setFromUnitVectors(up, end.clone().sub(start).normalize()),
        height: start.distanceTo(end) + 0.003,
        bottom: 0.052 - i * 0.0019,
        top: 0.052 - (i + 1) * 0.0019,
      };
    });
    const rings = segments
      .slice(1, 11)
      .map((_, i) => ({
        position: curve.getPointAt((i + 1) / 12),
        rotation: new Quaternion().setFromUnitVectors(
          new Vector3(0, 0, 1),
          curve.getTangentAt((i + 1) / 12),
        ),
        radius: 0.052 - (i + 1) * 0.0019,
      }));
    return { segments, rings };
  }, []);
  return (
    <group position={[-0.43, 0.19, -0.36]}>
      {segments.map((s, i) => (
        <mesh key={i} position={s.position} quaternion={s.rotation} castShadow>
          <cylinderGeometry args={[s.top, s.bottom, s.height, 9]} />
          <meshStandardMaterial color={i % 2 ? '#bb925f' : '#c9a674'} roughness={1} />
        </mesh>
      ))}
      {rings.map((r, i) => (
        <mesh key={i} position={r.position} quaternion={r.rotation}>
          <torusGeometry args={[r.radius, 0.0035, 3, 9]} />
          <meshStandardMaterial color="#9f7f53" />
        </mesh>
      ))}
      <group position={[0.245, 0.79, -0.055]}>
        {[0.08, 0.88, 1.7, 2.48, 3.25, 4.05, 4.85, 5.65].map((a, i) => (
          <Frond
            key={a}
            angle={a}
            length={[0.55, 0.49, 0.58, 0.51, 0.56, 0.5, 0.57, 0.48][i]}
            tilt={i % 3 === 0 ? -0.13 : 0.03}
          />
        ))}
        <mesh position={[0, 0.055, 0]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.025, 0.16, 6]} />
          <meshStandardMaterial color="#7ec55a" />
        </mesh>
        {[
          [-0.05, -0.055, 0.035],
          [0.04, -0.07, 0.065],
          [0.065, -0.035, -0.035],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} castShadow>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshStandardMaterial color={i % 2 ? '#a2ad4f' : '#809849'} roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
export function IslandCorner() {
  const shape = useMemo(shoreline, []);
  const water = useMemo(
    () =>
      canvasMap(
        (ctx, w, h) => {
          const gradient = ctx.createLinearGradient(0, 0, w, h);
          gradient.addColorStop(0, '#29b9c9');
          gradient.addColorStop(1, '#8ee9e2');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, w, h);
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.scale(w / 1.735, h / 1.735);
          const points = shape.getPoints(60);
          for (const [scale, color] of [
            [1.18, '#a3eee1'],
            [1.08, '#e7fff0'],
          ] as const) {
            ctx.save();
            ctx.scale(scale, scale);
            ctx.beginPath();
            points.forEach((p, i) => (i ? ctx.lineTo(p.x, -p.y) : ctx.moveTo(p.x, -p.y)));
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
          }
          ctx.restore();
          ctx.strokeStyle = '#d5fff1';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          for (const [x, y] of [
            [55, 70],
            [390, 90],
            [420, 350],
            [110, 430],
          ]) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 13, y + 5, x + 28, y);
            ctx.stroke();
          }
        },
        768,
        768,
      ),
    [shape],
  );
  useEffect(() => () => water.dispose(), [water]);
  return (
    <group>
      <mesh position={[0, 0.094, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.735, 1.735]} />
        <meshBasicMaterial map={water} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.112, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.035,
              bevelEnabled: true,
              bevelSize: 0.035,
              bevelThickness: 0.018,
              bevelSegments: 2,
              steps: 1,
              curveSegments: 18,
            },
          ]}
        />
        <meshStandardMaterial color="#ffe7ac" roughness={1} />
      </mesh>
      <IslandPalm />
      <group position={[-0.44, 0.18, 0.21]}>
        <mesh scale={[0.16, 0.12, 0.13]} rotation={[0, 0.3, 0.1]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8fa8a4" flatShading />
        </mesh>
        <mesh position={[0.17, -0.02, 0.02]} scale={[0.1, 0.075, 0.09]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#b1c4b8" flatShading />
        </mesh>
      </group>
    </group>
  );
}
