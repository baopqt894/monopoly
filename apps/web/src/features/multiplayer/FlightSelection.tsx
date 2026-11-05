import { useEffect } from 'react';
import { boardFor } from '@typhu/game-content';
import { FLIGHT_FEE } from '@typhu/game-engine';
import { AirportIcon } from '../properties/AirportIcon';
import { formatMoney } from '../../shared/format';
import './flight.css';
import '../game/board-selection-prompt.css';
import './flight-selection.css';

/** A board targeting mode: input stays on the board, never inside a dialog. */
export function FlightSelection({
  ids,
  targetId,
  onTarget,
  onFly,
  onCancel,
  boardId,
  boardLayout,
  mandatory = false,
}: {
  ids: number[];
  boardId?: 'vietnam-32';
  boardLayout?: 'districts-v1';
  targetId: number;
  onTarget: (id: number) => void;
  onFly: (id: number) => void;
  onCancel: () => void;
  mandatory?: boolean;
}) {
  const board = boardFor({ boardId, boardLayout });
  useEffect(() => {
    function keyDown(event: KeyboardEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest('input, textarea, [contenteditable="true"], .room-chat')
      )
        return;
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Escape' && !mandatory) {
        event.preventDefault();
        onCancel();
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        const direction = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : -1;
        onTarget(ids[(ids.indexOf(targetId) + direction + ids.length) % ids.length]);
      } else if (
        event.key === 'Enter' &&
        !(event.target instanceof Element && event.target.closest('[data-flight-cancel]'))
      ) {
        event.preventDefault();
        onFly(targetId);
      }
    }
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [ids, targetId, onTarget, onFly, onCancel, board.length, mandatory]);
  return (
    <section
      className="board-selection-prompt flight-target-hud"
      aria-label="Chọn điểm bay trên bàn cờ"
    >
      <div className="flight-selection-card">
        <div className="flight-selection-header">
          <span className="flight-selection-icon">
            <AirportIcon kind="plane" />
          </span>
          <h2>Chọn điểm bay</h2>
        </div>
        <div className="flight-selection-body">
          <p>Chọn thành phố để di chuyển</p>
          <div className="flight-selection-fare">
            <span>Phí chuyến bay</span>
            <strong>
              <span className="flight-selection-coin" aria-hidden="true">
                ₫
              </span>
              {formatMoney(FLIGHT_FEE)}
            </strong>
          </div>
        </div>
        {!mandatory && (
          <div className="flight-selection-actions">
            <button data-flight-cancel onClick={onCancel}>
              Hủy
            </button>
          </div>
        )}
      </div>
      <span className="board-selection-announcement" aria-live="polite">
        {board[targetId].name}
      </span>
    </section>
  );
}
