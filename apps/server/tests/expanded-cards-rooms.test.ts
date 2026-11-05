import { festivalRentMultiplier } from '@typhu/game-engine';
import type { GameState } from '@typhu/contracts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { ClientMessage, RoomSnapshot } from '@typhu/contracts/multiplayer';
import type { RoomResponse } from '@typhu/contracts/http';
import { HttpRoomService } from '../src/http-room-service';
import { MemoryRoomStore } from '../src/room-store';

const snapshot = (response: RoomResponse): RoomSnapshot => {
  const msg = response.messages.find((m) => 'room' in m);
  assert.ok(msg && 'room' in msg);
  return msg.room;
};
async function setup(festivalIncrement?: 0.25 | 0.5) {
  const store = new MemoryRoomStore(),
    identities = Array.from({ length: 3 }, () => ({
      connectionId: randomUUID(),
      token: '',
      roomCode: '',
    }));
  const send = async (index: number, message: ClientMessage | null, requestId = randomUUID()) => {
    const result = await new HttpRoomService(store).handle({
      ...identities[index],
      message,
      requestId,
    });
    const session = result.messages.find((m) => m.type === 'SESSION');
    if (session?.type === 'SESSION')
      Object.assign(identities[index], { token: session.token, roomCode: session.room.code });
    return result;
  };
  await send(0, {
    type: 'CREATE_ROOM',
    name: 'A',
    maxPlayers: 3,
    boardId: 'vietnam-32',
    eventTileCount: 2,
    festivalIncrement,
  });
  const code = identities[0].roomCode;
  for (let i = 1; i < 3; i++) {
    await send(i, { type: 'JOIN_ROOM', name: String.fromCharCode(65 + i), code });
    await send(i, { type: 'SET_READY', ready: true });
  }
  await send(0, { type: 'START_GAME' });
  const patch = async (edit: (game: GameState) => void) => {
    const old = (await store.read(code))!,
      saved = JSON.parse(old);
    saved.room.game.currentPlayer = 0;
    saved.room.game.startingPlayer = 0;
    delete saved.room.actionTimer;
    edit(saved.room.game);
    assert.equal(await store.compareAndSet(code, old, JSON.stringify(saved)), true);
  };
  return { store, send, code, patch, identities };
}

test('gift requires the actual card, actor and chosen owned asset/recipient; concurrent duplicate resolutions transfer exactly once and preserve the real winner', async () => {
  const { send, patch, store, code } = await setup();
  await patch((game) => {
    game.phase = 'card';
    game.drawnCard = { deck: 'chance', cardId: 'chance-23', revealed: true };
    game.properties[4] = { ownerId: 'player-1', level: 0, mortgaged: false, business: 'residence' };
    for (const id of [14, 18, 25])
      game.properties[id] = {
        ownerId: 'player-2',
        level: 0,
        mortgaged: false,
        business: 'residence',
      };
  });
  const action = { type: 'RESOLVE_CARD', targetTileId: 4, targetPlayerId: 'player-2' } as const;
  assert.equal((await send(1, { type: 'ACTION', action })).messages[0].type, 'ERROR');
  assert.equal(
    (await send(0, { type: 'ACTION', action: { ...action, targetTileId: 14 } })).messages[0].type,
    'ERROR',
  );
  const requestId = randomUUID();
  await Promise.all([
    send(0, { type: 'ACTION', action }, requestId),
    send(0, { type: 'ACTION', action }, requestId),
  ]);
  const room = snapshot(await send(1, null));
  assert.equal(room.game!.properties[4].ownerId, 'player-2');
  assert.equal(room.game!.winnerId, 'player-2');
  assert.equal(room.game!.winReason, 'resort-monopoly');
  assert.deepEqual(
    room.game!.players.map((p) => p.cash),
    [1500, 1500, 1500],
  );
  const saved = JSON.parse((await store.read(code))!);
  assert.equal(
    saved.room.game.log.filter((entry: { message: string }) =>
      entry.message.includes('tặng Phú Quốc'),
    ).length,
    1,
  );
});

