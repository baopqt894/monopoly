import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '../src';
import {
  DICE_PRESENTATION_MS,
  PAWN_STEP_MS,
  PRESENTATION_BUFFER_MS,
  pawnTravelMs,
  turnPresentationMs,
} from '@typhu/game-content';

test('accepted rolls publish distinct authoritative IDs even for identical dice; invalid rolls publish nothing', () => {
  const game = createGame({ names: ['A', 'B'], boardId: 'vietnam-32' });
  const rolled = reduceGame(game, { type: 'ROLL', dice: [2, 2] });
  assert.equal(game.lastRoll, undefined);
  assert.equal(rolled.lastRoll?.playerId, 'player-1');
  assert.equal(rolled.movement?.rollId, rolled.lastRoll?.id);
  rolled.phase = 'roll';
  const again = reduceGame(rolled, { type: 'ROLL', dice: [2, 2] });
  assert.notEqual(again.lastRoll?.id, rolled.lastRoll?.id);
  assert.equal(again.movement?.rollId, again.lastRoll?.id);
  const invalid = reduceGame(game, { type: 'ROLL', dice: [0, 6] });
  assert.ok(invalid.error);
  assert.equal(invalid.lastRoll, undefined);
});

test('failed island rolls still reserve the dice reveal without replaying a previous movement', () => {
  const game = createGame({ names: ['A', 'B'], boardId: 'vietnam-32' });
  game.players[0].jailed = true;
  game.players[0].position = 8;
  game.movement = { id: 0, playerId: 'player-1', path: [8] };
  const rolled = reduceGame(game, { type: 'ROLL', dice: [1, 2] });
  assert.ok(rolled.lastRoll);
  assert.equal(rolled.players[0].position, 8);
  assert.equal(rolled.movement?.id, 0);
  assert.equal(
    turnPresentationMs(rolled, { movementId: 0 }),
    DICE_PRESENTATION_MS + PRESENTATION_BUFFER_MS,
  );
});

test('presentation budgets wait for dice and every tile; later choices cannot restart that budget', () => {
  const game = reduceGame(createGame({ boardId: 'vietnam-32' }), { type: 'ROLL', dice: [3, 4] });
  assert.equal(pawnTravelMs(game.movement), 7 * PAWN_STEP_MS);
  assert.equal(
    turnPresentationMs(game, {}),
    DICE_PRESENTATION_MS + 7 * PAWN_STEP_MS + PRESENTATION_BUFFER_MS,
  );
  assert.equal(
    turnPresentationMs(game, { movementId: game.movement!.id, rollId: game.lastRoll!.id }),
    0,
  );
  const moved = {
    ...game,
    movement: {
      id: game.movement!.id + 1,
      playerId: 'player-1',
      path: [24],
      mode: 'flight' as const,
    },
  };
  assert.equal(
    turnPresentationMs(moved, { movementId: game.movement!.id, rollId: game.lastRoll!.id }),
    pawnTravelMs(moved.movement) + PRESENTATION_BUFFER_MS,
  );
});
