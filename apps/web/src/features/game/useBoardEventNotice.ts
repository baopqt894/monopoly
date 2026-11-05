import { useEffect, useRef, useState } from 'react';
import type { GameState } from '@typhu/contracts';
import { BOARD_EVENT_NOTICE_MS } from '@typhu/game-content';

export type BoardEventNotice = NonNullable<GameState['lastBoardEvent']>;

/** Observe public event IDs for every viewer; old snapshots are not new notifications. */
export function useBoardEventNotice(game: GameState, paused: boolean) {
  const seen = useRef(game.lastBoardEvent?.id);
  const [pending, setPending] = useState<BoardEventNotice | null>(null);
  const [visible, setVisible] = useState<BoardEventNotice | null>(null);
  const event = game.lastBoardEvent;
  useEffect(() => {
    if (!event || event.id === seen.current) return;
    seen.current = event.id;
    setPending(event);
  }, [event?.id]);
  useEffect(() => {
    if (!pending || paused) return;
    setVisible(pending);
    setPending(null);
  }, [pending, paused]);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(null), BOARD_EVENT_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [visible?.id]);
  const blocking =
    event?.kind === 'monopoly' &&
    (event.id !== seen.current || pending?.id === event.id || visible?.id === event.id);
  return { notice: paused ? null : visible, blocking };
}
