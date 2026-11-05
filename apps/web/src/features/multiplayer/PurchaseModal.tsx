import { useState } from 'react';
import { ArrowRight, ShoppingBag, TreePalm } from 'lucide-react';
import type { GameAction, GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import {
  personalBuildCap,
  propertyRentPreview,
  purchaseQuote,
  purchaseLevelQuotes,
  usesLandingRules,
} from '@typhu/game-engine';
import { LevelPicker } from '../properties/LevelPicker';
import {
  PropertyDialog,
  PropertyHero,
  PropertyPayment,
  PropertyEconomy,
  PropertyWallet,
  ResortProgress,
} from '../properties/PropertyDialog';

export function PurchaseModal({
  game,
  dispatch,
  onClose,
  pending,
}: {
  game: GameState;
  dispatch: (action: GameAction) => void;
  onClose: () => void;
  pending: boolean;
}) {
  const player = game.players[game.currentPlayer],
    tile = boardFor(game)[player.position];
  const [chosenLevel, setChosenLevel] = useState(1);
  const withLevels = usesLandingRules(game) && tile.kind === 'street';
  const level = Math.min(chosenLevel, personalBuildCap(game, player.id));
  const quote = purchaseQuote(game, tile.id, withLevels ? level : undefined);
  const resort = tile.kind === 'railroad';
  return (
    <PropertyDialog
      title={tile.resort ? 'Mua resort' : 'Mua đất'}
      icon={tile.resort ? <TreePalm size={18} /> : <ShoppingBag size={18} />}
      transaction
      onClose={onClose}
    >
      <PropertyHero game={game} tileId={tile.id} level={withLevels ? level : 0} />
      {withLevels && (
        <LevelPicker
          game={game}
          tileId={tile.id}
          value={level}
          onChange={setChosenLevel}
          options={purchaseLevelQuotes(game, tile.id)}
          disabled={pending}
        />
      )}
      {resort ? (
        <>
          <ResortProgress game={game} tileId={tile.id} playerId={player.id} previewPurchase />
          <PropertyWallet cash={player.cash} />
        </>
      ) : (
        <PropertyEconomy
          cash={player.cash}
          rent={propertyRentPreview(game, tile.id, player.id, withLevels ? level : 0)}
        />
      )}
      {quote.error && (
        <p className="property-dialog-error" role="status">
          {quote.error}
        </p>
      )}
      <PropertyPayment amount={quote.cost} label="Tổng thanh toán" />
      <div className="property-dialog-actions">
        <button
          className="property-skip"
          disabled={pending}
          onClick={() => dispatch({ type: 'SKIP_PURCHASE' })}
        >
          Bỏ qua
        </button>
        <button
          className="property-confirm"
          disabled={pending || !!quote.error}
          onClick={() => dispatch({ type: 'BUY', ...(withLevels ? { level } : {}) })}
        >
          <ShoppingBag size={14} />
          {withLevels ? `Mua cấp ${level}` : tile.resort ? 'Mua resort' : 'Mua ngay'}
          <ArrowRight size={14} />
        </button>
      </div>
    </PropertyDialog>
  );
}
