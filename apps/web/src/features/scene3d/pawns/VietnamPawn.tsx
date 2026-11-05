import { Shape } from 'three';
import { BeveledBox } from '../BeveledBox';
import {
  Arm,
  Ball,
  CREAM,
  Curve,
  DecalText,
  Head,
  INK,
  Rod,
  SKIN,
  Torso,
  Wheel,
  type Point,
} from './PawnParts';
import type { VietnamPawnKind } from './catalog';
import { Gymmer, PickleballGirl, Wibu } from './ContemporaryPawns';

export const STAR_LANTERN_POSITIONS: readonly Point[] = [
  [0, 2.4, -0.34],
  [-0.42, 2.08, -0.36],
  [0.42, 2.08, -0.36],
  [0, 1.95, -0.39],
  [-0.62, 1.67, -0.4],
  [0.62, 1.67, -0.4],
];

function Plinth({ color }: { color: string }) {
  return (
    <>
      <mesh position={[0, 0.055, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.76, 0.8, 0.11, 64]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.116, 0]} receiveShadow>
        <cylinderGeometry args={[0.71, 0.73, 0.022, 64]} />
        <meshStandardMaterial color="#f9e7c1" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.745, 0.012, 8, 64]} />
        <meshStandardMaterial color="#eac789" metalness={0.4} roughness={0.4} />
      </mesh>
    </>
  );
}

function StandingLegs({ color = '#354552' }: { color?: string }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod
            from={[s * 0.105, 0.74, 0]}
            to={[s * 0.14, 0.25, 0.01]}
            radius={0.083}
            color={color}
          />
          <BeveledBox
            size={[0.18, 0.11, 0.3]}
            position={[s * 0.14, 0.19, 0.075]}
            color={CREAM}
            radius={0.04}
          />
          <BeveledBox
            size={[0.18, 0.024, 0.3]}
            position={[s * 0.14, 0.145, 0.075]}
            color="#c7a87b"
            radius={0.01}
          />
        </group>
      ))}
    </>
  );
}

function Bike({ color, commuter = false }: { color: string; commuter?: boolean }) {
  return (
    <>
      <Wheel at={[-0.46, 0.37, 0]} radius={0.225} />
      <Wheel at={[0.49, 0.37, 0]} radius={0.225} />
      <Rod from={[-0.46, 0.37, 0]} to={[0.17, 0.62, 0]} radius={0.04} color="#b7c5bd" metal />
      <Rod from={[0.49, 0.37, 0]} to={[0.34, 0.85, 0]} radius={0.032} color="#c6d8d5" metal />
      <Ball at={[-0.04, 0.43, 0]} size={[0.21, 0.14, 0.13]} color="#858d85" metal />
      <BeveledBox
        size={[0.38, 0.2, 0.24]}
        position={[-0.27, 0.58, 0]}
        rotation={[0, 0, 0.12]}
        color={color}
        radius={0.04}
      />
      <BeveledBox
        size={[0.48, 0.065, 0.26]}
        position={[-0.23, 0.755, 0]}
        color="#303d3b"
        radius={0.025}
      />
      <Curve
        points={[
          [0.02, 0.5, 0],
          [0.18, 0.55, 0],
          [0.26, 0.77, 0],
          [0.32, 0.82, 0],
        ]}
        radius={0.095}
        color={color}
      />
      <BeveledBox
        size={[0.14, 0.18, 0.22]}
        position={[0.34, 0.8, 0]}
        rotation={[0, 0, -0.15]}
        color={color}
        radius={0.03}
      />
      <BeveledBox
        size={[0.035, 0.09, 0.15]}
        position={[0.42, 0.83, 0]}
        color="#fff2bf"
        radius={0.015}
      />
      <Curve
        points={[
          [0.29, 0.86, -0.23],
          [0.32, 0.9, 0],
          [0.29, 0.86, 0.23],
        ]}
        radius={0.021}
        color={INK}
      />
      <Curve
        points={[
          [0.34, 0.91, -0.14],
          [0.39, 1.06, -0.19],
          [0.4, 1.08, -0.24],
        ]}
        radius={0.012}
        color="#c9d2ca"
      />
      <Ball at={[0.4, 1.08, -0.24]} size={[0.065, 0.045, 0.025]} color="#afced0" metal />
      <Rod
        from={[-0.5, 0.31, 0.17]}
        to={[0.04, 0.35, 0.17]}
        radius={0.038}
        color={commuter ? '#8d9690' : '#ded1ad'}
        metal
      />
      <BeveledBox
        size={[0.07, 0.1, 0.15]}
        position={[-0.59, 0.64, 0]}
        color="#cf5142"
        radius={0.01}
      />
      {!commuter && (
        <>
          <Rod
            from={[-0.46, 0.4, 0.11]}
            to={[-0.26, 0.68, 0.11]}
            radius={0.035}
            color="#e7ba3d"
            metal
          />
          <BeveledBox
            size={[0.25, 0.028, 0.18]}
            position={[0.23, 0.66, 0]}
            rotation={[0, 0, -0.9]}
            color="#f4deb7"
            radius={0.01}
          />
        </>
      )}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod
            from={[-0.2, 0.82, s * 0.12]}
            to={[-0.02, 0.57, s * 0.21]}
            radius={0.073}
            color={commuter ? '#344b4d' : '#343944'}
          />
          <Rod
            from={[-0.02, 0.57, s * 0.21]}
            to={[0.02, 0.34, s * 0.22]}
            radius={0.058}
            color={commuter ? '#344b4d' : '#343944'}
          />
          <BeveledBox
            size={[0.25, 0.09, 0.13]}
            position={[0.085, 0.31, s * 0.22]}
            color={commuter ? '#473c31' : CREAM}
            radius={0.03}
          />
        </group>
      ))}
    </>
  );
}

