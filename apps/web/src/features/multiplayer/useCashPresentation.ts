import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState } from '@typhu/contracts';
import { CashPresentationQueue } from './cash-presentation';

export function useCashPresentation(game: GameState) {
  const queue = useRef<CashPresentationQueue | null>(null);
  queue.current ??= new CashPresentationQueue(game);
  const [view, setView] = useState(() => queue.current!.view());
  const publish = useCallback(() => {
    queue.current!.tick(performance.now());
    const next = queue.current!.view();
    setView((prior) => (prior.revision === next.revision ? prior : next));
  }, []);
  useEffect(() => {
    queue.current!.accept(game);
    publish();
  }, [game, publish]);
  useEffect(() => {
    if (!view.busy) return;
    const timer = setInterval(publish, 40);
    return () => clearInterval(timer);
  }, [view.busy, publish]);
  const onStep = useCallback(
    (id: number, index: number) => {
      queue.current!.step(id, index);
      publish();
    },
    [publish],
  );
  const onArrive = useCallback(
    (id: number) => {
      queue.current!.arrive(id);
      publish();
    },
    [publish],
  );
  return { ...view, onStep, onArrive };
}
