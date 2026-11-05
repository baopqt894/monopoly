import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardFor } from '@typhu/game-content';
import { createGame, reduceGame, flightTargets, buildProblem } from '../src';
const layouts = [
  {},
  { boardId: 'vietnam-32' as const },
  { boardId: 'vietnam-32' as const, boardLayout: 'districts-v1' as const },
];
for (const layout of layouts) {
  const name = layout.boardLayout ?? layout.boardId ?? '40-tile';
  function ready() {
    const s = createGame({
      ...layout,
      names: ['An', 'Bình'],
      propertyRules: 'landing-v1',
      propertyPricing: layout.boardId ? 'business-tour-v2' : 'level-one-included',
      seed: 42,
    });
    s.players[0].position = boardFor(s).find((t) => t.kind === 'airport')!.id;
    s.players[0].flight = 'ready';
    return s;
  }
  test(`${name}: own houses lv1–5 and resorts are selectable; only one airfare and no self-rent`, () => {
    for (const tile of boardFor(ready()).filter((t) => t.kind === 'street' || t.resort)) {
      for (const level of tile.kind === 'street' ? [1, 2, 3, 4, 5] : [0]) {
        const s = ready();
        s.properties[tile.id] = {
          ownerId: 'player-1',
          level,
          mortgaged: false,
          business: 'residence',
        };
        assert.ok(flightTargets(s).includes(tile.id));
        const next = reduceGame(s, { type: 'FLY', tileId: tile.id });
        assert.equal(next.error, null);
        assert.equal(next.players[0].position, tile.id);
        assert.equal(next.properties[tile.id].ownerId, 'player-1');
        const passed = tile.id < s.players[0].position;
        assert.equal(next.players[0].cash, 1500 - 50 + (passed ? 200 : 0));
        assert.equal(next.players[1].cash, 1500);
        assert.equal(next.players[0].completedLaps, passed ? 1 : 0);
        assert.equal(next.players[0].flight, undefined);
        assert.equal(next.flightRollPending, true);
        const duplicate = reduceGame(next, { type: 'FLY', tileId: tile.id });
        assert.ok(duplicate.error);
        assert.equal(duplicate.players[0].cash, next.players[0].cash);
      }
    }
  });
  test(`${name}: landing on own lv4 across GO allows landmark upgrade and preserves a normal roll afterward`, () => {
    const s = ready();
    const tile = boardFor(s).find((t) => t.kind === 'street')!;
    s.properties[tile.id] = {
      ownerId: 'player-1',
      level: 4,
      mortgaged: false,
      business: 'residence',
    };
    const landed = reduceGame(s, { type: 'FLY', tileId: tile.id });
    assert.equal(landed.error, null);
    assert.equal(landed.propertyVisit?.tileId, tile.id);
    assert.equal(landed.propertyVisit?.levelOnArrival, 4);
    assert.equal(buildProblem(landed, tile.id, 5), null);
    const built = reduceGame(landed, { type: 'BUILD', tileId: tile.id, level: 5 });
    assert.equal(built.error, null);
    assert.equal(built.properties[tile.id].level, 5);
    const roll = reduceGame(built, { type: 'END_TURN' });
    assert.equal(roll.error, null);
    assert.equal(roll.currentPlayer, 0);
    assert.equal(roll.phase, 'roll');
    assert.equal(reduceGame(roll, { type: 'ROLL', dice: [1, 2] }).error, null);
  });
}
test('own flight destination follows current player, never the host or player zero', () => {
  const s = createGame({
    boardId: 'vietnam-32',
    boardLayout: 'districts-v1',
    propertyRules: 'landing-v1',
    names: ['A', 'B'],
  });
  s.currentPlayer = 1;
  s.players[1].flight = 'ready';
  s.players[1].position = 24;
  s.properties[1] = { ownerId: 'player-1', level: 3, mortgaged: false, business: 'residence' };
  s.properties[2] = { ownerId: 'player-2', level: 3, mortgaged: false, business: 'residence' };
  assert.ok(!flightTargets(s).includes(1));
  assert.ok(flightTargets(s).includes(2));
  const next = reduceGame(s, { type: 'FLY', tileId: 2 });
  assert.equal(next.error, null);
  assert.equal(next.players[1].position, 2);
});
