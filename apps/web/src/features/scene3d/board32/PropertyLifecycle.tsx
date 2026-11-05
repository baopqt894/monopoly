import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, MeshBasicMaterial, type Material } from 'three';
import type { LogEntry } from '@typhu/contracts';
import { HouseModel } from './HouseModel';
import { ConstructionReveal } from './ConstructionReveal';
import {
  exitPose,
  exitEffectDuration,
  propertyExitCue,
  type PropertyExitKind,
} from './property-exit-presentation';
import { ExitDust } from './ExitDust';

type Exit = { id: number; kind: PropertyExitKind; city: string; level: number };
function DepartingHouse({ exit, onDone }: { exit: Exit; onDone: () => void }) {
  const model = useRef<Group>(null),
    particles = useRef<Group>(null);
  const elapsed = useRef(0),
    finished = useRef(false),
    fading = useRef<Material[]>([]);
  const particleMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: exit.kind === 'destroy' ? '#d0b392' : '#ffc65c',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [exit.kind],
  );
  useEffect(() => () => particleMaterial.dispose(), [particleMaterial]);
  useLayoutEffect(() => {
    const replacements: { mesh: Mesh; original: Material | Material[]; copies: Material[] }[] = [];
    model.current?.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const original = object.material;
      const copies = (Array.isArray(original) ? original : [original]).map((material) => {
        const copy = material.clone();
        copy.transparent = true;
        copy.depthWrite = false;
        return copy;
      });
      object.material = Array.isArray(original) ? copies : copies[0];
      object.raycast = () => {};
      replacements.push({ mesh: object, original, copies });
    });
    fading.current = replacements.flatMap((r) => r.copies);
    return () => {
      for (const r of replacements) {
        r.mesh.material = r.original;
        r.copies.forEach((m) => m.dispose());
      }
      fading.current = [];
    };
  }, []);
  useFrame((_, delta) => {
    if (finished.current) return;
    elapsed.current += Math.min(delta, 0.1);
    const pose = exitPose(exit.kind, elapsed.current);
    if (model.current) {
      model.current.scale.set(pose.scale, pose.scale * pose.scaleY, pose.scale);
      model.current.position.set(pose.shake, pose.lift, 0);
      model.current.rotation.z = pose.tilt;
    }
    fading.current.forEach((material) => {
      material.opacity = pose.opacity;
    });
    const p = pose.progress;
    particleMaterial.opacity = Math.sin(Math.PI * p) * 0.8;
    particles.current?.children.forEach((object, i) => {
      const a = (i * Math.PI) / 4 + 0.2;
      const radius = exit.kind === 'destroy' ? 0.35 + p * 0.16 : 0.29 + p * 0.05;
      object.position.set(
        Math.cos(a) * radius,
        exit.kind === 'destroy'
          ? 0.04 + Math.sin(Math.PI * p) * (0.12 + (i % 3) * 0.05)
          : 0.05 + p * (0.35 + (i % 3) * 0.07),
        Math.sin(a) * radius * 0.75,
      );
      object.rotation.set(p * 2, a + p * 3, p * 2);
      object.scale.setScalar(exit.kind === 'destroy' ? 0.035 + (1 - p) * 0.025 : 0.027);
    });
    if (elapsed.current >= exitEffectDuration(exit.kind)) {
      finished.current = true;
      onDone();
    }
  });
  return (
    <group name={`property-exit-${exit.kind}`}>
      <group ref={model}>
        <HouseModel city={exit.city} level={exit.level} />
      </group>
      <ExitDust kind={exit.kind} time={elapsed} />
      <group ref={particles}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} material={particleMaterial} raycast={() => {}}>
            {exit.kind === 'destroy' ? (
              <boxGeometry args={[1, 1, 1]} />
            ) : (
              <cylinderGeometry args={[1, 1, 0.22, 12]} />
            )}
          </mesh>
        ))}
      </group>
    </group>
  );
}
/** Keep a presentation-only copy after server removal; authoritative property state is never delayed. */
export function PropertyLifecycle({
  city,
  level,
  tileId,
  log,
}: {
  city: string;
  level: number;
  tileId: number;
  log: readonly LogEntry[];
}) {
  const logId = log.reduce((id, e) => Math.max(id, e.id), 0);
  const previous = useRef({ city, level, logId });
  const [exit, setExit] = useState<Exit | null>(null);
  useLayoutEffect(() => {
    const cue = propertyExitCue(previous.current, { city, level }, tileId, log);
    if (cue && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setExit(cue);
    else if (previous.current.city !== city || level > previous.current.level) setExit(null);
    previous.current = { city, level, logId };
  }, [city, level, tileId, log, logId]);
  return (
    <>
      <ConstructionReveal city={city} level={level}>
        <HouseModel city={city} level={level} />
      </ConstructionReveal>
      {exit && <DepartingHouse key={exit.id} exit={exit} onDone={() => setExit(null)} />}
    </>
  );
}
