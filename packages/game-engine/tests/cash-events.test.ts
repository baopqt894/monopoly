import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame, rentFor } from '../src';
import { changeCash } from '../src/cash-events';

const game = () =>
  createGame({
    names: ['An', 'Bình'],
    boardId: 'vietnam-32',
    boardLayout: 'districts-v1',
    propertyRules: 'landing-v1',
    propertyPricing: 'business-tour-v2',
    liquidationRules: 'full-value-v1',
    seed: 42,
  });
test('one roll records GO salary at the crossed step, then rent at arrival without netting them', () => {
  const initial = game();
  initial.players[0].position = 31;
  initial.properties[5] = {
    ownerId: 'player-2',
    level: 4,
    mortgaged: false,
    business: 'residence',
  };
  const rent = rentFor(initial, 5);
  const next = reduceGame(initial, { type: 'ROLL', dice: [2, 4] });
  const [salary, payment] = next.cashEvents!;
  assert.equal(next.cashEvents!.length, 2);
  assert.deepEqual(salary.changes, [{ playerId: 'player-1', amount: 200, balance: 1700 }]);
  assert.deepEqual(salary.trigger, { movementId: next.movement!.id, at: 'step', stepIndex: 0 });
  assert.deepEqual(payment.trigger, { movementId: next.movement!.id, at: 'arrival' });
  assert.deepEqual(payment.changes, [
    { playerId: 'player-1', amount: -rent, balance: 1700 - rent },
    { playerId: 'player-2', amount: rent, balance: 1500 + rent },
  ]);
  assert.equal(next.players[0].cash, 1700 - rent);
  assert.equal(initial.cashEvents, undefined);
});
test('flight fee is immediate and GO salary belongs to its actual crossing step', () => {
  const initial = game();
  initial.players[0].position = 24;
  initial.players[0].flight = 'ready';
  const next = reduceGame(initial, { type: 'FLY', tileId: 23 });
  assert.equal(next.error, null);
  assert.equal(next.cashEvents!.length, 2);
  assert.deepEqual(next.cashEvents![0].changes, [
    { playerId: 'player-1', amount: -50, balance: 1450 },
  ]);
  assert.equal(next.cashEvents![0].trigger, undefined);
  assert.deepEqual(next.cashEvents![1].trigger, {
    movementId: next.movement!.id,
    at: 'step',
    stepIndex: 7,
  });
  assert.equal(next.cashEvents![1].changes[0].balance, 1650);
});
test('backward movement over GO never publishes a salary event', () => {
  const initial = game();
  initial.players[0].position = 1;
  initial.phase = 'card';
  initial.drawnCard = { deck: 'chance', cardId: 'chance-10', revealed: true };
  const next = reduceGame(initial, { type: 'RESOLVE_CARD' });
  assert.deepEqual(next.movement!.path, [0, 31, 30]);
  assert.ok(next.cashEvents?.length);
  assert.ok(next.cashEvents!.every((event) => event.changes.every((change) => change.amount < 0)));
});
test('liquidation records sale income before payment to the creditor, including partial insolvency', () => {
  const initial = game();
  initial.players[0].cash = 0;
  initial.phase = 'end';
  initial.properties[1] = {
    ownerId: 'player-1',
    level: 2,
    mortgaged: false,
    business: 'residence',
  };
  initial.debt = {
    debtorId: 'player-1',
    creditorId: 'player-2',
    amount: 9999,
    reason: 'rent',
    selectedTileIds: [],
  };
  const next = reduceGame(initial, { type: 'DECLARE_BANKRUPTCY' });
  assert.equal(next.players[0].bankrupt, true);
  assert.equal(next.cashEvents!.length, 2);
  const [sold, paid] = next.cashEvents!;
  assert.ok(sold.changes[0].amount > 0);
  assert.equal(paid.changes[0].amount, -sold.changes[0].amount);
  assert.equal(paid.changes[1].balance, next.players[1].cash);
});
test('ledger is bounded, monotonic, ignores zero changes and rejected actions add nothing', () => {
  const initial = game();
  for (let i = 0; i < 70; i++)
    changeCash(initial, [{ player: initial.players[0], amount: 1 }], 'income');
  assert.equal(initial.cashEvents!.length, 64);
  assert.equal(initial.cashEvents![0].id, 7);
  assert.equal(initial.cashEvents!.at(-1)!.id, 70);
  changeCash(initial, [{ player: initial.players[0], amount: 0 }], 'zero');
  assert.equal(initial.cashEvents!.at(-1)!.id, 70);
  const rejected = reduceGame(initial, { type: 'BUY' });
  assert.ok(rejected.error);
  assert.deepEqual(rejected.cashEvents, initial.cashEvents);
});
