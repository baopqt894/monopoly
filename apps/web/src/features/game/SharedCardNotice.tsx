import type { GameState } from '@typhu/contracts';
import { getCard } from '@typhu/game-content';
import { activeCardReveal } from './card-presentation';
import { CardArtwork } from './CardArtwork';
import './chance-card.css';

export function SharedCardNotice({
  game,
  paused,
  viewerId,
}: {
  game: GameState;
  paused: boolean;
  viewerId: string;
}) {
  const event = activeCardReveal(game);
  if (!event || paused || event.playerId === viewerId) return null;
  return (
    <aside
      key={event.id}
      className="chance-card-observer"
      role="status"
      aria-label="Thẻ người chơi vừa rút"
    >
      <CardArtwork card={getCard(event.deck, event.cardId, game.boardId, game.boardLayout)} deck={event.deck} />
    </aside>
  );
}