test('hosting is actor/owner validated, duplicate requests cannot raise the level twice and public event fields remain distinct', async () => {
  const { send, patch } = await setup();
  await patch((game) => {
    game.phase = 'festival';
    game.properties[1] = { ownerId: 'player-1', level: 1, mortgaged: false, business: 'residence' };
    game.properties[3] = { ownerId: 'player-2', level: 1, mortgaged: false, business: 'residence' };
  });
  const initial = snapshot(await send(0, null));
  assert.equal(initial.eventTileCount, 2);
  assert.equal(initial.game!.eventTileIds!.length, 2);
  assert.equal(initial.game!.festivalTileId, null);
  assert.equal(
    (await send(1, { type: 'ACTION', action: { type: 'HOST_FESTIVAL', tileId: 3 } })).messages[0]
      .type,
    'ERROR',
  );
  assert.equal(
    (await send(0, { type: 'ACTION', action: { type: 'HOST_FESTIVAL', tileId: 3 } })).messages[0]
      .type,
    'ERROR',
  );
  const requestId = randomUUID();
  const action = { type: 'HOST_FESTIVAL', tileId: 1 } as const;
  await Promise.all([
    send(0, { type: 'ACTION', action }, requestId),
    send(0, { type: 'ACTION', action }, requestId),
  ]);
  const hosted = snapshot(await send(2, null));
  assert.equal(hosted.game!.festivalTileId, 1);
  assert.equal(hosted.game!.festivalLevel, 1);
  assert.deepEqual(hosted.game!.eventTileIds, initial.game!.eventTileIds);
  assert.equal((await send(0, { type: 'ACTION', action })).messages[0].type, 'ERROR');
});


test('festival increment persists through join/start/reconnect, cannot be changed by hosting, and rejects invalid creation values', async () => {
  const rejectedStore = new MemoryRoomStore();
  for (const festivalIncrement of [0, -1, 0.1, 1, null, '0.25']) {
    const rejected = await new HttpRoomService(rejectedStore).handle({
      connectionId: randomUUID(), requestId: randomUUID(),
      message: { type: 'CREATE_ROOM', name: 'Invalid', maxPlayers: 2, festivalIncrement } as never,
    });
    assert.equal(rejected.messages[0].type, 'ERROR');
  }
  const { send, patch, store, code, identities } = await setup(0.25);
  const initial = snapshot(await send(1, null));
  assert.equal(initial.festivalIncrement, 0.25);
  assert.equal(initial.game!.festivalIncrement, 0.25);
  await patch(game => {
    game.phase = 'festival';
    game.properties[1] = { ownerId: 'player-1', level: 1, mortgaged: false, business: 'residence' };
  });
  const hosted = snapshot(await send(0, { type: 'ACTION', action: { type: 'HOST_FESTIVAL', tileId: 1, festivalIncrement: 0.5 } } as never));
  assert.equal(hosted.game!.festivalLevel, 1);
  assert.equal(hosted.game!.festivalIncrement, 0.25);
  assert.equal(festivalRentMultiplier(hosted.game!, 1), 1.25);
  identities[1].connectionId = randomUUID();
  const resumed = snapshot(await send(1, { type: 'RECONNECT', token: identities[1].token }));
  assert.equal(resumed.festivalIncrement, 0.25);
  assert.equal(resumed.game!.festivalLevel, 1);
  assert.equal(resumed.game!.festivalIncrement, 0.25);
  const saved = JSON.parse((await store.read(code))!);
  assert.equal(saved.room.festivalIncrement, 0.25);
  assert.equal(saved.room.game.festivalIncrement, 0.25);
  assert.equal(snapshot(await (await setup()).send(0, null)).festivalIncrement, 0.5);
});
