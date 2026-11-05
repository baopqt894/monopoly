import { finishGameOnTime } from '@typhu/game-engine';
import type { Room } from './rooms';

/** Absolute timestamps survive reconnects, process restarts and CAS retries. */
export function syncMatchClock(room: Room, now: number) {
  if (!room.game || room.phase === 'lobby') return;
  if (
    room.phase === 'playing' &&
    room.matchDeadlineAt !== undefined &&
    now >= room.matchDeadlineAt
  ) {
    room.game = finishGameOnTime(room.game);
  }
  if (room.game.phase === 'finished') {
    room.phase = 'finished';
    room.matchEndedAt ??= room.matchDeadlineAt === undefined ? now : Math.min(now, room.matchDeadlineAt);
    room.pendingTrade = null;
    delete room.actionTimer;
    delete room.botActionAt;
  }
}
