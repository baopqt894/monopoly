import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '../src';
import { rollFeedback } from '../../../apps/web/src/features/game/roll-feedback';

test('feedback shows only the total and the authoritative destination, including a GO crossing', () => {
  const state = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  assert.equal(rollFeedback(state), null);
  state.players[0].position = 29;
  const rolled = reduceGame(state, { type: 'ROLL', dice: [2, 3] });
  assert.deepEqual(rollFeedback(rolled), { total: 5, doubles: false, destinationId: 2 });
});

test('doubles are announced even when the third double sends the player to the island instead of the sum destination', () => {
  const state = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  state.doubles = 2;
  const rolled = reduceGame(state, { type: 'ROLL', dice: [3, 3] });
  assert.deepEqual(rollFeedback(rolled), { total: 6, doubles: true, destinationId: 8 });
});

test('failed island attempts never mark an old movement as the new roll destination', () => {
  const state = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  state.players[0].jailed = true; state.players[0].position = 8;
  state.movement = { id: 0, rollId: 0, playerId: 'player-1', path: [8] };
  state.nextLogId = 20;
  const rolled = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  assert.deepEqual(rollFeedback(rolled), { total: 3, doubles: false, destinationId: null });
});

test('card and flight movement, mismatched players and missing paths never supply a dice target', () => {
  const rolled = reduceGame(createGame({ names: ['An', 'Bình'] }), { type: 'ROLL', dice: [2, 2] });
  assert.equal(rollFeedback(rolled)?.destinationId, 4);
  for (const patch of [{ mode: 'card' as const }, { mode: 'flight' as const }, { playerId: 'player-2' }, { path: [] }]) {
    const state = structuredClone(rolled);
    Object.assign(state.movement!, patch);
    assert.equal(rollFeedback(state)?.destinationId, null);
  }
});
