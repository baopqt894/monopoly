import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '../src/index';

test('every possible starting seat preserves names/IDs and cycles in list order for 2–4 players', () => {
  for (const count of [2, 3, 4]) for (let start = 0; start < count; start++) {
    const names = ['A', 'B', 'C', 'D'].slice(0, count);
    let game = createGame({ names, seed: 123, startingPlayer: start });
    assert.deepEqual(game.players.map((p) => p.name), names);
    assert.deepEqual(game.players.map((p) => p.id), names.map((_, i) => `player-${i + 1}`));
    assert.equal(game.currentPlayer, start);
    assert.ok(game.log[0].message.includes(`${names[start]} đi đầu`));
    for (let step = 1; step <= count * 2; step++) {
      game.phase = 'end'; game = reduceGame(game, { type: 'END_TURN' });
      assert.equal(game.currentPlayer, (start + step) % count);
      assert.equal(game.round, 1 + Math.floor(step / count));
      assert.equal(game.startingPlayer, start);
    }
  }
});

test('extra rolls do not advance order; bankruptcy skips a seat and still crosses the original round marker', () => {
  let game = createGame({ names: ['A', 'B', 'C', 'D'], seed: 4, startingPlayer: 2 });
  game.phase = 'end'; game.extraRoll = true;
  game = reduceGame(game, { type: 'END_TURN' });
  assert.equal(game.currentPlayer, 2); assert.equal(game.round, 1);
  game.players[2].bankrupt = true;
  for (const [next, round] of [[3, 1], [0, 1], [1, 1], [3, 2]]) {
    game.phase = 'end'; game = reduceGame(game, { type: 'END_TURN' });
    assert.equal(game.currentPlayer, next); assert.equal(game.round, round);
  }
});

test('legacy snapshots keep their current actor and index-zero round marker', () => {
  let game = createGame({ names: ['A', 'B', 'C'], seed: 5 });
  delete game.startingPlayer; game.currentPlayer = 2; game.phase = 'end';
  game = reduceGame(JSON.parse(JSON.stringify(game)), { type: 'END_TURN' });
  assert.equal(game.currentPlayer, 0); assert.equal(game.round, 2);
});

test('city end-of-game limits count a full cycle from the chosen starter, not crossing index zero', () => {
  let game = createGame({ names: ['A', 'B', 'C', 'D'], mode: 'city', maxRounds: 4, seed: 7, startingPlayer: 2 });
  game.round = 4;
  for (const next of [3, 0, 1]) {
    game.phase = 'end'; game = reduceGame(game, { type: 'END_TURN' });
    assert.equal(game.phase, 'roll'); assert.equal(game.currentPlayer, next);
  }
  game.phase = 'end'; game = reduceGame(game, { type: 'END_TURN' });
  assert.equal(game.phase, 'finished');
});

test('invalid starting indices fail before constructing a game', () => {
  for (const index of [-1, 2, 0.5, NaN, Infinity]) {
    assert.throws(() => createGame({ names: ['A', 'B'], startingPlayer: index }), /Người đi đầu/);
  }
});
