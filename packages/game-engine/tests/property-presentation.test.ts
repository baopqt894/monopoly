import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '../src';
function card(id: string) {
  const s = createGame({
    names: ['A', 'B', 'C'],
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
    liquidationRules: 'full-value-v1',
  });
  s.properties[1] = { ownerId: 'player-2', level: 3, mortgaged: false, business: 'residence' };
  s.phase = 'card';
  s.drawnCard = { deck: 'chance', cardId: id, revealed: true };
  return s;
}
test('validated property cards expose precise target and removal cause for all clients', () => {
  for (const [id, kind] of [
    ['chance-17', 'destroy'],
    ['chance-18', 'destroy'],
    ['chance-19', 'sell'],
  ]) {
    const s = card(id),
      next = reduceGame(s, { type: 'RESOLVE_CARD', targetTileId: 1 });
    assert.equal(next.error, null);
    assert.deepEqual(next.log.find((e) => e.propertyChange)?.propertyChange, { tileId: 1, kind });
    assert.equal(
      s.log.some((e) => e.propertyChange),
      false,
    );
    assert.deepEqual(JSON.parse(JSON.stringify(next)).log[0].propertyChange, { tileId: 1, kind });
  }
});
test('power outage and rejected final-tier destruction produce no removal cue', () => {
  const s = card('chance-20');
  const next = reduceGame(s, { type: 'RESOLVE_CARD', targetTileId: 1 });
  assert.equal(next.error, null);
  assert.equal(
    next.log.some((e) => e.propertyChange),
    false,
  );
  const protectedLot = card('chance-17');
  protectedLot.properties[1].level = 5;
  const rejected = reduceGame(protectedLot, { type: 'RESOLVE_CARD', targetTileId: 1 });
  assert.ok(rejected.error);
  assert.equal(
    rejected.log.some((e) => e.propertyChange),
    false,
  );
});
test('bulk debt sales tag each sold lot independently and keep the monetary result', () => {
  const s = card('chance-17');
  s.phase = 'end';
  s.drawnCard = null;
  s.players[0].cash = 0;
  s.properties = {};
  for (const id of [1, 4])
    s.properties[id] = {
      ownerId: 'player-1',
      level: id === 1 ? 1 : 0,
      mortgaged: false,
      business: 'residence',
    };
  s.debt = {
    id: 10,
    debtorId: 'player-1',
    creditorId: 'player-2',
    amount: 200,
    reason: 'rent',
    selectedTileIds: [1, 4],
  };
  const next = reduceGame(s, { type: 'LIQUIDATE_SELECTED' });
  assert.equal(next.error, null);
  assert.equal(next.debt, null);
  assert.equal(next.players[1].cash, 1700);
  assert.deepEqual(
    next.log
      .filter((e) => e.propertyChange)
      .map((e) => e.propertyChange)
      .sort((a, b) => a!.tileId - b!.tileId),
    [
      { tileId: 1, kind: 'sell' },
      { tileId: 4, kind: 'sell' },
    ],
  );
});
