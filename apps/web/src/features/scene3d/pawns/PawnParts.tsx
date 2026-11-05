import { useEffect, useMemo } from 'react';
import { CanvasTexture, CatmullRomCurve3, Quaternion, SRGBColorSpace, Vector3 } from 'three';
import { BeveledBox } from '../BeveledBox';

export type Point = [number, number, number];
export const SKIN = '#e8ae78';
export const INK = '#29383c';
export const CREAM = '#fff0d2';

export function DecalText({ text, at, width = 0.2 }: { text: string; at: Point; width?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const context = canvas.getContext('2d')!;
    context.font = 'bold 65px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.fillText(text, 128, 50);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={at}>
      <planeGeometry args={[width, width * 0.375]} />
      <meshStandardMaterial map={texture} transparent depthWrite={false} roughness={0.8} />
    </mesh>
  );
}

export function Ball({
  at,
  size,
  color,
  metal = false,
}: {
  at: Point;
  size: Point;
  color: string;
  metal?: boolean;
}) {
  return (
    <mesh position={at} scale={size} castShadow receiveShadow>
      <sphereGeometry args={[1, 20, 14]} />
      <meshStandardMaterial
        color={color}
        roughness={metal ? 0.3 : 0.68}
        metalness={metal ? 0.6 : 0}
      />
    </mesh>
  );
}

export function Rod({
  from,
  to,
  radius = 0.025,
  color,
  metal = false,
}: {
  from: Point;
  to: Point;
  radius?: number;
  color: string;
  metal?: boolean;
}) {
  const a = new Vector3(...from),
    b = new Vector3(...to);
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <mesh position={a.add(b).multiplyScalar(0.5)} quaternion={q} castShadow>
      <cylinderGeometry
        args={[radius, radius, new Vector3(...from).distanceTo(new Vector3(...to)), 12]}
      />
      <meshStandardMaterial
        color={color}
        roughness={metal ? 0.3 : 0.7}
        metalness={metal ? 0.65 : 0}
      />
    </mesh>
  );
}

export function Curve({
  points,
  radius = 0.02,
  color,
}: {
  points: Point[];
  radius?: number;
  color: string;
}) {
  const path = useMemo(
    () => new CatmullRomCurve3(points.map((point) => new Vector3(...point))),
    [points],
  );
  return (
    <mesh castShadow>
      <tubeGeometry args={[path, 24, radius, 8, false]} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}

export function Head({
  at,
  hat,
  glasses = false,
  female = false,
  moustache = false,
  helmetColor = '#2c8d77',
  hair = 'tuft',
}: {
  at: Point;
  hat?: 'nonla' | 'helmet' | 'cap';
  glasses?: boolean | 'round';
  female?: boolean;
  moustache?: boolean;
  helmetColor?: string;
  hair?: 'tuft' | 'short';
}) {
  return (
    <group position={at}>
      <Rod from={[0, -0.23, 0]} to={[0, -0.13, 0]} radius={0.063} color={SKIN} />
      <Ball at={[0, 0, 0]} size={[0.215, 0.235, 0.19]} color={SKIN} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ball at={[s * 0.207, -0.015, 0]} size={[0.045, 0.065, 0.045]} color={SKIN} />
          <Ball at={[s * 0.078, 0.015, 0.173]} size={[0.037, 0.044, 0.019]} color={CREAM} />
          <Ball at={[s * 0.074, 0.012, 0.189]} size={[0.018, 0.026, 0.009]} color={INK} />
          <Rod
            from={[s * 0.11, 0.075, 0.17]}
            to={[s * 0.048, 0.083, 0.18]}
            radius={0.012}
            color="#3c2e28"
          />
          <Ball at={[s * 0.125, -0.07, 0.16]} size={[0.037, 0.02, 0.008]} color="#d58b71" />
        </group>
      ))}
      <Ball at={[0, -0.035, 0.193]} size={[0.034, 0.043, 0.031]} color={SKIN} />
      <Curve
        points={[
          [-0.055, -0.104, 0.16],
          [0, -0.119, 0.179],
          [0.055, -0.104, 0.16],
        ]}
        radius={0.009}
        color="#8b4d3b"
      />
      <mesh position={[0, hair === 'short' ? 0.015 : 0.034, -0.018]} castShadow>
        <sphereGeometry
          args={[0.222, 24, 16, 0, Math.PI * 2, 0, Math.PI * (hair === 'short' ? 0.38 : 0.53)]}
        />
        <meshStandardMaterial color="#302e2a" roughness={0.85} />
      </mesh>
      {!hat && hair !== 'short' && (
        <>
          {[-1, 0, 1].map((s) => (
            <Ball
              key={s}
              at={[s * 0.09, 0.17 - Math.abs(s) * 0.03, 0.12]}
              size={[0.085, 0.095, 0.06]}
              color="#302e2a"
            />
          ))}
        </>
      )}
      {female && (
        <Ball
          at={[0.13, hat === 'nonla' ? -0.08 : -0.02, -0.17]}
          size={[0.12, hat === 'nonla' ? 0.18 : 0.22, 0.11]}
          color="#302e2a"
        />
      )}
      {moustache && <Ball at={[0, -0.086, 0.182]} size={[0.07, 0.017, 0.012]} color="#57463a" />}
      {glasses === 'round' && (
        <>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.087, 0.023, 0.202]}>
              <torusGeometry args={[0.068, 0.01, 8, 24]} />
              <meshStandardMaterial color="#3b3331" roughness={0.5} />
            </mesh>
          ))}
          <Rod from={[-0.02, 0.03, 0.205]} to={[0.02, 0.03, 0.205]} radius={0.008} color={INK} />
        </>
      )}
      {glasses === true && (
        <>
          {[-1, 1].map((s) => (
            <BeveledBox
              key={s}
              size={[0.15, 0.088, 0.026]}
              position={[s * 0.09, 0.025, 0.192]}
              color="#20282d"
              radius={0.03}
              roughness={0.2}
            />
          ))}
          <Rod from={[-0.03, 0.035, 0.207]} to={[0.03, 0.035, 0.207]} radius={0.013} color={INK} />
        </>
      )}
      {hat === 'nonla' && (
        <group position={[0, 0.21, 0]} rotation={[0.08, 0, -0.1]}>
          <mesh castShadow>
            <coneGeometry args={[0.34, 0.18, 40]} />
            <meshStandardMaterial color="#efd494" roughness={0.87} />
          </mesh>
          <mesh position={[0, -0.088, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.326, 0.012, 8, 40]} />
            <meshStandardMaterial color="#bd945b" />
          </mesh>
          <Curve
            points={[
              [-0.2, -0.1, 0.035],
              [0, -0.35, 0.15],
              [0.2, -0.1, 0.035],
            ]}
            radius={0.01}
            color="#a64d54"
          />
        </group>
      )}
      {hat === 'helmet' && (
        <>
          <mesh position={[0, 0.025, -0.012]} castShadow>
            <sphereGeometry args={[0.24, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={helmetColor} roughness={0.3} />
          </mesh>
          <BeveledBox
            size={[0.38, 0.025, 0.15]}
            position={[0, 0.08, 0.18]}
            color={helmetColor}
            radius={0.025}
          />
          <Curve
            points={[
              [-0.19, 0, 0],
              [-0.12, -0.18, 0.08],
              [0.12, -0.18, 0.08],
              [0.19, 0, 0],
            ]}
            radius={0.012}
            color={INK}
          />
        </>
      )}
      {hat === 'cap' && (
        <>
          <Ball at={[0, 0.14, -0.02]} size={[0.23, 0.13, 0.205]} color="#35495e" />
          <BeveledBox
            size={[0.36, 0.035, 0.2]}
            position={[0, 0.14, 0.2]}
            color="#35495e"
            radius={0.03}
          />
        </>
      )}
    </group>
  );
}

