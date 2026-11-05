import { ArrowRight, Check, Coins, Hammer, Landmark, ShieldCheck, Sparkles } from 'lucide-react';
import type { GameAction, GameState } from '@typhu/contracts';
import { propertyRentPreview, rentFor, upgradeQuote } from '@typhu/game-engine';
import { formatMoney } from '../../shared/format';
import { PropertyDialog, PropertyHero, PropertyPayment, PropertyWallet } from './PropertyDialog';
import { LandmarkCompleteModal } from './LandmarkCompleteModal';

export function LandmarkUpgradeModal({
  game,
  tileId,
  dispatch,
  onClose,
  onSkip,
  disabled = false,
}: {
  game: GameState;
  tileId: number;
  dispatch: (action: GameAction) => void;
  onClose: () => void;
  onSkip?: () => void;
  disabled?: boolean;
}) {
  const complete = game.properties[tileId]?.level === 5,
    player = game.players[game.currentPlayer];
  const quote = upgradeQuote(game, tileId, 5);
  if (complete) return <LandmarkCompleteModal game={game} tileId={tileId} onClose={onClose} />;
  return (
    <PropertyDialog
      title={complete ? 'Công trình hoàn thành' : 'Nâng cấp đặc trưng'}
      icon={complete ? <Check size={18} /> : <Landmark size={18} />}
      onClose={onClose}
      transaction={!!onSkip}
    >
      <PropertyHero game={game} tileId={tileId} level={5} landmark>
        <span className="property-level-summary">
          {!complete && (
            <>
              Cấp 4<ArrowRight size={12} />
            </>
          )}
          <strong>
            <Sparkles size={10} />
            Đặc trưng
          </strong>
        </span>
      </PropertyHero>
      <div className="property-landmark-benefits">
        <div className="property-landmark-rent">
          <span>
            <Coins size={14} />
            Tiền thuê
          </span>
          <strong>
            {!complete && (
              <>
                <del>{formatMoney(rentFor(game, tileId))}</del>
                <ArrowRight size={14} />
              </>
            )}
            {formatMoney(propertyRentPreview(game, tileId, game.properties[tileId].ownerId, 5))}
          </strong>
        </div>
        <div className="property-landmark-protection">
          <ShieldCheck size={14} />
          Không thể bị mua lại
        </div>
      </div>
      {!complete && (
        <>
          <PropertyWallet cash={player.cash} />
          {(game.error || quote.error) && (
            <p className="property-dialog-error" role="status">
              {game.error || quote.error}
            </p>
          )}
          <PropertyPayment amount={quote.cost} label="Phí nâng cấp" />
        </>
      )}
      <div className="property-dialog-actions">
        {onSkip && !complete && (
          <button className="property-skip" disabled={disabled} onClick={onSkip}>
            Bỏ qua
          </button>
        )}
        <button
          className="property-confirm"
          disabled={disabled || (!complete && !!quote.error)}
          onClick={() => (complete ? onClose() : dispatch({ type: 'BUILD', tileId, level: 5 }))}
        >
          {complete ? <Check size={14} /> : <Hammer size={14} />}{' '}
          {complete ? 'Hoàn tất' : 'Nâng cấp đặc trưng'}
          <ArrowRight size={14} />
        </button>
      </div>
    </PropertyDialog>
  );
}
