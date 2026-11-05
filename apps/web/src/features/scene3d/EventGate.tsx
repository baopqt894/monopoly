import { useEffect, useMemo } from 'react';
import { CatmullRomCurve3, DoubleSide, PlaneGeometry, TubeGeometry, Vector3 } from 'three';
import { canvasMap } from './board32/board-paint';

const pennants = ['#e9a84c', '#68b8b0', '#e88b90', '#9cbc75', '#edc76b'];

/** Original procedural festival decoration; kept inside the lot's tangent width. */
export function EventGate({
  width,
  festival,
  multiplier,
  event,
  reverse,
}: {
  width: number;
  festival: boolean;
  multiplier: number;
  event: boolean;
  reverse: boolean;
}) {
  const span = width * 0.84;
  const string = useMemo(
    () =>
      new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(-span / 2, 1.02, 0.025),
          new Vector3(0, 0.986, 0.025),
          new Vector3(span / 2, 1.02, 0.025),
        ]),
        16,
        0.003,
        4,
        false,
      ),
    [span],
  );
  useEffect(() => () => string.dispose(), [string]);
  const cloth = useMemo(() => {
    const geometry = new PlaneGeometry(span, 0.26, 16, 2);
    const points = geometry.attributes.position;
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i);
      const sag = 1 - ((2 * x) / span) ** 2;
      points.setY(i, points.getY(i) - sag * 0.045);
      points.setZ(i, Math.sin((x / span) * Math.PI * 2) * 0.018);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, [span]);
  const maps = useMemo(
    () => [
      canvasMap(
        (ctx, w, h) => {
          ctx.fillStyle = festival ? '#d97884' : '#c99743';
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = '#ffe9b6';
          ctx.lineWidth = 5;
          ctx.strokeRect(7, 8, w - 14, h - 16);
          ctx.fillStyle = '#fff9e8';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '800 57px sans-serif';
          ctx.fillText(festival ? 'LỄ HỘI' : 'SỰ KIỆN', w / 2, h / 2 + 2);
        },
        384,
        112,
      ),
      canvasMap(
        (ctx, w, h) => {
          ctx.fillStyle = '#fff5d9';
          ctx.beginPath();
          ctx.roundRect(0, 0, w, h, 24);
          ctx.fill();
          ctx.fillStyle = '#5c766a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '800 56px sans-serif';
          ctx.fillText(
            `×${multiplier.toLocaleString('vi-VN')}`,
            w / 2,
            festival && event ? 44 : h / 2,
          );
          if (festival && event) {
            ctx.font = '700 26px sans-serif';
            ctx.fillText('SK ×1,25', w / 2, 91);
          }
        },
        256,
        116,
      ),
    ],
    [festival, multiplier, event],
  );
  useEffect(() => () => cloth.dispose(), [cloth]);
  useEffect(() => () => maps.forEach((map) => map.dispose()), [maps]);
  return (
    <group>
      {[-1, 1].map((sign) => (
        <group key={sign} position={[(sign * span) / 2, 0, 0]}>
          <mesh position={[0, 0.025, 0]} raycast={() => {}}>
            <cylinderGeometry args={[0.055, 0.065, 0.05, 8]} />
            <meshStandardMaterial color="#b7bd9e" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.66, 0]} raycast={() => {}}>
            <cylinderGeometry args={[0.014, 0.021, 1.3, 8]} />
            <meshStandardMaterial color="#fff1c8" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.34, 0]} raycast={() => {}}>
            <sphereGeometry args={[0.033, 8, 6]} />
            <meshStandardMaterial color="#dca657" roughness={0.55} />
          </mesh>
        </group>
      ))}
      <group rotation={[0, reverse ? Math.PI : 0, 0]}>
        <mesh geometry={string} raycast={() => {}}>
          <meshStandardMaterial color="#e9d5ac" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.13, 0]} geometry={cloth} raycast={() => {}}>
          <meshBasicMaterial map={maps[0]} side={DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.79, 0.012]} raycast={() => {}}>
          <planeGeometry args={[0.35, 0.16]} />
          <meshBasicMaterial map={maps[1]} side={DoubleSide} transparent toneMapped={false} />
        </mesh>
        {pennants.map((color, i) => {
          const x = ((i - 2) * span) / 5.4;
          const y = 0.96 + Math.abs(i - 2) * 0.012;
          return (
            <mesh
              key={color}
              position={[x, y, 0.025]}
              rotation={[0, 0, -Math.PI / 2]}
              raycast={() => {}}
            >
              <circleGeometry args={[0.052, 3]} />
              <meshStandardMaterial color={color} side={DoubleSide} roughness={0.9} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
