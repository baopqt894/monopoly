import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, BOARD_32, MAP_TILES, buildingName, groupsFor, getCard } from '@typhu/game-content';
import { createGame, reduceGame, purchaseQuote, purchaseLevelQuotes, upgradeQuote } from '../src';
function fixture() {
  const state = createGame({
    names: ['An', 'Bình'],
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
    propertyPricing: 'level-one-included',
  });
  state.phase = 'purchase';
  state.players[0].position = 1;
  state.propertyVisit = {
    playerId: 'player-1',
    tileId: 1,
    ownerIdOnArrival: null,
    levelOnArrival: 0,
  };
  return state;
}
test('preview and live 32 board share exact clockwise names and landmark identity; legacy stays 40', () => {
  assert.equal(BOARD.length, 40);
  assert.equal(BOARD_32.length, 32);
  assert.equal(BOARD_32[8].name, 'Côn Đảo');
  assert.equal(groupsFor({boardId:'vietnam-32'}).pink.name,'Tây Nguyên');
  assert.match(getCard('chance','chance-11','vietnam-32').description,/Côn Đảo/);
  assert.deepEqual(
    BOARD_32.filter((t) => t.resort).map((t) => t.name),
    ['Phú Quốc', 'Lăng Cô', 'Mỹ Khê', 'Cô Tô'],
  );
  assert.deepEqual(
    BOARD_32.map((t) => t.name),
    MAP_TILES.map((t) => t.name),
  );
  assert.equal(buildingName(17, 5, 'vietnam-32'), 'Cầu Rồng');
  assert.equal(buildingName(15, 5, 'vietnam-32'), 'Ngọ Môn');
});
test('purchase and upgrade display quotes match actual debits and reject unavailable tiers', () => {
  const state = fixture();
  for (const level of [1, 2, 3]) {
    const quote = purchaseQuote(state, 1, level),
      after = reduceGame(state, { type: 'BUY', level });
    assert.equal(quote.error, null);
    assert.equal(after.error, null);
    assert.equal(state.players[0].cash - after.players[0].cash, quote.cost);
    assert.equal(after.properties[1].level, level);
  }
  assert.ok(purchaseQuote(state, 1, 4).error);
  const owned = reduceGame(state, { type: 'BUY', level: 1 });
  const quote = upgradeQuote(owned, 1, 3),
    upgraded = reduceGame(owned, { type: 'BUILD', tileId: 1, level: 3 });
  assert.equal(quote.error, null);
  assert.equal(upgraded.error, null);
  assert.equal(owned.players[0].cash - upgraded.players[0].cash, quote.cost);
  owned.players[0].cash = 0;
  assert.ok(upgradeQuote(owned, 1, 3).error);
  const poor = fixture();
  poor.players[0].cash = 1;
  assert.ok(purchaseQuote(poor, 1, 1).error);
  const empty = fixture();
  for (const tile of BOARD_32.filter((t) => t.kind === 'street').slice(1, 9))
    empty.properties[tile.id] = {
      ownerId: 'player-2',
      level: 4,
      mortgaged: false,
      business: 'residence',
    };
  assert.equal(purchaseQuote(empty, 1, 1).error, null);
});


test('four-tier purchase display quotes keep the locked tier price without authorizing it', () => {
  const game = fixture();
  const original = structuredClone(game);
  const quotes = purchaseLevelQuotes(game, 1);
  assert.deepEqual(quotes.map(quote => [quote.level, quote.cost]), [[1,60],[2,110],[3,160],[4,210]]);
  assert.equal(quotes[2].error, null);
  assert.ok(quotes[3].error);
  assert.deepEqual(game, original);
  const denied = reduceGame(game, {type:'BUY', level:4});
  assert.ok(denied.error);
  assert.equal(denied.players[0].cash, game.players[0].cash);
  assert.equal(denied.properties[1], undefined);
  game.players[0].completedLaps = 1;
  const unlocked = purchaseLevelQuotes(game, 1)[3];
  assert.equal(unlocked.error, null);
  const bought = reduceGame(game, {type:'BUY',level:4});
  assert.equal(bought.error, null);
  assert.equal(bought.players[0].cash, game.players[0].cash - unlocked.cost);
  assert.equal(bought.properties[1].level, 4);
});

test('fixed purchase tiers respect money, preserve prices and exclude non-city assets and legacy construction', () => {
  const game = fixture(); game.players[0].cash = 100;
  const quotes = purchaseLevelQuotes(game, 1);
  assert.equal(quotes[0].error, null);
  assert.ok(quotes.slice(1).every(quote => !!quote.error));
  assert.deepEqual(quotes.map(quote => quote.cost), [60,110,160,210]);
  assert.deepEqual(purchaseLevelQuotes(game, 4), []);
  assert.deepEqual(purchaseLevelQuotes(createGame(), 1), []);
});
