import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { VIETNAM_PAWNS, isVietnamPawn } from '@typhu/game-content';
import { drawPawnTokens } from '../src/room-pawns';
import { HttpRoomService } from '../src/http-room-service';
import { MemoryRoomStore } from '../src/room-store';
import type { RoomResponse } from '@typhu/contracts/http';

test('cosmetic sampling draws without replacement and can reach both ends of the catalog', () => {
  const before = structuredClone(VIETNAM_PAWNS);
  assert.deepEqual(
    drawPawnTokens(4, () => 0),
    VIETNAM_PAWNS.slice(0, 4).map((pawn) => pawn.id),
  );
  assert.deepEqual(
    drawPawnTokens(4, (max) => max - 1),
    [...VIETNAM_PAWNS]
      .reverse()
      .slice(0, 4)
      .map((pawn) => pawn.id),
  );
  for (const count of [2, 3, 4]) {
    const tokens = drawPawnTokens(count);
    assert.equal(new Set(tokens).size, count);
    assert.ok(tokens.every(isVietnamPawn));
  }
  assert.deepEqual(VIETNAM_PAWNS, before);
  for (const count of [0, 1, 5, 2.5]) assert.throws(() => drawPawnTokens(count));
});

test('server assigns and persists unique models; duplicate start, new instances, actions and reconnect cannot reroll them', async () => {
  const store = new MemoryRoomStore();
  const connectionIds = Array.from({ length: 4 }, () => randomUUID());
  const identities: { roomCode?: string; token?: string }[] = [{}, {}, {}, {}];
  async function send(index: number, message: unknown, requestId = randomUUID()) {
    const result = await new HttpRoomService(store).handle({
      connectionId: connectionIds[index],
      requestId,
      ...identities[index],
      message,
    });
    const session = result.messages.find((entry) => entry.type === 'SESSION');
    if (session?.type === 'SESSION')
      identities[index] = { roomCode: session.room.code, token: session.token };
    return result;
  }
  function room(response: RoomResponse) {
    const result = response.messages.find((entry) => 'room' in entry);
    assert.ok(result && 'room' in result, JSON.stringify(response));
    return result.room;
  }
  const created = room(
    await send(0, {
      type: 'CREATE_ROOM',
      name: 'Host',
      maxPlayers: 4,
      boardId: 'vietnam-32',
      token: 'hacked',
    }),
  );
  for (let i = 1; i < 4; i++) {
    await send(i, { type: 'JOIN_ROOM', name: `Guest ${i}`, code: created.code });
    await send(i, { type: 'SET_READY', ready: true });
  }
  const requestId = randomUUID();
  const first = room(await send(0, { type: 'START_GAME', tokens: ['hacked'] }, requestId));
  const tokens = first.game!.players.map((player) => player.token);
  assert.equal(new Set(tokens).size, 4);
  assert.ok(tokens.every(isVietnamPawn));
  assert.deepEqual(
    room(await send(0, { type: 'START_GAME' }, requestId)).game!.players.map((p) => p.token),
    tokens,
  );
  for (let i = 0; i < 4; i++)
    assert.deepEqual(
      room(await send(i, null)).game!.players.map((p) => p.token),
      tokens,
    );
  connectionIds[1] = randomUUID();
  assert.deepEqual(
    room(await send(1, { type: 'RECONNECT', token: identities[1].token })).game!.players.map(
      (p) => p.token,
    ),
    tokens,
  );
  await send(0, { type: 'ACTION', action: { type: 'SET_TOKEN', token: 'hacked' } });
  assert.deepEqual(
    room(await send(0, null)).game!.players.map((p) => p.token),
    tokens,
  );
  const saved = JSON.parse((await store.read(created.code))!);
  assert.deepEqual(
    saved.room.game.players.map((p: { token: string }) => p.token),
    tokens,
  );
  // Reading a saved room with older models must preserve those identities.
  saved.room.game.players[0].token = 'leaf';
  const previous = (await store.read(created.code))!;
  assert.equal(await store.compareAndSet(created.code, previous, JSON.stringify(saved)), true);
  assert.equal(room(await send(0, null)).game!.players[0].token, 'leaf');
});
