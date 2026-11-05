import { BeveledBox } from '../BeveledBox';
import { Shape } from 'three';
import { Ball, CREAM, Curve, DecalText, Head, INK, Rod, SKIN, Torso, Arm } from './PawnParts';

export function Gymmer() {
  return (
    <group>
      <BeveledBox
        size={[0.72, 0.11, 0.45]}
        position={[0, 0.72, -0.04]}
        color="#ad3f36"
        radius={0.035}
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod
            from={[s * 0.24, 0.66, -0.06]}
            to={[s * 0.24, 0.17, -0.06]}
            radius={0.035}
            color="#919e98"
            metal
          />
          <Rod
            from={[s * 0.24, 0.17, -0.24]}
            to={[s * 0.24, 0.17, 0.15]}
            radius={0.035}
            color="#919e98"
            metal
          />
          <BeveledBox
            size={[0.32, 0.18, 0.32]}
            position={[s * 0.17, 0.8, 0.05]}
            rotation={[0, -s * 0.2, 0]}
            color="#292e30"
            radius={0.04}
          />
          <Rod
            from={[s * 0.15, 0.79, 0.04]}
            to={[s * 0.31, 0.61, 0.36]}
            radius={0.15}
            color={SKIN}
          />
          <Ball at={[s * 0.29, 0.65, 0.29]} size={[0.17, 0.17, 0.24]} color={SKIN} />
          <Ball at={[s * 0.31, 0.58, 0.39]} size={[0.13, 0.13, 0.13]} color={SKIN} />
          <Rod
            from={[s * 0.31, 0.55, 0.38]}
            to={[s * 0.3, 0.31, 0.34]}
            radius={0.087}
            color={SKIN}
          />
          <Rod
            from={[s * 0.3, 0.34, 0.34]}
            to={[s * 0.3, 0.19, 0.34]}
            radius={0.075}
            color="#303638"
          />
          <BeveledBox
            size={[0.2, 0.11, 0.33]}
            position={[s * 0.3, 0.18, 0.42]}
            rotation={[0, -s * 0.17, 0]}
            color="#282f31"
            radius={0.04}
          />
        </group>
      ))}
      <Ball at={[0, 1.12, 0]} size={[0.29, 0.33, 0.18]} color="#252c2e" />
      <Rod from={[0, 1.36, 0]} to={[0, 1.5, 0]} radius={0.1} color={SKIN} />
      <Head at={[0, 1.68, 0]} hair="short" moustache />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ball at={[s * 0.28, 1.33, 0]} size={[0.15, 0.16, 0.15]} color={SKIN} />
          <Rod
            from={[s * 0.18, 1.4, 0.035]}
            to={[s * 0.2, 1.2, 0.16]}
            radius={0.045}
            color="#252c2e"
          />
        </group>
      ))}
      <Curve
        points={[
          [-0.15, 1.39, 0.13],
          [0, 1.31, 0.19],
          [0.15, 1.39, 0.13],
        ]}
        radius={0.014}
        color="#404647"
      />
      <Rod from={[-0.3, 1.32, 0]} to={[-0.43, 1.01, 0.1]} radius={0.105} color={SKIN} />
      <Ball at={[-0.38, 1.16, 0.055]} size={[0.12, 0.19, 0.12]} color={SKIN} />
      <Rod from={[-0.43, 1.01, 0.1]} to={[-0.46, 0.79, 0.27]} radius={0.08} color={SKIN} />
      <Ball at={[-0.46, 0.77, 0.28]} size={[0.075, 0.095, 0.065]} color={SKIN} />
      <Rod from={[0.3, 1.33, 0]} to={[0.45, 1.08, 0.1]} radius={0.11} color={SKIN} />
      <Ball at={[0.4, 1.23, 0.05]} size={[0.125, 0.19, 0.125]} color={SKIN} />
      <Rod from={[0.45, 1.08, 0.1]} to={[0.23, 1.27, 0.38]} radius={0.085} color={SKIN} />
      <Ball at={[0.23, 1.28, 0.39]} size={[0.075, 0.08, 0.06]} color={SKIN} />
      <Curve
        points={[
          [0.32, 1.42, 0.11],
          [0.43, 1.34, 0.15],
          [0.35, 1.22, 0.17],
          [0.45, 1.14, 0.17],
        ]}
        radius={0.01}
        color="#667064"
      />
      <Curve
        points={[
          [0.4, 1.4, 0.13],
          [0.35, 1.31, 0.18],
          [0.46, 1.24, 0.15],
        ]}
        radius={0.009}
        color="#667064"
      />
      <BeveledBox
        size={[0.18, 0.29, 0.045]}
        position={[0.17, 1.39, 0.425]}
        rotation={[0, -0.1, -0.08]}
        color="#dce0ca"
        radius={0.026}
      />
      {[
        [0.12, 1.46],
        [0.19, 1.46],
        [0.12, 1.39],
      ].map(([x, y], i) => (
        <Ball key={i} at={[x, y, 0.454]} size={[0.022, 0.022, 0.008]} color="#33413d" />
      ))}
      <group position={[-0.46, 0.23, -0.29]} rotation={[0, 0.3, 0]}>
        <Rod from={[-0.16, 0, 0]} to={[0.16, 0, 0]} radius={0.025} color="#a0aaa0" metal />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
            <meshStandardMaterial color="#3a4341" roughness={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function PickleballGirl() {
  const paddle = new Shape();
  paddle.moveTo(-0.065, -0.175);
  paddle.lineTo(0.065, -0.175);
  paddle.quadraticCurveTo(0.145, -0.175, 0.145, -0.095);
  paddle.lineTo(0.145, 0.095);
  paddle.quadraticCurveTo(0.145, 0.175, 0.065, 0.175);
  paddle.lineTo(-0.065, 0.175);
  paddle.quadraticCurveTo(-0.145, 0.175, -0.145, 0.095);
  paddle.lineTo(-0.145, -0.095);
  paddle.quadraticCurveTo(-0.145, -0.175, -0.065, -0.175);
  paddle.closePath();
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod
            from={[s * 0.1, 0.79, 0]}
            to={[s * 0.14, 0.49, s === 1 ? -0.03 : 0.09]}
            radius={0.062}
            color={SKIN}
          />
          <Rod
            from={[s * 0.14, 0.49, s === 1 ? -0.03 : 0.09]}
            to={[s * 0.16, 0.23, s === 1 ? -0.02 : 0.12]}
            radius={0.045}
            color={SKIN}
          />
          <Rod
            from={[s * 0.16, 0.29, s === 1 ? -0.02 : 0.12]}
            to={[s * 0.16, 0.2, s === 1 ? -0.02 : 0.12]}
            radius={0.049}
            color={CREAM}
          />
          <BeveledBox
            size={[0.16, 0.1, 0.29]}
            position={[s * 0.16, 0.18, s === 1 ? 0.05 : 0.19]}
            color={CREAM}
            radius={0.035}
          />
          <BeveledBox
            size={[0.16, 0.025, 0.29]}
            position={[s * 0.16, 0.139, s === 1 ? 0.05 : 0.19]}
            color="#78b6ac"
            radius={0.008}
          />
        </group>
      ))}
      <mesh position={[0, 0.83, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.29, 0.3, 20]} />
        <meshStandardMaterial color="#b295c7" roughness={0.85} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI) / 8;
        return (
          <Rod
            key={i}
            from={[Math.sin(a) * 0.17, 0.975, Math.cos(a) * 0.17]}
            to={[Math.sin(a) * 0.285, 0.685, Math.cos(a) * 0.285]}
            radius={0.009}
            color={i % 2 ? '#c3add3' : '#a182b9'}
          />
        );
      })}
      <Torso at={[0, 1.16, 0]} color={CREAM} size={[0.19, 0.25, 0.125]} />
      <Head at={[0, 1.61, 0]} female hair="short" />
      <mesh position={[0, 1.69, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.215, 0.022, 8, 32]} />
        <meshStandardMaterial color={CREAM} />
      </mesh>
      <BeveledBox
        size={[0.38, 0.025, 0.2]}
        position={[0, 1.69, 0.18]}
        color={CREAM}
        radius={0.04}
      />
      <Ball at={[0.14, 1.58, -0.23]} size={[0.105, 0.18, 0.08]} color="#49352c" />
      <Curve
        points={[
          [-0.06, 1.39, 0.095],
          [0, 1.32, 0.13],
          [0.06, 1.39, 0.095],
        ]}
        radius={0.012}
        color="#a78bbd"
      />
      <Arm
        shirt={CREAM}
        points={[
          [0.17, 1.31, 0],
          [0.33, 1.12, 0.06],
          [0.45, 1.37, 0.14],
        ]}
        radius={0.048}
      />
      <Arm
        shirt={CREAM}
        points={[
          [-0.17, 1.31, 0],
          [-0.3, 1.11, 0.12],
          [-0.25, 1.04, 0.27],
        ]}
        radius={0.048}
      />
      <Rod from={[0.44, 1.32, 0.14]} to={[0.54, 1.57, 0.14]} radius={0.025} color="#676053" />
      <group position={[0.59, 1.74, 0.14]} rotation={[0, 0, -0.2]}>
        <mesh castShadow>
          <extrudeGeometry args={[paddle, { depth: 0.045, bevelEnabled: false }]} />
          <meshStandardMaterial color="#39796f" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.046]} scale={[0.86, 0.89, 1]}>
          <shapeGeometry args={[paddle]} />
          <meshStandardMaterial color="#99d1bb" roughness={0.8} />
        </mesh>
      </group>
      <Rod from={[0.5, 1.69, 0.184]} to={[0.67, 1.81, 0.184]} radius={0.012} color={CREAM} />
      <Ball at={[-0.25, 1.08, 0.29]} size={[0.071, 0.071, 0.071]} color="#e1df59" />
      {[
        [-0.026, 0.025],
        [0.025, 0.025],
        [0, -0.023],
      ].map(([x, y], i) => (
        <Ball
          key={i}
          at={[-0.25 + x, 1.08 + y, 0.354]}
          size={[0.01, 0.012, 0.006]}
          color="#8f9d3d"
        />
      ))}
    </group>
  );
}

