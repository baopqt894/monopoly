import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { ClientMessage, RoomSnapshot } from '@typhu/contracts/multiplayer';
import { HttpRoomService } from '../src/http-room-service';
import { MemoryRoomStore } from '../src/room-store';

function fixture() {
  let now = 1000;
  const store = new MemoryRoomStore();
  function client() {
    const connectionId = randomUUID();
    let identity: { token?: string; roomCode?: string } = {};
    return {
      identity: () => identity,
      send: async (message: ClientMessage | null, requestId = randomUUID()) => {
        const result = await new HttpRoomService(store, () => now).handle({
          connectionId,
          requestId,
          ...identity,
          message,
        });
        const session = result.messages.find((message) => message.type === 'SESSION');
        if (session?.type === 'SESSION')
          identity = { token: session.token, roomCode: session.room.code };
        return result;
      },
    };
  }
  return {
    store,
    client,
    tick: () => {
      now += 1000;
    },
  };
}
function snapshot(
  result: Awaited<ReturnType<ReturnType<ReturnType<typeof fixture>['client']>['send']>>,
): RoomSnapshot {
  const entry = result.messages.find((message) => 'room' in message);
  assert.ok(entry && 'room' in entry);
  return entry.room;
}
test('chat authenticates sender, persists across HTTP instances, deduplicates retries and preserves action deadline', async () => {
  const qa = fixture(),
    host = qa.client(),
    guest = qa.client();
  const room = snapshot(
    await host.send({ type: 'CREATE_ROOM', name: 'An', maxPlayers: 2, boardId: 'vietnam-32' }),
  );
  await guest.send({ type: 'JOIN_ROOM', name: 'Bình', code: room.code });
  await guest.send({ type: 'SET_READY', ready: true });
  const playing = snapshot(await host.send({ type: 'START_GAME' }));
  const deadline = playing.actionDeadlineAt;
  const requestId = randomUUID();
  const message = {
    type: 'CHAT',
    text: '  Xin chào <b>mọi người</b>  ',
    name: 'Mạo danh',
  } as ClientMessage;
  const first = snapshot(await host.send(message, requestId));
  assert.equal(first.chat!.length, 1);
  assert.equal(first.chat![0].name, 'An');
  assert.equal(first.chat![0].text, 'Xin chào <b>mọi người</b>');
  const repeated = snapshot(await host.send(message, requestId));
  assert.equal(repeated.chat!.length, 1);
  assert.equal(repeated.actionDeadlineAt, deadline);
  assert.equal((await host.send({ type: 'CHAT', text: 'Spam' })).messages[0].type, 'ERROR');
  assert.equal(snapshot(await guest.send(null)).chat![0].id, first.chat![0].id);
  const outsider = await new HttpRoomService(qa.store).handle({
    connectionId: randomUUID(),
    requestId: randomUUID(),
    roomCode: room.code,
    token: randomUUID(),
    message: { type: 'CHAT', text: 'Xâm nhập' },
  });
  assert.equal(outsider.messages[0].type, 'ERROR');
  const publicJson = JSON.stringify(first);
  assert.ok(!publicJson.includes(host.identity().token!));
  qa.tick();
  assert.equal(snapshot(await guest.send({ type: 'CHAT', text: 'Đã nhận!' })).chat!.length, 2);
});
test('chat rejects invalid text and bounds persisted history to the newest fifty messages', async () => {
  const qa = fixture(),
    host = qa.client();
  await host.send({ type: 'CREATE_ROOM', name: 'An', maxPlayers: 2 });
  for (const text of ['', ' '.repeat(5), 'a'.repeat(241), '\u0000', 123]) {
    const response = await host.send({ type: 'CHAT', text } as ClientMessage);
    assert.equal(response.messages[0].type, 'ERROR');
  }
  for (let i = 0; i < 55; i++) {
    qa.tick();
    const result = await host.send({ type: 'CHAT', text: `Tin ${i}` });
    assert.equal(snapshot(result).chat!.at(-1)!.text, `Tin ${i}`);
  }
  const result = snapshot(await host.send(null));
  assert.equal(result.chat!.length, 50);
  assert.equal(result.chat![0].text, 'Tin 5');
});
