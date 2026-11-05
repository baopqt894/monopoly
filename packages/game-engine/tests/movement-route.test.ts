import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '../src';
import { pawnTravelMs, FLIGHT_STEP_MS, CARD_STEP_MS } from '@typhu/game-content';

test('long flight crosses every corner without charging intermediate taxes or rent and credits GO only once', () => {
  const game = createGame({
    names: ['An', 'Bình'],
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
  });
  game.players[0].position = 24;
  game.players[0].flight = 'ready';
  game.properties[29] = { ownerId: 'player-2', level: 5, mortgaged: false, business: 'residence' };
  const next = reduceGame(game, { type: 'FLY', tileId: 23 });
  assert.deepEqual(
    next.movement?.path,
    Array.from({ length: 31 }, (_, i) => (25 + i) % 32),
  );
  assert.equal(next.players[0].cash, 1650);
  assert.equal(next.players[0].completedLaps, 1);
  assert.equal(next.players[0].jailed, false); // crossing the island does not land there
  assert.equal(next.players[1].cash, 1500);
  assert.equal(pawnTravelMs(next.movement), 31 * FLIGHT_STEP_MS);
});

test('long movement card walks the full route and backward card walks backward without salary', () => {
  const game = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  game.players[0].position = 12;
  game.phase = 'card';
  game.drawnCard = { deck: 'chance', cardId: 'chance-02', revealed: true };
  const next = reduceGame(game, { type: 'RESOLVE_CARD' });
  assert.deepEqual(
    next.movement?.path,
    Array.from({ length: 19 }, (_, i) => 13 + i),
  );
  game.drawnCard = { deck: 'chance', cardId: 'chance-10', revealed: true };
  game.players[0].position = 1;
  const back = reduceGame(game, { type: 'RESOLVE_CARD' });
  assert.deepEqual(back.movement?.path, [0, 31, 30]);
  assert.equal(back.players[0].cash, 1350); // tax at destination
  assert.equal(pawnTravelMs(next.movement), 19 * CARD_STEP_MS);
  assert.equal(pawnTravelMs(back.movement), 3 * CARD_STEP_MS);
});
