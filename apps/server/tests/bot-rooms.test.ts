import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createGame } from '@typhu/game-engine';
import type { RoomRequest } from '@typhu/contracts/http';
import type { RoomSnapshot } from '@typhu/contracts/multiplayer';
import { HttpRoomService, type StoredRoom } from '../src/http-room-service';
import { MemoryRoomStore } from '../src/room-store';
import { roomEvent, roomEventsPost } from '../src/room-events';
import { roomEventDecoder } from '../../web/src/features/multiplayer/room-sync';

function snapshot(response: Awaited<ReturnType<HttpRoomService['handle']>>): RoomSnapshot {
  const message = response.messages.find((entry) => 'room' in entry); assert.ok(message && 'room' in message);
  return message.room;
}
async function setup(now = () => Date.now()) {
  const store = new MemoryRoomStore();
  const host: RoomRequest = { connectionId: randomUUID(), requestId: randomUUID(), message: { type: 'CREATE_ROOM', name: 'Host', mode: 'classic', maxPlayers: 4, maxRounds: 8 } };
  const created = await new HttpRoomService(store, now).handle(host);
  const session = created.messages[0]; assert.ok(session.type === 'SESSION');
  Object.assign(host, { roomCode: session.room.code, token: session.token, message: null });
  const joined = await new HttpRoomService(store, now).handle({ connectionId: randomUUID(), requestId: randomUUID(), message: { type: 'JOIN_ROOM', code: host.roomCode!, name: 'Guest' } });
  const guestSession = joined.messages[0]; assert.ok(guestSession.type === 'SESSION');
  const guest: RoomRequest = { connectionId: randomUUID(), requestId: randomUUID(), roomCode: host.roomCode, token: guestSession.token, message: { type: 'RECONNECT', token: guestSession.token } };
  await new HttpRoomService(store, now).handle(guest);
  const send = (identity: RoomRequest, message: RoomRequest['message']) => new HttpRoomService(store, now).handle({ ...identity, requestId: randomUUID(), message });
  await send(guest, { type: 'SET_READY', ready: true }); await send(host, { type: 'START_GAME' });
  // Bot tests require a known actor; random-start authority is tested independently.
  await patch(store, host.roomCode!, ({ room }) => {
    room.game!.currentPlayer = 0; room.game!.startingPlayer = 0; delete room.game!.victoryRules; delete room.game!.liquidationRules; delete room.actionTimer;
  });
  return { store, host, guest, send };
}
async function patch(store: MemoryRoomStore, code: string, edit: (stored: StoredRoom) => void) {
  const old = (await store.read(code))!; const stored = JSON.parse(old) as StoredRoom; edit(stored);
  assert.equal(await store.compareAndSet(code, old, JSON.stringify(stored)), true);
}

test('leaving replaces the seat, cancels related trades and revokes reconnect, poll, commands and SSE', async () => {
  const { store, host, guest, send } = await setup();
  await send(host, { type: 'PROPOSE_TRADE', offer: { fromId: 'player-1', toId: 'player-2', giveTileId: null, takeTileId: null, giveCash: 10, takeCash: 0 } });
  const request = { ...host, requestId: randomUUID(), message: { type: 'LEAVE_ROOM' } as const };
  assert.equal((await new HttpRoomService(store).handle(request)).messages[0].type, 'LEFT_ROOM');
  assert.equal((await new HttpRoomService(store).handle(request)).messages[0].type, 'LEFT_ROOM');
  const room = snapshot(await send(guest, null));
  assert.equal(room.seats[0].bot, true); assert.equal(room.seats[0].connected, false);
  assert.equal(room.pendingTrade, null); assert.equal(room.seats.length, 2);
  assert.equal(room.hostSeatId, room.seats[1].id);
  assert.equal(room.game!.players[0].cash, 1500); assert.ok(room.botActionAt);
  for (const message of [null, { type: 'RECONNECT', token: host.token! }, { type: 'ACTION', action: { type: 'ROLL' } }] as RoomRequest['message'][]) {
    const response = await send(host, message); assert.equal(response.messages[0].type, 'ERROR');
  }
  assert.equal(roomEvent(await store.read(host.roomCode!), host).type, 'ERROR');
  const newJoin = await new HttpRoomService(store).handle({ connectionId: randomUUID(), requestId: randomUUID(), message: { type: 'JOIN_ROOM', code: host.roomCode!, name: 'Host' } });
  assert.equal(newJoin.messages[0].type, 'ERROR');
});