function StreetRider() {
  const blade = new Shape();
  blade.moveTo(-0.035, 0);
  blade.lineTo(0.04, 0);
  blade.lineTo(0.07, 0.18);
  blade.lineTo(0, 0.3);
  blade.lineTo(-0.035, 0.18);
  blade.closePath();
  return (
    <group rotation={[0, -0.25, 0]}>
      <Bike color="#e56b45" />
      <Torso at={[-0.2, 1.02, 0]} color="#353c46" />
      <BeveledBox
        size={[0.11, 0.23, 0.018]}
        position={[-0.19, 1.07, 0.155]}
        color="#e9dcc1"
        radius={0.01}
      />
      <group position={[-0.18, 1.48, 0]} rotation={[0, 0.35, 0]}>
        <Head at={[0, 0, 0]} glasses />
      </group>
      <Arm
        shirt="#353c46"
        points={[
          [0.0, 1.14, -0.06],
          [0.16, 0.99, -0.2],
          [0.3, 0.88, -0.21],
        ]}
      />
      <Arm
        shirt="#353c46"
        points={[
          [-0.39, 1.15, 0.02],
          [-0.46, 0.96, 0.18],
          [-0.49, 1.12, 0.25],
        ]}
      />
      <Rod from={[-0.4, 0.52, 0.26]} to={[-0.57, 1.71, 0.26]} radius={0.019} color="#95683b" />
      <mesh position={[-0.57, 1.69, 0.26]} rotation={[0, 0, 0.14]} castShadow>
        <extrudeGeometry
          args={[
            blade,
            {
              depth: 0.018,
              bevelEnabled: true,
              bevelSize: 0.006,
              bevelThickness: 0.005,
              bevelSegments: 1,
              steps: 1,
            },
          ]}
        />
        <meshStandardMaterial color="#d0d6d0" metalness={0.65} roughness={0.33} />
      </mesh>
      <Curve
        points={[
          [-0.6, 1.66, 0.26],
          [-0.69, 1.6, 0.27],
          [-0.65, 1.48, 0.27],
        ]}
        radius={0.018}
        color="#c94839"
      />
    </group>
  );
}

