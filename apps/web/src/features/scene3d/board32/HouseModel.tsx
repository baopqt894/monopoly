import { DoubleSide, FrontSide, type MeshStandardMaterial } from 'three';
import { landmarkTexture } from './landmark-materials';
import { useEffect, useMemo, useRef } from 'react';
import { assetHouseGeometry, HOUSE_PALETTES } from './house-models';
import { cityLandmarkGeometry } from './landmark-models';
import { landmarkColors, resolveCityBuilding } from './building-catalog';
import type { Surface } from '../vietnam/miniature';

/** Levels 1–4 share the regional house; level 5 always resolves from the city identity. */
export function HouseModel({ city, level }: { city: string; level: number }) {
  const building = resolveCityBuilding(city, level);
  if (!building) return null;
  return building.kind === 'house' ? (
    <HouseMesh group={building.group} level={building.level} />
  ) : (
    <LandmarkMesh model={building.model} />
  );
}
function HouseMesh({ group, level }: { group: number; level: number }) {
  const parts = useMemo(() => assetHouseGeometry(group, level), [group, level]);
  const colors: Record<Surface, string> = {
    ...HOUSE_PALETTES[group],
    roof: group === 7 && level === 3 ? '#e45124' : HOUSE_PALETTES[group].roof,
    gold: '#f0ad24',
    green: '#579574',
    water: '#76cbd0',
  };
  return (
    <group scale={0.62} dispose={null}>
      {Object.entries(parts).map(([surface, geometry]) => (
        <mesh key={surface} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={colors[surface as Surface]}
            roughness={surface === 'glass' ? 0.32 : 0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
function LandmarkMesh({ model }: { model: string }) {
  const parts = useMemo(() => cityLandmarkGeometry(model), [model]);
  const colors = landmarkColors(model);
  const scale = model === 'turtle' || model === 'market' ? 0.72 : 0.6;
  return (
    <group scale={scale} dispose={null}>
      {Object.entries(parts).map(([surface, geometry]) => (
        <mesh key={`${model}:${surface}`} geometry={geometry} castShadow receiveShadow>
          <LandmarkMaterial
            model={model}
            surface={surface as Surface}
            color={colors[surface as Surface]}
          />
        </mesh>
      ))}
    </group>
  );
}

function LandmarkMaterial({
  model,
  surface,
  color,
}: {
  model: string;
  surface: Surface;
  color: string;
}) {
  const material = useRef<MeshStandardMaterial>(null);
  const map = landmarkTexture(model, surface) ?? null;
  // Mesh geometry and maps are cached; this per-instance material belongs to the mounted model.
  useEffect(() => {
    const owned = material.current;
    return () => owned?.dispose();
  }, []);
  return (
    <meshStandardMaterial
      ref={material}
      color={color}
      map={map}
      bumpMap={model === 'market' && surface === 'green' ? null : map}
      bumpScale={surface === 'roof' ? 0.0025 : 0.0015}
      roughness={
        surface === 'glass'
          ? 0.24
          : model === 'museum' && surface === 'roof'
            ? 0.32
            : surface === 'gold'
              ? 0.48
              : 0.78
      }
      metalness={surface === 'glass' ? 0.18 : surface === 'gold' ? 0.12 : 0}
      side={
        model === 'lotus' || surface === 'roof' || (model === 'hats' && surface === 'trim')
          ? DoubleSide
          : FrontSide
      }
    />
  );
}
