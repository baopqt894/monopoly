import { LevelPicker } from './LevelPicker';
import { useState } from 'react';
import { Hammer, LockKeyhole, Undo2, UnlockKeyhole } from 'lucide-react';
import type { Business, GameAction, GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import {
  buildProblem,
  managingPlayer,
  usesFullLiquidation,
  usesLandingRules,
  personalBuildCap,
  upgradeQuote,
} from '@typhu/game-engine';
import { formatMoney } from '../../shared/format';

export function PropertyActions({
  game,
  tileId,
  dispatch,
  compact = false,
}: {
  game: GameState;
  tileId: number;
  dispatch: (action: GameAction) => void;
  compact?: boolean;
}) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [business, setBusiness] = useState<Business>('residence');
  const property = game.properties[tileId];
  const tile = boardFor(game)[tileId];
  if (!property || property.ownerId !== managingPlayer(game).id || game.phase === 'finished')
    return null;
  const landing = usesLandingRules(game);
  const maxLevel = property.level === 4 ? 5 : personalBuildCap(game, managingPlayer(game).id);
  const next = Math.min(5, property.level + 1);
  const level = Math.max(next, Math.min(selectedLevel ?? next, maxLevel));
  const options = [1, 2, 3, 4, ...(property.level === 4 ? [5] : [])].map((target) =>
    upgradeQuote(game, tileId, target),
  );
  const quote = upgradeQuote(game, tileId, level);
  const problem = landing ? quote.error : buildProblem(game, tileId);
  const canManage = !!game.debt || !['card', 'auction'].includes(game.phase);
  return (
    <div className={`property-actions ${compact ? 'compact' : ''}`}>
      {!compact &&
        game.mode === 'city' &&
        tile.kind === 'street' &&
        !property.level &&
        !game.debt && (
          <label className="field">
            Chọn loại hình kinh doanh
            <select
              value={business}
              onChange={(event) => setBusiness(event.target.value as Business)}
            >
              <option value="residence">Nhà trọ · thuê ×0,7, thu nhập ₫8/cấp/vòng</option>
              <option value="cafe">Café · +20% thuê cạnh nhà trọ</option>
              <option value="hotel">Lưu trú · thuê ×1,4, phí ₫6/cấp/vòng</option>
            </select>
          </label>
        )}
      {landing && tile.kind === 'street' && options.length > 0 && (
        <LevelPicker
          game={game}
          tileId={tileId}
          value={level}
          onChange={setSelectedLevel}
          options={options}
          currentLevel={property.level}
        />
      )}
      <div className="property-action-buttons">
        {tile.kind === 'street' && property.level < 5 && (
          <button
            className="primary-button"
            title={problem ?? 'Xây thêm một cấp công trình'}
            disabled={!!problem}
            onClick={() =>
              dispatch({ type: 'BUILD', tileId, business, ...(landing ? { level } : {}) })
            }
          >
            <Hammer size={13} />
            {landing
              ? `Nâng cấp ${level} · ${formatMoney(quote.cost)}`
              : compact
                ? 'Xây'
                : `Xây / nâng cấp ${formatMoney(tile.buildCost!)}`}
          </button>
        )}
        {!usesFullLiquidation(game) && property.level > 0 && (
          <button
            className="secondary-button"
            disabled={!canManage}
            onClick={() => dispatch({ type: 'SELL_BUILDING', tileId })}
          >
            <Undo2 size={13} />
            {compact ? 'Bán nhà' : `Bán 1 cấp +${formatMoney(tile.buildCost! / 2)}`}
          </button>
        )}
        {!usesFullLiquidation(game) && (
          <button
            className="secondary-button"
            disabled={!canManage || (property.mortgaged && !!game.debt)}
            onClick={() =>
              dispatch({ type: property.mortgaged ? 'UNMORTGAGE' : 'MORTGAGE', tileId })
            }
          >
            {property.mortgaged ? <UnlockKeyhole size={13} /> : <LockKeyhole size={13} />}{' '}
            {property.mortgaged
              ? `Giải chấp ${formatMoney(Math.ceil(tile.price! * 0.55))}`
              : `Thế chấp +${formatMoney(tile.price! / 2)}`}
          </button>
        )}
      </div>
      {!compact && property.level < 5 && problem && tile.kind === 'street' && (
        <p className="modal-note">{problem}</p>
      )}
    </div>
  );
}
