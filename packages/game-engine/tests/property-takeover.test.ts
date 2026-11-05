import assert from 'node:assert/strict';
import test from 'node:test';
import type { GameState } from '@typhu/contracts';
import { buyBackQuote, createGame, hasEndTurnChoices, reduceGame } from '../src';

function game() { return createGame({ names: ['A', 'B'], seed: 123, propertyRules: 'landing-v1' }); }
function opponent(level: number, cash = 1500) {
  const state = game(); state.players[0].position = 1; state.players[0].cash = cash;
  state.properties[3] = { ownerId: 'player-2', level, mortgaged: false, business: 'residence' };
  return reduceGame(state, { type: 'ROLL', dice: [1, 1] });
}
function throughGo(state: GameState, owner: number) {
  state.currentPlayer = owner; state.phase = 'roll'; state.extraRoll = false;
  state.players[owner].position = 37;
  return reduceGame(state, { type: 'ROLL', dice: [1, 2] });
}

test('rent is paid first, takeover costs 1.5× current land/build value and immediately permits upgrading', () => {
  const landed = opponent(2);
  assert.equal(landed.players[0].cash, 1440); assert.equal(landed.players[1].cash, 1560);
  assert.deepEqual(buyBackQuote(landed, 3), { price: 240, constructionCost: 0, totalCost: 240, error: null });
  const bought = reduceGame(landed, { type: 'BUY_BACK', tileId: 3 });
  assert.equal(bought.error, null); assert.equal(bought.players[0].cash, 1200); assert.equal(bought.players[1].cash, 1800);
  assert.equal(bought.properties[3].ownerId, 'player-1'); assert.equal(bought.properties[3].level, 2);
  const upgraded = reduceGame(bought, { type: 'BUILD', tileId: 3 });
  assert.equal(upgraded.error, null); assert.equal(upgraded.properties[3].level, 3); assert.equal(upgraded.players[0].cash, 1150);
  assert.ok(reduceGame(bought, { type: 'BUY_BACK', tileId: 3 }).error);
  assert.equal(landed.properties[3].ownerId, 'player-2');
});

test('unpaid rent blocks takeover; debt clearance preserves the landing, but insufficient cash still blocks it', () => {
  let state = opponent(2, 1);
  state.properties[37] = { ownerId: 'player-1', level: 0, mortgaged: false, business: 'residence' };
  state.properties[39] = { ownerId: 'player-1', level: 0, mortgaged: false, business: 'residence' };
  assert.equal(state.debt!.amount, 59);
  assert.ok(reduceGame(state, { type: 'BUY_BACK', tileId: 3 }).error);
  state = reduceGame(state, { type: 'MORTGAGE', tileId: 39 });
  assert.equal(state.debt, null); assert.equal(state.players[0].cash, 141);
  assert.ok(reduceGame(state, { type: 'BUY_BACK', tileId: 3 }).error);
  state = reduceGame(state, { type: 'MORTGAGE', tileId: 37 });
  state = reduceGame(state, { type: 'BUY_BACK', tileId: 3 });
  assert.equal(state.error, null); assert.equal(state.properties[3].ownerId, 'player-1');
  assert.equal(state.players[0].cash, 76);
});

test('takeover cannot target another tile or a landmark; buying level four allows its landmark upgrade on that landing', () => {
  const state = opponent(4); state.players[0].completedLaps = 1;
  assert.ok(reduceGame(state, { type: 'BUY_BACK', tileId: 1 }).error);
  let bought = reduceGame(state, { type: 'BUY_BACK', tileId: 3 });
  bought = reduceGame(bought, { type: 'BUILD', tileId: 3, level: 5 });
  assert.equal(bought.error, null); assert.equal(bought.properties[3].level, 5);
  assert.ok(reduceGame(opponent(5), { type: 'BUY_BACK', tileId: 3 }).error);
  const ended = reduceGame(opponent(1), { type: 'END_TURN' });
  ended.currentPlayer = 0; ended.phase = 'end';
  assert.ok(reduceGame(ended, { type: 'BUY_BACK', tileId: 3 }).error);
});

test('personal laps count forward GO crossings even with zero salary, including flights, never backwards movement or island transfer', () => {
  const state = game(); state.goSalary = 0;
  const crossed = throughGo(state, 0);
  assert.equal(crossed.players[0].completedLaps, 1);
  const flight = game(); flight.players[0].flight = 'ready'; flight.players[0].position = 39;
  assert.equal(reduceGame(flight, { type: 'FLY', tileId: 0 }).players[0].completedLaps, 1);
  const island = game(); island.doubles = 2; island.players[0].position = 39;
  assert.equal(reduceGame(island, { type: 'ROLL', dice: [1, 1] }).players[0].completedLaps, 0);
  const back = game(); back.players[0].position = 2; back.phase = 'card'; back.drawnCard = { deck: 'chance', cardId: 'chance-10', revealed: true };
  assert.equal(reduceGame(back, { type: 'RESOLVE_CARD' }).players[0].completedLaps, 0);
});

test('takeover choice keeps the turn even when trades and all owned-asset actions are unavailable', () => {
  const state = opponent(1); state.extraRoll = false;
  assert.equal(hasEndTurnChoices(state, []), true);
});

test('buying back land cleared by an event still includes the mandatory minimum house, atomically', () => {
  const state = opponent(0);
  const quote = buyBackQuote(state, 3);
  assert.equal(quote.price, 90); assert.equal(quote.constructionCost, 50); assert.equal(quote.totalCost, 140);
  const beforeBuyer = state.players[0].cash, beforeSeller = state.players[1].cash;
  const bought = reduceGame(state, { type: 'BUY_BACK', tileId: 3 });
  assert.equal(bought.error, null); assert.equal(bought.properties[3].level, 1);
  assert.equal(bought.players[0].cash, beforeBuyer - 140); assert.equal(bought.players[1].cash, beforeSeller + 90);
  state.players[0].cash = 100;
  const failed = reduceGame(state, { type: 'BUY_BACK', tileId: 3 });
  assert.ok(failed.error); assert.equal(failed.properties[3].ownerId, 'player-2'); assert.equal(failed.players[0].cash, 100);
});
