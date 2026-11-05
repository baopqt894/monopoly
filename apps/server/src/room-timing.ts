import { automaticAction, reduceGame, timeoutAction, usesFullLiquidation } from '@typhu/game-engine';
import { CARD_AUTO_RESOLVE_MS, CARD_DRAW_MS, turnPresentationMs } from '@typhu/game-content';
import { roomActorId } from './room-bots';
import type { Room } from './rooms';

export const ACTION_TIME_MS = 15_000;
export const LIQUIDATION_TIME_MS = 30_000;

/** Restored alongside the game, so polling, reconnects and instance changes never reset it. */
export function syncRoomTimer(room: Room, now: number, allowTimeout = true) {
  const game = room.game;
  if (!game || room.phase !== 'playing' || game.phase === 'finished' || room.pendingTrade) {
    delete room.actionTimer;
    return;
  }
  const actorId = roomActorId(game);
  const bot = !!room.seats.find((seat) => seat.gamePlayerId === actorId)?.bot;
  const liquidating = !!game.debt && usesFullLiquidation(game);
  const duration = liquidating ? LIQUIDATION_TIME_MS : ACTION_TIME_MS;
  const key = liquidating
    ? `${actorId}:${bot}:liquidation:${game.debt!.id ?? 'legacy'}`
    : `${actorId}:${bot}:${game.phase}:${game.nextLogId}:${game.debt?.amount ?? ''}`;
  if (room.actionTimer?.key !== key) {
    const startsAt =
      now +
      turnPresentationMs(game, room.actionTimer ?? (game.lastBoardEvent?.kind === 'monopoly' ? {boardEventId:room.lastMonopolyNoticeId} : {})) +
      (game.phase === 'card' && !game.drawnCard?.revealed ? CARD_DRAW_MS : 0);
    if(game.lastBoardEvent?.kind==='monopoly') room.lastMonopolyNoticeId=game.lastBoardEvent.id;
    room.actionTimer = {
      key,
      startsAt,
      expiresAt: startsAt + duration,
      movementId: game.movement?.id,
      rollId: game.lastRoll?.id,
      revealId: game.lastRevealedCard?.id,
      boardEventId: game.lastBoardEvent?.id,
    };
    return;
  }
  if (
    allowTimeout &&
    game.phase === 'card' &&
    game.drawnCard &&
    !game.drawnCard.revealed &&
    now >= room.actionTimer.startsAt
  ) {
    room.game = reduceGame(game, { type: 'DRAW_CARD' });
    syncRoomTimer(room, now, false);
    return;
  }
  const automatic = automaticAction(game);
  const automaticAt = room.actionTimer.startsAt + (game.phase === 'card' ? CARD_AUTO_RESOLVE_MS : 0);
  if (allowTimeout && automatic && now >= automaticAt) {
    const result = reduceGame(game, automatic);
    if (!result.error) {
      room.game = result;
      if (result.phase === 'finished') room.phase = 'finished';
      syncRoomTimer(room, now, false);
      return;
    }
  }
  if (bot || !allowTimeout || room.actionTimer.expiresAt > now) return;
  const action = timeoutAction(game);
  if (!action) {
    room.actionTimer.expiresAt = now + duration;
    return;
  }
  const result = reduceGame(game, action);
  if (result.error) {
    room.actionTimer.expiresAt = now + duration;
    return;
  }
  room.game = result;
  if (result.phase === 'finished') room.phase = 'finished';
  syncRoomTimer(room, now, false);
}
