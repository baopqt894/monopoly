import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '@typhu/game-engine';
import { publicRoomSnapshot, type Room } from '../src/rooms';

test('public snapshots hide unopened cards and retain the same reveal for all viewers after resolution', () => {
  const game = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  game.phase = 'card';
  game.drawnCard = { deck: 'chance', cardId: 'chance-01', revealed: false };
  const room: Room = {
    code: 'ABC123',
    hostSeatId: 'host',
    mode: 'classic',
    maxPlayers: 2,
    maxRounds: 12,
    phase: 'playing',
    seats: [],
    game,
    pendingTrade: null,
    updatedAt: 0,
  };
  assert.equal(publicRoomSnapshot(room).game!.drawnCard!.cardId, 'hidden');
  assert.equal(publicRoomSnapshot(room).game!.lastRevealedCard, undefined);
  room.game = reduceGame(game, { type: 'DRAW_CARD' });
  const actor = publicRoomSnapshot(room),
    observer = publicRoomSnapshot(room);
  assert.equal(observer.game!.lastRevealedCard!.cardId, 'chance-01');
  assert.deepEqual(actor.game!.lastRevealedCard, observer.game!.lastRevealedCard);
  assert.ok(observer.game!.decks.chance.every((id) => id === 'hidden'));
  room.game = reduceGame(room.game, { type: 'RESOLVE_CARD' });
  assert.deepEqual(
    publicRoomSnapshot(room).game!.lastRevealedCard,
    observer.game!.lastRevealedCard,
  );
});
