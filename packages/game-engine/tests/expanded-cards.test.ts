import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  reduceGame,
  cardChoices,
  cardResolutionAction,
  cardDeckSize,
  propertyEventTargets,
  rentFor,
  bankSupply,
} from '../src';
import { getCard } from '@typhu/game-content';
import { random } from '../src/random';

const game = () =>
  createGame({
    names: ['A', 'B', 'C'],
    boardId: 'vietnam-32',
    propertyRules: 'landing-v1',
    propertyPricing: 'level-one-included',
    seed: 123,
  });
function card(id: string) {
  const state = game();
  state.phase = 'card';
  state.drawnCard = { deck: 'chance', cardId: id, revealed: true };
  state.decks.chance = state.decks.chance.filter((value) => value !== id);
  return state;
}
function own(state: ReturnType<typeof game>, id: number, ownerId = 'player-1', level = 1) {
  state.properties[id] = { ownerId, level, mortgaged: false, business: 'residence' };
}

test('expanded deck has 23 unique chance cards, unchanged 16 chest cards and accurate counts while escape cards are held', () => {
  const state = game();
  assert.equal(state.decks.chance.length, 23);
  assert.equal(state.decks.chest.length, 16);
  assert.equal(new Set(state.decks.chance).size, 23);
  for (const id of state.decks.chance) assert.equal(getCard('chance', id, state.boardId).id, id);
  const before = card('chance-09');
  assert.equal(cardDeckSize(before, 'chance'), 23);
  const held = reduceGame(before, { type: 'RESOLVE_CARD' });
  assert.equal(held.players[0].jailCards.length, 1);
  assert.equal(cardDeckSize(held, 'chance'), 23);
  const old = createGame();
  assert.equal(cardDeckSize(old, 'chance'), 16);
});

test('card six visits the festival corner and opens host selection only if the actor owns a city', () => {
  const state = card('chance-06');
  own(state, 1);
  state.players[0].position = 28;
  const moved = reduceGame(state, { type: 'RESOLVE_CARD' });
  assert.equal(moved.error, null);
  assert.equal(moved.players[0].position, 16);
  assert.equal(moved.phase, 'festival');
  assert.equal(moved.players[0].cash, 1700);
  assert.equal(moved.players[0].completedLaps, 1);
  assert.equal(reduceGame(card('chance-06'), { type: 'RESOLVE_CARD' }).phase, 'end');
});

test('card seven reaches the airport, grants a next-main-turn ticket and does not charge a flight fare', () => {
  const state = card('chance-07');
  state.players[0].cash = 0;
  const moved = reduceGame(state, { type: 'RESOLVE_CARD' });
  assert.equal(moved.players[0].position, 24);
  assert.equal(moved.players[0].flight, 'waiting');
  assert.equal(moved.players[0].cash, 0);
  assert.ok(reduceGame(moved, { type: 'FLY', tileId: 1 }).error);
});

test('festival-city travel goes to the single active festival; absent festival consumes the card without moving', () => {
  const state = card('chance-21');
  state.festivalTileId = 1;
  state.players[0].position = 28;
  const moved = reduceGame(state, { type: 'RESOLVE_CARD' });
  assert.equal(moved.players[0].position, 1);
  assert.equal(moved.phase, 'purchase');
  assert.equal(moved.players[0].cash, 1700);
  const absent = card('chance-21');
  absent.festivalTileId = null;
  const used = reduceGame(absent, { type: 'RESOLVE_CARD' });
  assert.equal(used.players[0].position, 0);
  assert.equal(used.players[0].cash, 1500);
  assert.equal(used.drawnCard, null);
  assert.equal(used.decks.chance.at(-1), 'chance-21');
});

test('tax travel wraps forward, pays GO before the tax and computes ten percent of the actor cash and full property values', () => {
  const state = card('chance-22');
  state.players[0].position = 31;
  own(state, 1);
  own(state, 2);
  own(state, 4, 'player-1', 0);
  const moved = reduceGame(state, { type: 'RESOLVE_CARD' });
  assert.equal(moved.players[0].position, 30);
  assert.equal(moved.players[0].cash, 1498);
  assert.equal(moved.players[0].completedLaps, 1);
});

test('earthquake deletes both land and buildings without refund, breaks a color group and preserves map events', () => {
  const state = card('chance-17');
  own(state, 1, 'player-2');
  own(state, 2, 'player-2');
  state.eventTileIds = [1];
  state.festivalTileId = 1;
  const beforeRent = rentFor(state, 2),
    supply = bankSupply(state).houses;
  const destroyed = reduceGame(state, { type: 'RESOLVE_CARD', targetTileId: 1 });
  assert.equal(destroyed.properties[1], undefined);
  assert.equal(destroyed.players[1].cash, 1500);
  assert.equal(rentFor(destroyed, 2), beforeRent / 2);
  assert.equal(bankSupply(destroyed).houses, supply + 1);
  assert.deepEqual(destroyed.eventTileIds, [1]);
  assert.equal(destroyed.festivalTileId, 1);
  own(state, 1, 'player-2', 5);
  assert.ok(!propertyEventTargets(state, 'earthquake').includes(1));
});

