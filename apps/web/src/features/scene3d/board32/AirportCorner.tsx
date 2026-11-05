import { useEffect, useMemo } from 'react';
import { DoubleSide, Shape } from 'three';
import { BeveledBox } from '../BeveledBox';
import { canvasMap } from './board-paint';
import { LandingGear, WingDetails, AirportCart } from './AirportDetails';

function Airplane() {
  const wing = useMemo(() => {
    const s = new Shape();
    s.moveTo(-0.055, 0.1);
    s.lineTo(-0.37, -0.13);
    s.lineTo(-0.37, -0.2);
    s.lineTo(-0.045, -0.08);
    s.lineTo(0.045, -0.08);
    s.lineTo(0.37, -0.2);
    s.lineTo(0.37, -0.13);
    s.lineTo(0.055, 0.1);
    s.closePath();
    return s;
  }, []);
  const tail = useMemo(() => {
    const s = new Shape();
    s.moveTo(-0.018, -0.2);
    s.lineTo(-0.16, -0.31);
    s.lineTo(-0.16, -0.35);
    s.lineTo(0.16, -0.35);
    s.lineTo(0.16, -0.31);
    s.lineTo(0.018, -0.2);
    s.closePath();
    return s;
  }, []);
  const fin = useMemo(() => {
    const s = new Shape();
    s.moveTo(-0.29, 0);
    s.lineTo(-0.34, 0.16);
    s.lineTo(-0.24, 0.15);
    s.lineTo(-0.14, 0);
    s.closePath();
    return s;
  }, []);
  return (
    <group position={[-0.16, 0.2, -0.05]} rotation={[0, Math.PI / 2, 0]} scale={0.95}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.052, 0.57, 6, 12]} />
        <meshStandardMaterial color="#fffdf2" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.018, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <extrudeGeometry
          args={[
            wing,
            {
              depth: 0.017,
              bevelEnabled: true,
              bevelSize: 0.007,
              bevelThickness: 0.004,
              bevelSegments: 1,
              steps: 1,
            },
          ]}
        />
        <meshStandardMaterial color="#fffdf2" />
      </mesh>
      <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <extrudeGeometry args={[tail, { depth: 0.013, bevelEnabled: false }]} />
        <meshStandardMaterial color="#3cadd0" />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <shapeGeometry args={[fin]} />
        <meshStandardMaterial color="#319dc5" side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.037, 0.245]} scale={[0.042, 0.022, 0.055]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#285973" roughness={0.3} />
      </mesh>
      <LandingGear />
      <WingDetails />
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.18, -0.035, -0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.03, 0.12, 10]} />
            <meshStandardMaterial color="#4ba9c2" />
          </mesh>
          <mesh position={[side * 0.18, -0.035, 0.003]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.019, 10]} />
            <meshStandardMaterial color="#315369" side={DoubleSide} />
          </mesh>
          {[-0.1, -0.035, 0.03, 0.095].map((z) => (
            <mesh key={z} position={[side * 0.049, 0.022, z]} scale={[0.009, 0.012, 0.012]}>
              <sphereGeometry args={[1, 6, 4]} />
              <meshStandardMaterial color="#337b98" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
function Terminal() {
  return (
    <group position={[0.17, 0.1, -0.5]}>
      <BeveledBox
        position={[0.08, 0.035, 0]}
        size={[0.84, 0.07, 0.35]}
        color="#dee9dc"
        radius={0.02}
      />
      <BeveledBox
        position={[0.08, 0.18, 0]}
        size={[0.77, 0.29, 0.29]}
        color="#fff5d9"
        radius={0.025}
      />
      <BeveledBox
        position={[0.08, 0.18, 0.153]}
        size={[0.68, 0.19, 0.018]}
        color="#5cbfce"
        radius={0.005}
      />
      {[-0.18, 0, 0.18, 0.36].map((x) => (
        <BeveledBox
          key={x}
          position={[x, 0.18, 0.17]}
          size={[0.017, 0.2, 0.025]}
          color="#e1f0df"
          radius={0.003}
        />
      ))}
      <mesh
        position={[0.08, 0.325, 0]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[1, 0.5, 1]}
        castShadow
      >
        <cylinderGeometry args={[0.2, 0.2, 0.9, 20, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color="#d9f3e9" side={DoubleSide} />
      </mesh>
      <BeveledBox
        position={[0.08, 0.325, 0]}
        size={[0.91, 0.025, 0.41]}
        color="#57b8cd"
        radius={0.01}
      />
      {[-0.2, 0.08, 0.36].map((x) => (
        <BeveledBox
          key={x}
          position={[x, 0.403, 0]}
          size={[0.2, 0.008, 0.1]}
          color="#52a5bd"
          radius={0.004}
        />
      ))}
      <BeveledBox
        position={[-0.315, 0.18, 0]}
        size={[0.014, 0.19, 0.22]}
        color="#5cbfce"
        radius={0.003}
      />
      <BeveledBox
        position={[0.08, 0.135, 0.17]}
        size={[0.15, 0.24, 0.025]}
        color="#348da7"
        radius={0.008}
      />
      <BeveledBox
        position={[0.08, 0.255, 0.188]}
        size={[0.15, 0.017, 0.025]}
        color="#f4c25f"
        radius={0.003}
      />
      <BeveledBox
        position={[0.33, 0.24, 0.17]}
        size={[0.15, 0.015, 0.013]}
        color="#e7f5ed"
        radius={0.002}
      />
      <BeveledBox
        position={[0.08, 0.3, 0.19]}
        size={[0.82, 0.025, 0.08]}
        color="#fff3cd"
        radius={0.01}
      />
      <BeveledBox
        position={[0.45, 0.265, -0.015]}
        size={[0.13, 0.53, 0.15]}
        color="#fff1d3"
        radius={0.02}
      />
      <BeveledBox
        position={[0.45, 0.56, -0.015]}
        size={[0.24, 0.16, 0.25]}
        color="#48acc7"
        radius={0.025}
      />
      <BeveledBox
        position={[0.45, 0.56, 0.115]}
        size={[0.19, 0.09, 0.012]}
        color="#285c79"
        radius={0.006}
      />
      <BeveledBox
        position={[0.45, 0.66, -0.015]}
        size={[0.29, 0.045, 0.3]}
        color="#d9f1e7"
        radius={0.018}
      />
      <BeveledBox
        position={[0.577, 0.56, -0.015]}
        size={[0.014, 0.09, 0.19]}
        color="#285c79"
        radius={0.004}
      />
      <BeveledBox
        position={[0.45, 0.46, 0.13]}
        size={[0.28, 0.014, 0.025]}
        color="#e8ecdb"
        radius={0.003}
      />
      <mesh position={[0.45, 0.76, -0.015]}>
        <cylinderGeometry args={[0.006, 0.006, 0.17, 6]} />
        <meshStandardMaterial color="#4f8a9f" />
      </mesh>
      <mesh position={[0.45, 0.85, -0.015]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshStandardMaterial color="#ffb44f" />
      </mesh>
    </group>
  );
}
export function AirportCorner() {
  const map = useMemo(
    () =>
      canvasMap(
        (ctx, w, h) => {
          ctx.fillStyle = '#cceef1';
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = '#409fb9';
          ctx.lineWidth = 11;
          ctx.beginPath();
          ctx.roundRect(15, 15, w - 30, h - 30, 28);
          ctx.stroke();
          ctx.fillStyle = '#e8f4e9';
          ctx.beginPath();
          ctx.moveTo(35, 35);
          ctx.lineTo(500, 35);
          ctx.lineTo(35, 500);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#a5c1c7';
          ctx.beginPath();
          ctx.roundRect(90, 285, 520, 165, 13);
          ctx.fill();
          ctx.strokeStyle = '#f7ffff';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.strokeStyle = '#f9ffff';
          ctx.lineWidth = 7;
          ctx.setLineDash([30, 24]);
          ctx.beginPath();
          ctx.moveTo(112, 367);
          ctx.lineTo(588, 367);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#f7ffff';
          for (const x of [111, 565])
            for (let y = 304; y < 440; y += 23) ctx.fillRect(x, y, 22, 11);
          ctx.strokeStyle = '#f2c15b';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(545, 205);
          ctx.lineTo(545, 256);
          ctx.quadraticCurveTo(545, 295, 490, 295);
          ctx.lineTo(490, 336);
          ctx.stroke();
          ctx.strokeStyle = '#f9df91';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(430, 240);
          ctx.lineTo(606, 240);
          ctx.stroke();
          ctx.strokeStyle = '#a8cbd0';
          ctx.lineWidth = 2;
          for (const x of [120, 275, 430, 585]) {
            ctx.beginPath();
            ctx.moveTo(x, 45);
            ctx.lineTo(x, 230);
            ctx.stroke();
          }
          ctx.fillStyle = '#eef9eb';
          ctx.beginPath();
          ctx.roundRect(55, 625, w - 110, 80, 17);
          ctx.fill();
          for (let i = 0; i < 10; i++)
            for (const y of [273, 463]) {
              ctx.fillStyle = i % 2 ? '#fff1bb' : '#b0ffff';
              ctx.beginPath();
              ctx.arc(110 + i * 52, y, 4, 0, Math.PI * 2);
              ctx.fill();
            }
        },
        768,
        768,
      ),
    [],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.094, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.735, 1.735]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <Terminal />
      <Airplane />
      <AirportCart />
    </group>
  );
}
