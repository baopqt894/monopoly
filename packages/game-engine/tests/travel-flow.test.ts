import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, DECKS } from '@typhu/game-content';
import { createGame, reduceGame } from '../src';
import type { GameState } from '@typhu/contracts';

const game = () => createGame({ names: ['An', 'Bình'], mode: 'classic', seed: 123 });
const useCard = (state: GameState) => reduceGame(reduceGame(state, { type: 'DRAW_CARD' }), { type: 'RESOLVE_CARD' });
function airport(doubles = false) {
  const state = game(); state.players[0].position = doubles ? 28 : 27;
  return reduceGame(state, { type: 'ROLL', dice: doubles ? [1, 1] : [1, 2] });
}
function readyFlight() {
  let state = reduceGame(airport(), { type: 'END_TURN' });
  state.phase = 'end';
  return reduceGame(state, { type: 'END_TURN' });
}

test('land on property, buy or skip: skipping preserves cash and leaves land unowned without auction', () => {
  const landed = reduceGame(game(), { type: 'ROLL', dice: [1, 2] });
  assert.equal(landed.phase, 'purchase');
  assert.deepEqual(landed.movement?.path, [1, 2, 3]);
  const skipped = reduceGame(landed, { type: 'SKIP_PURCHASE' });
  assert.equal(skipped.phase, 'roll'); assert.equal(skipped.currentPlayer, 1); assert.equal(skipped.auction, null);
  assert.deepEqual(skipped.properties, {}); assert.equal(skipped.players[0].cash, 1500);
  assert.equal(reduceGame(landed, { type: 'BUY' }).properties[3].ownerId, 'player-1');
  assert.ok(reduceGame(skipped, { type: 'SKIP_PURCHASE' }).error);
});

test('card must be drawn before use, reveal has no effect, use applies exactly once', () => {
  const initial = game(); initial.decks.chance = ['chance-08'];
  const landed = reduceGame(initial, { type: 'ROLL', dice: [3, 4] });
  assert.equal(landed.drawnCard?.revealed, false);
  assert.ok(reduceGame(landed, { type: 'RESOLVE_CARD' }).error);
  const drawn = reduceGame(landed, { type: 'DRAW_CARD' });
  assert.equal(drawn.drawnCard?.revealed, true); assert.equal(drawn.players[0].cash, 1500);
  assert.ok(reduceGame(drawn, { type: 'DRAW_CARD' }).error);
  const used = reduceGame(drawn, { type: 'RESOLVE_CARD' });
  assert.equal(used.players[0].cash, 1550); assert.equal(used.phase, 'end');
  const again = reduceGame(used, { type: 'RESOLVE_CARD' });
  assert.ok(again.error); assert.equal(again.players[0].cash, 1550);
});

test('old snapshots without optional travel fields still support drawing and using a pending card', () => {
  const state = game(); state.phase = 'card'; state.drawnCard = { deck: 'chance', cardId: 'chance-08' };
  assert.equal(useCard(state).players[0].cash, 1550);
  assert.ok(reduceGame(state, { type: 'FLY', tileId: 3 }).error);
});

test('airport cancels doubles, ends the turn and grants a ticket on the next main turn', () => {
  let state = airport(true);
  assert.equal(state.players[0].position, 30);
  assert.equal(state.players[0].flight, 'waiting');
  assert.equal(state.extraRoll, false);
  assert.ok(reduceGame(state, { type: 'FLY', tileId: 3 }).error);
  state = reduceGame(state, { type: 'END_TURN' });
  assert.equal(state.currentPlayer, 1); assert.equal(state.phase, 'roll');
  state.phase = 'end'; state = reduceGame(state, { type: 'END_TURN' });
  assert.equal(state.currentPlayer, 0); assert.equal(state.players[0].flight, 'ready');
});

test('flight pays 50, receives GO salary on crossings, handles island capture and consumes ticket exactly once', () => {
  for (const tile of BOARD.filter(tile => !['jail','chance','chest','tax','parking'].includes(tile.kind))) {
    const before = readyFlight(); const state = reduceGame(before, { type: 'FLY', tileId: tile.id });
    assert.equal(state.error, null, tile.name); assert.equal(state.players[0].position, tile.id);
    assert.equal(state.players[0].jailed, tile.kind === 'jail'); assert.equal(state.extraRoll, false);
    assert.equal(state.players[0].cash, (1450 + (tile.id < 30 ? 200 : 0)) * (tile.kind === 'tax' ? 0.9 : 1));
    assert.deepEqual(state.movement?.path, Array.from({length:(tile.id-30+40)%40},(_,i)=>(31+i)%40));
    assert.equal(state.movement?.mode, 'flight');
    assert.equal(state.players[0].flight, tile.id === 30 ? 'waiting' : undefined);
    assert.equal(state.phase, tile.price ? 'purchase' : ['chance', 'chest'].includes(tile.kind) ? 'card' : 'end');
    assert.ok(reduceGame(state, { type: 'FLY', tileId: 3 }).error);
    assert.equal(before.players[0].flight, 'ready');
  }
});

