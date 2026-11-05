import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '@typhu/game-engine';
import { cardBoardAction, cardBoardChoices } from '../src/features/game/card-board-selection';

function fixture(cardId: string) {
  const game = createGame({
    names: ['A', 'B', 'C'],
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
  });
  game.phase = 'card';
  game.drawnCard = { deck: 'chance', cardId, revealed: true };
  for (const [id, ownerId, level] of [
    [1, 'player-1', 3],
    [2, 'player-2', 3],
    [3, 'player-2', 5],
    [4, 'player-1', 0],
    [5, 'player-1', 5],
  ] as const) {
    game.properties[id] = { ownerId, level, mortgaged: false, business: 'residence' };
  }
  return game;
}

test('board targeting follows event eligibility, including level-five protection', () => {
  for (const id of ['chance-17', 'chance-18', 'chance-19', 'chance-20']) {
    const game = fixture(id);
    assert.deepEqual(cardBoardChoices(game)?.tileIds, id === 'chance-20' ? [2, 3] : [2]);
    assert.deepEqual(cardBoardAction(game, 2, ''), { type: 'RESOLVE_CARD', targetTileId: 2 });
    assert.equal(cardBoardAction(game, 1, ''), null);
    assert.equal(cardBoardAction(game, null, ''), null);
  }
});

test('gift requires one eligible property and a living opponent; resort and landmark are selectable', () => {
  const game = fixture('chance-23');
  assert.deepEqual(cardBoardChoices(game)?.tileIds, [1, 4, 5]);
  assert.equal(cardBoardAction(game, 4, ''), null);
  assert.equal(cardBoardAction(game, 4, 'player-1'), null);
  assert.deepEqual(cardBoardAction(game, 4, 'player-2'), {
    type: 'RESOLVE_CARD',
    targetTileId: 4,
    targetPlayerId: 'player-2',
  });
  assert.deepEqual(cardBoardAction(game, 5, 'player-3'), {
    type: 'RESOLVE_CARD',
    targetTileId: 5,
    targetPlayerId: 'player-3',
  });
  game.players[2].bankrupt = true;
  assert.equal(cardBoardAction(game, 5, 'player-3'), null);
  game.properties[4].ownerId = 'player-2';
  assert.equal(cardBoardAction(game, 4, 'player-2'), null);
});

test('unrevealed, debt, no eligible targets, ordinary cards and stale phases do not open board targeting', () => {
  const game = fixture('chance-17');
  game.drawnCard!.revealed = false;
  assert.equal(cardBoardChoices(game), null);
  game.drawnCard!.revealed = true;
  game.debt = { debtorId: 'player-1', creditorId: null, amount: 100, reason: 'test' };
  assert.equal(cardBoardChoices(game), null);
  game.debt = null;
  game.phase = 'end';
  assert.equal(cardBoardChoices(game), null);
  game.phase = 'card';
  game.properties = {};
  assert.equal(cardBoardChoices(game), null);
  assert.equal(cardBoardChoices(fixture('chance-21')), null);
});
