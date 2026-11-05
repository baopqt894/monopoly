import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseBotAction, createGame, reduceGame } from '../src';
import type { GameState } from '@typhu/contracts';

const game = () => createGame({ names: ['Bot', 'Human'], seed: 123, mode: 'city', maxRounds: 8 });
function own(state: GameState, id: number, level = 0, mortgaged = false) {
  state.properties[id] = { ownerId: 'player-1', level, mortgaged, business: 'residence' };
}
function step(state: GameState) {
  const action = chooseBotAction(state); assert.ok(action);
  const result = reduceGame(state, action); assert.equal(result.error, null, JSON.stringify(action));
  return result;
}

test('bot eagerly buys or skips unaffordable property, draws before using a card', () => {
  let state = game(); state.phase = 'purchase'; state.players[0].position = 3;
  assert.deepEqual(chooseBotAction(state), { type: 'BUY' });
  state.players[0].cash = 0; assert.deepEqual(chooseBotAction(state), { type: 'SKIP_PURCHASE' });
  state = game(); state.phase = 'card'; state.drawnCard = { deck: 'chance', cardId: 'chance-08' };
  assert.equal(chooseBotAction(state)?.type, 'DRAW_CARD'); state = step(state);
  assert.equal(chooseBotAction(state)?.type, 'RESOLVE_CARD'); state = step(state);
  assert.equal(state.players[0].cash, 1550);
});

test('bot redeems and builds until no spending option remains, without selling just to spend again', () => {
  let state = game(); state.phase = 'end'; state.players[0].cash = 160;
  own(state, 1, 0, true);
  assert.deepEqual(chooseBotAction(state), { type: 'UNMORTGAGE', tileId: 1 });
  state = step(state); state = step(state); state = step(state);
  assert.equal(state.properties[1].level, 2); assert.equal(state.players[0].cash, 27);
  assert.deepEqual(chooseBotAction(state), { type: 'END_TURN' });
});

test('bot handles jail, flights, auctions, debt and bankruptcy with legal engine actions', () => {
  let state = game(); state.players[0].jailed = true;
  assert.equal(chooseBotAction(state)?.type, 'PAY_BAIL');
  state.players[0].cash = 0; state.players[0].jailCards = ['chance'];
  assert.equal(chooseBotAction(state)?.type, 'USE_JAIL_CARD');
  state.players[0].jailCards = []; assert.equal(chooseBotAction(state)?.type, 'ROLL');
  state = game(); state.players[0].flight = 'ready';
  assert.deepEqual(chooseBotAction(state), { type: 'FLY', tileId: 39 });
  state = game(); state.phase = 'auction'; state.auction = { tileId: 3, bidderIndex: 1, highestBid: 0, highestBidderId: null, passed: [] };
  assert.deepEqual(chooseBotAction(state), { type: 'BID', amount: 60 });
  state.auction.highestBid = 60; assert.deepEqual(chooseBotAction(state), { type: 'PASS_BID' });
  state = game(); own(state, 1, 1); state.players[0].cash = 0;
  state.debt = { debtorId: 'player-1', creditorId: 'player-2', amount: 40, reason: 'rent' };
  assert.equal(chooseBotAction(state)?.type, 'SELL_BUILDING'); state = step(state);
  assert.equal(chooseBotAction(state)?.type, 'MORTGAGE'); state = step(state);
  assert.equal(state.debt, null);
  state = game(); state.players[0].cash = 0; state.debt = { debtorId: 'player-1', creditorId: 'player-2', amount: 100, reason: 'rent' };
  assert.equal(chooseBotAction(state)?.type, 'DECLARE_BANKRUPTCY');
  assert.equal(step(state).players[0].bankrupt, true);
});

test('simple bots complete a seeded match without illegal actions or spending loops', () => {
  let state = game();
  for (let i = 0; i < 3000 && state.phase !== 'finished'; i++) state = step(state);
  assert.equal(state.phase, 'finished'); assert.ok(state.winnerId);
});
