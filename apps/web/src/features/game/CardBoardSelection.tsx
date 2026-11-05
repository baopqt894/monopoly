import { Check } from 'lucide-react';
import type { GameAction, GameState } from '@typhu/contracts';
import { boardFor, getCard } from '@typhu/game-content';
import { cardBoardAction, cardBoardChoices } from './card-board-selection';
import { BoardSelectionPrompt } from './BoardSelectionPrompt';
import './card-board-selection.css';

export function CardBoardSelection({
  game,
  tileId,
  disabled,
  dispatch,
  recipientId,
  onRecipientChange,
}: {
  game: GameState;
  tileId: number | null;
  disabled: boolean;
  dispatch: (action: GameAction) => void;
  recipientId: string;
  onRecipientChange: (id: string) => void;
}) {
  const choices = cardBoardChoices(game)!;
  const drawn = game.drawnCard!;
  const card = getCard(drawn.deck, drawn.cardId, game.boardId, game.boardLayout);
  return (
    <BoardSelectionPrompt
      title={card.title}
      label="Chọn mục tiêu thẻ trên bàn cờ"
      prompt={choices.kind === 'gift' ? 'Chọn tài sản và người nhận' : 'Chọn thành phố của đối thủ'}
      className="card-board-hud"
    >
      {tileId !== null && <p className="board-selection-detail" aria-live="polite">{boardFor(game)[tileId].name}</p>}
      {choices.kind === 'gift' && (
        <div className="card-board-recipients" role="group" aria-label="Người nhận tài sản">
          {choices.recipientIds.map((id) => {
            const player = game.players.find((player) => player.id === id)!;
            return (
              <button
                key={id}
                aria-pressed={recipientId === id}
                disabled={disabled}
                className={recipientId === id ? 'is-selected' : ''}
                onClick={() => {
                  onRecipientChange(id);
                  const action = cardBoardAction(game, tileId, id);
                  if (action) dispatch(action);
                }}
              >
                <i style={{ background: player.color }} />
                {player.name}
                {recipientId === id && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </BoardSelectionPrompt>
  );
}
