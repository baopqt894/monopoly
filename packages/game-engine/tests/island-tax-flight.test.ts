import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardFor } from '@typhu/game-content';
import { createGame, reduceGame, taxFor, chooseBotAction } from '../src';

for (const boardId of [undefined, 'vietnam-32'] as const) {
  const game = () => createGame({ names: ['An', 'Bình'], boardId, propertyRules: 'landing-v1', seed: 123 });
  const islandId = boardId ? 8 : 10, airportId = boardId ? 24 : 30;
  test(`${boardId ?? 'legacy'}: ordinary landing and doubles landing both capture at island, preserving movement`, () => {
    for (const dice of [[1,2], [2,2]] as [number, number][]) {
      const state = game(); state.players[0].position = islandId - dice[0] - dice[1]; state.players[0].flight = 'waiting';
      const next = reduceGame(state, { type: 'ROLL', dice });
      assert.equal(next.players[0].position, islandId); assert.equal(next.players[0].jailed, true);
      assert.equal(next.extraRoll, false); assert.equal(next.doubles, 0); assert.equal(next.phase, 'end');
      assert.equal(next.players[0].flight, undefined); assert.equal(next.movement!.path.length, dice[0] + dice[1]);
      assert.equal(next.players[0].cash, 1500); assert.equal(state.players[0].jailed, false);
    }
  });
  test(`${boardId ?? 'legacy'}: escape doubles moves by sum and keeps the roll, counted as first in the doubles chain`, () => {
    const state = game(); Object.assign(state.players[0], {position: islandId, jailed: true, jailTurns: 1});
    let next = reduceGame(state, { type: 'ROLL', dice: [1,1] });
    assert.equal(next.players[0].position, islandId + 2); assert.equal(next.players[0].jailed, false);
    assert.equal(next.extraRoll, true); assert.equal(next.doubles, 1);
    if (next.phase === 'purchase') next = reduceGame(next, { type: 'SKIP_PURCHASE' });
    next = reduceGame(next, { type: 'END_TURN' });
    assert.equal(next.currentPlayer, 0); assert.equal(next.phase, 'roll');
    next = reduceGame(next, { type: 'ROLL', dice: [2,2] });
    if (next.phase === 'purchase') next = reduceGame(next, { type: 'SKIP_PURCHASE' });
    // Resolve the second landing before the third consecutive double.
    next = reduceGame(next, { type: 'END_TURN' });
    next = reduceGame(next, { type: 'ROLL', dice: [1,1] });
    assert.equal(next.players[0].position, islandId); assert.equal(next.players[0].jailed, true);
    assert.equal(next.extraRoll, false);
  });
  test(`${boardId ?? 'legacy'}: tax includes cash, land, resort and the full construction value`, () => {
    const state = game(); const board = boardFor(state);
    const city = board.find(tile => tile.kind === 'street')!, resort = board.find(tile => tile.kind === 'railroad')!;
    state.properties[city.id] = { ownerId:'player-1', level:4, mortgaged:false, business:'residence' };
    state.properties[resort.id] = { ownerId:'player-1', level:0, mortgaged:true, business:'residence' };
    const other = board.find(tile => tile.kind === 'street' && tile.id !== city.id)!;
    state.properties[other.id] = { ownerId:'player-2', level:5, mortgaged:false, business:'residence' };
    assert.equal(taxFor(state), 196); // cash 1500 + city 60 + four builds 200 + resort 200
    for (const tile of board.filter(tile => tile.kind === 'tax')) {
      const before = structuredClone(state); before.players[0].position = tile.id - 3;
      const next = reduceGame(before, { type: 'ROLL', dice:[1,2] });
      assert.equal(next.players[0].cash, 1304); assert.equal(next.players[1].cash, 1500);
      before.players[0].cash = 10;
      const debt = reduceGame(before, { type: 'ROLL', dice:[1,2] });
      assert.equal(debt.players[0].cash, 0); assert.equal(debt.debt!.amount, 37); assert.equal(debt.debt!.creditorId, null);
    }
    assert.equal(taxFor(game()), 150);
  });
  test(`${boardId ?? 'legacy'}: flight pays 50 once, awards full configured GO salary, counts a personal lap when crossing GO`, () => {
    for (const target of [0, 1, airportId, airportId + 1]) {
      const state = game(); state.goSalary = 375; state.players[0].position = airportId; state.players[0].flight = 'ready';
      const next = reduceGame(state, { type: 'FLY', tileId:target });
      assert.equal(next.error, null); assert.equal(next.players[0].cash, 1450 + (target < airportId ? 375 : 0));
      assert.equal(next.players[0].completedLaps, target < airportId ? 1 : 0); assert.equal(next.movement!.mode, 'flight');
      const duplicate = reduceGame(next, { type: 'FLY', tileId:target });
      assert.ok(duplicate.error); assert.equal(duplicate.players[0].cash, next.players[0].cash);
    }
    const poor = game(); poor.players[0].position = airportId; poor.players[0].flight = 'ready'; poor.players[0].cash = 49;
    const rejected = reduceGame(poor, {type:'FLY',tileId:0});
    assert.ok(rejected.error); assert.equal(rejected.players[0].cash, 49); assert.equal(rejected.players[0].flight, 'ready');
    assert.equal(rejected.players[0].position, airportId); assert.equal(chooseBotAction(poor)!.type, 'ROLL');
    poor.players[0].cash = 50;
    assert.equal(reduceGame(poor, { type:'FLY', tileId:0 }).players[0].cash, 200);
  });
}


test('a paid flight crossing GO with zero salary unlocks level four and reopens owner outage properties', () => {
  const state = createGame({names:['An','Bình'],boardId:'vietnam-32',propertyRules:'landing-v1',seed:123,goSalary:0});
  state.players[0].position=24; state.players[0].flight='ready';
  state.properties[1]={ownerId:'player-1',level:3,mortgaged:false,business:'residence',disabledLaps:1};
  state.properties[2]={ownerId:'player-2',level:3,mortgaged:false,business:'residence',disabledLaps:2};
  let landed=reduceGame(state,{type:'FLY',tileId:31});
  landed.phase='roll'; landed=reduceGame(landed,{type:'ROLL',dice:[1,1]});
  assert.equal(landed.players[0].completedLaps,1); assert.equal(landed.players[0].cash,1450);
  assert.equal(landed.properties[1].disabledLaps,undefined); assert.equal(landed.properties[2].disabledLaps,2);
  const built=reduceGame(landed,{type:'BUILD',tileId:1,level:4});
  assert.equal(built.error,null); assert.equal(built.properties[1].level,4);
  const duplicate=reduceGame(landed,{type:'FLY',tileId:0});
  assert.ok(duplicate.error); assert.equal(duplicate.players[0].completedLaps,1);
});
