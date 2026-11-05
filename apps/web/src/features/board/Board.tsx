import type { CSSProperties } from 'react';
import {
  ArrowUpRight,
  CircleHelp,
  Coffee,
  Coins,
  Droplets,
  Gift,
  House,
  Landmark,
  TreePalm,
  ParkingCircle,
  Plane,
  Sparkles,
  TrainFront,
  Trees,
  Zap,
} from 'lucide-react';
import type { BoardTile, GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { liquidationTileIds, liquidationValue, randomEventTileIds, festivalRentMultiplier } from '@typhu/game-engine';
import { Token } from '../../shared/Token';
import { CityIllustration } from './CityIllustration';
import './board.css';
import { tileAmount } from './tile-amount';
import type { RollFeedback } from '../game/roll-feedback';

export function boardPosition(id: number, boardId?: 'vietnam-32'): CSSProperties {
  const count = boardId === 'vietnam-32' ? 32 : 40;
  const side = count / 4,
    last = side + 1;
  if (id <= side) return { gridRow: last, gridColumn: last - id };
  if (id <= side * 2) return { gridRow: side * 2 + 1 - id, gridColumn: 1 };
  if (id <= side * 3) return { gridRow: 1, gridColumn: id - side * 2 + 1 };
  return { gridRow: id - side * 3 + 1, gridColumn: last };
}

const icons = {
  go: ArrowUpRight,
  street: House,
  railroad: TrainFront,
  utility: Zap,
  chance: CircleHelp,
  chest: Gift,
  tax: Coins,
  jail: TreePalm,
  parking: ParkingCircle,
  airport: Plane,
};

function Tile({
  tile,
  game,
  onSelect,
  selected,
  arrivalTotal,
  onTarget,
  cardTargetIds,
  cardTargetId = null,
  liquidating = false,
  selectionDisabled = false,
}: {
  tile: BoardTile;
  game: GameState;
  onSelect: (id: number) => void;
  selected: boolean;
  arrivalTotal?: number;
  onTarget?: (id: number) => void;
  cardTargetIds?: number[];
  cardTargetId?: number | null;
  liquidating?: boolean;
  selectionDisabled?: boolean;
}) {
  const property = game.properties[tile.id];
  const amount = tileAmount(game, tile.id);
  const owner = game.players.find((player) => player.id === property?.ownerId);
  const occupants = game.players.filter(
    (player) => player.position === tile.id && !player.bankrupt,
  );
  const sideLength = boardFor(game).length / 4;
  const eligible = liquidating && liquidationTileIds(game).includes(tile.id);
  const cardEligible = cardTargetIds?.includes(tile.id) ?? false;
  const priority = (game.debt?.selectedTileIds ?? []).indexOf(tile.id);
  const corner = tile.id % sideLength === 0;
  const side =
    tile.id === 0 || tile.id <= sideLength
      ? 'bottom'
      : tile.id <= sideLength * 2
        ? 'left'
        : tile.id <= sideLength * 3
          ? 'top'
          : 'right';
  const Icon = tile.resort
    ? TreePalm
    : tile.kind === 'utility' && tile.id === 28
      ? Droplets
      : icons[tile.kind];
  const active = game.players[game.currentPlayer].position === tile.id;
  return (
    <button
      style={
        {
          ...boardPosition(tile.id, game.boardId),
          '--group': owner?.color ?? '#c6bca7',
          '--owner': owner?.color,
        } as CSSProperties
      }
      className={`board-tile side-${side} kind-${tile.kind} ${owner ? 'is-owned' : ''} ${corner ? 'corner' : ''} ${active ? 'active-tile' : ''} ${selected ? 'selected-tile' : ''} ${property?.mortgaged ? 'mortgaged' : ''} ${eligible ? 'is-liquidation-target' : ''} ${eligible && priority >= 0 ? 'is-liquidation-selected' : ''} ${cardTargetIds !== undefined && !cardEligible ? 'is-card-unavailable' : ''} ${cardEligible ? 'is-card-target' : ''} ${cardEligible && cardTargetId === tile.id ? 'is-card-selected' : ''}`}
      disabled={
        (liquidating && (!eligible || selectionDisabled)) ||
        (cardTargetIds !== undefined && (!cardEligible || selectionDisabled))
      }
      aria-pressed={cardEligible ? cardTargetId === tile.id : eligible ? priority >= 0 : undefined}
      data-roll-destination={arrivalTotal !== undefined || undefined}
      onClick={() => onSelect(tile.id)}
      onPointerEnter={() => onTarget?.(tile.id)}
      onFocus={() => onTarget?.(tile.id)}
      aria-label={
        cardEligible
          ? `Chọn ô ${tile.name}`
          : eligible
            ? `Chọn bán ${tile.name}, ₫${liquidationValue(game, tile.id)}`
            : `Ô ${tile.id}: ${tile.name}${amount !== undefined ? `, ${tile.kind === 'tax' ? 'thuế' : 'tiền thuê'} ₫${amount}` : ''}${owner ? `, chủ ${owner.name}` : ''}`
      }
    >
      {arrivalTotal !== undefined && <span className="board-roll-destination" aria-hidden="true">{arrivalTotal}</span>}
      {tile.group && (
        <span className="color-band">
          {property && property.level > 0 && (
            <span className="buildings">
              {property.level === 5 ? (
                <Landmark size={12} />
              ) : (
                Array.from({ length: property.level }, (_, i) => (
                  <House key={i} size={7} fill="currentColor" />
                ))
              )}
            </span>
          )}
        </span>
      )}
      <span className="tile-content">
        {tile.kind !== 'street' && (
          <Icon className="tile-icon" strokeWidth={tile.kind === 'chance' ? 1.5 : 1.8} />
        )}
        <span className="tile-name">{tile.name}</span>
        {amount !== undefined && <span className="tile-price">₫{amount.toLocaleString('vi-VN')}</span>}
        {corner && <span className="tile-subtitle">{tile.subtitle}</span>}
      </span>
      {eligible && (
        <span className="liquidation-board-price">
          {priority >= 0 ? `${priority + 1} · ` : ''}₫{liquidationValue(game, tile.id)}
        </span>
      )}
      {owner && <span className="owner-dot" title={owner.name} />}
      {game.festivalTileId===tile.id ? <span className="board-event-mark is-festival">Lễ hội ×{festivalRentMultiplier(game,tile.id).toLocaleString('vi-VN')}</span> : randomEventTileIds(game).includes(tile.id) && <span className="board-event-mark">Sự kiện ×1,25</span>}
      {!!occupants.length && (
        <span className="tile-tokens">
          {occupants.map((player) => (
            <span
              key={player.id}
              className={`board-token ${player.id === game.players[game.currentPlayer].id ? 'current-token' : ''}`}
              style={{ background: player.color }}
              title={player.name}
            >
              <Token token={player.token} size={11} />
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

export function Board({
  game,
  rollResult,
  selectedTileId,
  onSelect,
  onTarget,
  cardTargetIds,
  cardTargetId = null,
  liquidating = false,
  selectionDisabled = false,
}: {
  game: GameState;
  selectedTileId: number | null;
  rollResult?: RollFeedback | null;
  onSelect: (id: number) => void;
  onTarget?: (id: number) => void;
  cardTargetIds?: number[];
  cardTargetId?: number | null;
  liquidating?: boolean;
  selectionDisabled?: boolean;
}) {
  const board = boardFor(game);
  return (
    <div className="board-shell">
      <div
        className={`game-board ${board.length === 32 ? 'board-32' : ''}`}
        aria-label={`Bàn cờ tỷ phú ${board.length} ô`}
      >
        <div className="board-center">
          <div className="center-topline">
            <span>
              <Trees size={12} /> MỘT THÀNH PHỐ DO BẠN TẠO NÊN
            </span>
            <span>EST. 2026</span>
          </div>
          <div className="center-brand">
            <span className="brand-flourish">✦</span>
            <h2>
              TỶ PHÚ<span>THÀNH PHỐ SỐNG</span>
            </h2>
            <span className="brand-flourish">✦</span>
          </div>
          <p className="center-tagline">Đầu tư khôn ngoan. Xây nên câu chuyện của bạn.</p>
          <CityIllustration />
          <div className="center-decks">
            <div className="deck-stack chance-deck">
              <CircleHelp size={21} />
              <span>
                CƠ HỘI<small>{game.decks.chance.length} thẻ trong bộ</small>
              </span>
              <Sparkles className="deck-decoration" size={14} />
            </div>
            <div className="deck-stack chest-deck">
              <Gift size={21} />
              <span>
                QUỸ CỘNG ĐỒNG<small>{game.decks.chest.length} thẻ trong bộ</small>
              </span>
              <Coffee className="deck-decoration" size={14} />
            </div>
          </div>
          <div className="center-footer">
            <span>{board.length} Ô · 8 KHU PHỐ · VÔ VÀN CƠ HỘI</span>
            <Landmark size={14} />
            <span>
              {game.mode === 'city'
                ? 'THÀNH PHỐ LUÔN CHUYỂN ĐỘNG'
                : 'HÀNH TRÌNH CỦA NHỮNG NHÀ ĐẦU TƯ'}
            </span>
          </div>
        </div>
        {board.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            game={game}
            onSelect={onSelect}
            selected={tile.id === selectedTileId}
            arrivalTotal={rollResult?.destinationId === tile.id ? rollResult.total : undefined}
            onTarget={onTarget}
            cardTargetIds={cardTargetIds}
            cardTargetId={cardTargetId}
            liquidating={liquidating}
            selectionDisabled={selectionDisabled}
          />
        ))}
      </div>
    </div>
  );
}
