import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProblem, createGame, reduceGame, rentFor } from '../src';

function game() {
  return createGame({ names: ['An', 'Bình'], seed: 123, propertyRules: 'landing-v1' });
}
function purchase(level?: number) {
  const state = reduceGame(game(), { type: 'ROLL', dice: [1, 2] });
  return reduceGame(state, { type: 'BUY', ...(level === undefined ? {} : { level }) });
}

test('buying a city atomically includes level one or the chosen eligible level, without needing its group', () => {
  const state = purchase();
  assert.equal(state.error, null); assert.equal(state.properties[3].level, 1);
  assert.equal(state.players[0].cash, 1390); assert.equal(state.phase, 'end');
  assert.equal(state.properties[1], undefined);
  const level3 = purchase(3);
  assert.equal(level3.properties[3].level, 3); assert.equal(level3.players[0].cash, 1290);
});

test('insufficient construction money or invalid levels leave ownership, cash and purchase phase untouched', () => {
  const state = reduceGame(game(), { type: 'ROLL', dice: [1, 2] });
  state.players[0].cash = 80;
  const failed = reduceGame(state, { type: 'BUY' });
  assert.ok(failed.error); assert.equal(failed.properties[3], undefined);
  assert.equal(failed.players[0].cash, 80); assert.equal(failed.phase, 'purchase');
  assert.deepEqual(state.properties, {});
  for (const level of [0, -1, 4, 5, 1.2, NaN, Infinity]) {
    const result = reduceGame(reduceGame(game(), { type: 'ROLL', dice: [1, 2] }), { type: 'BUY', level });
    assert.ok(result.error); assert.equal(result.properties[3], undefined); assert.equal(result.players[0].cash, 1500);
  }
});

test('first-lap cap is three, completed-lap cap is four, and purchasing level four never immediately unlocks five', () => {
  const state = purchase(3);
  assert.ok(buildProblem(state, 3));
  const crossed = game(); crossed.players[0].completedLaps = 1;
  const bought = reduceGame(reduceGame(crossed, { type: 'ROLL', dice: [1, 2] }), { type: 'BUY', level: 4 });
  assert.equal(bought.error, null); assert.equal(bought.properties[3].level, 4);
  assert.ok(reduceGame(bought, { type: 'BUILD', tileId: 3, level: 5 }).error);
  const beforeCrossing = game(); beforeCrossing.players[0].position = 39;
  const crossedAndBought = reduceGame(reduceGame(beforeCrossing, { type: 'ROLL', dice: [1, 3] }), { type: 'BUY', level: 4 });
  assert.equal(crossedAndBought.error, null); assert.equal(crossedAndBought.players[0].completedLaps, 1);
  assert.equal(crossedAndBought.properties[3].level, 4);
});

test('landmark requires arriving again on a preexisting level-four city and charges exactly one level', () => {
  const state = game(); state.players[0].completedLaps = 1; state.players[0].position = 1;
  state.properties[3] = { ownerId: 'player-1', level: 4, business: 'residence', mortgaged: false };
  const landed = reduceGame(state, { type: 'ROLL', dice: [1, 1] });
  assert.equal(landed.propertyVisit!.levelOnArrival, 4);
  const built = reduceGame(landed, { type: 'BUILD', tileId: 3 });
  assert.equal(built.error, null); assert.equal(built.properties[3].level, 5);
  assert.equal(built.players[0].cash, 1450);
  assert.equal(landed.properties[3].level, 4);
});

test('standing on a city, a different owned city, or a previous-turn landing cannot grant building rights', () => {
  const state = purchase();
  state.properties[1] = { ownerId: 'player-1', level: 1, business: 'residence', mortgaged: false };
  assert.ok(reduceGame(state, { type: 'BUILD', tileId: 1 }).error);
  const built = reduceGame(state, { type: 'BUILD', tileId: 3, level: 3 });
  assert.equal(built.error, null); assert.equal(built.properties[3].level, 3);
  assert.equal(built.players[0].cash, 1290);
  const ended = reduceGame(state, { type: 'END_TURN' });
  assert.equal(ended.propertyVisit, undefined);
  ended.currentPlayer = 0; ended.phase = 'end';
  assert.ok(reduceGame(ended, { type: 'BUILD', tileId: 3 }).error);
  const roll = structuredClone(state); roll.phase = 'roll';
  assert.ok(reduceGame(roll, { type: 'BUILD', tileId: 3 }).error);
});

test('color-set bonus doubles rent on built properties as well as bare land under landing rules only', () => {
  const state = game();
  state.properties[1] = { ownerId: 'player-2', level: 1, business: 'residence', mortgaged: false };
  state.properties[3] = { ownerId: 'player-2', level: 4, business: 'residence', mortgaged: false };
  assert.equal(rentFor(state, 1), 20); assert.equal(rentFor(state, 3), 640);
  delete state.propertyRules;
  assert.equal(rentFor(state, 1), 10); assert.equal(rentFor(state, 3), 320);
});

test('railroads/utilities do not build houses and auction cannot bypass mandatory construction', () => {
  const state = game(); state.players[0].position = 2;
  const railroad = reduceGame(reduceGame(state, { type: 'ROLL', dice: [1, 2] }), { type: 'BUY' });
  assert.equal(railroad.error, null); assert.equal(railroad.properties[5].level, 0);
  assert.equal(railroad.players[0].cash, 1300);
  const city = reduceGame(game(), { type: 'ROLL', dice: [1, 2] });
  assert.ok(reduceGame(city, { type: 'START_AUCTION' }).error);
});
