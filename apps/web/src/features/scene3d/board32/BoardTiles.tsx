'use client';
import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '@typhu/contracts';
import { randomEventTileIds } from '@typhu/game-engine';
import { ownedBuildingLevel } from './gameplay-buildings';
import { tileAmount } from '../../board/tile-amount';
import { BeveledBox } from '../BeveledBox';
import { board32Layout, type MapTile } from './board-layout';
import { tileMap, labelMap, symbolMap } from './board-paint';
import { PropertyLifecycle } from './PropertyLifecycle';
import { AssetCorner } from './AssetCorner';
import { BoardCenter } from './BoardCenter';

function CornerLabel({ tile, index }: { tile: MapTile; index: number }) {
  const map = useMemo(() => labelMap(tile.name), [tile.name]);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh
      renderOrder={30}
      position={[0, 0.14, 0.53]}
      rotation={[-Math.PI / 2, 0, index === 0 || index === 24 ? Math.PI : 0]}
    >
      <planeGeometry args={[1.5, 0.43]} />
      <meshBasicMaterial
        map={map}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
function SpecialSymbol({ tile }: { tile: MapTile }) {
  const map = useMemo(() => symbolMap(tile), [tile]);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh position={[0, 0.115, -0.22]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.24, 1.24]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
export function RaisedTile({
  tile,
  index,
  selected,
  onSelect,
  game,
  onHover,
}: {
  game: GameState;
  onHover?: (id: number | null) => void;
  tile: MapTile;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
}) {
  const layout = board32Layout(index);
  const [hovered, setHovered] = useState(false);
  const innerBuilding = tile.kind === 'city' && (index < 8 || index > 24);
  const buildingZ = innerBuilding ? 0.47 : -0.47;
  const amount = game ? tileAmount(game, index) : undefined;
  const property = game?.properties[index];
  const owner = game?.players.find((p) => p.id === property?.ownerId);
  const map = useMemo(() => {
    const texture = tileMap(
      tile,
      selected,
      hovered,
      innerBuilding ? 8 : index,
      amount,
      owner?.color,
    );
    if (innerBuilding) {
      texture.center.set(0.5, 0.5);
      texture.rotation = Math.PI;
    }
    return texture;
  }, [tile, selected, hovered, index, innerBuilding, amount, owner?.color]);
  useEffect(() => () => map.dispose(), [map]);
  const level = ownedBuildingLevel(game, index);
  const event = !!game && randomEventTileIds(game).includes(index);
  const festival = game?.festivalTileId === index;
  return (
    <group
      position={[layout.x, 0.32, layout.z]}
      rotation={[0, layout.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta < 5) onSelect(index);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover?.(index);
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover?.(null);
      }}
    >
      {
        <>
          <BeveledBox
            size={[layout.width - 0.035, 0.26, layout.depth - 0.035]}
            position={[0, -0.07, 0]}
            color={selected ? '#49a9ab' : (owner?.color ?? '#c6bca7')}
            radius={0.025}
          />
          <BeveledBox
            size={[layout.width - 0.045, 0.075, layout.depth - 0.045]}
            position={[0, 0.047, 0]}
            color="#fff9e9"
            radius={0.012}
          />
          <mesh position={[0, 0.087, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[layout.width - 0.065, layout.depth - 0.065]} />
            <meshStandardMaterial map={map} roughness={0.86} />
          </mesh>
        </>
      }
      {owner && (
        <group>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh
                position={[0, 0.094, side * (layout.depth / 2 - 0.065)]}
                rotation={[-Math.PI / 2, 0, 0]}
                raycast={() => {}}
              >
                <planeGeometry args={[layout.width - 0.09, 0.065]} />
                <meshBasicMaterial color={owner.color} toneMapped={false} />
              </mesh>
              <mesh
                position={[side * (layout.width / 2 - 0.065), 0.095, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                raycast={() => {}}
              >
                <planeGeometry args={[0.065, layout.depth - 0.09]} />
                <meshBasicMaterial color={owner.color} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {(event || festival) && (
        <mesh position={[0.35, 0.105, -0.65]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}>
          <ringGeometry args={[0.07, 0.105, festival ? 5 : 20]} />
          <meshBasicMaterial color={festival ? '#f09531' : '#d5b33f'} toneMapped={false} />
        </mesh>
      )}
      {layout.corner ? (
        <>
          <AssetCorner kind={tile.kind} rotation={layout.rotation} />
          {tile.kind === 'airport' ? (
            <group rotation={[0, Math.PI / 2, 0]}>
              <CornerLabel tile={tile} index={16} />
            </group>
          ) : (
            <CornerLabel tile={tile} index={index} />
          )}
        </>
      ) : tile.kind === 'city' ? (
        <>
          <group
            position={[0, 0.09, buildingZ]}
            rotation={[0, index < 8 || index > 24 ? Math.PI : 0, 0]}
          >
            <PropertyLifecycle city={tile.name} level={level} tileId={index} log={game.log} />
          </group>
        </>
      ) : (
        <SpecialSymbol tile={tile} />
      )}
    </group>
  );
}
export function Vietnam32Base({ gameplay = false }: { gameplay?: boolean }) {
  return (
    <group>
      <BeveledBox
        size={[11.55, 0.36, 11.55]}
        position={[0, -0.1, 0]}
        color="#398d9c"
        radius={0.08}
      />
      <BeveledBox
        size={[11.48, 0.09, 11.48]}
        position={[0, 0.11, 0]}
        color="#eadcc3"
        radius={0.025}
      />
      <BeveledBox size={[7.64, 0.13, 7.64]} position={[0, 0.13, 0]} color="#83b950" radius={0.03} />
      <group position={[0, 0.08, 0]}>
        <BoardCenter showDice={!gameplay} />
      </group>
    </group>
  );
}