test('reload/disconnect does not turn a human into a bot, and concurrent ticks execute a bot action once', async () => {
  let time = Date.now(); const context = await setup(() => time);
  const { store, host, guest, send } = context;
  time += 46_000;
  assert.equal(snapshot(await send(guest, null)).seats[0].bot, undefined);
  assert.equal((await send(host, { type: 'RECONNECT', token: host.token! })).messages[0].type, 'SESSION');
  await patch(store, host.roomCode!, (stored) => {
    // The 46-second presence check also crosses the action deadline. Its random
    // automatic roll may charge tax, so isolate the spending fixture afterwards.
    stored.room.game = createGame({ names: stored.room.seats.map((seat) => seat.name), mode: 'classic', seed: 123, maxRounds: 8 });
    stored.room.game!.phase = 'purchase'; stored.room.game!.players[0].position = 3;
    delete stored.room.actionTimer;
  });
  await send(host, { type: 'LEAVE_ROOM' });
  const due = snapshot(await send(guest, null)).botActionAt!;
  assert.equal(snapshot(await send(guest, null)).game!.properties[3], undefined);
  time = due + 1;
  await Promise.all([send(guest, null), send(guest, null), send(guest, null)]);
  const room = snapshot(await send(guest, null));
  assert.equal(room.game!.players[0].cash, 1440); assert.equal(room.game!.properties[3].ownerId, 'player-1');
  assert.equal(room.game!.log.filter((entry) => entry.message.includes('mua Cần Thơ')).length, 1);
});

test('bot on the current or non-current debt seat liquidates legally and yields back to the human', async () => {
  let time = Date.now(); const { store, host, guest, send } = await setup(() => time);
  await send(guest, { type: 'LEAVE_ROOM' });
  await patch(store, host.roomCode!, (stored) => {
    const game = stored.room.game!; game.phase = 'roll'; game.players[1].cash = 0;
    game.debt = { debtorId: 'player-2', creditorId: 'player-1', amount: 20, reason: 'rent' };
    game.properties[1] = { ownerId: 'player-2', level: 0, mortgaged: false, business: 'residence' };
  });
  let room = snapshot(await send(host, null)); time = room.botActionAt! + 1;
  room = snapshot(await send(host, null));
  assert.equal(room.game!.debt, null); assert.equal(room.game!.properties[1].mortgaged, true);
  assert.equal(room.game!.players[0].cash, 1520); assert.equal(room.botActionAt, undefined);
});

test('SSE timers make a bot buy and finish its turn without any observer polling', { timeout: 8000 }, async () => {
  const { store, host, guest, send } = await setup();
  await patch(store, host.roomCode!, (stored) => {
    const game = stored.room.game!; game.phase = 'purchase'; game.mode = 'classic'; game.players[0].position = 3;
    game.propertyVisit = { playerId: 'player-1', tileId: 3, ownerIdOnArrival: null, levelOnArrival: 0 };
  });
  const abort = new AbortController();
  const response = await roomEventsPost(new Request('https://game.test/api/room/events', {
    method: 'POST', headers: { origin: 'https://game.test', 'content-type': 'application/json' },
    body: JSON.stringify({ ...guest, message: null }), signal: abort.signal,
  }), store);
  const reader = response.body!.getReader();
  const seen: RoomSnapshot[] = [];
  const decode = roomEventDecoder((message) => { if (message.type === 'ROOM_STATE') seen.push(message.room); });
  try {
    await send(host, { type: 'LEAVE_ROOM' });
    while (!seen.some((room) => room.game?.currentPlayer === 1)) {
      const chunk = await reader.read(); assert.equal(chunk.done, false); decode(chunk.value!);
    }
    assert.ok(seen.some((room) => room.seats[0].bot && room.game!.properties[3]?.ownerId === 'player-1'));
    assert.equal(seen.at(-1)!.game!.players[0].cash, 1440);
    assert.equal(seen.at(-1)!.game!.properties[3].level, 1);
  } finally { abort.abort(); await reader.cancel(); }
});
