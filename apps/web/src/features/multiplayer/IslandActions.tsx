import type { GameAction, Player } from '@typhu/contracts';
import './island-actions.css';

function IslandActionIcon({ ticket = false }: { ticket?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="#254f63"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ticket ? (
        <>
          <path d="M5 9H35V15A5 5 0 0 0 35 25V31H5V25A5 5 0 0 0 5 15Z" fill="#fff5d4" />
          <path d="M29 10V14M29 18V22M29 26V30" stroke="#96b8af" strokeDasharray="2 2" />
          <path d="M17 13L19 17L24 18L20 21L21 26L17 24L13 26L14 21L10 18L15 17Z" fill="#edb857" />
        </>
      ) : (
        <>
          <circle cx="20" cy="20" r="16" fill="#fff8df" />
          <circle cx="20" cy="20" r="8" fill="#9ed5dc" />
          <path d="M9 9L14 14M26 26L31 31M9 31L14 26M26 14L31 9" stroke="#ed9475" strokeWidth="8" />
          <circle cx="20" cy="20" r="16" />
          <circle cx="20" cy="20" r="8" />
        </>
      )}
    </svg>
  );
}

export function IslandActions({
  player,
  disabled,
  dispatch,
}: {
  player: Player;
  disabled: boolean;
  dispatch: (action: GameAction) => void;
}) {
  return (
    <div className="island-actions" aria-label="Lựa chọn rời đảo hoang">
      <button
        className="island-pay"
        aria-label="Trả ₫200 để rời đảo"
        disabled={disabled || player.cash < 200}
        onClick={() => dispatch({ type: 'PAY_BAIL' })}
      >
        <span className="island-action-icon">
          <IslandActionIcon />
        </span>
        <span className="island-action-label">Trả phí rời đảo</span>
        <strong className="island-action-value">₫200</strong>
      </button>
      {player.jailCards.length > 0 && (
        <button disabled={disabled} onClick={() => dispatch({ type: 'USE_JAIL_CARD' })}>
          <span className="island-action-icon">
            <IslandActionIcon ticket />
          </span>
          <span className="island-action-label">Dùng thẻ thoát đảo</span>
          <strong className="island-action-count" aria-label={`${player.jailCards.length} thẻ`}>
            {player.jailCards.length}
          </strong>
        </button>
      )}
    </div>
  );
}
