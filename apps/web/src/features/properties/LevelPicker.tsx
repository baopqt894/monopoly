import type { GameState } from '@typhu/contracts';
import { Check, Landmark, LockKeyhole } from 'lucide-react';
import { buildingName } from '@typhu/game-content';
import { formatMoney } from '../../shared/format';
import './property-levels.css';
import { PropertyBuildingArt } from './PropertyBuildingArt';
import { propertyLevelLabel } from './PropertyDialog';

export function LevelPicker({
  game,
  tileId,
  value,
  onChange,
  options,
  currentLevel,
  disabled = false,
}: {
  game: GameState;
  tileId: number;
  value: number;
  onChange: (level: number) => void;
  options: { level: number; cost: number; error?: string | null }[];
  currentLevel?: number;
  disabled?: boolean;
}) {
  const landmark = options.find((option) => option.level === 5);
  return (
    <fieldset className="property-level-picker">
      <legend>Chọn cấp công trình</legend>
      <div className="property-standard-levels">
        {[1, 2, 3, 4].map((level, index) => {
          const option = options.find((entry) => entry.level === level);
          const owned = currentLevel !== undefined && level <= currentLevel;
          const current = currentLevel === level;
          const unavailable = disabled || !option || !!option.error || owned;
          const reason = current
            ? 'Đang sở hữu cấp này.'
            : owned
              ? 'Đã vượt cấp này.'
              : option?.error;
          return (
            <button
              key={level}
              type="button"
              disabled={unavailable}
              aria-pressed={!unavailable && value === level}
              aria-current={current ? 'step' : undefined}
              aria-label={`Cấp ${level}${option ? `, ${formatMoney(option.cost)}` : ''}${reason ? `, ${reason}` : ''}`}
              title={reason ?? propertyLevelLabel(level)}
              className={`${unavailable ? 'is-unavailable' : ''} ${!unavailable && value === level ? 'is-selected' : ''} ${current ? 'is-current' : ''}`}
              onClick={() => onChange(level)}
            >
              <span className="level-state-icon">
                {current ? (
                  <Check size={12} />
                ) : unavailable ? (
                  <LockKeyhole size={11} />
                ) : value === level ? (
                  <Check size={12} />
                ) : null}
              </span>
              <PropertyBuildingArt level={level} />
              <strong>Cấp {level}</strong>
              <span className="level-price">
                {current
                  ? 'Đang có'
                  : owned
                    ? 'Đã vượt cấp'
                    : option
                      ? formatMoney(option.cost)
                      : '—'}
              </span>
            </button>
          );
        })}
      </div>
      {landmark && (
        <button
          type="button"
          className={`landmark-level ${landmark.error || disabled ? 'is-unavailable' : ''} ${!landmark.error && !disabled && value === 5 ? 'is-selected' : ''}`}
          disabled={disabled || !!landmark.error}
          aria-pressed={!landmark.error && !disabled && value === 5}
          title={landmark.error ?? buildingName(tileId, 5, game.boardId, game.boardLayout)}
          onClick={() => onChange(5)}
        >
          <Landmark size={28} strokeWidth={1.6} aria-hidden="true" />
          <span>
            <strong>Công trình đặc trưng</strong>
            <span>{buildingName(tileId, 5, game.boardId, game.boardLayout)}</span>
          </span>
          <b>{formatMoney(landmark.cost)}</b>
          {landmark.error && <LockKeyhole size={14} aria-hidden="true" />}
        </button>
      )}
    </fieldset>
  );
}
