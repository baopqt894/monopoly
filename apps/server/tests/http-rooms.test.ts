import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { ClientMessage, RoomSnapshot, ServerMessage } from '@typhu/contracts/multiplayer';
import type { RoomRequest, RoomResponse } from '@typhu/contracts/http';
import { HttpRoomService } from '../src/http-room-service';
import { healthGet, roomPost } from '../src/http-gateway';
import { getRoomStore, MemoryRoomStore } from '../src/room-store';
import { reduceGame } from '@typhu/game-engine';

function client(store: MemoryRoomStore, now = () => Date.now()) {
  const connectionId = randomUUID();
  let identity: { token: string; roomCode: string } | undefined;
  async function send(message: ClientMessage | null, options: Partial<RoomRequest> = {}) {
    // A fresh service per request simulates separate serverless instances.
    const response = await new HttpRoomService(store, now).handle({
      connectionId,
      requestId: randomUUID(),
      ...identity,
      message,
      ...options,
    });
    const session = response.messages.find((entry) => entry.type === 'SESSION');
    if (session?.type === 'SESSION')
      identity = { token: session.token, roomCode: session.room.code };
    return response;
  }
  return { connectionId, send, identity: () => identity! };
}
function snapshot(response: RoomResponse): RoomSnapshot {
  const message = response.messages.find((entry) => 'room' in entry);
  assert.ok(message && 'room' in message, JSON.stringify(response));
  return message.room;
}
function errorCode(response: RoomResponse) {
  return response.messages.find((entry) => entry.type === 'ERROR')?.code;
}
async function setup() {
  const store = new MemoryRoomStore();
  const host = client(store),
    guest = client(store);
  const room = snapshot(
    await host.send({ type: 'CREATE_ROOM', name: 'An', mode: 'classic', maxPlayers: 4, maxRounds: 8 }),
  );
  await guest.send({ type: 'JOIN_ROOM', name: 'Bình', code: room.code });
  return { store, host, guest, code: room.code };
}
async function started() {
  const context = await setup();
  await context.guest.send({ type: 'SET_READY', ready: true });
  assert.equal(snapshot(await context.host.send({ type: 'START_GAME' })).phase, 'playing');
  return context;
}

test('random starting player persists across HTTP instances, duplicate start and reconnect', async () => {
  const { store, host, guest, code } = await setup();
  await guest.send({ type: 'SET_READY', ready: true });
  const requestId = randomUUID();
  const first = snapshot(await host.send({ type: 'START_GAME' }, { requestId }));
  const start = first.game!.startingPlayer!;
  assert.ok(Number.isInteger(start) && start >= 0 && start < 2);
  assert.equal(first.game!.currentPlayer, start);
  assert.deepEqual(first.game!.players.map((p) => p.name), ['An', 'Bình']);
  assert.deepEqual(first.seats.map((s) => s.gamePlayerId), first.game!.players.map((p) => p.id));
  const duplicate = snapshot(await host.send({ type: 'START_GAME' }, { requestId }));
  assert.equal(duplicate.game!.startingPlayer, start);
  const replacement = client(store);
  const restored = snapshot(await replacement.send({ type: 'RECONNECT', token: guest.identity().token }, guest.identity()));
  assert.equal(restored.game!.currentPlayer, start);
  assert.equal(restored.game!.startingPlayer, start);
  const stored = JSON.parse((await store.read(code))!);
  assert.equal(stored.room.game.startingPlayer, start);
});

test('custom classic settings survive separate instances, joining and starting the game', async () => {
  const store = new MemoryRoomStore(); const host = client(store), guest = client(store);
  const lobby = snapshot(await host.send({ type: 'CREATE_ROOM', name: 'Host', maxPlayers: 2, startingCash: 3200, goSalary: 450 }));
  assert.equal(lobby.mode, 'classic'); assert.equal(lobby.maxPlayers, 2);
  assert.equal(lobby.startingCash, 3200); assert.equal(lobby.goSalary, 450);
  const joined = snapshot(await guest.send({ type: 'JOIN_ROOM', name: 'Guest', code: lobby.code }));
  assert.equal(joined.startingCash, 3200); assert.equal(joined.goSalary, 450);
  await guest.send({ type: 'SET_READY', ready: true });
  const started = snapshot(await host.send({ type: 'START_GAME' }));
  assert.equal(started.game!.mode, 'classic'); assert.equal(started.game!.goSalary, 450);
  assert.ok(started.game!.players.every(p => p.cash === 3200));
  const restored = snapshot(await guest.send(null));
  assert.equal(restored.game!.startingCash, 3200); assert.equal(restored.goSalary, 450);
});