test('flight validates destinations and phase without consuming ticket; rolling requires insufficient flight money', () => {
  const before = readyFlight();
  for (const tileId of [-1, 40, 1.5, NaN, Infinity]) {
    const state = reduceGame(before, { type: 'FLY', tileId });
    assert.ok(state.error); assert.equal(state.players[0].flight, 'ready'); assert.equal(state.players[0].position, 30);
  }
  const rolled = reduceGame(before, { type: 'ROLL', dice: [1, 2] });
  assert.ok(rolled.error); assert.equal(rolled.players[0].flight, 'ready'); assert.equal(rolled.players[0].position, 30);
  const poor=structuredClone(before);poor.players[0].cash=49;
  const fallback=reduceGame(poor,{type:'ROLL',dice:[1,2]});
  assert.equal(fallback.error,null);assert.equal(fallback.players[0].flight,undefined);assert.equal(fallback.players[0].position,33);
  const ended = structuredClone(before); ended.phase = 'end';
  assert.ok(reduceGame(ended, { type: 'FLY', tileId: 3 }).error);
});

test('flying to enemy land or Chance is rejected; walking to Chance still requires draw and use', () => {
  const before = readyFlight(); before.properties[3] = { ownerId: 'player-2', level: 0, business: 'residence', mortgaged: false };
  let state = reduceGame(before, { type: 'FLY', tileId: 3 });
  assert.ok(state.error); assert.equal(state.players[0].cash, 1500); assert.equal(state.players[1].cash, 1500);
  before.decks.chance = ['chance-11'];
  state = reduceGame(before, { type: 'FLY', tileId: 7 });
  assert.ok(state.error); assert.equal(state.players[0].flight,'ready');
  delete before.players[0].flight; before.players[0].position=4;
  state = reduceGame(before,{type:'ROLL',dice:[1,2]});
  assert.equal(state.players[0].jailed, false); state = useCard(state);
  assert.equal(state.players[0].jailed, true); assert.equal(state.players[0].position, 10);
});

test('Chance sends a player to the island without salary or ticket; Community has no island-transfer card', () => {
  assert.ok(DECKS.chest.every((card) => card.effect.type !== 'jail'));
  const before = game(); before.players[0].position = 29; before.players[0].flight = 'waiting'; before.decks.chance = ['chance-11'];
  let state = reduceGame(before, { type: 'ROLL', dice: [3, 4] });
  assert.equal(state.players[0].jailed, false); state = useCard(state);
  assert.equal(state.players[0].position, 10); assert.equal(state.players[0].jailed, true);
  assert.equal(state.players[0].cash, 1500); assert.equal(state.players[0].flight, undefined);
  assert.deepEqual(state.movement?.path, Array.from({length:14},(_,i)=>(37+i)%40));
  const chest = game(); chest.decks.chest = ['chest-06'];
  state = useCard(reduceGame(chest, { type: 'ROLL', dice: [1, 1] }));
  assert.equal(state.players[0].jailed, false); assert.equal(state.players[0].cash, 1550);
});

test('movement cards start a fresh draw or property choice and supply an authoritative route', () => {
  const initial = game(); initial.players[0].position = 29; initial.decks.chance = ['chance-10']; initial.decks.chest = ['chest-01'];
  const landed = reduceGame(initial, { type: 'ROLL', dice: [3, 4] });
  const moved = useCard(landed);
  assert.equal(moved.drawnCard?.deck, 'chest'); assert.equal(moved.drawnCard?.revealed, false);
  assert.deepEqual(moved.movement?.path, [35, 34, 33]);
  assert.notEqual(moved.movement?.id, landed.movement?.id);
  const approach = game(); approach.players[0].position=4; approach.decks.chance = ['chance-02'];
  const property = useCard(reduceGame(approach, { type: 'ROLL', dice:[1,2] }));
  assert.equal(property.phase, 'purchase'); assert.ok(BOARD[property.players[0].position].price);
});
