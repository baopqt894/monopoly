import type { GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { buyBackQuote, rentFor } from '@typhu/game-engine';
import { Coins, House, MapPinned } from 'lucide-react';
import { formatMoney } from '../../shared/format';
import {
  PropertyDialog,
  PropertyHero,
  PropertyOwner,
  PropertyRentGrid,
  ResortProgress,
} from './PropertyDialog';

export function PropertyInfoModal({
  game,
  tileId,
  onClose,
}: {
  game: GameState;
  tileId: number;
  onClose: () => void;
}) {
  const tile = boardFor(game)[tileId],
    property = game.properties[tileId];
  const owner = game.players.find((player) => player.id === property?.ownerId);
  const buyback = buyBackQuote(game, tileId);
  const canBeBoughtBack = !!owner && tile.kind === 'street' && property.level < 5;
  return (
    <PropertyDialog title="Thông tin đất" icon={<MapPinned size={18} />} onClose={onClose}>
      <PropertyHero
        game={game}
        tileId={tileId}
        level={property?.level ?? 0}
        landmark={property?.level === 5}
      />
      <PropertyOwner name={owner?.name ?? 'Ngân hàng'} />
      <div className="property-info-metrics">
        <div className={!canBeBoughtBack ? 'is-unavailable' : ''}>
          <span>
            <House size={14} />
            Giá mua lại
          </span>
          <strong>
            {canBeBoughtBack ? formatMoney(buyback.totalCost) : owner ? 'Không thể mua lại' : '—'}
          </strong>
        </div>
        <div>
          <span>
            <Coins size={14} />
            Tiền thuê hiện tại
          </span>
          <strong>{property ? formatMoney(rentFor(game, tileId)) : '—'}</strong>
        </div>
      </div>
      {property?.mortgaged && (
        <p className="property-dialog-error">Đang thế chấp · không thu tiền thuê</p>
      )}
      {!!property?.disabledLaps && (
        <p className="property-dialog-error">Tạm ngưng thu thuê · {property.disabledLaps} vòng</p>
      )}
      {tile.kind === 'street' ? (
        <PropertyRentGrid
          game={game}
          tileId={tileId}
          ownerId={owner?.id ?? game.players[game.currentPlayer].id}
        />
      ) : tile.kind === 'railroad' ? (
        <ResortProgress
          game={game}
          tileId={tileId}
          playerId={owner?.id ?? game.players[game.currentPlayer].id}
        />
      ) : null}
    </PropertyDialog>
  );
}
