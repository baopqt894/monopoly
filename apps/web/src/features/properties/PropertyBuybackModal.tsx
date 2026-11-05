import { ArrowRight, ArrowRightLeft, ShoppingBag } from 'lucide-react';
import type { GameAction, GameState } from '@typhu/contracts';
import { buyBackQuote, propertyValue } from '@typhu/game-engine';
import { formatMoney } from '../../shared/format';
import {
  PropertyDialog,
  PropertyHero,
  PropertyOwner,
  PropertyPayment,
  PropertyWallet,
} from './PropertyDialog';

export function PropertyBuybackModal({
  game,
  tileId,
  dispatch,
  onClose,
  onSkip,
  disabled,
}: {
  game: GameState;
  tileId: number;
  dispatch: (action: GameAction) => void;
  onClose: () => void;
  onSkip?: () => void;
  disabled: boolean;
}) {
  const property = game.properties[tileId],
    player = game.players[game.currentPlayer];
  const owner = game.players.find((entry) => entry.id === property.ownerId)!;
  const quote = buyBackQuote(game, tileId);
  return (
    <PropertyDialog
      title="Mua lại đất"
      icon={<ArrowRightLeft size={18} />}
      onClose={onClose}
      transaction
      variant="is-buyback"
    >
      <PropertyHero game={game} tileId={tileId} level={property.level} />
      <PropertyOwner name={owner.name} transfer />
      <div className="property-value-row">
        <span>Giá trị đất & công trình</span>
        <strong>
          {formatMoney(propertyValue(game, tileId))} <small>×1,5</small>
        </strong>
      </div>
      <PropertyWallet cash={player.cash} />
      {(game.error || quote.error) && (
        <p className="property-dialog-error" role="status">
          {game.error || quote.error}
        </p>
      )}
      <PropertyPayment amount={quote.totalCost} label="Tổng giá mua lại" />
      <div className="property-dialog-actions">
        <button className="property-skip" disabled={disabled} onClick={onSkip ?? onClose}>
          Bỏ qua
        </button>
        <button
          className="property-confirm"
          disabled={disabled || !!quote.error}
          onClick={() => dispatch({ type: 'BUY_BACK', tileId })}
        >
          <ShoppingBag size={14} />
          Mua lại
          <ArrowRight size={14} />
        </button>
      </div>
    </PropertyDialog>
  );
}
