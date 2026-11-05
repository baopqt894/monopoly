import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '@typhu/game-engine';
import { BOARD_EVENT_NOTICE_MS, PRESENTATION_BUFFER_MS } from '@typhu/game-content';
import { RoomService, type Room } from '../src/rooms';
import { syncRoomTimer } from '../src/room-timing';
import { advanceRoomBot } from '../src/room-bots';
function fixture(): Room {
  const game = createGame({
    names: ['An', 'Bình'],
    boardId: 'vietnam-32',
    boardLayout: 'districts-v1',
    propertyRules: 'landing-v1',
    propertyPricing: 'business-tour-v2',
    seed: 42,
  });
  game.players[0].position = 3;
  game.phase = 'purchase';
  game.propertyVisit = {
    playerId: 'player-1',
    tileId: 3,
    ownerIdOnArrival: null,
    levelOnArrival: 0,
  };
  for (const id of [1, 2])
    game.properties[id] = {
      ownerId: 'player-1',
      level: 1,
      mortgaged: false,
      business: 'residence',
    };
  return {
    code: 'QA0001',
    hostSeatId: 'host',
    mode: 'classic',
    maxPlayers: 2,
    maxRounds: 20,
    phase: 'playing',
    game,
    pendingTrade: null,
    updatedAt: 0,
    seats: [
      {
        id: 'host',
        name: 'An',
        connected: true,
        ready: true,
        gamePlayerId: 'player-1',
        token: 'host',
        peerId: null,
      },
      {
        id: 'guest',
        name: 'Bình',
        connected: true,
        ready: true,
        gamePlayerId: 'player-2',
        token: 'guest',
        peerId: null,
      },
    ],
  };
}
test('server holds actions for the Monopoly announcement and does not restart its delay on reconnect', () => {
  let now = 1000;
  const room = fixture();
  const messages: any[] = [];
  const service = new RoomService(() => now);
  service.rooms.set(room.code, room);
  const peer = service.connect((m) => messages.push(m));
  service.handle(peer, { type: 'RECONNECT', token: 'host' });
  service.handle(peer, { type: 'ACTION', action: { type: 'BUY', level: 1 } });
  assert.equal(room.game!.lastBoardEvent?.kind, 'monopoly');
  const at = 1000 + BOARD_EVENT_NOTICE_MS + PRESENTATION_BUFFER_MS;
  assert.equal(room.actionTimer!.startsAt, at);
  const original = structuredClone(room.game);
  service.handle(peer, { type: 'ACTION', action: { type: 'END_TURN' } });
  assert.equal(messages.at(-1).code, 'PRESENTATION_PENDING');
  assert.deepEqual(room.game, original);
  now = at - 1;
  service.handle(peer, { type: 'RECONNECT', token: 'host' });
  assert.equal(room.actionTimer!.startsAt, at);
  assert.deepEqual(room.game, original);
  now = at;
  service.handle(peer, { type: 'ACTION', action: { type: 'END_TURN' } });
  assert.notEqual(messages.at(-1).type, 'ERROR');
  assert.equal(room.game!.currentPlayer, 1);
});
test('an old announcement does not replay after a trade timer is removed or restored', () => {
  const room = fixture();
  room.game = reduceGame(room.game!, { type: 'BUY', level: 1 });
  syncRoomTimer(room, 1000);
  assert.equal(room.actionTimer!.startsAt, 3700);
  delete room.actionTimer;
  syncRoomTimer(room, 4000);
  assert.equal(room.actionTimer!.startsAt, 4000);
  const restored = JSON.parse(JSON.stringify(room));
  delete restored.actionTimer;
  syncRoomTimer(restored, 5000);
  assert.equal(restored.actionTimer.startsAt, 5000);
});

test('a bot waits for Monopoly before its next action', () => {
  const room = fixture();
  room.seats[0].bot = true;
  room.game = reduceGame(room.game!, { type: 'BUY', level: 1 });
  syncRoomTimer(room, 1000);
  const event = room.game!.lastBoardEvent;
  advanceRoomBot(room, 1000);
  advanceRoomBot(room, 1600);
  assert.equal(room.game!.properties[3].level, 1);
  assert.equal(room.botActionAt, 3700);
  advanceRoomBot(room, 3699);
  assert.equal(room.game!.currentPlayer, 0);
  advanceRoomBot(room, 3700);
  assert.equal(room.game!.properties[3].level, 2);
  assert.deepEqual(room.game!.lastBoardEvent, event);
});
