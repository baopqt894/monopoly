import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  finishGameOnTime,
  gameOutcome,
  netWorth,
  reduceGame,
  resolveMatchDuration,
} from '../src';

test('match duration allows four presets, defaults new requests to 60 and rejects invalid input', () => {
  assert.deepEqual(resolveMatchDuration({}), { durationMinutes: 60 });
  for (const value of [15, 30, 45, 60])
    assert.equal(resolveMatchDuration({ durationMinutes: value }).durationMinutes, value);
  for (const value of [0, -15, 20, 90, 15.5, NaN, Infinity, '15', null])
    assert.throws(() => resolveMatchDuration({ durationMinutes: value as number }));
});

test('time limit ranks full property value and frozen debt without mutating the game', () => {
  const game = createGame({
    names: ['An', 'Bình'],
    victoryRules: 'business-tour-v1',
    liquidationRules: 'full-value-v1',
  });
  game.properties[1] = { ownerId: 'player-1', level: 2, business: 'residence', mortgaged: false };
  game.debt = { debtorId: 'player-1', creditorId: 'player-2', amount: 500, reason: 'rent' };
  game.players[1].cash = 1400;
  const original = structuredClone(game);
  const worth = game.players.map((player) => netWorth(game, player.id));
  const finished = finishGameOnTime(game);
  assert.deepEqual(game, original);
  assert.equal(finished.phase, 'finished');
  assert.equal(finished.winReason, 'time-limit');
  assert.equal(finished.winnerId, 'player-2');
  assert.deepEqual(
    finished.players.map((player) => netWorth(finished, player.id)),
    worth,
  );
  assert.equal(gameOutcome(finished).leaders[0].id, 'player-2');
  assert.deepEqual(reduceGame(finished, { type: 'ROLL', dice: [6, 6] }), finished);
  assert.equal(finishGameOnTime(finished), finished);
});

test('deadline finishes every active phase, preserves ties and does not replace an earlier victory', () => {
  for (const phase of ['roll', 'purchase', 'festival', 'card', 'auction', 'end'] as const) {
    const game = createGame({ names: ['An', 'Bình'], victoryRules: 'business-tour-v1' });
    game.phase = phase;
    const finished = finishGameOnTime(game);
    assert.equal(finished.phase, 'finished');
    assert.equal(gameOutcome(finished).leaders.length, 2);
  }
  const won = createGame();
  won.phase = 'finished';
  won.winReason = 'side-monopoly';
  won.winnerId = 'player-1';
  assert.equal(finishGameOnTime(won), won);
});
