import { useEffect, useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import type { Business } from '@typhu/contracts';
import { VIETNAM_CITIES } from '@typhu/game-content';
import { vietnamGeometry } from './geometry';
import type { Surface } from './miniature';

export function VietnamBuilding({
  tileId,
  level,
  business = 'residence',
  scale = 1,
}: {
  tileId: number;
  level: number;
  business?: Business;
  scale?: number;
}) {
  const city = VIETNAM_CITIES[tileId];
  const parts = useMemo(() => vietnamGeometry(tileId, level, business), [tileId, level, business]);
  const materials = useMemo(() => {
    const colors: Record<Surface, string> = {
      wall: city.wall,
      roof: city.roof,
      trim: '#fff0d5',
      glass: city.model === 'ha-long' && level === 5 ? '#253d49' : '#326477',
      gold: '#e5b851',
      green: '#44865b',
      water: '#5fbdb7',
      wood: '#765844',
    };
    return Object.fromEntries(
      Object.entries(colors).map(([key, color]) => [
        key,
        new MeshStandardMaterial({
          color,
          roughness: key === 'glass' ? 0.23 : key === 'water' ? 0.22 : 0.53,
          metalness: key === 'gold' ? 0.28 : key === 'glass' ? 0.16 : 0,
        }),
      ]),
    ) as Record<Surface, MeshStandardMaterial>;
  }, [city, level]);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);
  return (
    <group scale={scale} dispose={null}>
      {(Object.entries(parts) as [Surface, NonNullable<typeof parts.wall>][]).map(
        ([part, geometry]) => (
          <mesh
            key={part}
            geometry={geometry}
            material={materials[part]}
            castShadow={part !== 'water' && part !== 'glass'}
            receiveShadow
          />
        ),
      )}
    </group>
  );
}
