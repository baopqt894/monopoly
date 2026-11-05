import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { ClientMessage, ServerMessage } from '@typhu/contracts/multiplayer';
import type { RoomResponse } from '@typhu/contracts/http';
import { RoomService, publicRoomSnapshot } from '../src/rooms';
import { syncMatchClock } from '../src/room-match-clock';
import { HttpRoomService, type StoredRoom } from '../src/http-room-service';
import { MemoryRoomStore } from '../src/room-store';

function setup(durationMinutes: 15 | 30 | 45 | 60 = 15) {
  let now = 1000;
  const service = new RoomService(
    () => now,
    () => 0,
  );
  const messages: ServerMessage[] = [];
  const host = service.connect((message) => messages.push(message));
  const guest = service.connect(() => {});
  service.handle(host, {
    type: 'CREATE_ROOM',
    name: 'An',
    maxPlayers: 2,
    durationMinutes,
    matchDeadlineAt: 1,
    matchStartedAt: 1,
  });
  const room = [...service.rooms.values()][0];
  service.handle(guest, { type: 'JOIN_ROOM', name: 'Bình', code: room.code });
  service.handle(guest, { type: 'SET_READY', ready: true });
  return {
    service,
    host,
    guest,
    room,
    messages,
    setNow(value: number) {
      now = value;
    },
  };
}

test('server starts the selected duration only at START_GAME, ignores client timestamps, shares it with both seats', () => {
  for (const duration of [15, 30, 45, 60] as const) {
    const s = setup(duration);
    assert.equal(s.room.durationMinutes, duration);
    assert.equal(s.room.matchDeadlineAt, undefined);
    s.setNow(5000);
    s.service.handle(s.host, { type: 'START_GAME', matchDeadlineAt: 1 });
    assert.equal(s.room.matchStartedAt, 5000);
    assert.equal(s.room.matchDeadlineAt, 5000 + duration * 60_000);
    assert.equal(publicRoomSnapshot(s.room).matchDeadlineAt, s.room.matchDeadlineAt);
    const deadline = s.room.matchDeadlineAt;
    s.setNow(6000);
    s.service.handle(s.guest, { type: 'RECONNECT', token: s.room.seats[1].token });
    assert.equal(s.room.matchDeadlineAt, deadline);
  }
});

test('match expiry takes priority over action timers, bots and pending trades, and rejects a late purchase', () => {
  const s = setup();
  s.service.handle(s.host, { type: 'START_GAME' });
  const game = s.room.game!;
  game.phase = 'purchase';
  game.players[0].position = 1;
  s.room.pendingTrade = {
    offer: {
      fromId: 'player-1',
      toId: 'player-2',
      giveCash: 100,
      takeCash: 0,
      giveTileId: null,
      takeTileId: null,
    },
    expiresAt: s.room.matchDeadlineAt! + 10000,
  };
  s.room.botActionAt = s.room.matchDeadlineAt;
  syncMatchClock(s.room, s.room.matchDeadlineAt! - 1);
  assert.equal(s.room.phase, 'playing');
  s.setNow(s.room.matchDeadlineAt!);
  s.service.handle(s.host, { type: 'ACTION', action: { type: 'BUY' } });
  assert.equal(s.room.phase, 'finished');
  assert.equal(s.room.game!.properties[1], undefined);
  assert.equal(s.room.pendingTrade, null);
  assert.equal(s.room.actionTimer, undefined);
  assert.equal(s.room.botActionAt, undefined);
  assert.equal(s.room.matchEndedAt, s.room.matchDeadlineAt);
  assert.equal(s.messages.at(-1)?.type, 'ERROR');
});

test('legacy rooms are not assigned a new deadline; early wins stop the existing clock', () => {
  const s = setup();
  delete s.room.durationMinutes;
  s.service.handle(s.host, { type: 'START_GAME' });
  syncMatchClock(s.room, 999999999);
  assert.equal(s.room.matchDeadlineAt, undefined);
  assert.equal(s.room.phase, 'playing');
  s.room.matchDeadlineAt = 10000;
  s.room.game!.phase = 'finished';
  s.room.game!.winReason = 'side-monopoly';
  syncMatchClock(s.room, 3000);
  syncMatchClock(s.room, 20000);
  assert.equal(s.room.matchEndedAt, 3000);
  assert.equal(s.room.game!.winReason, 'side-monopoly');
});

function snapshot(response: RoomResponse) {
  const message = response.messages.find((message) => 'room' in message);
  assert.ok(message && 'room' in message, JSON.stringify(response));
  return message.room;
}

test('CREATE_ROOM validates the duration on the server and gives old clients the new-room default', () => {
  for (const durationMinutes of [0, 20, -15, null, '30', 60.5]) {
    const service = new RoomService();
    const messages: ServerMessage[] = [];
    const host = service.connect((message) => messages.push(message));
    service.handle(host, { type: 'CREATE_ROOM', name: 'An', maxPlayers: 2, durationMinutes });
    assert.equal(messages.at(-1)?.type, 'ERROR');
    assert.equal(service.rooms.size, 0);
  }
  const service = new RoomService();
  const host = service.connect(() => {});
  service.handle(host, { type: 'CREATE_ROOM', name: 'An', maxPlayers: 2 });
  assert.equal([...service.rooms.values()][0].durationMinutes, 60);
});

test('HTTP restore and simultaneous deadline reads commit one final result without resetting the clock', async () => {
  let now = 1000;
  const store = new MemoryRoomStore(() => now);
  function client() {
    const connectionId = randomUUID();
    let identity: { token: string; roomCode: string } | undefined;
    return async (message: ClientMessage | null) => {
      const result = await new HttpRoomService(store, () => now).handle({
        connectionId,
        requestId: randomUUID(),
        ...identity,
        message,
      });
      const session = result.messages.find((message) => message.type === 'SESSION');
      if (session?.type === 'SESSION')
        identity = { token: session.token, roomCode: session.room.code };
      return result;
    };
  }
  const host = client(),
    guest = client();
  const created = snapshot(
    await host({ type: 'CREATE_ROOM', name: 'An', maxPlayers: 2, durationMinutes: 15 }),
  );
  await guest({ type: 'JOIN_ROOM', name: 'Bình', code: created.code });
  await guest({ type: 'SET_READY', ready: true });
  const started = snapshot(await host({ type: 'START_GAME' }));
  const deadline = started.matchDeadlineAt!;
  assert.equal(deadline, 901000);
  now = deadline;
  const responses = await Promise.all([host(null), guest(null), host(null)]);
  for (const response of responses) {
    const room = snapshot(response);
    assert.equal(room.phase, 'finished');
    assert.equal(room.matchDeadlineAt, deadline);
    assert.equal(room.game!.winReason, 'time-limit');
    assert.equal(
      room.game!.log.filter((entry) => entry.message.startsWith('Hết thời gian chơi.')).length,
      1,
    );
  }
  const saved: StoredRoom = JSON.parse((await store.read(created.code))!);
  assert.equal(saved.room.matchStartedAt, 1000);
  assert.equal(saved.room.matchEndedAt, deadline);
});
