import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardFor } from '@typhu/game-content';
import { createGame, reduceGame, flightTargets } from '../src';
for (const layout of [
  {},
  { boardId: 'vietnam-32' as const },
  { boardId: 'vietnam-32' as const, boardLayout: 'districts-v1' as const },
]) {
  const name = layout.boardLayout ?? layout.boardId ?? '40-tile';
  function ready() {
    const s = createGame({
      ...layout,
      names: ['An', 'Bình'],
      propertyRules: 'landing-v1',
      seed: 42,
    });
    s.players[0].position = boardFor(s).find((t) => t.kind === 'airport')!.id;
    s.players[0].flight = 'ready';
    return s;
  }
  test(`${name}: card, tax, festival and island targets are blocked without consuming flight or money`, () => {
    const s = ready();
    for (const tile of boardFor(s).filter((t) =>
      ['chance', 'chest', 'tax', 'parking', 'jail'].includes(t.kind),
    )) {
      assert.ok(!flightTargets(s).includes(tile.id));
      const denied = reduceGame(s, { type: 'FLY', tileId: tile.id });
      assert.ok(denied.error, tile.name);
      assert.equal(denied.players[0].cash, s.players[0].cash);
      assert.equal(denied.players[0].position, s.players[0].position);
      assert.equal(denied.players[0].flight, 'ready');
      assert.equal(denied.seed, s.seed);
      assert.deepEqual(denied.decks, s.decks);
      assert.deepEqual(denied.movement, s.movement);
      assert.equal(denied.phase, 'roll');
    }
    for (const tile of boardFor(s).filter((t) => ['go', 'airport'].includes(t.kind))) {
      assert.ok(flightTargets(s).includes(tile.id));
      assert.equal(reduceGame(s, { type: 'FLY', tileId: tile.id }).error, null);
    }
  });
  test(`${name}: blocked flight destinations still work when reached by a normal dice roll`, () => {
    for (const tile of boardFor(ready()).filter((t) =>
      ['chance', 'chest', 'tax', 'parking'].includes(t.kind),
    )) {
      const s = ready();
      delete s.players[0].flight;
      s.players[0].position = (tile.id - 3 + boardFor(s).length) % boardFor(s).length;
      const city = boardFor(s).find((t) => t.kind === 'street')!;
      s.properties[city.id] = {
        ownerId: 'player-1',
        level: 1,
        mortgaged: false,
        business: 'residence',
      };
      const walked = reduceGame(s, { type: 'ROLL', dice: [1, 2] });
      assert.equal(walked.error, null);
      assert.equal(walked.players[0].position, tile.id);
      assert.equal(
        walked.phase,
        ['chance', 'chest'].includes(tile.kind)
          ? 'card'
          : tile.kind === 'parking'
            ? 'festival'
            : 'end',
      );
    }
  });
}