export function Torso({
  at,
  color,
  size = [0.23, 0.28, 0.15],
}: {
  at: Point;
  color: string;
  size?: Point;
}) {
  return (
    <group position={at}>
      <Ball at={[0, 0, 0]} size={size} color={color} />
      <Rod
        from={[0, -size[1] * 0.7, size[2] * 0.98]}
        to={[0, size[1] * 0.63, size[2] * 0.98]}
        radius={0.009}
        color="#e8dbc1"
      />
    </group>
  );
}

export function Arm({
  points,
  shirt,
  radius = 0.058,
  longSleeve = false,
}: {
  points: [Point, Point, Point];
  shirt: string;
  radius?: number;
  longSleeve?: boolean;
}) {
  return (
    <>
      <Rod from={points[0]} to={points[1]} radius={radius} color={shirt} />
      <Ball at={points[1]} size={[radius, radius, radius]} color={shirt} />
      <Rod
        from={points[1]}
        to={points[2]}
        radius={radius * 0.74}
        color={longSleeve ? shirt : SKIN}
      />
      <Ball at={points[2]} size={[radius * 0.9, radius, radius * 0.85]} color={SKIN} />
    </>
  );
}

export function Wheel({
  at,
  radius = 0.24,
  axis = 'z',
}: {
  at: Point;
  radius?: number;
  axis?: 'x' | 'z';
}) {
  return (
    <group position={at} rotation={axis === 'x' ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
      <mesh castShadow>
        <torusGeometry args={[radius, 0.04, 10, 32]} />
        <meshStandardMaterial color="#303b3b" roughness={0.9} />
      </mesh>
      <mesh>
        <torusGeometry args={[radius - 0.036, 0.012, 8, 32]} />
        <meshStandardMaterial color="#e3d7b9" metalness={0.7} roughness={0.25} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 10;
        return (
          <Rod
            key={i}
            from={[0, 0, 0]}
            to={[Math.cos(angle) * (radius - 0.04), Math.sin(angle) * (radius - 0.04), 0]}
            radius={0.006}
            color="#ddd6bd"
            metal
          />
        );
      })}
      <Ball at={[0, 0, 0]} size={[0.047, 0.047, 0.056]} color="#d8cba5" metal />
    </group>
  );
}
