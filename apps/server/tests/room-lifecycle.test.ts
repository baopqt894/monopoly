import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import type { RoomRequest } from '@typhu/contracts/http';
import { HttpRoomService, FINISHED_ROOM_TTL_MS, type StoredRoom } from '../src/http-room-service';
import { MemoryRoomStore } from '../src/room-store';
import { roomEventsPost } from '../src/room-events';

async function setup() {
  let time = Date.now();
  const store = new MemoryRoomStore();
  const send = (id: Partial<RoomRequest>, message: RoomRequest['message']) =>
    new HttpRoomService(store, () => time).handle({ connectionId: randomUUID(), ...id, requestId: randomUUID(), message });
  const ids: Partial<RoomRequest>[] = [];
  for (const name of ['Host', 'Guest']) {
    const id = { connectionId: randomUUID() };
    const response = await send(id, ids.length ? {type:'JOIN_ROOM', name, code: ids[0].roomCode!} : {type:'CREATE_ROOM', name, maxPlayers:2});
    const session = response.messages[0]; assert.equal(session.type, 'SESSION');
    if (session.type !== 'SESSION') throw new Error('Missing session');
    ids.push({...id, roomCode:session.room.code, token:session.token});
  }
  await send(ids[1], {type:'SET_READY', ready:true});
  await send(ids[0], {type:'START_GAME'});
  const code = ids[0].roomCode!;
  const patch = async (edit: (stored:StoredRoom)=>void) => {
    const before = (await store.read(code))!; const stored:StoredRoom = JSON.parse(before);
    edit(stored); assert.equal(await store.compareAndSet(code, before, JSON.stringify(stored)), true);
  };
  return {store, send, ids, code, patch, advance:(ms:number)=>{time+=ms;}, now:()=>time};
}

test('last human leaving deletes a bot-only room atomically and notifies subscribers', async () => {
  const {store, send, ids, code} = await setup();
  await send(ids[0], {type:'LEAVE_ROOM'});
  assert.notEqual(await store.read(code), null, 'a remaining human keeps the room');
  let deleted = false;
  const unsubscribe = await store.subscribe(code, value => { if(value===null) deleted=true; });
  await Promise.all([send(ids[1], {type:'LEAVE_ROOM'}), send(ids[1], {type:'LEAVE_ROOM'})]);
  assert.equal(await store.read(code), null);
  assert.equal(deleted, true);
  await unsubscribe();
});

test('legacy bot-only room is deleted on read instead of advancing bots', async () => {
  const {store, send, ids, code, patch} = await setup();
  await patch(({room}) => { room.seats.forEach(seat => {seat.bot=true;seat.connected=false;}); });
  const result = await send(ids[0], null);
  assert.equal(result.messages[0].type, 'ERROR');
  assert.equal(await store.read(code), null);
});

test('finished room has a fixed cleanup deadline that heartbeats and reconnects cannot extend', async () => {
  const {store, send, ids, code, patch, advance, now} = await setup();
  await patch(({room}) => { room.phase='finished';room.game!.phase='finished';delete room.matchEndedAt; });
  const response = await send(ids[0], null);
  const snapshot = response.messages[0]; assert.equal(snapshot.type, 'ROOM_STATE');
  if(snapshot.type!=='ROOM_STATE') return;
  assert.equal(snapshot.room.matchEndedAt, now());
  const ended = now();
  advance(FINISHED_ROOM_TTL_MS-1);
  assert.equal((await send(ids[0], {type:'RECONNECT',token:ids[0].token!})).messages[0].type,'SESSION');
  advance(2);
  assert.equal((await send(ids[0], null)).messages[0].type,'ERROR');
  assert.equal(await store.read(code),null);
  assert.ok(now()>ended+FINISHED_ROOM_TTL_MS);
});

test('finished SSE delivers the result then closes immediately without a subscription', async () => {
  const {store, ids, patch} = await setup();
  await patch(({room}) => { room.phase='finished';room.game!.phase='finished'; });
  let subscribed = false;
  store.subscribe = async () => {subscribed=true;return async()=>{};};
  const response = await roomEventsPost(new Request('https://game.test/api/room/events', {
    method:'POST',headers:{origin:'https://game.test','content-type':'application/json'},
    body:JSON.stringify({...ids[0],requestId:randomUUID(),message:null}),
  }),store);
  assert.match(await response.text(), /"phase":"finished"/);
  assert.equal(subscribed,false);
});

test('MemoryRoomStore expires finished snapshots at an absolute deadline', async () => {
  const store = new MemoryRoomStore();
  assert.equal(await store.compareAndSet('ABCDEF',null,'value',Date.now()-1),true);
  assert.equal(await store.read('ABCDEF'),null);
});
