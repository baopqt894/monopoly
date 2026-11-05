import { useEffect, useState } from 'react';
import type { GameState } from '@typhu/contracts';
import { DICE_PRESENTATION_MS, DICE_SPIN_MS } from '@typhu/game-content';

/** Observe roll IDs, not dice values or arbitrary log updates. Same doubles can repeat. */
export function useRollPresentation(game: GameState, requestFailed: boolean) {
  const [view, setView] = useState<{
    id: number | undefined;
    phase: 'idle' | 'spinning' | 'result';
  }>({ id: game.lastRoll?.id, phase: 'idle' });
  const [awaiting, setAwaiting] = useState(false);
  const id = game.lastRoll?.id;
  const unseen = id !== undefined && id !== view.id;
  useEffect(() => {
    if (id === undefined || id === view.id) return;
    setAwaiting(false);
    // Keep this ID unacknowledged until the entire result hold has finished.
    setView((current) => ({ ...current, phase: 'spinning' }));
    const reveal = setTimeout(
      () => setView((current) => ({ ...current, phase: 'result' })),
      DICE_SPIN_MS,
    );
    const finish = setTimeout(() => setView({ id, phase: 'idle' }), DICE_PRESENTATION_MS);
    return () => {
      clearTimeout(reveal);
      clearTimeout(finish);
    };
  }, [id, view.id]);
  useEffect(() => {
    if (requestFailed) setAwaiting(false);
  }, [requestFailed]);
  useEffect(() => {
    if (!awaiting) return;
    const watchdog = setTimeout(() => setAwaiting(false), 10_000);
    return () => clearTimeout(watchdog);
  }, [awaiting]);
  const spinning = awaiting || (unseen && view.phase !== 'result');
  return {
    spinning,
    result: unseen && view.phase === 'result',
    busy: awaiting || unseen,
    request: () => setAwaiting(true),
  };
}
