import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '../src';

test('paying for island release deducts exactly 200 once and preserves the roll', () => {
  const state = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  Object.assign(state.players[0], { jailed: true, jailTurns: 1, position: 8 });
  const result = reduceGame(state, { type: 'PAY_BAIL' });
  assert.equal(result.error, null);
  assert.equal(result.players[0].cash, 1300);
  assert.equal(result.players[0].jailed, false);
  assert.equal(result.phase, 'roll');
  assert.equal(result.players[0].position, 8);
  assert.ok(reduceGame(result, { type: 'PAY_BAIL' }).error);
  const poor = structuredClone(state);
  poor.players[0].cash = 199;
  const rejected = reduceGame(poor, { type: 'PAY_BAIL' });
  assert.ok(rejected.error);
  assert.equal(rejected.players[0].cash, 199);
  assert.equal(rejected.players[0].jailed, true);
});

test('only a successful reveal publishes a durable card event, including repeat draws', () => {
  const state = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  state.phase = 'card';
  state.drawnCard = { deck: 'chance', cardId: 'chance-01', revealed: false };
  assert.equal(state.lastRevealedCard, undefined);
  const revealed = reduceGame(state, { type: 'DRAW_CARD' });
  assert.equal(revealed.error, null);
  assert.deepEqual(revealed.lastRevealedCard, {
    id: state.nextLogId,
    playerId: state.players[0].id,
    deck: 'chance',
    cardId: 'chance-01',
  });
  assert.deepEqual(
    reduceGame(revealed, { type: 'DRAW_CARD' }).lastRevealedCard,
    revealed.lastRevealedCard,
  );
  const resolved = reduceGame(revealed, { type: 'RESOLVE_CARD' });
  assert.deepEqual(resolved.lastRevealedCard, revealed.lastRevealedCard);
  resolved.phase = 'card';
  resolved.drawnCard = { deck: 'chance', cardId: 'chance-01', revealed: false };
  const next = reduceGame(resolved, { type: 'DRAW_CARD' });
  assert.ok(next.lastRevealedCard!.id > revealed.lastRevealedCard!.id);
});
