import type { Business } from '@typhu/contracts';
import { tileLayout } from './board-layout';
import { VietnamBuilding } from './vietnam/VietnamBuilding';

export function PropertyBuildings({
  id,
  level,
  color,
  business,
  boardId,
  modelId = id,
}: {
  boardId?: 'vietnam-32';
  modelId?: number;
  id: number;
  level: number;
  color: string;
  business: Business;
}) {
  const tile = tileLayout(id, boardId);
  const boardSize = boardId === 'vietnam-32' ? 32 : 40;
  const side = Math.max(0, Math.floor((id - 1) / (boardSize / 4)));
  const x = side === 1 ? tile.width / 2 - 0.37 : side === 3 ? -tile.width / 2 + 0.37 : 0;
  const z = side === 0 ? -tile.depth / 2 + 0.37 : side === 2 ? tile.depth / 2 - 0.37 : 0;
  return (
    <group position={[x, 0.07, z]} rotation={[0, side % 2 ? Math.PI / 2 : 0, 0]}>
      <VietnamBuilding
        tileId={modelId}
        level={level}
        business={business}
        scale={level === 5 ? 0.54 : 0.48}
      />
      {Array.from({ length: level }, (_, tier) => (
        <mesh key={tier} position={[(tier - (level - 1) / 2) * 0.08, 0.014, 0.33]}>
          <sphereGeometry args={[0.022, 10, 6]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}
