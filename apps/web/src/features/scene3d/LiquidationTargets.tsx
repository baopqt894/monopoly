import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { liquidationTileIds, liquidationValue } from '@typhu/game-engine';
import { formatMoney } from '../../shared/format';
import { tileLayout } from './board-layout';
import { arrangeSaleLabels } from './liquidation-label-layout';

function SaleTarget({ game, id }: { game: GameState; id: number }) {
  const layout = tileLayout(id, game.boardId);
  const priority = (game.debt?.selectedTileIds ?? []).indexOf(id);
  return (
    <mesh
      position={[layout.x, game.boardId === 'vietnam-32' ? 0.43 : 0.29, layout.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => {}}
    >
      <planeGeometry args={[layout.width - 0.06, layout.depth - 0.06]} />
      <meshBasicMaterial
        color={priority >= 0 ? '#ffcf57' : '#51c9ac'}
        transparent
        opacity={0.55}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** DOM labels share tile IDs with the world-space projector, without a second WebGL renderer. */
export function LiquidationLabels({
  game,
  disabled,
  onSelect,
}: {
  game: GameState;
  disabled: boolean;
  onSelect: (id: number) => void;
}) {
  const board = boardFor(game);
  return (
    <>
      <svg className="liquidation-label-links" aria-hidden="true">
        {liquidationTileIds(game).map((id) => (
          <line key={id} data-liquidation-link={id} />
        ))}
      </svg>
      {liquidationTileIds(game).map((id) => {
        const priority = (game.debt?.selectedTileIds ?? []).indexOf(id);
        const price = formatMoney(liquidationValue(game, id));
        return (
          <button
            key={id}
            data-liquidation-tile={id}
            className={`liquidation-tile-price ${priority >= 0 ? 'is-selected' : ''}`}
            aria-label={`Chọn bán ${board[id].name}, ${price}`}
            aria-pressed={priority >= 0}
            disabled={disabled}
            title={`${board[id].name} · ${price}`}
            onClick={() => onSelect(id)}
          >
            {priority >= 0 && <span className="liquidation-order">{priority + 1}</span>}
            {price}
          </button>
        );
      })}
    </>
  );
}

export function LiquidationTargets({
  game,
  container,
}: {
  game: GameState;
  container: HTMLElement;
}) {
  const { camera, size } = useThree();
  const point = useMemo(() => new Vector3(), []);
  const targets = useRef<{ id: number; button: HTMLButtonElement; line: SVGLineElement | null }[]>(
    [],
  );
  const lastLayout = useRef('');
  const ids = liquidationTileIds(game);
  const key = ids.join(',');
  useEffect(() => {
    lastLayout.current = '';
    targets.current = ids.flatMap((id) => {
      const button = container.querySelector<HTMLButtonElement>(`[data-liquidation-tile="${id}"]`);
      const line = container.querySelector<SVGLineElement>(`[data-liquidation-link="${id}"]`);
      return button ? [{ id, button, line }] : [];
    });
  }, [container, key]);
  useFrame(() => {
    const anchors = targets.current.map(({ id, button }) => {
      const tile = tileLayout(id, game.boardId);
      point.set(tile.x, game.boardId === 'vietnam-32' ? 0.58 : 0.44, tile.z).project(camera);
      return {
        id,
        x: ((point.x + 1) * size.width) / 2,
        y: ((1 - point.y) * size.height) / 2,
        width: button.offsetWidth,
        height: button.offsetHeight,
      };
    });
    const signature = JSON.stringify(anchors);
    if (lastLayout.current === signature) return;
    lastLayout.current = signature;
    const labels = arrangeSaleLabels(anchors, size.width, size.height);
    labels.forEach((label, index) => {
      const { button, line } = targets.current[index],
        anchor = anchors[index];
      button.style.transform = `translate(${label.x}px, ${label.y}px) translate(-50%, -50%)`;
      if (line) {
        line.setAttribute('x1', String(anchor.x));
        line.setAttribute('y1', String(anchor.y));
        line.setAttribute('x2', String(label.x));
        line.setAttribute('y2', String(label.y));
        line.style.visibility =
          Math.hypot(label.x - anchor.x, label.y - anchor.y) > 5 ? 'visible' : 'hidden';
      }
    });
  });
  return (
    <group>
      {ids.map((id) => (
        <SaleTarget key={id} game={game} id={id} />
      ))}
    </group>
  );
}
