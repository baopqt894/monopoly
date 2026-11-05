import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardFor, mapTilesFor } from '@typhu/game-content';
import { BOARD_32_PRICES } from '../../game-content/src/board32-prices';
import { BOARD_32_RENT_REFERENCE } from '../../game-content/src/board32-rents';
import { createGame, reduceGame, rentFor, festivalTargets } from '../src';
import { constructionUpgradeCost, propertyValue } from '../src/property-rules';
import { tileAmount } from '../../../apps/web/src/features/board/tile-amount';
const game = () =>
  createGame({
    boardId: 'vietnam-32',
    boardLayout: 'districts-v1',
    propertyRules: 'landing-v1',
    propertyPricing: 'business-tour-v2',
    names: ['A', 'B', 'C'],
    startingCash: 100000,
    eventTileCount: 0,
    seed: 42,
  });
const names = [
  'Huế',
  'Đà Nẵng',
  'Hội An',
  'Sóc Trăng',
  'Bạc Liêu',
  'Cà Mau',
  'Quy Nhơn',
  'Nha Trang',
  'Phan Thiết',
  'Buôn Ma Thuột',
  'Kon Tum',
  'Châu Đốc',
  'Cần Thơ',
  'Ninh Bình',
  'Hạ Long',
  'Hải Phòng',
  'Vinh',
  'Đồng Hới',
  'Hà Nội',
  'TP. Hồ Chí Minh',
];
test('all 20 relocated cities use the approved P/H and level 1–5 rents in travel order', () => {
  const s = game();
  const cities = boardFor(s).filter((t) => t.kind === 'street');
  assert.deepEqual(
    cities.map((t) => t.name),
    names,
  );
  cities.forEach((t, i) => {
    const price = BOARD_32_PRICES[i],
      rents = BOARD_32_RENT_REFERENCE[i].rents;
    assert.equal(t.price, price.price);
    assert.equal(t.buildCost, price.houseCost);
    assert.equal(mapTilesFor(s)[t.id].price, price.price);
    assert.deepEqual(t.rents, [rents[0], ...rents]);
    for (let level = 1; level <= 5; level++) {
      s.properties = {
        [t.id]: { ownerId: 'player-2', level, mortgaged: false, business: 'residence' },
      };
      assert.equal(rentFor(s, t.id), rents[level - 1]);
      assert.equal(tileAmount(s, t.id), rents[level - 1]);
      assert.equal(
        propertyValue(s, t.id),
        price.price + (level === 5 ? 6 : level - 1) * price.houseCost,
      );
    }
    assert.equal(constructionUpgradeCost(s, t.id, 4, 5), price.houseCost * 3);
  });
});
test('landing on every relocated city charges the exact approved rent at every building level', () => {
  const cities = boardFor(game()).filter((t) => t.kind === 'street');
  cities.forEach((tile, i) => {
    for (let level = 1; level <= 5; level++) {
      const s = game();
      s.players[0].position = (tile.id - 3 + 32) % 32;
      s.properties[tile.id] = {
        ownerId: 'player-2',
        level,
        mortgaged: false,
        business: 'residence',
      };
      const result = reduceGame(s, { type: 'ROLL', dice: [1, 2] });
      assert.equal(result.error, null);
      assert.equal(result.players[0].position, tile.id);
      assert.equal(
        result.players[1].cash - s.players[1].cash,
        BOARD_32_RENT_REFERENCE[i].rents[level - 1],
        `${tile.name} level ${level}`,
      );
    }
  });
});
test('festival selection is bound to the active player and rejects other players, resorts and unowned lots', () => {
  const s = game();
  s.currentPlayer = 1;
  s.phase = 'festival';
  s.properties = {
    1: { ownerId: 'player-1', level: 2, mortgaged: false, business: 'residence' },
    2: { ownerId: 'player-2', level: 3, mortgaged: false, business: 'residence' },
    4: { ownerId: 'player-2', level: 0, mortgaged: false, business: 'residence' },
  };
  assert.deepEqual(festivalTargets(s, 'player-2'), [2]);
  assert.deepEqual(festivalTargets(s, 'player-1'), []);
  assert.deepEqual(festivalTargets(s, 'player-3'), []);
  assert.deepEqual(festivalTargets(s), [2]);
  for (const tileId of [1, 3, 4, 16]) {
    const rejected = reduceGame(s, { type: 'HOST_FESTIVAL', tileId });
    assert.ok(rejected.error);
    assert.equal(rejected.festivalTileId, s.festivalTileId);
    assert.equal(rejected.festivalLevel, s.festivalLevel);
  }
  const hosted = reduceGame(s, { type: 'HOST_FESTIVAL', tileId: 2 });
  assert.equal(hosted.error, null);
  assert.equal(hosted.festivalTileId, 2);
  hosted.currentPlayer = 0;
  hosted.phase = 'festival';
  assert.deepEqual(festivalTargets(hosted, 'player-1'), [1]);
  assert.deepEqual(festivalTargets(hosted, 'player-2'), []);
});
