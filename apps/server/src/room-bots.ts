import type { GameState } from '@typhu/contracts';
import { turnPresentationMs } from '@typhu/game-content';
import { chooseBotAction, reduceGame } from '@typhu/game-engine';
import type { Room } from './rooms';

export function roomActorId(game: GameState): string {
  return (
    game.debt?.debtorId ??
    (game.phase === 'auction' && game.auction
      ? game.players[game.auction.bidderIndex].id
      : game.players[game.currentPlayer].id)
  );
}

/** One persisted step per deadline; compare-and-set makes concurrent observers safe. */
export function advanceRoomBot(room: Room, now: number) {
  if (
    !room.game ||
    room.phase !== 'playing' ||
    room.pendingTrade ||
    !room.seats.some((seat) => seat.bot && seat.gamePlayerId === roomActorId(room.game!))
  ) {
    delete room.botActionAt;
    return;
  }
  if (room.botActionAt === undefined) {
    room.botActionAt = now + 600;
    return;
  }
  if (room.actionTimer && room.actionTimer.startsAt > now) {
    room.botActionAt = Math.max(room.botActionAt, room.actionTimer.startsAt);
    return;
  }
  if (room.botActionAt > now) return;
  const action = chooseBotAction(room.game);
  if (!action) {
    delete room.botActionAt;
    return;
  }
  const beforePresentation = {
    movementId: room.game.movement?.id,
    rollId: room.game.lastRoll?.id,
    revealId: room.game.lastRevealedCard?.id,
    boardEventId: room.game.lastBoardEvent?.id,
  };
  const result = reduceGame(room.game, action);
  if (result.error) {
    delete room.botActionAt;
    return;
  }
  room.game = result;
  if (result.phase === 'finished') room.phase = 'finished';
  const nextIsBot =
    room.phase === 'playing' &&
    room.seats.some((seat) => seat.bot && seat.gamePlayerId === roomActorId(result));
  if (nextIsBot) {
    const presentation = turnPresentationMs(result, beforePresentation);
    room.botActionAt = now + (presentation || (action.type === 'DRAW_CARD' ? 900 : 450));
  } else delete room.botActionAt;
}