function Creator() {
  return (
    <group>
      <StandingLegs color="#e7d6b6" />
      <Torso at={[0, 0.98, 0]} color="#b494c8" />
      <Head at={[0, 1.45, 0]} female />
      <Arm
        shirt="#b494c8"
        points={[
          [0.19, 1.14, 0],
          [0.35, 1.03, 0.1],
          [0.42, 1.39, 0.19],
        ]}
      />
      <Arm
        shirt="#b494c8"
        points={[
          [-0.19, 1.13, 0],
          [-0.3, 0.87, 0.11],
          [-0.35, 0.82, 0.2],
        ]}
      />
      <BeveledBox
        size={[0.17, 0.29, 0.048]}
        position={[0.43, 1.49, 0.2]}
        rotation={[0, -0.2, -0.1]}
        color="#324347"
        radius={0.025}
      />
      <BeveledBox
        size={[0.14, 0.24, 0.012]}
        position={[0.43, 1.49, 0.229]}
        color="#b9e4de"
        radius={0.015}
      />
      <Ball at={[0.4, 1.58, 0.24]} size={[0.012, 0.012, 0.006]} color={INK} />
      <Rod from={[-0.49, 0.24, 0]} to={[-0.49, 1.49, 0]} radius={0.018} color={INK} />
      <mesh position={[-0.49, 1.48, 0]}>
        <torusGeometry args={[0.22, 0.033, 12, 40]} />
        <meshStandardMaterial color="#fff4d2" emissive="#ffdfa2" emissiveIntensity={0.25} />
      </mesh>
      <BeveledBox
        size={[0.09, 0.16, 0.035]}
        position={[-0.49, 1.44, 0.01]}
        color="#3d4d50"
        radius={0.01}
      />
      {[-1, 1].map((s) => (
        <Rod
          key={s}
          from={[-0.49, 0.38, 0]}
          to={[-0.49 + s * 0.2, 0.14, 0.16]}
          radius={0.014}
          color={INK}
        />
      ))}
      <Curve
        points={[
          [-0.19, 1.18, 0.06],
          [0, 0.96, 0.17],
          [0.16, 0.79, 0.09],
        ]}
        radius={0.019}
        color="#755b82"
      />
      <BeveledBox
        size={[0.2, 0.17, 0.1]}
        position={[0.16, 0.78, 0.13]}
        rotation={[0, 0, -0.2]}
        color="#6f557c"
        radius={0.035}
      />
    </group>
  );
}

function Cyclo() {
  return (
    <group rotation={[0, -0.5, 0]} scale={0.92}>
      <Wheel at={[-0.43, 0.39, 0.36]} radius={0.25} axis="x" />
      <Wheel at={[0.43, 0.39, 0.36]} radius={0.25} axis="x" />
      <Wheel at={[0, 0.39, -0.53]} radius={0.25} axis="x" />
      <Rod
        from={[-0.43, 0.38, 0.36]}
        to={[0.43, 0.38, 0.36]}
        radius={0.025}
        color="#c2b48e"
        metal
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod
            from={[s * 0.3, 0.47, 0.45]}
            to={[0, 0.49, -0.53]}
            radius={0.023}
            color="#d9c898"
            metal
          />
          <Curve
            points={[
              [s * 0.34, 0.65, 0.55],
              [s * 0.36, 0.88, 0.25],
              [s * 0.31, 0.95, 0.04],
            ]}
            radius={0.022}
            color="#d8cda8"
          />
          <Rod
            from={[s * 0.34, 0.6, 0.48]}
            to={[s * 0.34, 1.2, 0.48]}
            radius={0.018}
            color="#d6c79f"
            metal
          />
          <Rod
            from={[s * 0.34, 0.75, 0.01]}
            to={[s * 0.34, 1.24, 0.02]}
            radius={0.018}
            color="#d6c79f"
            metal
          />
        </group>
      ))}
      <BeveledBox
        size={[0.63, 0.1, 0.52]}
        position={[0, 0.57, 0.32]}
        color="#b94c3e"
        radius={0.03}
      />
      <BeveledBox
        size={[0.61, 0.38, 0.1]}
        position={[0, 0.79, 0.03]}
        rotation={[-0.12, 0, 0]}
        color="#c96048"
        radius={0.04}
      />
      <BeveledBox
        size={[0.73, 0.075, 0.65]}
        position={[0, 1.26, 0.25]}
        rotation={[-0.08, 0, 0]}
        color="#c54c37"
        radius={0.03}
      />
      {[-0.3, -0.15, 0, 0.15, 0.3].map((x) => (
        <Rod
          key={x}
          from={[x, 1.296, -0.05]}
          to={[x, 1.246, 0.56]}
          radius={0.006}
          color="#efc898"
        />
      ))}
      <BeveledBox
        size={[0.34, 0.05, 0.16]}
        position={[0, 0.75, -0.51]}
        color="#463d31"
        radius={0.02}
      />
      <Torso at={[0, 1.04, -0.45]} color={CREAM} size={[0.2, 0.25, 0.14]} />
      <Head at={[0, 1.49, -0.44]} hat="nonla" moustache />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Arm
            shirt={CREAM}
            points={[
              [s * 0.19, 1.17, -0.43],
              [s * 0.29, 0.99, -0.28],
              [s * 0.25, 0.93, -0.13],
            ]}
          />
          <Rod
            from={[s * 0.09, 0.8, -0.46]}
            to={[s * 0.15, 0.55, -0.32]}
            radius={0.068}
            color="#605443"
          />
          <Rod
            from={[s * 0.15, 0.55, -0.32]}
            to={[s * 0.14, 0.35, -0.42]}
            radius={0.044}
            color={SKIN}
          />
        </group>
      ))}
      <BeveledBox
        size={[0.5, 0.04, 0.16]}
        position={[0, 0.42, 0.64]}
        color="#b5ab8b"
        radius={0.01}
      />
    </group>
  );
}