export function Wibu() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rod
            from={[s * 0.1, 0.78, 0]}
            to={[s * 0.13, 0.23, 0.04]}
            radius={0.075}
            color="#374858"
          />
          <BeveledBox
            size={[0.18, 0.12, 0.29]}
            position={[s * 0.13, 0.19, 0.1]}
            color={CREAM}
            radius={0.04}
          />
          <BeveledBox
            size={[0.18, 0.025, 0.29]}
            position={[s * 0.13, 0.142, 0.1]}
            color="#bc6057"
            radius={0.008}
          />
        </group>
      ))}
      <BeveledBox
        size={[0.45, 0.52, 0.2]}
        position={[0, 1.07, -0.24]}
        color="#364e69"
        radius={0.065}
      />
      <BeveledBox
        size={[0.3, 0.22, 0.05]}
        position={[0, 0.94, -0.36]}
        color="#8da9b6"
        radius={0.035}
      />
      <Torso at={[0, 1.07, 0]} color="#e0bd6e" size={[0.22, 0.27, 0.15]} />
      {[-1, 1].map((s) => (
        <Curve
          key={s}
          points={[
            [s * 0.17, 1.3, -0.1],
            [s * 0.18, 1.23, 0.13],
            [s * 0.16, 0.86, 0.12],
          ]}
          radius={0.025}
          color="#43536a"
        />
      ))}
      <Head at={[0, 1.54, 0.015]} glasses="round" />
      <mesh position={[0, 1.61, -0.035]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.225, 0.025, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#3f4c5c" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Ball at={[s * 0.235, 1.54, 0]} size={[0.045, 0.085, 0.07]} color="#435c74" />
          <Ball at={[s * 0.273, 1.54, 0]} size={[0.015, 0.052, 0.045]} color="#e3a7a3" />
        </group>
      ))}
      <Arm
        shirt="#e0bd6e"
        points={[
          [-0.18, 1.23, 0],
          [-0.32, 0.98, 0.15],
          [-0.22, 1.04, 0.32],
        ]}
      />
      <Arm
        shirt="#e0bd6e"
        points={[
          [0.18, 1.23, 0],
          [0.32, 1.06, 0.1],
          [0.17, 1.55, 0.2],
        ]}
      />
      <group position={[-0.17, 1.04, 0.32]} rotation={[-0.12, -0.13, -0.08]}>
        <BeveledBox
          size={[0.31, 0.37, 0.035]}
          position={[0, 0, 0]}
          color="#b65b66"
          radius={0.012}
        />
        <BeveledBox
          size={[0.28, 0.34, 0.015]}
          position={[0, 0, 0.025]}
          color={CREAM}
          radius={0.008}
        />
        <BeveledBox
          size={[0.26, 0.065, 0.008]}
          position={[0, 0.115, 0.036]}
          color="#745675"
          radius={0.003}
        />
        <DecalText text="MANGA" at={[0, 0.115, 0.043]} width={0.24} />
        <BeveledBox
          size={[0.11, 0.12, 0.006]}
          position={[-0.065, -0.005, 0.038]}
          color="#7a8eab"
          radius={0.005}
        />
        <BeveledBox
          size={[0.11, 0.12, 0.006]}
          position={[0.065, -0.005, 0.038]}
          color="#d99b92"
          radius={0.005}
        />
        {[-0.09, -0.13].map((y) => (
          <Rod
            key={y}
            from={[-0.12, y, 0.042]}
            to={[0.12, y, 0.042]}
            radius={0.006}
            color="#6b7581"
          />
        ))}
      </group>
      <Ball at={[-0.22, 0.88, 0.13]} size={[0.04, 0.05, 0.025]} color="#d994a2" />
    </group>
  );
}
