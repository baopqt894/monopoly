import { BeveledBox } from '../BeveledBox';

export function LandingGear() {
  return (
    <>
      {[
        [0, 0.21],
        [-0.085, -0.08],
        [0.085, -0.08],
      ].map(([x, z], i) => (
        <group key={i} position={[x, -0.045, z]}>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.045, 6]} />
            <meshStandardMaterial color="#607e8b" />
          </mesh>
          <mesh position={[0, -0.047, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.019, 10]} />
            <meshStandardMaterial color="#364e59" />
          </mesh>
        </group>
      ))}
    </>
  );
}
export function WingDetails() {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          <BeveledBox
            position={[side * 0.366, 0.035, -0.165]}
            rotation={[0, 0, -side * 0.25]}
            size={[0.015, 0.067, 0.066]}
            color="#36add0"
            radius={0.006}
          />
          <BeveledBox
            position={[side * 0.049, -0.006, 0]}
            size={[0.005, 0.012, 0.43]}
            color="#50b8d0"
            radius={0.002}
          />
          <BeveledBox
            position={[side * 0.12, 0.022, -0.08]}
            rotation={[0, side * 0.35, 0]}
            size={[0.09, 0.004, 0.005]}
            color="#c7dcd9"
            radius={0.001}
          />
          <mesh position={[side * 0.18, -0.035, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.022, 0.004, 5, 12]} />
            <meshStandardMaterial color="#e4e9dd" />
          </mesh>
        </group>
      ))}
    </>
  );
}
export function AirportCart() {
  return (
    <group position={[0.4, 0.1, 0.02]} rotation={[0, -0.4, 0]}>
      <BeveledBox
        position={[0, 0.045, 0]}
        size={[0.11, 0.06, 0.17]}
        color="#f5bd54"
        radius={0.012}
      />
      <BeveledBox
        position={[0, 0.097, 0.04]}
        size={[0.1, 0.07, 0.07]}
        color="#faf3d3"
        radius={0.009}
      />
      <BeveledBox
        position={[0, 0.102, 0.079]}
        size={[0.077, 0.04, 0.006]}
        color="#3b8ca9"
        radius={0.002}
      />
      {[-1, 1].map((s) =>
        [-0.05, 0.05].map((z) => (
          <mesh key={`${s}:${z}`} position={[s * 0.06, 0.025, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.023, 0.023, 0.015, 8]} />
            <meshStandardMaterial color="#3f6069" />
          </mesh>
        )),
      )}
      <BeveledBox
        position={[0, 0.033, -0.15]}
        size={[0.025, 0.018, 0.13]}
        color="#90aab2"
        radius={0.004}
      />
      <BeveledBox
        position={[0, 0.037, -0.24]}
        size={[0.13, 0.025, 0.13]}
        color="#bdcfd1"
        radius={0.005}
      />
      <BeveledBox
        position={[-0.025, 0.083, -0.24]}
        size={[0.055, 0.068, 0.08]}
        color="#ec8870"
        radius={0.008}
      />
      <BeveledBox
        position={[0.035, 0.073, -0.24]}
        size={[0.045, 0.05, 0.08]}
        color="#559fbd"
        radius={0.006}
      />
    </group>
  );
}
