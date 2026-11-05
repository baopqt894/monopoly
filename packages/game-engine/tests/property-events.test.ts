import assert from 'node:assert/strict';
import test from 'node:test';
import type { GameState } from '@typhu/contracts';
import { chooseBotAction, createGame, propertyEventTargets, reduceGame, rentFor, timeoutAction } from '../src';

function event(card: string, level = 3) {
  const state = createGame({ names: ['A', 'B', 'C'], seed: 123, propertyRules: 'landing-v1' });
  state.phase = 'card'; state.drawnCard = { deck: 'chance', cardId: card, revealed: true };
  state.decks.chance = state.decks.chance.filter((id) => id !== card);
  state.properties[3] = { ownerId: 'player-2', level, mortgaged: false, business: 'residence' };
  return state;
}
function cross(state: GameState, index = 1) {
  state.currentPlayer = index; state.phase = 'roll'; state.players[index].position = 37;
  return reduceGame(state, { type: 'ROLL', dice: [1, 2] });
}

test('new rule deck includes exactly four new events; old rules retain the original decks', () => {
  const old = createGame({ seed: 1 }), fresh = createGame({ seed: 1, propertyRules: 'landing-v1' });
  assert.equal(old.decks.chance.length, 16); assert.equal(fresh.decks.chance.length, 23);
  assert.equal(fresh.decks.chest.length, 16);
  assert.equal(new Set(fresh.decks.chance).size, 23);
});

test('earthquake destroys the entire property and ownership; fire lowers exactly one level without refund', () => {
  const original = event('chance-17', 4);
  const destroyed = reduceGame(original, { type: 'RESOLVE_CARD', targetTileId: 3 });
  assert.equal(destroyed.error, null); assert.equal(destroyed.properties[3], undefined); assert.equal(destroyed.players[1].cash, 1500);
  assert.equal(original.properties[3].level, 4);
  for (const level of [1, 4]) {
    const fire = reduceGame(event('chance-18', level), { type: 'RESOLVE_CARD', targetTileId: 3 });
    assert.equal(fire.properties[3].level, level - 1); assert.equal(fire.players[1].cash, 1500);
  }
});

test('forced sale returns the property to the bank and refunds full base land plus present construction, exactly once', () => {
  const before = event('chance-19', 3);
  const sold = reduceGame(before, { type: 'RESOLVE_CARD', targetTileId: 3 });
  assert.equal(sold.error, null); assert.equal(sold.properties[3], undefined);
  assert.equal(sold.players[1].cash, 1710); assert.equal(sold.players[0].cash, 1500);
  const repeated = reduceGame(sold, { type: 'RESOLVE_CARD', targetTileId: 3 });
  assert.ok(repeated.error); assert.equal(repeated.players[1].cash, 1710);
  assert.equal(sold.decks.chance.filter((id) => id === 'chance-19').length, 1);
});

test('only power outage can target a landmark; illegal targets do not consume the card, seed or cash', () => {
  for (const card of ['chance-17', 'chance-18', 'chance-19']) {
    const state = event(card, 5);
    const invalid = reduceGame(state, { type: 'RESOLVE_CARD', targetTileId: 3 });
    assert.ok(invalid.error); assert.deepEqual(invalid.drawnCard, state.drawnCard);
    assert.equal(invalid.seed, state.seed); assert.equal(invalid.properties[3].level, 5);
  }
  const state = event('chance-20', 5);
  assert.deepEqual(propertyEventTargets(state, 'power-outage'), [3]);
  const applied = reduceGame(state, { type: 'RESOLVE_CARD', targetTileId: 3 });
  assert.equal(applied.error, null); assert.equal(applied.properties[3].disabledLaps, 3);
  assert.equal(applied.properties[3].level, 5); assert.equal(rentFor(applied, 3), 0);
});

test('outage expires on the owner’s third GO crossing, including flights, never global rounds or other players’ laps', () => {
  let state = reduceGame(event('chance-20', 5), { type: 'RESOLVE_CARD', targetTileId: 3 });
  state.round += 10; state = cross(state, 0);
  assert.equal(state.properties[3].disabledLaps, 3);
  state.currentPlayer = 1; state.phase = 'roll'; state.players[1].flight = 'ready'; state.players[1].position = 39;
  state = reduceGame(state, { type: 'FLY', tileId: 0 });
  assert.equal(state.properties[3].disabledLaps, 2);
  for (const remaining of [1, 0]) {
    state = cross(state);
    assert.equal(state.properties[3].disabledLaps ?? 0, remaining);
    assert.equal(rentFor(state, 3) === 0, remaining > 0);
  }
});

test('choosing an event target is required when eligible; own properties, wrong tiles and unrevealed cards are rejected', () => {
  const state = event('chance-17');
  state.properties[1] = { ownerId: 'player-1', level: 2, mortgaged: false, business: 'residence' };
  for (const targetTileId of [undefined, 1, -1, 40, NaN]) {
    assert.ok(reduceGame(state, { type: 'RESOLVE_CARD', ...(targetTileId === undefined ? {} : { targetTileId }) }).error);
  }
  state.drawnCard!.revealed = false;
  assert.ok(reduceGame(state, { type: 'RESOLVE_CARD', targetTileId: 3 }).error);
  const noTarget = event('chance-17', 5);
  const fizzled = reduceGame(noTarget, { type: 'RESOLVE_CARD' });
  assert.equal(fizzled.error, null); assert.equal(fizzled.drawnCard, null); assert.equal(fizzled.properties[3].level, 5);
});

test('a second outage resets to three owner crossings, and a takeover preserves the remaining closure', () => {
  let state = reduceGame(event('chance-20', 2), { type: 'RESOLVE_CARD', targetTileId: 3 });
  state = cross(state);
  assert.equal(state.properties[3].disabledLaps, 2);
  state.currentPlayer = 0; state.phase = 'roll'; state.players[0].position = 1;
  state = reduceGame(state, { type: 'ROLL', dice: [1, 1] });
  assert.equal(state.players[0].cash, 1500); // no rent while closed
  state = reduceGame(state, { type: 'BUY_BACK', tileId: 3 });
  assert.equal(state.error, null); assert.equal(state.properties[3].disabledLaps, 2);
  state.phase = 'card'; state.currentPlayer = 2; state.drawnCard = { deck: 'chance', cardId: 'chance-20', revealed: true };
  state = reduceGame(state, { type: 'RESOLVE_CARD', targetTileId: 3 });
  assert.equal(state.error, null); assert.equal(state.properties[3].disabledLaps, 3);
  state = cross(state, 1);
  assert.equal(state.properties[3].disabledLaps, 3); // previous owner's lap cannot reopen it
  state = cross(state, 0);
  assert.equal(state.properties[3].disabledLaps, 2);
});

test('human timeout picks a deterministic random eligible target, bot targets richest owner, planning never mutates state', () => {
  const state = event('chance-20');
  state.properties[1] = { ownerId: 'player-3', level: 2, mortgaged: false, business: 'residence' };
  state.players[2].cash = 9000;
  const copy = structuredClone(state);
  const action = timeoutAction(state)!;
  assert.equal(action.type, 'RESOLVE_CARD');
  assert.equal(reduceGame(state, action).error, null);
  assert.deepEqual(action, timeoutAction(state)); assert.deepEqual(state, copy);
  assert.deepEqual(chooseBotAction(state), { type: 'RESOLVE_CARD', targetTileId: 1 });
  assert.equal(reduceGame(state, chooseBotAction(state)!).error, null);
});
