import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  Vector3,
} from 'three';
import { BeveledBox } from '../BeveledBox';
import { canvasMap } from './board-paint';
import { FestivalPerformers, FestivalAudience } from './FestivalPeople';

const colors = ['#ee7256', '#f4bd50', '#39aca5', '#e98fa3'];
function Pennant({ x, y, color }: { x: number; y: number; color: string }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute(
      'position',
      new Float32BufferAttribute([-0.045, 0, 0, 0.045, 0, 0, 0, -0.125, 0], 3),
    );
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh position={[x, y, 0.015]} geometry={geometry} castShadow>
      <meshStandardMaterial color={color} side={DoubleSide} />
    </mesh>
  );
}
function Bunting() {
  const cord = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-0.65, 0.94, 0),
        new Vector3(0, 0.79, 0),
        new Vector3(0.65, 0.94, 0),
      ]),
    [],
  );
  return (
    <group position={[0, 0, -0.24]}>
      {[-0.65, 0.65].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.48, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.016, 0.96, 8]} />
            <meshStandardMaterial color="#e3b56c" />
          </mesh>
          <mesh position={[x, 0.97, 0]}>
            <sphereGeometry args={[0.028, 8, 6]} />
            <meshStandardMaterial color="#f7c35f" />
          </mesh>
          <BeveledBox
            position={[x, 0.03, 0]}
            size={[0.12, 0.06, 0.12]}
            color="#f7dfb7"
            radius={0.015}
          />
        </group>
      ))}
      <mesh>
        <tubeGeometry args={[cord, 20, 0.005, 5, false]} />
        <meshStandardMaterial color="#e5b77f" />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const x = -0.54 + i * 0.135;
        return (
          <Pennant key={i} x={x} y={0.79 + 0.15 * Math.pow(x / 0.65, 2)} color={colors[i % 4]} />
        );
      })}
    </group>
  );
}
function Canopy() {
  const geometry = useMemo(() => {
    const corners = [
      [-0.5, -0.23],
      [0, -0.23],
      [0.5, -0.23],
      [0.5, 0],
      [0.5, 0.23],
      [0, 0.23],
      [-0.5, 0.23],
      [-0.5, 0],
    ];
    const positions: number[] = [],
      indices: number[] = [];
    const g = new BufferGeometry();
    corners.forEach(([x, z], i) => {
      const next = corners[(i + 1) % 8];
      const start = i * 3;
      positions.push(0, 0.87, 0, x, 0.63, z, next[0], 0.63, next[1]);
      indices.push(start, start + 1, start + 2);
      g.addGroup(i * 3, 3, i % 2);
    });
    g.setAttribute('position', new Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial attach="material-0" color="#ec6954" side={DoubleSide} />
        <meshStandardMaterial attach="material-1" color="#fff0c8" side={DoubleSide} />
      </mesh>
      <BeveledBox
        position={[0, 0.61, 0.225]}
        size={[1, 0.085, 0.025]}
        color="#ef775d"
        radius={0.01}
      />
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
        <mesh key={x} position={[x, 0.565, 0.24]} scale={[0.1, 0.06, 0.018]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={i % 2 ? '#fff0c8' : '#ef775d'} />
        </mesh>
      ))}
      <mesh position={[0, 0.94, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.17, 6]} />
        <meshStandardMaterial color="#e9b254" />
      </mesh>
      <Pennant x={0.046} y={1.02} color="#39aca5" />
    </>
  );
}
function Lantern({ x }: { x: number }) {
  return (
    <group position={[x, 0.46, 0.19]}>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.09, 5]} />
        <meshStandardMaterial color="#e7be72" />
      </mesh>
      <mesh scale={[0.055, 0.075, 0.055]} castShadow>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#ffbf50" />
      </mesh>
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.006, 0.01, 0.055, 6]} />
        <meshStandardMaterial color="#ed7651" />
      </mesh>
    </group>
  );
}
function Balloons() {
  return (
    <group position={[-0.62, 0.1, 0.15]} scale={0.85}>
      <BeveledBox position={[0, 0.02, 0]} size={[0.1, 0.04, 0.1]} color="#f5ce86" radius={0.012} />
      {[
        [-0.055, 0.53, 0],
        [0.07, 0.6, -0.025],
        [0.015, 0.42, 0.055],
      ].map(([x, y, z], i) => (
        <group key={i}>
          <mesh position={[x / 2, y / 2, z / 2]} rotation={[0, 0, -Math.atan2(x, y)]}>
            <cylinderGeometry args={[0.002, 0.002, y, 4]} />
            <meshStandardMaterial color="#c4a56d" />
          </mesh>
          <mesh position={[x, y, z]} scale={[0.065, 0.085, 0.065]} castShadow>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={colors[i]} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export function FestivalCorner() {
  const map = useMemo(
    () =>
      canvasMap(
        (ctx, w, h) => {
          const ground = ctx.createLinearGradient(0, 0, w, h);
          ground.addColorStop(0, '#f58b8a');
          ground.addColorStop(0.52, '#ffb392');
          ground.addColorStop(1, '#ffe5b6');
          ctx.fillStyle = ground;
          ctx.fillRect(0, 0, w, h);
          // Broad borders read at board scale; the name sits on a quiet cream apron.
          ctx.strokeStyle = '#d65f6e';
          ctx.lineWidth = 20;
          ctx.beginPath();
          ctx.roundRect(17, 17, w - 34, h - 34, 26);
          ctx.stroke();
          ctx.strokeStyle = '#ffe6a4';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.roundRect(35, 35, w - 70, h - 70, 22);
          ctx.stroke();
          ctx.fillStyle = '#fff1d1';
          ctx.beginPath();
          ctx.moveTo(43, 610);
          ctx.quadraticCurveTo(380, 533, w - 43, 610);
          ctx.lineTo(w - 43, h - 43);
          ctx.lineTo(43, h - 43);
          ctx.closePath();
          ctx.fill();
          const glow = ctx.createRadialGradient(190, 180, 20, 190, 180, 310);
          glow.addColorStop(0, '#ffedb7b0');
          glow.addColorStop(1, '#ffedb700');
          ctx.fillStyle = glow;
          ctx.fillRect(40, 40, w - 80, h - 80);
          ctx.save();
          ctx.translate(350, 350);
          ctx.fillStyle = '#fff0bb';
          ctx.beginPath();
          ctx.arc(0, 0, 144, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#43b9ac';
          ctx.beginPath();
          ctx.arc(0, 0, 130, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#b4e6c3';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, 115, 0, Math.PI * 2);
          ctx.stroke();
          for (let i = 0; i < 12; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 6);
            ctx.fillStyle = '#ffe3a1';
            ctx.beginPath();
            ctx.moveTo(0, -82);
            ctx.lineTo(13, -31);
            ctx.lineTo(-13, -31);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
          ctx.fillStyle = '#fff2bf';
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          const confetti = ['#e65375', '#fff3c0', '#209f9c', '#8d78b6'];
          for (let i = 0; i < 46; i++) {
            const a = i * 2.399,
              r = 172 + (i % 4) * 27;
            const x = 350 + Math.cos(a) * r,
              y = 330 + Math.sin(a) * r;
            if (y > 570 || x < 55 || x > w - 55 || y < 55) continue;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(a);
            ctx.fillStyle = confetti[i % 4];
            if (i % 3 === 0) {
              ctx.beginPath();
              ctx.arc(0, 0, 4, 0, Math.PI * 2);
              ctx.fill();
            } else ctx.fillRect(-3, -7, 6, 14);
            ctx.restore();
          }
          // Warm bulbs around the outside edge, with no actual dynamic lights.
          for (let i = 0; i < 11; i++)
            for (const [x, y] of [
              [65 + i * 64, 51],
              [51, 65 + i * 64],
              [w - 51, 65 + i * 64],
            ]) {
              const halo = ctx.createRadialGradient(x, y, 1, x, y, 13);
              halo.addColorStop(0, '#fffbdcff');
              halo.addColorStop(1, '#fff3a500');
              ctx.fillStyle = halo;
              ctx.fillRect(x - 13, y - 13, 26, 26);
              ctx.fillStyle = '#fff5c5';
              ctx.beginPath();
              ctx.arc(x, y, 3, 0, Math.PI * 2);
              ctx.fill();
            }
        },
        768,
        768,
      ),
    [],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <>
      <mesh position={[0, 0.094, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.735, 1.735]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <group position={[-0.35, 0.1, -0.35]} rotation={[0, Math.PI / 4, 0]} scale={0.74}>
        <BeveledBox
          position={[0, 0.035, 0]}
          size={[1.04, 0.07, 0.5]}
          color="#e6bf82"
          radius={0.025}
        />
        <BeveledBox
          position={[0, 0.078, 0.05]}
          size={[0.91, 0.025, 0.36]}
          color="#f5dbab"
          radius={0.012}
        />
        <BeveledBox
          position={[0, 0.025, 0.31]}
          size={[0.64, 0.05, 0.13]}
          color="#f0d3a0"
          radius={0.015}
        />
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.023, 0.027, 0.56, 8]} />
            <meshStandardMaterial color="#e97b58" />
          </mesh>
        ))}
        <BeveledBox
          position={[0, 0.32, -0.17]}
          size={[0.77, 0.46, 0.025]}
          color="#3caaa2"
          radius={0.015}
        />
        {[-0.31, 0.31].map((x) => (
          <BeveledBox
            key={x}
            position={[x, 0.32, -0.14]}
            size={[0.14, 0.46, 0.025]}
            color="#ec795d"
            radius={0.015}
          />
        ))}
        <FestivalPerformers />
        <Canopy />
        <Lantern x={-0.3} />
        <Lantern x={0.3} />
        <Bunting />
        {[-0.38, -0.19, 0, 0.19, 0.38].map((x, i) => (
          <mesh key={x} position={[x, 0.55, 0.27]}>
            <sphereGeometry args={[0.018, 8, 6]} />
            <meshStandardMaterial
              color={colors[i % 4]}
              emissive={colors[i % 4]}
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
      </group>
      <Balloons />
      <FestivalAudience />
    </>
  );
}
