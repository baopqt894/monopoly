import type { GameAction, GameState } from '@typhu/contracts';
import { liquidationPotential, liquidationQuote } from '@typhu/game-engine';
import { boardFor } from '@typhu/game-content';
import { Check, House, X } from 'lucide-react';
import { formatMoney } from '../../shared/format';
import './liquidation.css';
import './liquidation-panel.css';

/** Only renders authoritative debt/selection values; sales remain server actions. */
export function LiquidationSelection({
  game,
  dispatch,
  disabled,
}: {
  game: GameState;
  dispatch: (action: GameAction) => void;
  disabled: boolean;
}) {
  const debt = game.debt!;
  const quote = liquidationQuote(game);
  const board = boardFor(game);
  return (
    <section className="liquidation-hud cartoon-liquidation" aria-label="Thanh lý trên bàn cờ">
      <header className="liquidation-panel-header">
        <span>
          <House size={18} />
        </span>
        <h2>Thanh lý trả nợ</h2>
      </header>
      <div className="liquidation-panel-body">
        <div className="liquidation-totals" aria-live="polite">
          <span>
            Cần thanh toán<strong>{formatMoney(debt.amount)}</strong>
          </span>
          <span>
            Tiền bán đã chọn<strong>{formatMoney(quote.selectedValue)}</strong>
          </span>
        </div>
        {quote.selectedIds.length > 0 && (
          <div className="liquidation-selected-assets" aria-label="Tài sản sẽ bán">
            {quote.selectedIds.map((id) => (
              <button
                key={id}
                disabled={disabled}
                aria-label={`Bỏ chọn ${board[id].name}`}
                onClick={() =>
                  dispatch({
                    type: 'SET_LIQUIDATION_SELECTION',
                    tileIds: quote.selectedIds.filter((selected) => selected !== id),
                  })
                }
              >
                <Check size={11} />
                {board[id].name}
                <X size={11} />
              </button>
            ))}
          </div>
        )}
        <div
          className={`liquidation-balance ${quote.remainingDebt ? 'is-short' : 'is-covered'}`}
          aria-live="polite"
        >
          <span>{quote.remainingDebt ? 'Còn thiếu sau bán' : 'Tiền dư sau trả nợ'}</span>
          <strong>{formatMoney(quote.remainingDebt || quote.surplus)}</strong>
        </div>
        <button
          className="liquidation-sell"
          disabled={disabled || !quote.selectedIds.length}
          onClick={() => dispatch({ type: 'LIQUIDATE_SELECTED' })}
        >
          Bán {quote.selectedIds.length} tài sản & trả nợ
        </button>
        {liquidationPotential(game) < debt.amount && (
          <button
            className="liquidation-bankrupt"
            disabled={disabled}
            onClick={() => dispatch({ type: 'DECLARE_BANKRUPTCY' })}
          >
            Bán toàn bộ · Phá sản
          </button>
        )}
        {game.error && <span role="alert">{game.error}</span>}
      </div>
    </section>
  );
}
