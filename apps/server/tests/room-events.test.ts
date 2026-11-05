import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { RoomRequest } from '@typhu/contracts/http';
import type { RoomSnapshot, ServerMessage } from '@typhu/contracts/multiplayer';
import { HttpRoomService } from '../src/http-room-service';
import { roomEventsPost, roomEvent } from '../src/room-events';
import { MemoryRoomStore } from '../src/room-store';
import { syncRoomTimer } from '../src/room-timing';
import { RoomRevisionGate, roomEventDecoder } from '../../web/src/features/multiplayer/room-sync';

async function setup() {
  const store = new MemoryRoomStore(),
    connectionId = randomUUID();
  const service = new HttpRoomService(store);
  const response = await service.handle({
    connectionId,
    requestId: randomUUID(),
    message: { type: 'CREATE_ROOM', name: 'Host', mode: 'classic', maxPlayers: 2, maxRounds: 8 },
  });
  const session = response.messages.find((entry) => entry.type === 'SESSION');
  assert.ok(session?.type === 'SESSION');
  const identity: RoomRequest = {
    connectionId,
    requestId: randomUUID(),
    token: session.token,
    roomCode: session.room.code,
    message: null,
  };
  return { store, service, identity, room: session.room };
}
function request(body: unknown, signal?: AbortSignal) {
  return new Request('https://game.test/api/room/events', {
    method: 'POST',
    headers: { origin: 'https://game.test', 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}

test('human action expires through SSE with no browser command or observer poll', { timeout: 5000 }, async () => {
  const { store, service, identity } = await setup();
  const joined = await service.handle({ connectionId: randomUUID(), requestId: randomUUID(), message: { type: 'JOIN_ROOM', code: identity.roomCode!, name: 'Guest' } });
  const session = joined.messages[0]; assert.ok(session.type === 'SESSION');
  const guest = { connectionId: randomUUID(), requestId: randomUUID(), roomCode: identity.roomCode, token: session.token, message: { type: 'RECONNECT', token: session.token } };
  await service.handle(guest);
  await service.handle({ ...guest, requestId: randomUUID(), message: { type: 'SET_READY', ready: true } });
  await service.handle({ ...identity, requestId: randomUUID(), message: { type: 'START_GAME' } });
  const value = (await store.read(identity.roomCode!))!;
  const saved = JSON.parse(value); saved.room.actionTimer.expiresAt = Date.now() + 80;
  assert.equal(await store.compareAndSet(identity.roomCode!, value, JSON.stringify(saved)), true);
  const abort = new AbortController();
  const response = await roomEventsPost(request({ ...guest, message: null }, abort.signal), store);
  const reader = response.body!.getReader();
  try {
    let message = await event(reader);
    while (message.type === 'ROOM_STATE' && message.room.game!.phase === 'roll') message = await event(reader);
    assert.ok(message.type === 'ROOM_STATE');
    assert.equal(message.room.game!.log.filter((entry) => / tung [1-6] và [1-6]/.test(entry.message)).length, 1);
  } finally { abort.abort(); await reader.cancel(); }
});

test('match deadline finishes both viewers through SSE without a browser action or poll', { timeout: 5000 }, async () => {
  const { store, service, identity } = await setup();
  const connectionId = randomUUID();
  const joined = await service.handle({ connectionId, requestId: randomUUID(), message: { type: 'JOIN_ROOM', code: identity.roomCode!, name: 'Guest' } });
  const session = joined.messages[0]; assert.ok(session.type === 'SESSION');
  const guest = { ...identity, connectionId, token: session.token };
  await service.handle({ ...guest, requestId: randomUUID(), message: { type: 'SET_READY', ready: true } });
  await service.handle({ ...identity, requestId: randomUUID(), message: { type: 'START_GAME' } });
  const previous = (await store.read(identity.roomCode!))!;
  const saved = JSON.parse(previous);
  const deadline = Date.now() + 500;
  saved.room.matchDeadlineAt = deadline;
  assert.equal(await store.compareAndSet(identity.roomCode!, previous, JSON.stringify(saved)), true);
  const abort = new AbortController();
  const responses = await Promise.all([identity, guest].map(id => roomEventsPost(request({ ...id, message: null }, abort.signal), store)));
  const readers = responses.map(response => response.body!.getReader());
  try {
    const results = await Promise.all(readers.map(async reader => {
      let message = await event(reader);
      while (message.type === 'ROOM_STATE' && message.room.phase !== 'finished') message = await event(reader);
      assert.ok(message.type === 'ROOM_STATE');
      assert.equal(message.room.game!.winReason, 'time-limit');
      assert.equal(message.room.matchEndedAt, deadline);
      assert.deepEqual(message.room.game!.players.map(player => player.cash), [1500, 1500]);
      return message.room;
    }));
    assert.equal(results[0].game!.winnerId, results[1].game!.winnerId);
  } finally {
    abort.abort();
    await Promise.all(readers.map(reader => reader.cancel()));
  }
});
async function event(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const messages: ServerMessage[] = [];
  const decode = roomEventDecoder((message) => messages.push(message));
  while (!messages.length) {
    const chunk = await reader.read();
    assert.equal(chunk.done, false);
    decode(chunk.value!);
  }
  return messages[0];
}
test('airport automatically advances through SSE at animation completion, not fifteen seconds later', {timeout:5000}, async()=>{
  const {store,service,identity}=await setup();
  const joined=await service.handle({connectionId:randomUUID(),requestId:randomUUID(),message:{type:'JOIN_ROOM',code:identity.roomCode!,name:'Guest'}});
  const session=joined.messages[0];assert.ok(session.type==='SESSION');
  const guest={connectionId:randomUUID(),requestId:randomUUID(),roomCode:identity.roomCode,token:session.token,message:{type:'RECONNECT',token:session.token}};
  await service.handle(guest);
  await service.handle({...guest,requestId:randomUUID(),message:{type:'SET_READY',ready:true}});
  await service.handle({...identity,requestId:randomUUID(),message:{type:'START_GAME'}});
  const previous=(await store.read(identity.roomCode!))!;const saved=JSON.parse(previous);
  saved.room.game.currentPlayer=0;saved.room.game.phase='end';saved.room.game.extraRoll=false;
  saved.room.game.players[0].position=30;saved.room.game.players[0].flight='waiting';delete saved.room.actionTimer;
  syncRoomTimer(saved.room,Date.now()+100,false);
  await store.compareAndSet(identity.roomCode!,previous,JSON.stringify(saved));
  const abort=new AbortController();const response=await roomEventsPost(request({...guest,message:null},abort.signal),store);
  const reader=response.body!.getReader();
  try {
    let message=await event(reader);
    while(message.type==='ROOM_STATE'&&message.room.game!.currentPlayer===0)message=await event(reader);
    assert.ok(message.type==='ROOM_STATE');assert.equal(message.room.game!.currentPlayer,1);
    assert.equal(message.room.game!.players[0].flight,'waiting');
  }finally{abort.abort();await reader.cancel();}
});
test('Chance auto-draws through SSE after arrival with no browser action without a forced reading delay', {timeout:5000}, async()=>{
  const {store,service,identity}=await setup();
  const joined=await service.handle({connectionId:randomUUID(),requestId:randomUUID(),message:{type:'JOIN_ROOM',code:identity.roomCode!,name:'Guest'}});
  const session=joined.messages[0];assert.ok(session.type==='SESSION');
  const guest={connectionId:randomUUID(),requestId:randomUUID(),roomCode:identity.roomCode,token:session.token,message:{type:'RECONNECT',token:session.token}};
  await service.handle(guest);
  await service.handle({...guest,requestId:randomUUID(),message:{type:'SET_READY',ready:true}});
  await service.handle({...identity,requestId:randomUUID(),message:{type:'START_GAME'}});
  const previous=(await store.read(identity.roomCode!))!;const saved=JSON.parse(previous);
  saved.room.game.currentPlayer=0;saved.room.game.phase='card';
  saved.room.game.drawnCard={deck:'chance',cardId:'chance-08',revealed:false};
  delete saved.room.actionTimer;syncRoomTimer(saved.room,Date.now(),false);
  saved.room.actionTimer.startsAt=Date.now()+100;
  await store.compareAndSet(identity.roomCode!,previous,JSON.stringify(saved));
  const abort=new AbortController();const response=await roomEventsPost(request({...guest,message:null},abort.signal),store);
  const reader=response.body!.getReader();
  try {
    let message=await event(reader);
    assert.ok(message.type==='ROOM_STATE');assert.equal(message.room.game!.drawnCard!.cardId,'hidden');
    while(message.type==='ROOM_STATE'&&!message.room.game!.drawnCard?.revealed)message=await event(reader);
    assert.ok(message.type==='ROOM_STATE');assert.equal(message.room.game!.drawnCard!.cardId,'chance-08');
    assert.equal(message.room.game!.players[0].cash,1500);
    assert.ok(message.room.actionStartsAt! <= Date.now()+500);
    assert.equal(message.room.actionDeadlineAt!-message.room.actionStartsAt!,15000);
    while (message.type === 'ROOM_STATE' && message.room.game!.players[0].cash === 1500)
      message = await event(reader);
    assert.ok(message.type === 'ROOM_STATE');
    assert.equal(message.room.game!.players[0].cash, 1550);
    while (message.type === 'ROOM_STATE' && message.room.game!.currentPlayer === 0)
      message = await event(reader);
    assert.ok(message.type === 'ROOM_STATE');
    assert.equal(message.room.game!.currentPlayer, 1);
    assert.equal(message.room.game!.players[0].cash, 1550);
  }finally{abort.abort();await reader.cancel();}
});

test('push delivers a join without any observer poll, and never exposes private data', async () => {
  const { store, service, identity } = await setup();
  const abort = new AbortController();
  const response = await roomEventsPost(request(identity, abort.signal), store);
  assert.match(response.headers.get('content-type')!, /text\/event-stream/);
  const reader = response.body!.getReader();
  try {
    const first = await event(reader);
    assert.equal(first.type, 'ROOM_STATE');
    await service.handle({
      connectionId: randomUUID(),
      requestId: randomUUID(),
      message: { type: 'JOIN_ROOM', name: 'Guest', code: identity.roomCode },
    });
    const next = await event(reader);
    assert.ok(next.type === 'ROOM_STATE');
    assert.equal(next.room.seats.length, 2);
    assert.ok(next.room.revision! > (first as { room: RoomSnapshot }).room.revision!);
    assert.ok(!JSON.stringify(next).includes(identity.token!));
    assert.ok(!JSON.stringify(next).includes('peerId'));
  } finally {
    abort.abort();
    await reader.cancel();
  }
});
test('push checks origin and credentials, revokes an old connection, and closes deleted rooms', async () => {
  const { store, service, identity } = await setup();
  assert.equal(
    (await roomEventsPost(request({ ...identity, token: randomUUID() }), store)).status,
    401,
  );
  assert.equal(
    (await roomEventsPost(request({ ...identity, message: { type: 'START_GAME' } }), store)).status,
    400,
  );
  const bad = new Request('https://game.test/api/room/events', {
    method: 'POST',
    headers: { origin: 'https://evil.test', 'content-type': 'application/json' },
    body: JSON.stringify(identity),
  });
  assert.equal((await roomEventsPost(bad, store)).status, 403);
  const response = await roomEventsPost(request(identity), store);
  const reader = response.body!.getReader();
  try {
    await event(reader);
    await service.handle({
      ...identity,
      connectionId: randomUUID(),
      requestId: randomUUID(),
      message: { type: 'RECONNECT', token: identity.token },
    });
    const revoked = await event(reader);
    assert.ok(revoked.type === 'ERROR');
    assert.equal(revoked.code, 'SESSION_REPLACED');
    assert.equal((await reader.read()).done, true);
    assert.equal(roomEvent(null, identity).type, 'ERROR');
  } finally {
    await reader.cancel();
  }
});
test('unchanged heartbeats keep the same revision and do not re-render the board', async () => {
  const { store, service, identity, room } = await setup();
  const before = JSON.parse((await store.read(room.code))!);
  const response = await service.handle(identity);
  const state = response.messages.find((message) => message.type === 'ROOM_STATE');
  assert.ok(state?.type === 'ROOM_STATE');
  assert.equal(state.room.revision, room.revision);
  const after = JSON.parse((await store.read(room.code))!);
  assert.equal(after.revision, before.revision);
  const gate = new RoomRevisionGate();
  assert.equal(gate.accept(room), true);
  assert.equal(gate.accept(state.room), false);
  assert.equal(gate.accept({ ...room, revision: room.revision! + 2 }), true);
  assert.equal(gate.accept({ ...room, revision: room.revision! + 1 }), false);
});
test('event decoder handles fragmented Vietnamese UTF-8 and multiple events per chunk', () => {
  const messages: ServerMessage[] = [],
    decode = roomEventDecoder((value) => messages.push(value));
  const value: ServerMessage = { type: 'ERROR', code: 'TEST', message: 'Tiếng Việt — đồng bộ' };
  const bytes = new TextEncoder().encode(
    `:keepalive\n\ndata:${JSON.stringify(value)}\n\ndata:${JSON.stringify(value)}\n\n`,
  );
  for (const byte of bytes) decode(new Uint8Array([byte]));
  assert.deepEqual(messages, [value, value]);
});

test('stream rotation and cancellation release subscriptions', async () => {
  const { store, identity } = await setup();
  const original = store.subscribe.bind(store);
  let active = 0;
  store.subscribe = async (code, listener) => {
    active++;
    const stop = await original(code, listener);
    let stopped = false;
    return async () => {
      if (!stopped) {
        stopped = true;
        active--;
        await stop();
      }
    };
  };
  const response = await roomEventsPost(request(identity), store, {
    durationMs: 30,
    heartbeatMs: 10000,
  });
  const reader = response.body!.getReader();
  await event(reader);
  assert.equal((await reader.read()).done, true);
  assert.equal(active, 0);
  const abort = new AbortController();
  const other = await roomEventsPost(request(identity, abort.signal), store);
  const second = other.body!.getReader();
  await event(second);
  abort.abort();
  await second.cancel();
  assert.equal(active, 0);
});

test('pending trades expire on the stream without requiring any client poll', async () => {
  const { store, service, identity } = await setup();
  const guestId = randomUUID();
  const joined = await service.handle({
    connectionId: guestId,
    requestId: randomUUID(),
    message: { type: 'JOIN_ROOM', name: 'Guest', code: identity.roomCode },
  });
  const guest = joined.messages.find((message) => message.type === 'SESSION');
  assert.ok(guest?.type === 'SESSION');
  await service.handle({
    ...identity,
    token: guest.token,
    connectionId: guestId,
    requestId: randomUUID(),
    message: { type: 'SET_READY', ready: true },
  });
  await service.handle({ ...identity, requestId: randomUUID(), message: { type: 'START_GAME' } });
  const game = JSON.parse((await store.read(identity.roomCode!))!).room.game;
  const actorIndex = game.currentPlayer;
  const tradeIdentity = actorIndex === 0 ? identity : { ...identity, token: guest.token, connectionId: guestId };
  await service.handle({
    ...tradeIdentity,
    requestId: randomUUID(),
    message: {
      type: 'PROPOSE_TRADE',
      offer: {
        fromId: `player-${actorIndex + 1}`,
        toId: `player-${2 - actorIndex}`,
        giveTileId: null,
        takeTileId: null,
        giveCash: 100,
        takeCash: 0,
      },
    },
  });
  const old = (await store.read(identity.roomCode!))!;
  const stored = JSON.parse(old);
  stored.room.pendingTrade.expiresAt = Date.now() + 200;
  stored.revision++;
  await store.compareAndSet(identity.roomCode!, old, JSON.stringify(stored));
  const abort = new AbortController();
  const response = await roomEventsPost(request(identity, abort.signal), store);
  const reader = response.body!.getReader();
  try {
    const first = await event(reader);
    assert.ok(first.type === 'ROOM_STATE' && first.room.pendingTrade);
    const expired = await event(reader);
    assert.ok(expired.type === 'ROOM_STATE');
    assert.equal(expired.room.pendingTrade, null);
    assert.deepEqual(
      expired.room.game!.players.map((player) => player.cash),
      [1500, 1500],
    );
    assert.equal(expired.room.game!.seed, 0);
    assert.ok(expired.room.game!.decks.chance.every((id) => id === 'hidden'));
  } finally {
    abort.abort();
    await reader.cancel();
  }
});
