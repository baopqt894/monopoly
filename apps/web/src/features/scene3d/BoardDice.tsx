import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { BeveledBox } from './BeveledBox';

const dots: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-0.18, 0.18],
    [0.18, -0.18],
  ],
  3: [
    [-0.18, 0.18],
    [0, 0],
    [0.18, -0.18],
  ],
  4: [
    [-0.18, 0.18],
    [0.18, 0.18],
    [-0.18, -0.18],
    [0.18, -0.18],
  ],
  5: [
    [-0.18, 0.18],
    [0.18, 0.18],
    [0, 0],
    [-0.18, -0.18],
    [0.18, -0.18],
  ],
  6: [
    [-0.18, 0.18],
    [0.18, 0.18],
    [-0.18, 0],
    [0.18, 0],
    [-0.18, -0.18],
    [0.18, -0.18],
  ],
};
const topRotations: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [-Math.PI / 2, 0, 0],
  3: [0, 0, Math.PI / 2],
  4: [0, 0, -Math.PI / 2],
  5: [Math.PI / 2, 0, 0],
  6: [Math.PI, 0, 0],
};
function Face({ value, rotation }: { value: number; rotation: [number, number, number] }) {
  return (
    <group rotation={rotation}>
      {dots[value].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.386]}>
          <circleGeometry args={[0.058, 16]} />
          <meshStandardMaterial color={value === 1 ? '#cf775c' : '#315e6b'} roughness={0.38} />
        </mesh>
      ))}
    </group>
  );
}
function Die({
  value,
  x,
  rolling,
  index,
}: {
  value: number;
  x: number;
  rolling: boolean;
  index: number;
}) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const rotation = ref.current.rotation;
    if (rolling) {
      rotation.x += delta * (8 + index);
      rotation.y += delta * (6 + index);
      rotation.z += delta * 4;
      ref.current.position.y =
        0.9 + Math.abs(Math.sin(state.clock.elapsedTime * 12 + index)) * 0.45;
    } else {
      const target = topRotations[value];
      rotation.x = MathUtils.damp(
        MathUtils.euclideanModulo(rotation.x + Math.PI, Math.PI * 2) - Math.PI,
        target[0],
        14,
        delta,
      );
      rotation.y = MathUtils.damp(
        MathUtils.euclideanModulo(rotation.y + Math.PI, Math.PI * 2) - Math.PI,
        target[1],
        14,
        delta,
      );
      rotation.z = MathUtils.damp(
        MathUtils.euclideanModulo(rotation.z + Math.PI, Math.PI * 2) - Math.PI,
        target[2],
        14,
        delta,
      );
      ref.current.position.y = MathUtils.damp(ref.current.position.y, 0.8, 12, delta);
    }
  });
  return (
    <group position={[x, 0, 0.1]} rotation={[0, index ? 0.18 : -0.15, 0]}>
      <group ref={ref} position={[0, 0.8, 0]}>
        <BeveledBox
          size={[0.76, 0.76, 0.76]}
          color="#fff4da"
          radius={0.09}
          roughness={0.24}
          metalness={0.035}
        />
        <Face value={1} rotation={[-Math.PI / 2, 0, 0]} />
        <Face value={6} rotation={[Math.PI / 2, 0, 0]} />
        <Face value={2} rotation={[0, 0, 0]} />
        <Face value={5} rotation={[0, Math.PI, 0]} />
        <Face value={3} rotation={[0, Math.PI / 2, 0]} />
        <Face value={4} rotation={[0, -Math.PI / 2, 0]} />
      </group>
    </group>
  );
}
export function BoardDice({ dice, rolling }: { dice: [number, number]; rolling: boolean }) {
  return (
    <group position={[0, 0, 0.15]}>
      <Die value={dice[0]} x={-0.65} index={0} rolling={rolling} />
      <Die value={dice[1]} x={0.65} index={1} rolling={rolling} />
    </group>
  );
}
