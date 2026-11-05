import { BeveledBox } from '../BeveledBox';

/** Low landscape relief around the perimeter; the central play plaza stays unobstructed. */
export function TravelGarden() {
  return (
    <group position={[0, 0.145, 0]} raycast={() => {}}>
      {/* Ha Long limestone silhouettes: stone foot, irregular shoulders, planted crown. */}
      {[
        [1.03, -2.89, 0.21, 0.48],
        [1.53, -2.7, 0.18, 0.32],
        [2.02, -2.96, 0.16, 0.4],
        [2.63, -2.16, 0.15, 0.24],
      ].map(([x, z, r, h], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, i * 0.7, 0]}>
          <mesh position={[0, h * 0.46, 0]} scale={[1, 1, 0.74]} castShadow receiveShadow>
            <cylinderGeometry args={[r * 0.58, r, h * 0.92, 6]} />
            <meshStandardMaterial color={i % 2 ? '#9da58b' : '#8c9984'} roughness={0.95} />
          </mesh>
          <mesh
            position={[-r * 0.13, h * 0.91, 0]}
            scale={[r * 0.66, h * 0.13, r * 0.57]}
            castShadow
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={i % 2 ? '#5c9a69' : '#468e65'} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.74, 1]}>
            <ringGeometry args={[r * 0.95, r * 1.35, 30]} />
            <meshBasicMaterial color="#b4ece0" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
      {/* Layered fields rise only slightly above their painted contour lines. */}
      <group position={[-2.55, 0, -2.63]} rotation={[0, -0.3, 0]}>
        {[0.78, 0.64, 0.49, 0.35].map((r, i) => (
          <group key={i} position={[i * 0.035, i * 0.036, 0]}>
            <mesh scale={[1, 1, 0.69]} position={[0, 0.018, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[r * 0.96, r, 0.036, 44]} />
              <meshStandardMaterial color={i % 2 ? '#e7cd67' : '#90b966'} roughness={0.94} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.037, 0]} scale={[1, 0.69, 1]}>
              <ringGeometry args={[r * 0.89, r * 0.96, 44]} />
              <meshStandardMaterial color="#f1df91" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
      {/* A small wooden junk boat, with warm ochre fan sails against the turquoise bay. */}
      <group position={[2.53, 0.025, -2.8]} rotation={[0, -0.45, 0]} scale={0.8}>
        <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.8, 1, 0.65]} castShadow>
          <capsuleGeometry args={[0.062, 0.32, 3, 10]} />
          <meshStandardMaterial color="#a66032" roughness={0.85} />
        </mesh>
        <BeveledBox
          size={[0.32, 0.025, 0.09]}
          position={[0, 0.04, 0]}
          color="#e8ba6d"
          radius={0.005}
        />
        {[-0.09, 0.075].map((x, i) => (
          <group key={x} position={[x, 0.045, 0]}>
            <mesh position={[0, 0.18, 0]}>
              <cylinderGeometry args={[0.006, 0.007, 0.36, 7]} />
              <meshStandardMaterial color="#86502e" />
            </mesh>
            <mesh position={[0.048, 0.2, 0]} rotation={[0, 0.15, 0]} castShadow>
              <circleGeometry args={[i ? 0.115 : 0.14, 16, -Math.PI / 2, Math.PI]} />
              <meshStandardMaterial color={i ? '#e5a54b' : '#efbf68'} side={2} roughness={0.9} />
            </mesh>
            {[0.11, 0.18, 0.25].map((y) => (
              <mesh key={y} position={[0.047, y, 0.003]}>
                <boxGeometry args={[0.09, 0.003, 0.004]} />
                <meshStandardMaterial color="#c58a3e" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