function BuffaloBoy() {
  return (
    <group rotation={[0, -0.24, 0]}>
      <Ball at={[0, 0.6, 0]} size={[0.45, 0.3, 0.27]} color="#677473" />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <group key={`${x}-${z}`}>
            <Rod
              from={[x * 0.29, 0.52, z * 0.17]}
              to={[x * 0.32, 0.22, z * 0.19]}
              radius={0.065}
              color="#5a6868"
            />
            <Ball at={[x * 0.32, 0.19, z * 0.19]} size={[0.076, 0.05, 0.07]} color="#354644" />
          </group>
        )),
      )}
      <Ball at={[0.41, 0.67, 0.01]} size={[0.25, 0.24, 0.24]} color="#65716d" />
      <Ball at={[0.54, 0.55, 0.065]} size={[0.2, 0.12, 0.19]} color="#828779" />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Curve
            points={[
              [0.38, 0.81, s * 0.17],
              [0.34, 0.92, s * 0.34],
              [0.42, 1.03, s * 0.39],
              [0.5, 1.08, s * 0.34],
            ]}
            radius={0.038}
            color="#e0cc9d"
          />
          <Ball at={[0.49, 0.76, s * 0.19]} size={[0.045, 0.05, 0.02]} color={CREAM} />
          <Ball at={[0.51, 0.76, s * 0.204]} size={[0.02, 0.03, 0.009]} color={INK} />
          <Ball at={[0.3, 0.76, s * 0.27]} size={[0.1, 0.045, 0.055]} color="#69766b" />
          <Ball at={[0.66, 0.59, s * 0.085]} size={[0.015, 0.016, 0.022]} color="#35433c" />
        </group>
      ))}
      <Curve
        points={[
          [-0.4, 0.66, -0.03],
          [-0.56, 0.54, -0.08],
          [-0.58, 0.35, -0.04],
        ]}
        radius={0.023}
        color="#5a6868"
      />
      <Ball at={[-0.58, 0.33, -0.04]} size={[0.04, 0.06, 0.035]} color="#354644" />
      <Torso at={[-0.08, 1.06, 0]} color="#af6441" size={[0.18, 0.21, 0.125]} />
      <Head at={[-0.08, 1.46, 0.02]} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod
            from={[-0.1, 0.89, s * 0.1]}
            to={[-0.05, 0.76, s * 0.31]}
            radius={0.065}
            color="#454d46"
          />
          <Rod
            from={[-0.05, 0.76, s * 0.31]}
            to={[0.03, 0.53, s * 0.32]}
            radius={0.044}
            color={SKIN}
          />
          <Ball at={[0.06, 0.5, s * 0.32]} size={[0.08, 0.04, 0.055]} color={SKIN} />
          <Arm
            shirt="#af6441"
            radius={0.048}
            points={[
              [s * 0.15 - 0.08, 1.19, 0.03],
              [s * 0.23 - 0.08, 1.11, 0.18],
              [s * 0.14 - 0.04, 1.32, 0.19],
            ]}
          />
        </group>
      ))}
      <Rod from={[-0.32, 1.32, 0.195]} to={[0.38, 1.32, 0.195]} radius={0.019} color="#d3af58" />
      {[-0.15, -0.04, 0.07, 0.18, 0.29].map((x) => (
        <Ball key={x} at={[x, 1.333, 0.207]} size={[0.009, 0.009, 0.005]} color="#66523a" />
      ))}
    </group>
  );
}

