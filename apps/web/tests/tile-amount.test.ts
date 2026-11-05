import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, rentFor, reduceGame, taxFor } from '@typhu/game-engine';
import { tileAmount } from '../src/features/board/tile-amount';

test('tile amount hides unowned listings and follows actual rent through construction, group, event, festival and closure', () => {
  let game = createGame({
    names: ['An', 'Bình'],
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
    propertyPricing: 'level-one-included',
    startingCash: 10000,
  });
  assert.equal(tileAmount(game, 1), undefined);
  assert.equal(tileAmount(game, 4), undefined);
  game.players[0].position = 30;
  game = reduceGame(game, { type: 'ROLL', dice: [1, 2] });
  game = reduceGame(game, { type: 'BUY', level: 3 });
  assert.equal(game.error, null);
  assert.equal(tileAmount(game, 1), rentFor(game, 1));
  assert.notEqual(tileAmount(game, 1), 60);
  game.properties[2] = { ownerId: 'player-1', level: 1, mortgaged: false, business: 'residence' };
  game.eventTileIds = [1];
  game.festivalTileId = 1;
  game.festivalLevel = 2;
  game.festivalIncrement = 0.5;
  const quoted = tileAmount(game, 1)!;
  game.currentPlayer = 1;
  game.phase = 'roll';
  game.players[1].position = 30;
  const cash = game.players[1].cash;
  game = reduceGame(game, { type: 'ROLL', dice: [1, 2] });
  assert.equal(cash - game.players[1].cash, quoted - (game.goSalary ?? 200));
  game.properties[1].disabledLaps = 3;
  assert.equal(tileAmount(game, 1), 0);
  assert.equal(tileAmount(game, 30), taxFor(game));
});
