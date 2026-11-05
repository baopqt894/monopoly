import type { GameState } from '@typhu/contracts';
import { boardFor, getCard } from '@typhu/game-content';
import { specialCardDestination } from '@typhu/game-engine';
import { CardArtwork } from './CardArtwork';
import './chance-card.css';

export function CardModal({
  game,
}: {
  game: GameState;
}) {
  if (!game.drawnCard) return null;
  const { deck, cardId, revealed } = game.drawnCard;
  const card = revealed ? getCard(deck, cardId, game.boardId, game.boardLayout) : null;
  const destination =
    card?.effect.type === 'move-special' && card.effect.destination === 'festival-city'
      ? specialCardDestination(game, card.effect)
      : undefined;
  return (
    <section
      className={`chance-card-stage ${revealed ? 'is-revealed' : 'is-drawing'}`}
      aria-label="Thẻ vừa rút"
    >
      <div className="chance-card-float">
        <CardArtwork
          card={card}
          deck={deck}
          detail={destination === undefined ? undefined : boardFor(game)[destination].name}
        />
      </div>
    </section>
  );
}
