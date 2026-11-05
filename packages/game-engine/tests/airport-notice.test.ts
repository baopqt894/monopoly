import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame } from '../src';

test('an actual airport landing emits public player/tile identity on both board versions; passing it does not', () => {
  for (const boardId of [undefined, 'vietnam-32' as const]) {
    const state = createGame({ names: ['An', 'Bình'], boardId });
    const airport = boardId ? 24 : 30;
    state.players[0].position = airport - 3;
    const before = structuredClone(state);
    const next = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
    assert.equal(next.lastBoardEvent?.kind, 'airport-arrival');
    assert.equal(next.lastBoardEvent?.playerId, state.players[0].id);
    assert.equal(next.lastBoardEvent?.tileId, airport);
    assert.equal(next.lastBoardEvent?.id, next.log[0].id);
    assert.equal(next.players[0].flight, 'waiting');
    assert.deepEqual(state, before);
    assert.equal(reduceGame(state, { type: 'ROLL', dice: [2, 3] }).lastBoardEvent, undefined);
    const ended = reduceGame(next, { type: 'END_TURN' });
    assert.equal(ended.currentPlayer, 1);
    assert.deepEqual(ended.lastBoardEvent, next.lastBoardEvent);
  }
});

test('arriving by flight or a travel card emits the same airport notice', () => {
  const state = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  state.players[0].flight = 'ready';
  const flown = reduceGame(state, { type: 'FLY', tileId: 24 });
  assert.equal(flown.error, null);
  assert.equal(flown.lastBoardEvent?.tileId, 24);
  const card = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  card.phase = 'card'; card.drawnCard = { deck: 'chance', cardId: 'chance-07', revealed: true };
  card.decks.chance = card.decks.chance.filter(id => id !== 'chance-07');
  const travelled = reduceGame(card, { type: 'RESOLVE_CARD' });
  assert.equal(travelled.error, null);
  assert.equal(travelled.lastBoardEvent?.kind, 'airport-arrival');
  assert.equal(travelled.lastBoardEvent?.tileId, 24);
});

test('a later airport visit gets a fresh event ID; rejected actions cannot manufacture one', () => {
  const state = createGame({ names: ['An', 'Bình'], boardId: 'vietnam-32' });
  state.players[0].position = 21;
  const first = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  assert.deepEqual(reduceGame(first, { type: 'ROLL' }).lastBoardEvent, first.lastBoardEvent);
  const later = structuredClone(first); later.phase = 'roll'; later.players[0].position = 21;
  delete later.players[0].flight;
  const second = reduceGame(later, { type: 'ROLL', dice: [1, 2] });
  assert.ok(second.lastBoardEvent!.id > first.lastBoardEvent!.id);
});
