import test from 'node:test';
import assert from 'node:assert/strict';
import { boardFor } from '@typhu/game-content';
import { createGame, reduceGame, flightTargets, timeoutAction, taxFor, propertyValue } from '../src';

for (const boardId of [undefined, 'vietnam-32'] as const) {
  test(`${boardId ?? 'legacy'}: flight permits own lots and rejects enemy properties and island without spending or moving`, () => {
    const game = createGame({ boardId, names: ['A', 'B'], propertyRules: 'landing-v1' });
    game.players[0].flight = 'ready';
    game.players[0].position = boardFor(game).find(tile => tile.kind === 'airport')!.id;
    const cities = boardFor(game).filter(tile => tile.kind === 'street');
    cities.slice(0, 2).forEach((tile, i) => game.properties[tile.id] = {ownerId: game.players[i].id, level: 1, mortgaged: false, business: 'residence'});
    const island = boardFor(game).find(tile => tile.kind === 'jail')!;
    for (const id of [cities[1].id, island.id]) {
      assert.ok(!flightTargets(game).includes(id));
      const denied = reduceGame(game, {type:'FLY', tileId:id});
      assert.ok(denied.error);
      assert.equal(denied.players[0].cash, 1500);
      assert.equal(denied.players[0].flight, 'ready');
      assert.equal(denied.players[0].position, game.players[0].position);
      assert.equal(denied.seed, game.seed);
    }
    assert.ok(flightTargets(game).includes(cities[0].id));
    assert.ok(flightTargets(game).includes(cities[2].id));
  });
  test(`${boardId ?? 'legacy'}: timeout discards flight, rolls exactly once and pays no airfare`, () => {
    const game = createGame({boardId, names:['A','B'], seed:123});
    game.players[0].flight = 'ready';
    game.players[0].position = boardFor(game).find(tile => tile.kind === 'airport')!.id;
    const action = timeoutAction(game)!;
    assert.equal(action.type, 'SKIP_FLIGHT');
    const next = reduceGame(game, action);
    const reference = structuredClone(game); delete reference.players[0].flight;
    const rolled = reduceGame(reference, {type:'ROLL'});
    assert.equal(next.error, null);
    assert.equal(next.players[0].flight, rolled.players[0].flight);
    assert.equal(next.players[0].cash, rolled.players[0].cash);
    assert.equal(next.players[0].position, rolled.players[0].position);
    assert.deepEqual(next.dice, rolled.dice);
    assert.equal(next.log.filter(entry => / tung [1-6] và [1-6]/.test(entry.message)).length, 1);
    assert.ok(reduceGame(next, action).error);
  });
}

test('full-asset tax uses level-one-inclusive values, including landmark/resort but no opponent wealth', () => {
  const game = createGame({boardId:'vietnam-32', propertyRules:'landing-v1', propertyPricing:'level-one-included'});
  game.players[0].cash = 123;
  game.properties[1] = {ownerId:'player-1',level:5,mortgaged:false,business:'residence'};
  game.properties[4] = {ownerId:'player-1',level:0,mortgaged:false,business:'residence'};
  game.properties[2] = {ownerId:'player-2',level:5,mortgaged:false,business:'residence'};
  assert.equal(taxFor(game), Math.ceil((123 + propertyValue(game, 1) + propertyValue(game, 4)) / 10));
  game.properties[1].disabledLaps = 3;
  assert.equal(taxFor(game), Math.ceil((123 + propertyValue(game, 1) + propertyValue(game, 4)) / 10));
});