function Basket({ at, bananas = false }: { at: Point; bananas?: boolean }) {
  return (
    <group position={at}>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.18, 24]} />
        <meshStandardMaterial color="#b78b4b" roughness={0.9} />
      </mesh>
      {[-0.06, 0, 0.06].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2 + y * 0.3, 0.009, 6, 24]} />
          <meshStandardMaterial color="#e2bd77" />
        </mesh>
      ))}
      {[-1, 0, 1].flatMap((x) =>
        [-1, 0, 1].map((z) =>
          bananas ? (
            <Ball
              key={`${x}-${z}`}
              at={[x * 0.09, 0.11, z * 0.08]}
              size={[0.036, 0.038, 0.09]}
              color="#e5bf47"
            />
          ) : (
            <Ball
              key={`${x}-${z}`}
              at={[x * 0.09, 0.12, z * 0.08]}
              size={[0.053, 0.055, 0.053]}
              color={(x + z) % 2 ? '#e39a40' : '#84a35a'}
            />
          ),
        ),
      )}
    </group>
  );
}

function Vendor() {
  return (
    <group>
      <StandingLegs color="#4a4840" />
      <Torso at={[0, 0.99, 0]} color="#a66574" />
      <Head at={[0, 1.46, 0]} hat="nonla" female />
      <Curve
        points={[
          [-0.69, 1.2, 0],
          [0, 1.27, 0],
          [0.69, 1.2, 0],
        ]}
        radius={0.025}
        color="#b58648"
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod
            from={[s * 0.64, 1.2, 0]}
            to={[s * 0.6, 0.47, 0.11]}
            radius={0.008}
            color="#795d3d"
          />
          <Rod
            from={[s * 0.64, 1.2, 0]}
            to={[s * 0.6, 0.47, -0.11]}
            radius={0.008}
            color="#795d3d"
          />
          <Basket at={[s * 0.6, 0.39, 0]} bananas={s === 1} />
        </group>
      ))}
      <Arm
        shirt="#a66574"
        points={[
          [0.19, 1.13, 0],
          [0.3, 1.01, 0.15],
          [0.3, 1.25, 0.03],
        ]}
      />
      <Arm
        shirt="#a66574"
        points={[
          [-0.19, 1.13, 0],
          [-0.26, 0.9, 0.05],
          [-0.24, 0.75, 0.13],
        ]}
      />
    </group>
  );
}

function XeOm() {
  return (
    <group rotation={[0, -0.25, 0]}>
      <Bike color="#159f56" commuter />
      <Torso at={[-0.2, 1.03, 0]} color="#139e50" />
      <Head at={[-0.18, 1.49, 0]} hat="helmet" helmetColor="#139e50" moustache />
      <DecalText text="Grab" at={[-0.2, 1.1, 0.154]} width={0.2} />
      <DecalText text="Grab" at={[-0.18, 1.62, 0.213]} width={0.2} />
      {[-1, 1].map((s) => (
        <Arm
          key={s}
          shirt="#139e50"
          longSleeve
          points={[
            [-0.2, 1.16, s * 0.18],
            [0.04, 1.0, s * 0.22],
            [0.28, 0.87, s * 0.22],
          ]}
        />
      ))}
      <BeveledBox
        size={[0.34, 0.35, 0.39]}
        position={[-0.53, 0.95, 0]}
        color="#108b45"
        radius={0.025}
      />
      <BeveledBox
        size={[0.36, 0.045, 0.41]}
        position={[-0.53, 1.14, 0]}
        color="#1caf5d"
        radius={0.015}
      />
      <DecalText text="Grab" at={[-0.53, 0.98, 0.202]} width={0.25} />
    </group>
  );
}

