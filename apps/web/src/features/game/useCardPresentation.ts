import type { GameState } from '@typhu/contracts';
import { useEffect, useState } from 'react';
import { CARD_AUTO_RESOLVE_MS } from '@typhu/game-content';
import { cardPresentationKey } from './card-presentation';

export function useCardPresentation(game: GameState) {
  const key = cardPresentationKey(game);
  const revealed = game.phase === 'card' && !!game.drawnCard?.revealed;
  const [readyKey, setReadyKey] = useState('');
  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setReadyKey(key), CARD_AUTO_RESOLVE_MS);
    return () => clearTimeout(timer);
  }, [key, revealed]);
  return { key, ready: revealed && readyKey === key };
}
