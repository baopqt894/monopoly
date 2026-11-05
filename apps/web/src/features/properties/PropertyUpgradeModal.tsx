import { useState } from 'react';
import { ArrowRight, Hammer } from 'lucide-react';
import type { GameAction, GameState } from '@typhu/contracts';
import { personalBuildCap, propertyRentPreview, rentFor, upgradeQuote } from '@typhu/game-engine';
import { PropertyDialog, PropertyEconomy, PropertyHero, PropertyPayment } from './PropertyDialog';
import { LevelPicker } from './LevelPicker';

export function PropertyUpgradeModal({
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
  const next = Math.min(4, property.level + 1),
    cap = personalBuildCap(game, player.id);
  const [selected, setSelected] = useState(next);
  const level = Math.max(next, Math.min(selected, cap));
  const quote = upgradeQuote(game, tileId, level);
  return (
    <PropertyDialog title="Nâng cấp nhà" icon={<Hammer size={18} />} onClose={onClose} transaction>
      <PropertyHero game={game} tileId={tileId} level={level}>
        <span className="property-level-summary">
          Cấp {property.level}
          <ArrowRight size={12} />
          <strong>Cấp {level}</strong>
        </span>
      </PropertyHero>
      <LevelPicker
        game={game}
        tileId={tileId}
        value={level}
        onChange={setSelected}
        options={[1, 2, 3, 4].map((target) => upgradeQuote(game, tileId, target))}
        currentLevel={property.level}
        disabled={disabled}
      />
      <PropertyEconomy
        cash={player.cash}
        previousRent={rentFor(game, tileId)}
        rent={propertyRentPreview(game, tileId, player.id, level)}
      />
      {(game.error || quote.error) && (
        <p className="property-dialog-error" role="status">
          {game.error || quote.error}
        </p>
      )}
      <PropertyPayment amount={quote.cost} label="Phí nâng cấp" />
      <div className="property-dialog-actions">
        <button className="property-skip" disabled={disabled} onClick={onSkip ?? onClose}>
          Bỏ qua
        </button>
        <button
          className="property-confirm"
          disabled={disabled || !!quote.error}
          onClick={() => dispatch({ type: 'BUILD', tileId, level })}
        >
          <Hammer size={14} />
          Nâng lên cấp {level}
          <ArrowRight size={14} />
        </button>
      </div>
    </PropertyDialog>
  );
}
