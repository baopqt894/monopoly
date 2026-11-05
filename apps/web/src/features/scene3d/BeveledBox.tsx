import { useEffect, useMemo, type ReactNode } from 'react';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export function BeveledBox({
  size,
  color,
  radius = 0.05,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  metalness = 0,
  roughness = 0.65,
  children,
}: {
  size: [number, number, number];
  color: string;
  radius?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  metalness?: number;
  roughness?: number;
  children?: ReactNode;
}) {
  const [width, height, depth] = size;
  const geometry = useMemo(
    () => new RoundedBoxGeometry(width, height, depth, 2, Math.min(radius, height / 3)),
    [width, height, depth, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh castShadow receiveShadow geometry={geometry} position={position} rotation={rotation}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      {children}
    </mesh>
  );
}
