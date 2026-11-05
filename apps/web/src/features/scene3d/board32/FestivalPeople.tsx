import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

function Guest({
  at,
  color,
  turn = 0,
  performer = false,
}: {
  at: [number, number, number];
  color: string;
  turn?: number;
  performer?: boolean;
}) {
  const arm = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (performer && arm.current)
      arm.current.rotation.z = -1.7 + Math.sin(clock.elapsedTime * 2.5) * 0.2;
  });
  return (
    <group position={at} rotation={[0, turn, 0]}>
      {[-0.027, 0.027].map((x) => (
        <mesh key={x} position={[x, 0.043, 0]} castShadow>
          <capsuleGeometry args={[0.019, 0.044, 3, 6]} />
          <meshStandardMaterial color="#3b687b" />
        </mesh>
      ))}
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.033, 0.054, 0.13, 9]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.24, 0]} castShadow>
        <sphereGeometry args={[0.055, 12, 8]} />
        <meshStandardMaterial color="#efc397" />
      </mesh>
      <mesh position={[0, 0.263, -0.006]} scale={[1, 0.65, 1]} castShadow>
        <sphereGeometry args={[0.057, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial color="#424b47" />
      </mesh>
      {[-0.018, 0.018].map((x) => (
        <mesh key={x} position={[x, 0.243, 0.051]}>
          <sphereGeometry args={[0.004, 6, 4]} />
          <meshBasicMaterial color="#384c49" />
        </mesh>
      ))}
      <group ref={arm} position={[-0.042, 0.179, 0]} rotation={[0, 0, performer ? -1.7 : -0.4]}>
        <mesh position={[0, -0.047, 0]}>
          <capsuleGeometry args={[0.016, 0.062, 3, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.094, 0]}>
          <sphereGeometry args={[0.018, 8, 6]} />
          <meshStandardMaterial color="#efc397" />
        </mesh>
      </group>
      <group position={[0.042, 0.179, 0]} rotation={[0, 0, performer ? 1.3 : 0.5]}>
        <mesh position={[0, -0.047, 0]}>
          <capsuleGeometry args={[0.016, 0.062, 3, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.094, 0]}>
          <sphereGeometry args={[0.018, 8, 6]} />
          <meshStandardMaterial color="#efc397" />
        </mesh>
      </group>
      {performer && (
        <mesh position={[0, 0.29, 0]}>
          <cylinderGeometry args={[0.038, 0.057, 0.035, 10]} />
          <meshStandardMaterial color="#f6ba4f" />
        </mesh>
      )}
    </group>
  );
}
function Drum({ at }: { at: [number, number, number] }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.065, 0.16, 12]} />
        <meshStandardMaterial color="#df6950" />
      </mesh>
      <mesh position={[0, 0.176, 0]}>
        <cylinderGeometry args={[0.079, 0.079, 0.014, 16]} />
        <meshStandardMaterial color="#ffedb7" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.028, 0.194, 0.01]} rotation={[0.1, 0, s * 0.5]}>
          <boxGeometry args={[0.009, 0.1, 0.009]} />
          <meshStandardMaterial color="#a67742" />
        </mesh>
      ))}
    </group>
  );
}
export function FestivalPerformers() {
  return (
    <group>
      <Guest at={[-0.13, 0.06, 0.31]} color="#e85f6f" performer />
      <Guest at={[0.14, 0.06, 0.31]} color="#37aaa5" performer />
      <Drum at={[-0.32, 0.08, 0.18]} />
    </group>
  );
}
export function FestivalAudience() {
  return (
    <group>
      <Guest at={[-0.5, 0.1, 0.04]} color="#eea446" turn={Math.PI * 0.7} />
      <Guest at={[-0.38, 0.1, 0.2]} color="#43b9b0" turn={Math.PI * 0.85} />
      <Guest at={[0.04, 0.1, -0.5]} color="#ea899f" turn={-Math.PI * 0.2} />
      <Guest at={[0.25, 0.1, -0.36]} color="#eac25c" turn={-Math.PI * 0.15} />
      <Guest at={[0.37, 0.1, -0.12]} color="#6e9fcb" turn={-Math.PI * 0.1} />
    </group>
  );
}
