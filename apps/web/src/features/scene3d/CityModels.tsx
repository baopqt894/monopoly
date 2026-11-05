import { useEffect, useMemo } from 'react';
import { labelTexture } from './board-layout';
import { BeveledBox } from './BeveledBox';
import { VietnamBuilding } from './vietnam/VietnamBuilding';

function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0.32, z]} scale={scale}>
      <BeveledBox size={[0.66, 0.1, 0.66]} position={[0, 0.04, 0]} color="#f4eedb" radius={0.12} />
      <BeveledBox size={[0.54, 0.035, 0.54]} position={[0, 0.1, 0]} color="#719b7b" radius={0.11} />
      <mesh castShadow position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.38, 8]} />
        <meshStandardMaterial color="#9c8063" />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]} scale={[0.9, 1.2, 0.9]}>
        <icosahedronGeometry args={[0.31, 2]} />
        <meshStandardMaterial color="#43866d" roughness={0.75} />
      </mesh>
      <mesh castShadow position={[-0.09, 0.62, 0.07]} scale={[0.8, 1, 0.8]}>
        <icosahedronGeometry args={[0.24, 1]} />
        <meshStandardMaterial color="#83b784" roughness={0.75} />
      </mesh>
    </group>
  );
}
function Bench({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0.34, z]} rotation={[0, rotation, 0]}>
      <BeveledBox size={[0.55, 0.07, 0.21]} position={[0, 0.12, 0]} color="#c9a373" radius={0.02} />
      <BeveledBox
        size={[0.55, 0.19, 0.05]}
        position={[0, 0.25, -0.09]}
        color="#d3b080"
        radius={0.02}
      />
      {[-0.19, 0.19].map((a) => (
        <BeveledBox
          key={a}
          size={[0.045, 0.14, 0.16]}
          color="#4e6d68"
          position={[a, 0.03, 0]}
          radius={0.008}
        />
      ))}
    </group>
  );
}
export function CityModels() {
  const title = useMemo(() => labelTexture('VIỆT NAM', '', '#426960'), []);
  const chance = useMemo(() => labelTexture('?', 'C Ơ  H Ộ I', '#92733d', '#f2ddb0'), []);
  const chest = useMemo(
    () => labelTexture('◇', 'Q U Ỹ  C Ộ N G  Đ Ồ N G', '#4a787a', '#c9ded9'),
    [],
  );
  useEffect(
    () => () => {
      title.dispose();
      chance.dispose();
      chest.dispose();
    },
    [title, chance, chest],
  );
  return (
    <group>
      <mesh receiveShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[8.98, 0.08, 8.98]} />
        <meshStandardMaterial color="#86b7ac" roughness={0.95} />
      </mesh>
      <BeveledBox size={[8.55, 0.06, 8.55]} position={[0, 0.28, 0]} color="#afd1ae" radius={0.08} />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 2.9, 0.32, -2.65]}>
          <BeveledBox
            size={[1.7, 0.07, 1.9]}
            position={[0, 0.03, 0]}
            color="#f6f0e2"
            radius={0.16}
          />
          <BeveledBox
            size={[1.5, 0.04, 1.7]}
            position={[0, 0.075, 0]}
            color="#90b998"
            radius={0.13}
          />
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 2.7, 0.34, 2.9]}>
          <BeveledBox size={[1.9, 0.12, 0.56]} position={[0, 0, 0]} color="#f6f0e2" radius={0.12} />
          <BeveledBox
            size={[1.73, 0.15, 0.39]}
            position={[0, 0.09, 0]}
            color="#6b9f7e"
            radius={0.13}
          />
          {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
            <mesh key={x} position={[x, 0.18, 0.04]}>
              <sphereGeometry args={[0.075, 12, 8]} />
              <meshStandardMaterial color={i % 2 ? '#f2c36f' : '#e5a99a'} roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      {[-3.85, 3.85].map((x) => (
        <mesh key={x} receiveShadow position={[x, 0.317, 0]}>
          <boxGeometry args={[0.22, 0.012, 7.95]} />
          <meshStandardMaterial color="#f7f0df" />
        </mesh>
      ))}
      {[-3.85, 3.85].map((z) => (
        <mesh key={z} receiveShadow position={[0, 0.317, z]}>
          <boxGeometry args={[7.95, 0.012, 0.22]} />
          <meshStandardMaterial color="#f7f0df" />
        </mesh>
      ))}
      {[-3.35, 3.35].map((x) => (
        <mesh key={x} receiveShadow position={[x, 0.32, 0]}>
          <boxGeometry args={[0.025, 0.012, 6.7]} />
          <meshStandardMaterial color="#b9cdb9" />
        </mesh>
      ))}
      {[-3.35, 3.35].map((z) => (
        <mesh key={z} receiveShadow position={[0, 0.32, z]}>
          <boxGeometry args={[6.7, 0.012, 0.025]} />
          <meshStandardMaterial color="#b9cdb9" />
        </mesh>
      ))}
      <mesh position={[0, 0.323, -2.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.6, 1.125]} />
        <meshBasicMaterial map={title} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh receiveShadow position={[0, 0.345, 0.1]}>
        <cylinderGeometry args={[1.58, 1.62, 0.07, 80]} />
        <meshStandardMaterial color="#c5b283" metalness={0.25} roughness={0.65} />
      </mesh>
      <mesh receiveShadow position={[0, 0.385, 0.1]}>
        <cylinderGeometry args={[1.51, 1.51, 0.025, 80]} />
        <meshStandardMaterial color="#faf3e4" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.403, 0.1]}>
        <torusGeometry args={[1.38, 0.009, 6, 100]} />
        <meshStandardMaterial color="#c4cbb3" />
      </mesh>
      <group position={[-2.75, 0.39, -2.75]}>
        <VietnamBuilding tileId={39} level={5} scale={1.36} />
      </group>
      <group position={[2.75, 0.39, -2.75]}>
        <VietnamBuilding tileId={37} level={5} scale={1.15} />
      </group>
      <group position={[-2.75, 0.39, 2.8]}>
        <VietnamBuilding tileId={24} level={5} scale={1.2} />
      </group>
      <group position={[2.75, 0.39, 2.8]}>
        <VietnamBuilding tileId={24} level={3} business="cafe" scale={1.06} />
      </group>
      {[
        [-3.1, 3.08],
        [3.1, 3.08],
        [-3.12, -1.7],
        [3.12, -1.7],
      ].map(([x, z], i) => (
        <Tree key={i} x={x} z={z} scale={i < 2 ? 0.87 : 0.67} />
      ))}
      <Bench x={-3.13} z={1.45} rotation={Math.PI / 2} />
      <Bench x={3.13} z={1.45} rotation={-Math.PI / 2} />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <group key={`${x}:${z}`} position={[x * 3.65, 0.34, z * 2.65]}>
            <mesh castShadow position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.025, 0.04, 0.64, 8]} />
              <meshStandardMaterial color="#537e79" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.66, 0]}>
              <sphereGeometry args={[0.085, 12, 10]} />
              <meshStandardMaterial
                color="#fff0bc"
                emissive="#f4ca7b"
                emissiveIntensity={0.22}
                roughness={0.45}
              />
            </mesh>
            <mesh position={[0, 0.75, 0]}>
              <coneGeometry args={[0.12, 0.09, 6]} />
              <meshStandardMaterial color="#547c76" />
            </mesh>
          </group>
        )),
      )}
      {[
        { x: -2.65, map: chance, angle: -0.08, base: '#d3bc8e' },
        { x: 2.65, map: chest, angle: 0.08, base: '#99b5ab' },
      ].map(({ x, map, angle, base }) => (
        <group key={x} position={[x, 0.37, 0.5]} rotation={[0, angle, 0]}>
          {[0, 0.035, 0.07].map((y) => (
            <BeveledBox
              key={y}
              size={[1.42, 0.032, 1.02]}
              color={base}
              position={[0, y, 0]}
              radius={0.015}
            />
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.089, 0]}>
            <planeGeometry args={[1.4, 0.99]} />
            <meshBasicMaterial map={map} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <group position={[0, 0.35, -3.45]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.35, 0.4, 0.12, 40]} />
          <meshStandardMaterial color="#d6d9c1" />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.29, 0.29, 0.025, 40]} />
          <meshStandardMaterial color="#79aaa8" metalness={0.2} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <sphereGeometry args={[0.11, 20, 20]} />
          <meshStandardMaterial color="#dce6d3" />
        </mesh>
        <mesh castShadow position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.045, 0.065, 0.24, 20]} />
          <meshStandardMaterial color="#f0e9d8" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.18, 0.12, 0.045, 32]} />
          <meshStandardMaterial color="#77c3c1" roughness={0.22} metalness={0.15} />
        </mesh>
      </group>
    </group>
  );
}