test('server rejects invalid money, unsupported modes and excess seats before creating rooms', async () => {
  const store = new MemoryRoomStore();
  const base = { type: 'CREATE_ROOM', name: 'Host', maxPlayers: 2 };
  for (const patch of [{ startingCash: 0 }, { startingCash: 1.5 }, { startingCash: '2000' },
    { startingCash: null }, { goSalary: -1 }, { goSalary: 1000001 }, { goSalary: null },
    { mode: 'city' }, { maxPlayers: 5 }]) {
    const peer = client(store);
    const response = await peer.send({ ...base, ...patch } as unknown as ClientMessage);
    assert.equal(errorCode(response), 'INVALID_ACTION');
    assert.equal(response.messages.some(message => message.type === 'SESSION'), false);
  }
});

test('deadline survives service replacement/reconnect and racing observers execute one timeout', async () => {
  let time = Date.now(); const now = () => time;
  const store = new MemoryRoomStore(), host = client(store, now), guest = client(store, now);
  const lobby = snapshot(await host.send({ type: 'CREATE_ROOM', name: 'Timer Host', mode: 'classic', maxPlayers: 2, maxRounds: 8 }));
  await guest.send({ type: 'JOIN_ROOM', code: lobby.code, name: 'Timer Guest' });
  await guest.send({ type: 'SET_READY', ready: true });
  const first = snapshot(await host.send({ type: 'START_GAME' }));
  assert.equal(first.actionDeadlineAt, time + 15_000);
  time += 5000;
  const resumed = client(store, now);
  const restored = snapshot(await resumed.send({ type: 'RECONNECT', token: host.identity().token }, host.identity()));
  assert.equal(restored.actionDeadlineAt, first.actionDeadlineAt);
  assert.equal(snapshot(await guest.send(null)).actionDeadlineAt, first.actionDeadlineAt);
  time = first.actionDeadlineAt!;
  await Promise.all([resumed.send(null), guest.send(null), guest.send(null)]);
  const after = snapshot(await guest.send(null));
  assert.equal(after.game!.log.filter((entry) => / tung [1-6] và [1-6]/.test(entry.message)).length, 1);
  assert.ok(after.actionDeadlineAt! > time);
});

test('late purchase cannot beat the timeout; valid actions reset time but invalid actions do not', async () => {
  let time = Date.now(); const store = new MemoryRoomStore();
  const host = client(store, () => time), guest = client(store, () => time);
  const lobby = snapshot(await host.send({ type: 'CREATE_ROOM', name: 'Host', mode: 'classic', maxPlayers: 2, maxRounds: 8 }));
  await guest.send({ type: 'JOIN_ROOM', name: 'Guest', code: lobby.code });
  await guest.send({ type: 'SET_READY', ready: true }); await host.send({ type: 'START_GAME' });
  let raw = (await store.read(lobby.code))!; let saved = JSON.parse(raw);
  saved.room.game.phase = 'purchase'; saved.room.game.currentPlayer = 0; saved.room.game.startingPlayer = 0; saved.room.game.players[0].position = 3; delete saved.room.actionTimer;
  assert.equal(await store.compareAndSet(lobby.code, raw, JSON.stringify(saved)), true);
  const deadline = snapshot(await host.send(null)).actionDeadlineAt!;
  time = deadline + 1;
  assert.ok(errorCode(await host.send({ type: 'ACTION', action: { type: 'BUY' } })));
  let state = snapshot(await guest.send(null));
  assert.equal(state.game!.properties[3], undefined); assert.equal(state.game!.players[0].cash, 1500);
  raw = (await store.read(lobby.code))!; saved = JSON.parse(raw);
  saved.room.game.properties[1] = { ownerId: 'player-1', level: 0, mortgaged: false, business: 'residence' };
  saved.room.game.properties[3] = { ownerId: 'player-1', level: 0, mortgaged: false, business: 'residence' };
  saved.room.game.phase = 'end'; saved.room.game.currentPlayer = 0; saved.room.game.players[0].position = 1;
  saved.room.game.propertyVisit = { playerId: 'player-1', tileId: 1, ownerIdOnArrival: 'player-1', levelOnArrival: 0 };
  assert.equal(await store.compareAndSet(lobby.code, raw, JSON.stringify(saved)), true);
  time += 5000;
  state = snapshot(await host.send({ type: 'ACTION', action: { type: 'BUILD', tileId: 1 } }));
  assert.equal(state.actionDeadlineAt, time + 15_000);
  // The successful build now automatically completes its landing decision.
  state = snapshot(await host.send(null));
  assert.equal(state.game!.currentPlayer, 1);
  const reset = state.actionDeadlineAt;
  time += 1000;
  assert.ok(errorCode(await host.send({ type: 'ACTION', action: { type: 'BUILD', tileId: 39 } })));
  assert.equal(snapshot(await guest.send(null)).actionDeadlineAt, reset);
});