function StarLantern({ at }: { at: Point }) {
  const star = new Shape();
  const vertices: Point[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 0.235 : 0.1;
    const x = Math.cos(angle) * r,
      y = Math.sin(angle) * r;
    if (i === 0) star.moveTo(x, y);
    else star.lineTo(x, y);
    vertices.push([x, y, 0.035]);
  }
  star.closePath();
  return (
    <group position={at}>
      <mesh castShadow>
        <extrudeGeometry args={[star, { depth: 0.045, bevelEnabled: false }]} />
        <meshStandardMaterial
          color="#e84339"
          emissive="#ba251c"
          emissiveIntensity={0.22}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <torusGeometry args={[0.25, 0.012, 8, 32]} />
        <meshStandardMaterial color="#d5b449" roughness={0.6} />
      </mesh>
      {vertices.map((v, i) => (
        <Rod
          key={i}
          from={v}
          to={vertices[(i + 1) % vertices.length]}
          radius={0.009}
          color="#e8c857"
        />
      ))}
      {[0, 2, 4, 6, 8].map((i) => (
        <Rod key={i} from={[0, 0, 0.05]} to={vertices[i]} radius={0.006} color="#f1c85e" />
      ))}
    </group>
  );
}

function StarVendor() {
  return (
    <group scale={0.86}>
      {/* Six separate five-point lanterns, matching the supplied reference. */}
      {STAR_LANTERN_POSITIONS.map((at, i) => (
        <group key={i}>
          <Rod from={[-0.1, 0.62, -0.38]} to={at} radius={0.009} color="#8a7051" />
          <StarLantern at={at} />
        </group>
      ))}
      <Wheel at={[-0.39, 0.43, -0.02]} radius={0.3} axis="x" />
      <Wheel at={[0.27, 0.43, -0.02]} radius={0.3} axis="x" />
      {[-0.33, 0.21].map((x) => (
        <group key={x}>
          <Rod from={[x, 0.34, -0.26]} to={[x, 0.31, 0.39]} radius={0.022} color="#a2b3b2" metal />
          <Rod from={[x, 0.37, -0.2]} to={[x, 0.88, -0.2]} radius={0.018} color="#bac7bf" metal />
          <Wheel at={[x, 0.21, 0.35]} radius={0.07} axis="x" />
          <Rod from={[x, 0.64, -0.19]} to={[x, 0.64, 0.23]} radius={0.024} color={INK} />
        </group>
      ))}
      <BeveledBox
        size={[0.5, 0.08, 0.45]}
        position={[-0.06, 0.57, 0]}
        color="#344344"
        radius={0.02}
      />
      <BeveledBox
        size={[0.5, 0.34, 0.06]}
        position={[-0.06, 0.77, -0.19]}
        color="#344344"
        radius={0.025}
      />
      <Torso at={[-0.07, 0.96, 0]} color="#e65531" size={[0.2, 0.26, 0.13]} />
      <Head at={[-0.07, 1.4, 0.015]} hat="cap" />
      <Ball at={[-0.07, 1.16, 0.095]} size={[0.085, 0.08, 0.025]} color="#30373b" />
      {[-1, 1].map((s) => (
        <BeveledBox
          key={s}
          size={[0.09, 0.11, 0.025]}
          position={[-0.07 + s * 0.08, 1.16, 0.1]}
          rotation={[0.1, 0, -s * 0.42]}
          color="#ce4025"
          radius={0.012}
        />
      ))}
      <BeveledBox
        size={[0.014, 0.38, 0.018]}
        position={[-0.07, 0.96, 0.135]}
        color="#30363a"
        radius={0.003}
      />
      <BeveledBox
        size={[0.026, 0.04, 0.015]}
        position={[-0.07, 1.095, 0.148]}
        color="#d8d7c3"
        radius={0.004}
      />
      <Rod from={[-0.2, 1.05, 0.11]} to={[-0.2, 1.085, 0.11]} radius={0.008} color={CREAM} />
      <Rod from={[-0.2, 1.085, 0.11]} to={[-0.135, 1.085, 0.132]} radius={0.008} color={CREAM} />
      <Rod from={[-0.135, 1.085, 0.132]} to={[-0.135, 1.05, 0.132]} radius={0.008} color={CREAM} />
      <Rod from={[-0.01, 1.075, 0.132]} to={[0.07, 1.075, 0.1]} radius={0.009} color={CREAM} />
      <Rod from={[0.07, 1.075, 0.1]} to={[0.01, 1.012, 0.132]} radius={0.009} color={CREAM} />
      <Rod from={[-0.005, 1.045, 0.132]} to={[0.044, 1.045, 0.12]} radius={0.008} color={CREAM} />
      <Ball at={[-0.22, 1.16, 0.045]} size={[0.037, 0.025, 0.012]} color="#f0c843" />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Arm
            shirt="#e65531"
            longSleeve
            points={[
              [-0.07 + s * 0.18, 1.08, 0],
              [-0.07 + s * 0.25, 0.86, 0.08],
              [-0.07 + s * 0.22, 0.72, 0.19],
            ]}
          />
          <Rod
            from={[-0.07 + s * 0.1, 0.63, 0.04]}
            to={[-0.07 + s * 0.14, 0.6, 0.29]}
            radius={0.069}
            color="#2e3a42"
          />
          <Rod
            from={[-0.07 + s * 0.14, 0.6, 0.29]}
            to={[-0.07 + s * 0.14, 0.3, 0.3]}
            radius={0.054}
            color="#2e3a42"
          />
          <BeveledBox
            size={[0.15, 0.07, 0.21]}
            position={[-0.07 + s * 0.14, 0.28, 0.36]}
            color="#e2d7bf"
            radius={0.02}
          />
        </group>
      ))}
      <BeveledBox
        size={[0.43, 0.035, 0.25]}
        position={[-0.06, 0.23, 0.35]}
        color="#a7b7b0"
        radius={0.01}
      />
    </group>
  );
}

