import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MeshBasicMaterial } from 'three';
import {
  CONSTRUCTION_DURATION,
  constructionPose,
  isNewConstruction,
} from './construction-presentation';

/** The house remains at its normal ground anchor; only a visual wrapper is animated. */
export function ConstructionReveal({
  city,
  level,
  children,
}: {
  city: string;
  level: number;
  children: ReactNode;
}) {
  const house = useRef<Group>(null),
    fx = useRef<Group>(null),
    dust = useRef<Group>(null),
    sparks = useRef<Group>(null),
    ring = useRef<Group>(null);
  const [active, setActive] = useState(false);
  const previous = useRef({ city, level });
  const time = useRef<number | null>(null);
  const materials = useMemo(
    () => ({
      dust: new MeshBasicMaterial({
        color: '#f6d69a',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      spark: new MeshBasicMaterial({
        color: '#f4b737',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
      ring: new MeshBasicMaterial({
        color: '#ffda8c',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose());
    },
    [materials],
  );
  useLayoutEffect(() => {
    const next = { city, level };
    const animate =
      isNewConstruction(previous.current, next) &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    previous.current = next;
    time.current = animate ? 0 : null;
    house.current?.scale.set(animate ? 0.92 : 1, animate ? 0.06 : 1, animate ? 0.92 : 1);
    setActive(animate);
    if (fx.current) fx.current.visible = animate;
    Object.values(materials).forEach((m) => {
      m.opacity = 0;
    });
  }, [city, level, materials]);
  useFrame((_, delta) => {
    if (time.current === null) return;
    time.current += Math.min(delta, 0.1);
    const pose = constructionPose(time.current);
    house.current?.scale.set(pose.scaleXZ, pose.scaleY, pose.scaleXZ);
    if (dust.current)
      dust.current.children.forEach((p, i) => {
        const a = (i * Math.PI) / 3,
          r = 0.32 + pose.progress * 0.16;
        p.position.set(
          Math.cos(a) * r,
          0.035 + Math.sin(pose.progress * Math.PI) * 0.08,
          Math.sin(a) * r * 0.7,
        );
        p.scale.setScalar(0.045 + pose.progress * 0.035);
      });
    if (sparks.current)
      sparks.current.children.forEach((p, i) => {
        const a = (i * Math.PI) / 3 + 0.3;
        p.position.set(
          Math.cos(a) * (0.35 + pose.progress * 0.07),
          0.06 + pose.progress * (0.38 + (i % 3) * 0.1),
          Math.sin(a) * 0.32,
        );
        p.rotation.z = a + pose.progress * 1.3;
      });
    ring.current?.scale.setScalar(0.85 + pose.progress * 0.5);
    materials.dust.opacity = pose.opacity * 0.65;
    materials.spark.opacity = pose.opacity;
    materials.ring.opacity = pose.opacity * 0.6;
    if (time.current >= CONSTRUCTION_DURATION) {
      time.current = null;
      house.current?.scale.set(1, 1, 1);
      if (fx.current) fx.current.visible = false;
      setActive(false);
    }
  });
  return (
    <>
      <group ref={house} name="construction-house">
        {children}
      </group>
      <group ref={fx} name="construction-effects" visible={active}>
        <group ref={ring} position={[0, 0.012, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={materials.ring} raycast={() => {}}>
            <ringGeometry args={[0.34, 0.352, 40]} />
          </mesh>
        </group>
        <group ref={dust}>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} material={materials.dust} raycast={() => {}}>
              <sphereGeometry args={[1, 7, 5]} />
            </mesh>
          ))}
        </group>
        <group ref={sparks}>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} renderOrder={20} material={materials.spark} raycast={() => {}}>
              <boxGeometry args={[0.018, 0.055, 0.018]} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}