test('racing observers apply a forced card once but flight continuation waits for a manual roll', async () => {
  let time = Date.now();
  const store = new MemoryRoomStore();
  const host = client(store, () => time), guest = client(store, () => time);
  const lobby = snapshot(await host.send({ type: 'CREATE_ROOM', name: 'Auto Host', maxPlayers: 2 }));
  await guest.send({ type: 'JOIN_ROOM', name: 'Auto Guest', code: lobby.code });
  await guest.send({ type: 'SET_READY', ready: true }); await host.send({ type: 'START_GAME' });
  let raw = (await store.read(lobby.code))!;
  let saved = JSON.parse(raw);
  saved.room.game.currentPlayer = 0; saved.room.game.phase = 'card';
  saved.room.game.drawnCard = { deck: 'chance', cardId: 'chance-08', revealed: true };
  delete saved.room.actionTimer;
  assert.equal(await store.compareAndSet(lobby.code, raw, JSON.stringify(saved)), true);
  const revealed = snapshot(await host.send(null));
  time = revealed.actionStartsAt! + 1200;
  await Promise.all([host.send(null), guest.send(null), guest.send(null)]);
  let result = snapshot(await guest.send(null));
  assert.equal(result.game!.players[0].cash, 1550);
  assert.equal(result.game!.drawnCard, null);
  assert.equal(result.game!.log.filter(entry => entry.message === 'Auto Host nhận ₫50.').length, 1);
  raw = (await store.read(lobby.code))!; saved = JSON.parse(raw);
  Object.assign(saved.room.game, { currentPlayer: 0, phase: 'end', flightRollPending: true, extraRoll: false, doubles: 0, seed: 123 });
  delete saved.room.game.movement; delete saved.room.game.lastRoll; delete saved.room.game.propertyVisit;
  delete saved.room.actionTimer;
  assert.equal(await store.compareAndSet(lobby.code, raw, JSON.stringify(saved)), true);
  await host.send(null);
  await Promise.all([host.send(null), guest.send(null), guest.send(null)]);
  result = snapshot(await guest.send(null));
  assert.equal(result.game!.automaticRoll, undefined);
  assert.equal(result.game!.phase, 'roll');
  assert.equal(result.game!.currentPlayer, 0);
  assert.equal(result.game!.lastRoll, undefined);
  assert.equal(result.game!.log.filter(entry => / tung [1-6] và [1-6]/.test(entry.message)).length, 0);
  result = snapshot(await host.send({ type: 'ACTION', action: { type: 'ROLL' } }));
  assert.equal(result.game!.log.filter(entry => / tung [1-6] và [1-6]/.test(entry.message)).length, 1);
});

