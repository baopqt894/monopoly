import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { ClientMessage, RoomSnapshot } from '@typhu/contracts/multiplayer';
import type { RoomResponse } from '@typhu/contracts/http';
import { boardFor } from '@typhu/game-content';
import { automaticAction, chooseBotAction, ownedTiles } from '@typhu/game-engine';
import { HttpRoomService } from '../src/http-room-service';
import { MemoryRoomStore } from '../src/room-store';
function snapshot(response: RoomResponse): RoomSnapshot {
  const message = response.messages.find((m) => 'room' in m);
  assert.ok(message && 'room' in message, JSON.stringify(response.messages.map((m) => m.type)));
  return message.room;
}
for (const count of [2, 3, 4])
  test(`complete ${count}-seat 32-tile game via authenticated HTTP, including reload mid-game`, async () => {
    let now = Date.now();
    const store = new MemoryRoomStore();
    const identities = Array.from({ length: count }, () => ({
      connectionId: randomUUID(),
      token: '',
      roomCode: '',
    }));
    async function send(index: number, message: ClientMessage | null) {
      const result = await new HttpRoomService(store, () => now).handle({
        ...identities[index],
        requestId: randomUUID(),
        message,
      });
      const error = result.messages.find((m) => m.type === 'ERROR');
      assert.equal(
        error,
        undefined,
        error && 'message' in error ? String(error.message) : 'server rejected action',
      );
      const session = result.messages.find((m) => m.type === 'SESSION');
      if (session?.type === 'SESSION')
        Object.assign(identities[index], { token: session.token, roomCode: session.room.code });
      return snapshot(result);
    }
    let room = await send(0, {
      type: 'CREATE_ROOM',
      name: 'QA 1',
      maxPlayers: count,
      boardId: 'vietnam-32',
      eventTileCount: 3,
      startingCash: 1500,
    });
    const code = room.code;
    for (let i = 1; i < count; i++) {
      await send(i, { type: 'JOIN_ROOM', code, name: `QA ${i + 1}` });
      await send(i, { type: 'SET_READY', ready: true });
    }
    room = await send(0, { type: 'START_GAME' });
    const raw = (await store.read(code))!;
    const saved = JSON.parse(raw);
    saved.room.game.seed = 731 + count;
    assert.equal(await store.compareAndSet(code, raw, JSON.stringify(saved)), true);
    room = await send(0, null);
    let steps = 0;
    let reloaded = false;
    const seen = new Set<string>();
    while (room.game!.phase !== 'finished' && steps < 6000) {
      const game = room.game!;
      seen.add(game.phase);
      if (game.debt) seen.add('debt');
      assert.equal(boardFor(game).length, 32);
      for (const player of game.players) assert.ok(player.position >= 0 && player.position < 32);
      const actorId =
        game.debt?.debtorId ??
        (game.phase === 'auction' && game.auction
          ? game.players[game.auction.bidderIndex].id
          : game.players[game.currentPlayer].id);
      const actor = room.seats.findIndex((seat) => seat.gamePlayerId === actorId);
      assert.ok(actor >= 0);
      if(game.lastBoardEvent?.kind==='monopoly' && (room.actionStartsAt??now)>now){
        now=room.actionStartsAt!;room=await send(actor,null);steps++;continue;
      }
      if (automaticAction(game)) {
        now = Math.max(now, (room.actionStartsAt ?? now) + (game.phase === 'card' ? 1200 : 0));
        room = await send(actor, null);
        steps++;
        continue;
      }
      let action = chooseBotAction(game);
      assert.ok(action, `no action in ${game.phase}`);
      if (action.type === 'AUTO_LIQUIDATE') {
        action = game.debt!.selectedTileIds?.length
          ? { type: 'LIQUIDATE_SELECTED' }
          : {
              type: 'SET_LIQUIDATION_SELECTION',
              tileIds: ownedTiles(game, actorId).map((t) => t.id),
            };
        if (action.type === 'SET_LIQUIDATION_SELECTION' && !action.tileIds.length)
          action = { type: 'DECLARE_BANKRUPTCY' };
      }
      room = await send(actor, { type: 'ACTION', action });
      steps++;
      if (steps >= 12 && !reloaded && !automaticAction(room.game!)) {
        reloaded = true;
        const before = structuredClone(room.game);
        identities[0].connectionId = randomUUID();
        room = await send(0, { type: 'RECONNECT', token: identities[0].token });
        assert.deepEqual(
          room.game,
          before,
          'reload must not replay movement, charges or ownership',
        );
      }
    }
    assert.equal(room.game!.phase, 'finished', `did not finish after ${steps} actions`);
    assert.ok(room.game!.winnerId);
    assert.ok(reloaded, 'reload was checked at an interactive decision');
    assert.ok(room.game!.winReason);
    assert.ok(seen.has('purchase'));
    assert.ok(seen.has('card'));
    const result = structuredClone(room.game);
    identities[0].connectionId = randomUUID();
    room = await send(0, { type: 'RECONNECT', token: identities[0].token });
    assert.deepEqual(room.game, result, 'finished result survives reload');
    // Report the actual coverage of the full game, not assumptions about random landings.
    console.info(
      `${count} seats: ${steps} actions, phases ${[...seen].join('/')}, result ${room.game!.winReason}`,
    );
  });