function AoDai() {
  return (
    <group>
      <StandingLegs color="#f1e3c5" />
      <mesh position={[0, 0.68, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.27, 0.9, 24]} />
        <meshStandardMaterial color="#439c87" roughness={0.8} />
      </mesh>
      <Torso at={[0, 1.06, 0]} color="#439c87" size={[0.19, 0.26, 0.13]} />
      <Head at={[0, 1.51, 0]} hat="nonla" female />
      <Arm
        shirt="#439c87"
        points={[
          [-0.17, 1.19, 0],
          [-0.28, 0.94, 0.04],
          [-0.22, 0.86, 0.21],
        ]}
      />
      <Arm
        shirt="#439c87"
        points={[
          [0.17, 1.19, 0],
          [0.27, 1.02, 0.07],
          [0.06, 0.98, 0.23],
        ]}
      />
      {[-1, 0, 1].map((s) => (
        <group key={s}>
          <Rod
            from={[0.05, 0.91, 0.23]}
            to={[0.13 + s * 0.065, 1.28 + Math.abs(s) * 0.07, 0.24]}
            radius={0.009}
            color="#6c9758"
          />
          <Ball
            at={[0.13 + s * 0.065, 1.3 + Math.abs(s) * 0.07, 0.24]}
            size={[0.046, 0.08, 0.046]}
            color={s === 0 ? '#edb4b7' : '#d98c9c'}
          />
        </group>
      ))}
      {[0.44, 0.61, 0.78].map((y) => (
        <Ball key={y} at={[0.13, y, 0.19]} size={[0.025, 0.025, 0.008]} color="#dbcb90" />
      ))}
    </group>
  );
}

const MODELS = {
  'street-rider': StreetRider,
  creator: Creator,
  gymmer: Gymmer,
  wibu: Wibu,
  pickleball: PickleballGirl,
  cyclo: Cyclo,
  'buffalo-boy': BuffaloBoy,
  vendor: Vendor,
  'xe-om': XeOm,
  'star-vendor': StarVendor,
  'ao-dai': AoDai,
};

/** Renderer-only assets. Token assignment and game state remain server-owned. */
export function VietnamPawn({
  kind,
  color,
  scale = 1,
  showBase = true,
}: {
  kind: VietnamPawnKind;
  color: string;
  scale?: number;
  showBase?: boolean;
}) {
  const Model = MODELS[kind];
  return (
    <group scale={scale}>
      {showBase && <Plinth color={color} />}
      <Model />
    </group>
  );
}
