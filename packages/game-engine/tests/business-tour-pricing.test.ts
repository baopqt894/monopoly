import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD_32, boardFor } from '@typhu/game-content';
import {
  createGame, reduceGame, purchaseQuote, purchaseLevelQuotes, upgradeQuote,
  propertyValue, liquidationValue, buyBackQuote, taxFor, rentFor,
} from '../src';

const game = () => createGame({ names: ['A', 'B'], boardId: 'vietnam-32',
  propertyRules: 'landing-v1', propertyPricing: 'business-tour-v2',
  liquidationRules: 'full-value-v1', seed: 123, eventTileCount: 0 });
function owned(level: number, cash = 1500) {
  const state = game();
  state.players[0].position = 1;
  state.players[0].completedLaps = 1;
  state.players[0].cash = cash;
  state.phase = 'end';
  state.properties[1] = {ownerId: 'player-1', level, mortgaged: false, business: 'residence'};
  state.propertyVisit = {playerId: 'player-1', tileId: 1, ownerIdOnArrival: 'player-1', levelOnArrival: level};
  return state;
}

test('every city purchase uses P + (level - 1) H; quotes equal actual debits', () => {
  for (const tile of BOARD_32.filter(tile => tile.kind === 'street')) {
    const state = game(); state.players[0].position = tile.id;
    state.players[0].completedLaps = 1; state.players[0].cash = 10000; state.phase = 'purchase';
    state.propertyVisit = {playerId:'player-1', tileId:tile.id, ownerIdOnArrival:null, levelOnArrival:0};
    assert.deepEqual(purchaseLevelQuotes(state, tile.id).map(q => q.cost),
      [0,1,2,3].map(houses => tile.price! + houses * tile.buildCost!));
    for (const level of [1,2,3,4]) {
      const quote = purchaseQuote(state, tile.id, level);
      const after = reduceGame(state, {type:'BUY', level});
      assert.equal(after.error, null); assert.equal(quote.error, null);
      assert.equal(state.players[0].cash - after.players[0].cash, quote.cost);
      assert.equal(propertyValue(after, tile.id), quote.cost);
    }
  }
});

test('landmark costs 3H, blocks insufficient cash, and keeps revisit requirements', () => {
  const state = owned(4, 149);
  assert.equal(upgradeQuote(state, 1, 5).cost, 150);
  assert.ok(upgradeQuote(state, 1, 5).error);
  const denied = reduceGame(state, {type:'BUILD', tileId:1, level:5});
  assert.ok(denied.error); assert.equal(denied.players[0].cash, 149); assert.equal(denied.properties[1].level, 4);
  state.players[0].cash = 150;
  const after = reduceGame(state, {type:'BUILD', tileId:1, level:5});
  assert.equal(after.error, null); assert.equal(after.players[0].cash, 0);
  assert.equal(propertyValue(after, 1), 360); // P=60 + 6H=300
  assert.equal(liquidationValue(after, 1), 360);
  assert.equal(taxFor(after, 'player-1'), 36);
  const justBuilt = owned(4); justBuilt.propertyVisit!.levelOnArrival = 3;
  assert.ok(upgradeQuote(justBuilt, 1, 5).error);
  const notLapped = owned(4); notLapped.players[0].completedLaps = 0;
  assert.ok(upgradeQuote(notLapped, 1, 5).error);
});

test('normal multi-level upgrade and staged purchase have identical total investment', () => {
  const state = owned(1);
  assert.equal(upgradeQuote(state, 1, 4).cost, 150);
  const after = reduceGame(state, {type:'BUILD', tileId:1, level:4});
  assert.equal(after.error, null); assert.equal(after.players[0].cash, 1350);
  assert.equal(propertyValue(after, 1), 210);
});

test('buyback remains 1.5x and allows immediate 3H landmark upgrade; landmark cannot be bought back', () => {
  const state = owned(4);
  state.properties[1].ownerId = 'player-2'; state.propertyVisit!.ownerIdOnArrival = 'player-2';
  assert.equal(buyBackQuote(state, 1).price, 315);
  const bought = reduceGame(state, {type:'BUY_BACK', tileId:1});
  assert.equal(bought.error, null); assert.equal(bought.players[1].cash, 1815);
  const built = reduceGame(bought, {type:'BUILD', tileId:1, level:5});
  assert.equal(built.error, null); assert.equal(built.players[0].cash, 1035);
  built.properties[1].ownerId = 'player-2'; built.propertyVisit!.ownerIdOnArrival = 'player-2';
  assert.ok(buyBackQuote(built, 1).error);
});

test('rent at every city and level is unchanged by the new construction pricing', () => {
  for (const tile of BOARD_32.filter(tile => tile.kind === 'street')) {
    for (const level of [1,2,3,4,5]) {
      const state = game(); state.properties[tile.id] = {ownerId:'player-1', level, mortgaged:false, business:'residence'};
      const previous = structuredClone(state); previous.propertyPricing = 'level-one-included';
      assert.equal(rentFor(state, tile.id), rentFor(previous, tile.id));
    }
  }
});

test('old pricing snapshots retain their landmark quote, debit and liquidation value', () => {
  for (const pricing of [undefined, 'level-one-included'] as const) {
    const state = owned(4); state.propertyPricing = pricing;
    assert.equal(upgradeQuote(state, 1, 5).cost, 50);
    const after = reduceGame(state, {type:'BUILD', tileId:1, level:5});
    assert.equal(after.error, null); assert.equal(after.players[0].cash, 1450);
    assert.equal(propertyValue(after, 1), pricing ? 260 : 310);
  }
});


test('all twenty adopted P/H rows and six observed purchase bundles use the new schedule', () => {
  const rows = [[60,50],[60,50],[60,50],[100,50],[100,50],[120,50],
    [140,100],[140,100],[160,100],[180,100],[200,100],[220,150],
    [240,150],[260,150],[260,150],[280,150],[300,200],[320,200],[350,200],[400,200]];
  const state = game(); state.players[0].completedLaps = 1; state.players[0].cash = 10000;
  const cities = boardFor(state).filter(t => t.kind === 'street');
  assert.deepEqual(cities.map(t => [t.price, t.buildCost]), rows);
  for (const [id, level, expected] of [[3,4,210],[6,4,250],[19,4,690],[26,3,700],[29,3,750],[31,3,800]]) {
    state.phase = 'purchase'; state.players[0].position = id;
    assert.equal(purchaseQuote(state, id, level).cost, expected);
  }
});

test('pre-v2 rooms preserve old land and house prices, including earlier 3H hotel rooms', () => {
  const state = game();
  const old = structuredClone(state); old.propertyPricing = 'business-tour-v1';
  const included = structuredClone(state); included.propertyPricing = 'level-one-included';
  const legacy = structuredClone(state); delete legacy.propertyPricing;
  for (const snapshot of [old, included, legacy]) {
    assert.equal(boardFor(snapshot)[3].price, 100);
    assert.equal(boardFor(snapshot)[10].buildCost, 100);
    assert.equal(boardFor(snapshot)[17].buildCost, 150);
  }
  assert.equal(boardFor(state)[3].price, 60);
  assert.equal(boardFor(state)[10].price, 140);
  // Earlier v1 landmark rooms retain 3H even while keeping their original P/H.
  old.properties[3] = {ownerId:'player-1', level:5, mortgaged:false, business:'residence'};
  assert.equal(propertyValue(old, 3), 400);
  assert.equal(boardFor(createGame()).length, 40);
});