test('airport event is public to the arriving player and every observer, survives turn advance and is never duplicated by racing reads', async () => {
  let time = Date.now();
  const store = new MemoryRoomStore();
  const host = client(store, () => time), guest = client(store, () => time);
  const lobby = snapshot(await host.send({ type: 'CREATE_ROOM', name: 'Airport Host', maxPlayers: 2 }));
  await guest.send({ type: 'JOIN_ROOM', name: 'Airport Guest', code: lobby.code });
  await guest.send({ type: 'SET_READY', ready: true }); await host.send({ type: 'START_GAME' });
  const raw = (await store.read(lobby.code))!, saved = JSON.parse(raw);
  saved.room.game.currentPlayer = 0; saved.room.game.phase = 'roll'; saved.room.game.players[0].position = 27;
  saved.room.game = reduceGame(saved.room.game, { type: 'ROLL', dice: [1, 2] });
  delete saved.room.actionTimer;
  assert.equal(await store.compareAndSet(lobby.code, raw, JSON.stringify(saved)), true);
  const actor = snapshot(await host.send(null)), observer = snapshot(await guest.send(null));
  const notice = actor.game!.lastBoardEvent;
  assert.equal(notice?.playerId, 'player-1'); assert.equal(notice?.tileId, 30);
  assert.deepEqual(observer.game!.lastBoardEvent, notice);
  assert.equal(observer.actionStartsAt, actor.actionStartsAt);
  time = actor.actionStartsAt!;
  await Promise.all([host.send(null), guest.send(null), guest.send(null)]);
  const advanced = snapshot(await guest.send(null));
  assert.equal(advanced.game!.currentPlayer, 1);
  assert.deepEqual(advanced.game!.lastBoardEvent, notice);
  assert.equal(advanced.game!.log.filter(entry => entry.id === notice!.id).length, 1);
});

test('HTTP create/join/poll survive separate service instances and conceal private state', async () => {
  const { host, guest } = await started();
  const room = snapshot(await host.send(null));
  assert.equal(room.seats.length, 2);
  assert.equal(room.game!.seed, 0);
  assert.ok(room.game!.decks.chance.every((id) => id === 'hidden'));
  const json = JSON.stringify(await guest.send(null));
  assert.ok(!json.includes(host.identity().token));
  assert.ok(!json.includes('peerId'));
  assert.ok(!json.includes('receipts'));
});

test('HTTP actions retain server dice and actor validation', async () => {
  const { host, guest } = await started();
  const first = snapshot(await host.send(null)).game!.currentPlayer;
  const [actor, other] = first === 0 ? [host, guest] : [guest, host];
  assert.equal(
    errorCode(await other.send({ type: 'ACTION', action: { type: 'ROLL' } })),
    'NOT_YOUR_TURN',
  );
  assert.ok(errorCode(await actor.send({ type: 'ACTION', action: { type: 'ROLL', dice: [6, 6] } })));
  const room = snapshot(await actor.send({ type: 'ACTION', action: { type: 'ROLL' } }));
  assert.equal(room.game!.log.filter((entry) => / tung [1-6] và [1-6]/.test(entry.message)).length, 1);
});

test('concurrent joins and ready commands do not overwrite one another', async () => {
  const { store, host, guest, code } = await setup();
  const third = client(store),
    fourth = client(store);
  const joins = await Promise.all([
    third.send({ type: 'JOIN_ROOM', name: 'Cường', code }),
    fourth.send({ type: 'JOIN_ROOM', name: 'Dũng', code }),
  ]);
  assert.ok(joins.every((response) => !errorCode(response)));
  await Promise.all([
    guest.send({ type: 'SET_READY', ready: true }),
    third.send({ type: 'SET_READY', ready: true }),
    fourth.send({ type: 'SET_READY', ready: true }),
  ]);
  const room = snapshot(await host.send(null));
  assert.equal(room.seats.length, 4);
  assert.ok(room.seats.every((seat) => seat.ready));
});