test('gift transfers exactly one self-owned tile and all building/outage state, with no payment or movement', () => {
  for (const [id, level] of [
    [1, 5],
    [4, 0],
  ]) {
    const state = card('chance-23');
    own(state, id, 'player-1', level);
    own(state, 2);
    state.properties[id].disabledLaps = 2;
    const gift = reduceGame(state, {
      type: 'RESOLVE_CARD',
      targetTileId: id,
      targetPlayerId: 'player-2',
    });
    assert.equal(gift.error, null);
    assert.deepEqual(gift.properties[id], { ...state.properties[id], ownerId: 'player-2' });
    assert.equal(gift.properties[2].ownerId, 'player-1');
    assert.deepEqual(
      gift.players.map((player) => player.cash),
      state.players.map((player) => player.cash),
    );
    assert.equal(gift.players[0].position, 0);
    assert.equal(state.properties[id].ownerId, 'player-1');
    assert.ok(
      reduceGame(gift, { type: 'RESOLVE_CARD', targetTileId: 2, targetPlayerId: 'player-2' }).error,
    );
  }
});

test('gift cannot take opponent assets, target self/bankrupt/missing recipient or bypass unpaid debt; errors do not consume anything', () => {
  const state = card('chance-23');
  own(state, 1);
  own(state, 2, 'player-2');
  state.players[2].bankrupt = true;
  for (const payload of [
    {},
    { targetTileId: 2, targetPlayerId: 'player-2' },
    { targetTileId: 1, targetPlayerId: 'player-1' },
    { targetTileId: 1, targetPlayerId: 'player-3' },
    { targetTileId: 1, targetPlayerId: 'missing' },
    { targetTileId: 1.5, targetPlayerId: 'player-2' },
  ]) {
    const invalid = reduceGame(state, { type: 'RESOLVE_CARD', ...payload });
    assert.ok(invalid.error);
    assert.deepEqual(invalid.drawnCard, state.drawnCard);
    assert.deepEqual(invalid.decks, state.decks);
    assert.deepEqual(invalid.properties, state.properties);
    assert.equal(invalid.seed, state.seed);
  }
  const owing = structuredClone(state);
  owing.debt = { debtorId: 'player-1', creditorId: 'player-2', amount: 100, reason: 'rent' };
  assert.ok(
    reduceGame(owing, { type: 'RESOLVE_CARD', targetTileId: 1, targetPlayerId: 'player-2' }).error,
  );
  const ordinary = card('chance-08');
  assert.ok(reduceGame(ordinary, { type: 'RESOLVE_CARD', targetPlayerId: 'player-2' }).error);
});

test('gift without assets or recipients fizzles; hidden cards do not expose choices', () => {
  const state = card('chance-23');
  assert.equal(reduceGame(state, { type: 'RESOLVE_CARD' }).drawnCard, null);
  own(state, 1);
  state.drawnCard!.revealed = false;
  assert.deepEqual(cardChoices(state).tileIds, []);
  state.drawnCard!.revealed = true;
  state.players[1].bankrupt = true;
  state.players[2].bankrupt = true;
  assert.equal(reduceGame(state, { type: 'RESOLVE_CARD' }).drawnCard, null);
});

test('gift can complete the recipient Resort Monopoly and award that recipient instantly', () => {
  const state = card('chance-23');
  state.victoryRules = 'business-tour-v1';
  own(state, 4, 'player-1', 0);
  for (const id of [14, 18, 25]) own(state, id, 'player-2', 0);
  const gift = reduceGame(state, {
    type: 'RESOLVE_CARD',
    targetTileId: 4,
    targetPlayerId: 'player-2',
  });
  assert.equal(gift.winnerId, 'player-2');
  assert.equal(gift.winReason, 'resort-monopoly');
  assert.equal(gift.phase, 'finished');
});

test('gift timeout planning is pure and seeded; bot and timeout return legal choices', () => {
  const state = card('chance-23');
  own(state, 1);
  own(state, 4, 'player-1', 0);
  const before = structuredClone(state),
    action = cardResolutionAction(state, 'random');
  assert.deepEqual(state, before);
  assert.deepEqual(action, cardResolutionAction(state, 'random'));
  const used = reduceGame(state, action);
  assert.equal(used.error, null);
  const rng = { seed: state.seed };
  random(rng);
  random(rng);
  assert.equal(used.seed, rng.seed);
  assert.equal(reduceGame(state, cardResolutionAction(state, 'richest')).error, null);
});
