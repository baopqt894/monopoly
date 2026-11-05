import type { GameAction, GameState } from '@typhu/contracts';
import { nextFestivalMultiplier } from '@typhu/game-engine';
import './board-selection-prompt.css';
import './festival-selection.css';

export function FestivalSelection({
  game,
  playerId,
  disabled,
  dispatch,
}: {
  game: GameState;
  playerId: string;
  disabled: boolean;
  dispatch: (action: GameAction) => void;
}) {
  const canAct = !disabled && game.players[game.currentPlayer].id === playerId;
  return (
    <section
      className="board-selection-prompt festival-selection"
      aria-label="Chọn nơi tổ chức Lễ hội trên bàn cờ"
    >
      <div className="festival-selection-card">
        <header className="festival-selection-header">
          <span className="festival-selection-icon" aria-hidden="true">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              stroke="#254f63"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 39V8M43 39V8M3 39H8M40 39H45M5 10Q24 23 43 10" />
              <path d="M7 12L10 24L17 17Z" fill="#ed9475" />
              <path d="M17 17L24 29L30 17Z" fill="#ffda77" />
              <path d="M31 17L38 24L41 12Z" fill="#70b6c2" />
              <path d="M16 36H32M24 30V41" stroke="#d1a047" />
            </svg>
          </span>
          <h2>Tổ chức lễ hội</h2>
        </header>
        <div className="festival-selection-body">
          <p>Chọn thành phố của bạn</p>
          <div className="festival-selection-bonus">
            <span>Tiền thuê lễ hội</span>
            <strong>×{nextFestivalMultiplier(game).toLocaleString('vi-VN')}</strong>
          </div>
          <button
            className="festival-selection-skip"
            disabled={!canAct}
            onClick={() => dispatch({ type: 'SKIP_FESTIVAL' })}
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </section>
  );
}