test('repeated create and commands with the same request ID are idempotent', async () => {
  const store = new MemoryRoomStore(),
    host = client(store);
  const requestId = randomUUID();
  const create: ClientMessage = {
    type: 'CREATE_ROOM',
    name: 'An',
    mode: 'classic',
    maxPlayers: 2,
    maxRounds: 8,
  };
  const first = snapshot(await host.send(create, { requestId }));
  assert.equal(snapshot(await host.send(create, { requestId })).code, first.code);
  const guest = client(store);
  await guest.send({ type: 'JOIN_ROOM', name: 'Bình', code: first.code });
  await guest.send({ type: 'SET_READY', ready: true });
  const initial = snapshot(await host.send({ type: 'START_GAME' }));
  const actor = initial.game!.currentPlayer === 0 ? host : guest;
  const rollId = randomUUID();
  await actor.send({ type: 'ACTION', action: { type: 'ROLL' } }, { requestId: rollId });
  const room = snapshot(
    await actor.send({ type: 'ACTION', action: { type: 'ROLL' } }, { requestId: rollId }),
  );
  assert.equal(room.game!.log.filter((entry) => / tung [1-6] và [1-6]/.test(entry.message)).length, 1);
});

test('reload reconnects the seat and revokes the old connection', async () => {
  const { store, host } = await started();
  const replacement = client(store);
  const identity = host.identity();
  const response = await replacement.send({ type: 'RECONNECT', token: identity.token }, identity);
  assert.equal(snapshot(response).seats.length, 2);
  assert.equal(errorCode(await host.send(null)), 'SESSION_REPLACED');
  assert.equal(
    errorCode(await host.send({ type: 'ACTION', action: { type: 'ROLL' } })),
    'SESSION_REPLACED',
  );
  assert.equal(errorCode(await replacement.send(null)), undefined);
});

test('trade expires before acceptance, and two concurrent acceptances transfer money once', async () => {
  const context = await started();
  const { store } = context;
  const actorIndex = snapshot(await context.host.send(null)).game!.currentPlayer;
  const [host, guest] = actorIndex === 0 ? [context.host, context.guest] : [context.guest, context.host];
  const balances = actorIndex === 0 ? [1400, 1600] : [1600, 1400];
  const offer = {
    fromId: `player-${actorIndex + 1}`,
    toId: `player-${2 - actorIndex}`,
    giveTileId: null,
    takeTileId: null,
    giveCash: 100,
    takeCash: 0,
  };
  await host.send({ type: 'PROPOSE_TRADE', offer });
  await Promise.all([
    guest.send({ type: 'RESPOND_TRADE', accept: true }),
    guest.send({ type: 'RESPOND_TRADE', accept: true }),
  ]);
  let room = snapshot(await host.send(null));
  assert.deepEqual(
    room.game!.players.map((player) => player.cash),
    balances,
  );
  await host.send({ type: 'PROPOSE_TRADE', offer });
  const expired = await new HttpRoomService(store, () => Date.now() + 46_000).handle({
    ...guest.identity(),
    connectionId: guest.connectionId,
    requestId: randomUUID(),
    message: { type: 'RESPOND_TRADE', accept: true },
  });
  assert.ok(errorCode(expired));
  room = snapshot(await host.send(null));
  assert.equal(room.pendingTrade, null);
  assert.deepEqual(
    room.game!.players.map((player) => player.cash),
    balances,
  );
});

test('heartbeat expiry marks absent seats offline and prevents start', async () => {
  const { store, host } = await setup();
  const service = new HttpRoomService(store, () => Date.now() + 46_000);
  const response = await service.handle({
    ...host.identity(),
    connectionId: host.connectionId,
    requestId: randomUUID(),
    message: null,
  });
  const room = snapshot(response);
  assert.equal(room.seats[0].connected, true);
  assert.equal(room.seats[1].connected, false);
  assert.ok(errorCode(await host.send({ type: 'START_GAME' })));
});

test('forged tokens fail and leaving the lobby frees the seat', async () => {
  const { host, guest } = await setup();
  assert.equal(errorCode(await host.send(null, { token: randomUUID() })), 'SESSION_EXPIRED');
  assert.equal((await guest.send({ type: 'LEAVE_ROOM' })).messages[0].type, 'LEFT_ROOM');
  assert.equal(snapshot(await host.send(null)).seats.length, 1);
});

