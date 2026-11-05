import { BeveledBox } from './BeveledBox';
import { isVietnamPawn } from './pawns/catalog';
import { VietnamPawn } from './pawns/VietnamPawn';

export function PieceModel({
  kind,
  color,
  showBase = true,
}: {
  kind: string;
  color: string;
  showBase?: boolean;
}) {
  if (isVietnamPawn(kind))
    return <VietnamPawn kind={kind} color={color} scale={0.31} showBase={showBase} />;
  return (
    <group>
      {showBase && (
        <group>
          <mesh castShadow position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.17, 0.21, 0.1, 32]} />
            <meshStandardMaterial color={color} roughness={0.26} metalness={0.22} />
          </mesh>
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.205, 0.19, 0.035, 32]} />
            <meshStandardMaterial color="#f8e9bf" roughness={0.35} metalness={0.18} />
          </mesh>
          <mesh position={[0, 0.093, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.165, 0.181, 32]} />
            <meshStandardMaterial color="#fff3d2" roughness={0.32} metalness={0.35} />
          </mesh>
          <mesh position={[0, 0.108, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.14, 0.012, 8, 32]} />
            <meshStandardMaterial color="#edc989" metalness={0.65} roughness={0.22} />
          </mesh>
        </group>
      )}
      {kind === 'leaf' ? (
        <group>
          <mesh castShadow position={[0, 0.25, 0]} scale={[0.85, 1.1, 0.8]}>
            <sphereGeometry args={[0.14, 24, 20]} />
            <meshStandardMaterial color="#f2e6ca" roughness={0.65} />
          </mesh>
          <mesh castShadow position={[0, 0.46, 0.01]}>
            <sphereGeometry args={[0.14, 24, 20]} />
            <meshStandardMaterial color="#f6ead1" roughness={0.6} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh castShadow position={[s * 0.095, 0.59, 0.01]} rotation={[0, 0, -s * 0.22]}>
                <coneGeometry args={[0.055, 0.13, 3]} />
                <meshStandardMaterial color="#f0dfc1" />
              </mesh>
              <mesh position={[s * 0.052, 0.48, 0.139]}>
                <sphereGeometry args={[0.013, 10, 10]} />
                <meshStandardMaterial color="#3e514e" />
              </mesh>
              <mesh position={[s * 0.09, 0.435, 0.125]} scale={[1, 0.5, 0.4]}>
                <sphereGeometry args={[0.025, 12, 10]} />
                <meshStandardMaterial color="#d69e88" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.365, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.106, 0.027, 10, 24]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.329, 0.115]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshStandardMaterial color="#d4b46b" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ) : kind === 'sun' ? (
        <group>
          <mesh castShadow position={[0, 0.29, 0]}>
            <cylinderGeometry args={[0.145, 0.12, 0.3, 32]} />
            <meshStandardMaterial color="#d2a56d" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.444, 0]}>
            <cylinderGeometry args={[0.125, 0.125, 0.012, 32]} />
            <meshStandardMaterial color="#ede0c7" />
          </mesh>
          <mesh castShadow position={[0.155, 0.3, 0]}>
            <torusGeometry args={[0.092, 0.029, 12, 28]} />
            <meshStandardMaterial color="#c89d64" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.452, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.027, 0.035, 20]} />
            <meshBasicMaterial color="#c3a77d" />
          </mesh>
        </group>
      ) : kind === 'diamond' ? (
        <group>
          <mesh
            castShadow
            position={[0, 0.32, 0]}
            rotation={[0.08, 0.3, 0.12]}
            scale={[1, 1.25, 1]}
          >
            <octahedronGeometry args={[0.19]} />
            <meshStandardMaterial color="#a8a0c4" roughness={0.18} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.065, 8]} />
            <meshStandardMaterial color="#c7ad73" roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
      ) : (
        <group>
          <mesh castShadow position={[0, 0.21, 0]} scale={[1.55, 0.45, 0.8]}>
            <sphereGeometry args={[0.15, 16, 8]} />
            <meshStandardMaterial color="#78a8b6" roughness={0.5} />
          </mesh>
          <BeveledBox
            size={[0.3, 0.045, 0.12]}
            position={[0, 0.25, 0]}
            color="#e2d2ab"
            radius={0.01}
          />
          <mesh castShadow position={[0, 0.41, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
            <meshStandardMaterial color="#bca47c" />
          </mesh>
          <mesh
            castShadow
            position={[0.065, 0.46, 0]}
            rotation={[0, 0, -0.15]}
            scale={[1, 1, 0.16]}
          >
            <coneGeometry args={[0.14, 0.27, 3]} />
            <meshStandardMaterial color="#f0e7d2" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}
