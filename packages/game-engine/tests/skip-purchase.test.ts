import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardFor } from '@typhu/game-content';
import { createGame, finishIdleTurn, purchaseQuote, reduceGame } from '../src';

const configurations = [
  {},
  { propertyRules: 'landing-v1' as const },
  { propertyRules: 'landing-v1' as const, propertyPricing: 'level-one-included' as const },
  { propertyRules: 'landing-v1' as const, propertyPricing: 'business-tour-v2' as const, boardId: 'vietnam-32' as const, boardLayout: 'districts-v1' as const },
];

for (const config of configurations) {
  test(`unaffordable landing skips purchase; exact minimum still allows buying: ${JSON.stringify(config)}`, () => {
    const state = createGame({ names: ['An', 'Bình'], mode: 'classic', seed: 123, ...config });
    const target = boardFor(state).find(tile => tile.kind === 'street' && tile.id >= 3)!;
    state.players[0].position = target.id - 3;
    const landed = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
    const minimum = purchaseQuote(landed, target.id).cost;
    for (const cash of [minimum - 1, minimum]) {
      state.players[0].cash = cash;
      const before = structuredClone(state);
      const next = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
      assert.equal(next.error, null);
      assert.equal(next.phase, cash < minimum ? 'roll' : 'purchase');
      assert.equal(next.currentPlayer, cash < minimum ? 1 : 0);
      assert.equal(next.players[0].cash, cash);
      assert.equal(next.properties[target.id], undefined);
      assert.equal(next.auction, null);
      assert.equal(next.movement?.playerId, state.players[0].id);
      assert.deepEqual(state, before);
      if (cash === minimum) assert.equal(reduceGame(next, { type: 'BUY' }).players[0].cash, 0);
    }
  });
}

test('manual skip and unaffordable landing both preserve doubles without an extra end step', () => {
  for (const cash of [0, 1500]) {
    const state = createGame({ names: ['An', 'Bình'], seed: 123 });
    state.players[0].position = 1;
    state.players[0].cash = cash;
    const landed = reduceGame(state, { type: 'ROLL', dice: [1, 1] });
    const next = cash ? reduceGame(landed, { type: 'SKIP_PURCHASE' }) : landed;
    assert.equal(next.phase, 'roll');
    assert.equal(next.currentPlayer, 0);
    assert.equal(next.doubles, 1);
    assert.equal(next.extraRoll, false);
    assert.equal(next.propertyVisit, undefined);
  }
});

test('unaffordable flight destination still gives the passenger their normal roll', () => {
  const state = createGame({ names: ['An', 'Bình'], seed: 123 });
  state.players[0].flight = 'ready';
  state.players[0].cash = 50;
  const next = reduceGame(state, { type: 'FLY', tileId: 3 });
  assert.equal(next.error, null);
  assert.equal(next.phase, 'roll');
  assert.equal(next.currentPlayer, 0);
  assert.equal(next.players[0].cash, 0);
  assert.equal(next.flightRollPending, undefined);
  assert.equal(next.properties[3], undefined);
});

test('restored unaffordable purchase advances despite available cash trades, without changing the input', () => {
  const state = createGame({ names: ['An', 'Bình'], seed: 123 });
  state.phase = 'purchase';
  state.players[0].position = 3;
  state.players[0].cash = 1;
  const before = structuredClone(state);
  assert.equal(finishIdleTurn(state).currentPlayer, 1);
  assert.deepEqual(state, before);
  state.debt = { debtorId: state.players[0].id, amount: 10, creditorId: null, reason: 'test' };
  assert.equal(finishIdleTurn(state), state);
});

test('skipping on the last turn finishes a round-limited game', () => {
  const state = createGame({ names: ['An', 'Bình'], mode: 'city', maxRounds: 8, seed: 123 });
  state.currentPlayer = 1;
  state.round = state.maxRounds;
  state.phase = 'purchase';
  state.players[1].position = 3;
  const next = reduceGame(state, { type: 'SKIP_PURCHASE' });
  assert.equal(next.error, null);
  assert.equal(next.phase, 'finished');
});