test('HTTP gateway enforces origin, payload, rate limits and uncached responses', async () => {
  const store = new MemoryRoomStore();
  const make = (origin = 'https://game.test', body = '{}') =>
    new Request('https://game.test/api/room', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body,
    });
  assert.equal((await roomPost(make('https://evil.test'), store)).status, 403);
  assert.equal((await roomPost(make('https://game.test', 'x'.repeat(16_385)), store)).status, 413);
  assert.equal((await roomPost(make('https://game.test', 'invalid json'), store)).status, 400);
  for (let index = 0; index < 35; index++) await roomPost(make(), store);
  assert.equal((await roomPost(make(), store)).status, 429);
  const health = await healthGet(store);
  assert.equal(health.status, 200);
  assert.match(health.headers.get('cache-control')!, /no-store/);
});

test('HTTP origin validation uses public Host behind Next.js and Vercel proxies', async () => {
  const store = new MemoryRoomStore();
  const headers = {
    origin: 'https://game.test',
    host: 'game.test',
    'x-forwarded-proto': 'https',
    'content-type': 'application/json',
  };
  const response = await roomPost(
    new Request('http://0.0.0.0:3000/api/room', { method: 'POST', headers, body: '{}' }),
    store,
  );
  assert.equal(response.status, 200);
  const forged = await roomPost(
    new Request('http://0.0.0.0:3000/api/room', {
      method: 'POST',
      headers: { ...headers, origin: 'https://other.test' },
      body: '{}',
    }),
    store,
  );
  assert.equal(forged.status, 403);
});

test('Vercel never falls back to process RAM when MongoDB is missing', async () => {
  const previousUri = process.env.MONGODB_URI;
  const previousVercel = process.env.VERCEL;
  try {
    delete process.env.MONGODB_URI;
    process.env.VERCEL = '1';
    assert.throws(() => getRoomStore(), /ROOM_STORE_NOT_CONFIGURED/);
    assert.equal((await healthGet()).status, 503);
    const response = await roomPost(
      new Request('https://game.test/api/room', {
        method: 'POST',
        headers: { origin: 'https://game.test', 'content-type': 'application/json' },
        body: '{}',
      }),
    );
    assert.equal(response.status, 503);
    assert.equal((await response.json()).messages[0].code, 'ROOM_STORE_NOT_CONFIGURED');
  } finally {
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  }
});


test('festival configuration and generated map survive HTTP instances, duplicate start and reconnect', async () => {
  const store = new MemoryRoomStore(); const host = client(store), guest = client(store);
  for (const eventTileCount of [-1, 25, 2.5, '2', null]) {
    const rejected = await host.send({ type: 'CREATE_ROOM', name: 'Host', maxPlayers: 2, eventTileCount } as never);
    assert.equal(errorCode(rejected), 'INVALID_ACTION');
  }
  const lobby = snapshot(await host.send({ type: 'CREATE_ROOM', name: 'Host', maxPlayers: 2, boardId: 'vietnam-32', eventTileCount: 24 }));
  assert.equal(lobby.eventTileCount, 24);
  const joined = snapshot(await guest.send({ type: 'JOIN_ROOM', name: 'Guest', code: lobby.code }));
  assert.equal(joined.eventTileCount, 24);
  await guest.send({ type: 'SET_READY', ready: true });
  const requestId = randomUUID();
  const started = snapshot(await host.send({ type: 'START_GAME', eventTileIds: [0], eventTileCount: 22 } as never, { requestId }));
  assert.equal(started.game!.boardId, 'vietnam-32');
  const ids = started.game!.eventTileIds!;
  for (const resort of [4,14,18,25]) assert.ok(ids.includes(resort));
  assert.equal(ids.length, 24); assert.equal(new Set(ids).size, 24); assert.ok(!ids.includes(0));
  assert.equal(started.game!.eventTileCount, 24);
  assert.deepEqual(snapshot(await host.send({ type: 'START_GAME' }, { requestId })).game!.eventTileIds, ids);
  assert.deepEqual(snapshot(await guest.send(null)).game!.eventTileIds, ids);
  const resumed = client(store);
  assert.deepEqual(snapshot(await resumed.send({ type: 'RECONNECT', token: guest.identity().token }, guest.identity())).game!.eventTileIds, ids);
  assert.deepEqual(JSON.parse((await store.read(lobby.code))!).room.game.eventTileIds, ids);
});
