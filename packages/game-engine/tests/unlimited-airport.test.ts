import test from 'node:test';
import assert from 'node:assert/strict';
import { boardFor } from '@typhu/game-content';
import {
  createGame,
  reduceGame,
  purchaseQuote,
  upgradeQuote,
  finishIdleTurn,
  chooseBotAction,
  timeoutAction,
  automaticAction,
} from '../src';
const game = () =>
  createGame({
    names: ['An', 'Bình'],
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
    propertyPricing: 'level-one-included',
    eventTileCount: 3,
    startingCash: 1000000,
    seed: 123,
  });

test('three global event tiles never limit ownership or building supply: buy all 24 assets', () => {
  let state = game();
  const events = [...state.eventTileIds!];
  for (const tile of boardFor(state).filter((tile) => tile.price)) {
    state.phase = 'roll';
    state.players[0].position = (tile.id + 29) % 32;
    state = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
    assert.equal(state.phase, 'purchase', tile.name);
    const level = tile.kind === 'street' ? 3 : 0;
    assert.equal(purchaseQuote(state, tile.id, level).error, null, tile.name);
    state = reduceGame(state, { type: 'BUY', level });
    assert.equal(state.error, null, tile.name);
  }
  assert.equal(Object.keys(state.properties).length, 24);
  assert.equal(
    Object.values(state.properties).filter((property) => property.ownerId === state.players[0].id)
      .length,
    24,
  );
  assert.deepEqual(state.eventTileIds, events);
  assert.equal(events.length, 3);
});

test('upgrade and takeover remain available with all old bank houses and hotels exhausted', () => {
  let state = game();
  state.players[0].completedLaps = 1;
  for (const tile of boardFor(state).filter((tile) => tile.kind === 'street'))
    state.properties[tile.id] = {
      ownerId: state.players[1].id,
      level: 5,
      mortgaged: false,
      business: 'residence',
    };
  state.properties[1].level = 2;
  state.players[0].position = 30;
  state = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  state = reduceGame(state, { type: 'BUY_BACK', tileId: 1 });
  assert.equal(state.error, null);
  assert.equal(upgradeQuote(state, 1, 4).error, null);
  state = reduceGame(state, { type: 'BUILD', tileId: 1, level: 4 });
  assert.equal(state.error, null);
  assert.ok(reduceGame(state, { type: 'BUILD', tileId: 1, level: 5 }).error); // must return to an existing level four
  state.phase = 'roll';
  state.players[0].position = 30;
  state = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  state = reduceGame(state, { type: 'BUILD', tileId: 1, level: 5 });
  assert.equal(state.error, null);
});

test('airport doubles end the turn; mandatory flight keeps its ordinary roll after purchase and upgrade', () => {
  let state = game();
  state.players[0].position = 20;
  state = reduceGame(state, { type: 'ROLL', dice: [2, 2] });
  assert.equal(state.players[0].flight, 'waiting');
  assert.equal(state.extraRoll, false);
  state = finishIdleTurn(state);
  assert.equal(state.currentPlayer, 1);
  state.phase = 'end';
  state = reduceGame(state, { type: 'END_TURN' });
  assert.equal(state.currentPlayer, 0);
  assert.equal(state.players[0].flight, 'ready');
  const seed = state.seed;
  const rejected = reduceGame(state, { type: 'ROLL' });
  assert.ok(rejected.error);
  assert.equal(rejected.seed, seed);
  assert.equal(timeoutAction(state)!.type, 'SKIP_FLIGHT');
  assert.equal(chooseBotAction(state)!.type, 'FLY');
  const cash = state.players[0].cash;
  state = reduceGame(state, { type: 'FLY', tileId: 1 });
  assert.equal(state.players[0].cash, cash - 50 + 200);
  state = reduceGame(state, { type: 'BUY', level: 1 });
  assert.equal(state.error, null);
  state = reduceGame(state, { type: 'BUILD', tileId: 1, level: 3 });
  assert.equal(state.error, null);
  assert.equal(finishIdleTurn(state).currentPlayer, 0);
  assert.equal(state.flightRollPending, true);
  state = reduceGame(state, { type: 'END_TURN' });
  assert.equal(state.currentPlayer, 0);
  assert.equal(state.phase, 'roll');
  assert.equal(state.flightRollPending, undefined);
  assert.equal(state.automaticRoll, undefined);
  assert.equal(automaticAction(state), null);
  assert.equal(reduceGame(state, { type: 'ROLL', dice: [1, 2] }).error, null);
});

test('flying onto airport cancels the following roll; poverty permits ordinary dice', () => {
  for (const id of [24]) {
    let state = game();
    state.players[0].position = 24;
    state.players[0].flight = 'ready';
    state = reduceGame(state, { type: 'FLY', tileId: id });
    assert.equal(state.flightRollPending, undefined);
    state = reduceGame(state, { type: 'END_TURN' });
    assert.equal(state.currentPlayer, 1);
  }
  const poor = game();
  poor.players[0].position = 24;
  poor.players[0].flight = 'ready';
  poor.players[0].cash = 49;
  assert.equal(timeoutAction(poor)!.type, 'ROLL');
  const rolled = reduceGame(poor, { type: 'ROLL', dice: [1, 2] });
  assert.equal(rolled.error, null);
  assert.equal(rolled.players[0].flight, undefined);
});
