import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, SpriteMaterial } from 'three';
import { canvasMap } from './board-paint';
import { exitEffectDuration, type PropertyExitKind } from './property-exit-presentation';

/** Soft billboard clouds, staggered in two rings, with a tail after the house vanishes. */
export function ExitDust({ kind, time }: { kind: PropertyExitKind; time: RefObject<number> }) {
  const root = useRef<Group>(null);
  const count = kind === 'destroy' ? 18 : 10;
  const map = useMemo(
    () =>
      canvasMap(
        (ctx, w, h) => {
          for (const [x, y, r] of [
            [0.5, 0.52, 0.43],
            [0.3, 0.58, 0.26],
            [0.68, 0.58, 0.28],
            [0.46, 0.3, 0.28],
            [0.64, 0.36, 0.22],
          ]) {
            const gradient = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w);
            gradient.addColorStop(0, '#fff7e7ff');
            gradient.addColorStop(0.55, '#f5dfbfff');
            gradient.addColorStop(0.8, '#d6b88e99');
            gradient.addColorStop(1, '#fff1d900');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
          }
        },
        128,
        128,
      ),
    [],
  );
  const materials = useMemo(
    () =>
      Array.from(
        { length: count },
        (_, i) =>
          new SpriteMaterial({
            map,
            color: i % 3 === 0 ? '#b69a74' : i % 3 === 1 ? '#ead5b2' : '#c9ad84',
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
    [map, count],
  );
  useEffect(
    () => () => {
      materials.forEach((m) => m.dispose());
    },
    [materials],
  );
  useEffect(() => () => map.dispose(), [map]);
  useFrame(() => {
    root.current?.children.forEach((sprite, i) => {
      const delay = 0.03 + (i % 6) * 0.035;
      const life = exitEffectDuration(kind) - delay;
      const p = (time.current - delay) / life;
      sprite.visible = p >= 0 && p < 1;
      if (!sprite.visible) return;
      const angle = i * 2.399;
      const inner = i % 3 === 0;
      const radius = (inner ? 0.1 : 0.25) + (kind === 'destroy' ? 0.18 : 0.1) * p;
      sprite.position.set(
        Math.cos(angle) * radius,
        0.07 + p * (inner ? 0.27 : 0.12),
        Math.sin(angle) * radius * 0.75,
      );
      const size =
        (kind === 'destroy' ? 0.3 : 0.2) + (kind === 'destroy' ? 0.5 : 0.3) * Math.sqrt(p);
      sprite.scale.set(size, size * (0.65 + (i % 3) * 0.12), 1);
      const fadeIn = Math.min(1, p * 10);
      materials[i].opacity =
        fadeIn *
        Math.pow(Math.max(0, 1 - Math.max(0, p - 0.4) / 0.6), 1.2) *
        (kind === 'destroy' ? 0.95 : 0.72);
      materials[i].rotation = Math.sin(i * 4) * 0.18 + p * 0.1;
    });
  });
  return (
    <group ref={root} name="exit-dust-clouds">
      {materials.map((material, i) => (
        <sprite key={i} material={material} visible={false} raycast={() => {}} />
      ))}
    </group>
  );
}
