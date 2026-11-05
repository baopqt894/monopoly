import type { GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { tileLayout } from './board-layout';

/** Input remains on the physical tiles; this layer only changes their lighting. */
export function CardTargets({
  game,
  ids,
  selectedId,
}: {
  game: GameState;
  ids: number[];
  selectedId: number | null;
}) {
  const board = boardFor(game);
  return (
    <group>
      {board.map((tile) => {
        const layout = tileLayout(tile.id, game.boardId);
        const eligible = ids.includes(tile.id),
          selected = tile.id === selectedId;
        const width = layout.width - 0.04,
          depth = layout.depth - 0.04;
        return (
          <group
            key={tile.id}
            position={[layout.x, game.boardId === 'vietnam-32' ? 0.43 : 0.3, layout.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <mesh raycast={() => {}} renderOrder={5}>
              <planeGeometry args={[width, depth]} />
              <meshBasicMaterial
                color={selected ? '#ffda72' : eligible ? '#baffda' : '#102534'}
                transparent
                opacity={selected ? 0.5 : eligible ? 0.16 : 0.66}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            {eligible &&
              [
                [0, depth / 2, width, 0.045],
                [0, -depth / 2, width, 0.045],
                [-width / 2, 0, 0.045, depth],
                [width / 2, 0, 0.045, depth],
              ].map(([x, y, w, h], index) => (
                <mesh key={index} position={[x, y, 0.005]} raycast={() => {}} renderOrder={6}>
                  <planeGeometry args={[w, h]} />
                  <meshBasicMaterial
                    color={selected ? '#ffc640' : '#8de8b5'}
                    depthTest={false}
                    depthWrite={false}
                    toneMapped={false}
                  />
                </mesh>
              ))}
          </group>
        );
      })}
    </group>
  );
}
