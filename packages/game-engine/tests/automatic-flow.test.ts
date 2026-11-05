import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, reduceGame, automaticAction, hasLandingChoice } from '../src';

const game = () => createGame({ names: ['An', 'Bình'], seed: 123, propertyRules: 'landing-v1', propertyPricing: 'level-one-included' });

test('an empty landing ends despite optional trades, while a new main turn still waits for a roll', () => {
  const state = game();
  assert.equal(automaticAction(state), null);
  state.phase = 'end';
  assert.deepEqual(automaticAction(state), { type: 'END_TURN' });
  const ended = reduceGame(state, automaticAction(state)!);
  assert.equal(ended.currentPlayer, 1);
  assert.equal(automaticAction(ended), null);
});

test('doubles and flight continuations both wait for the roll button', () => {
  for (const kind of ['doubles', 'flight'] as const) {
    const state = game(); state.phase = 'end';
    if (kind === 'doubles') { state.extraRoll = true; state.doubles = 1; }
    else state.flightRollPending = true;
    const ready = reduceGame(state, { type: 'END_TURN' });
    assert.equal(ready.currentPlayer, 0);
    assert.equal(ready.phase, 'roll');
    assert.equal(ready.automaticRoll, undefined);
    assert.equal(automaticAction(ready), null);
    // Reconnecting to a snapshot from the old automatic-flight behavior must also wait.
    ready.automaticRoll = true;
    assert.equal(automaticAction(ready), null);
    const rolled = reduceGame(ready, { type: 'ROLL', dice: [1, 2] });
    assert.equal(rolled.automaticRoll, undefined);
    assert.equal(rolled.players[0].position, 3);
    assert.equal(automaticAction(rolled), null);
  }
});

test('buying after doubles restores a manual roll without changing player or rolling twice', () => {
  const state = game(); state.players[0].position = 1;
  const landed = reduceGame(state, { type: 'ROLL', dice: [1, 1] });
  assert.equal(landed.phase, 'purchase');
  const bought = reduceGame(landed, { type: 'BUY', level: 2 });
  const ready = reduceGame(bought, automaticAction(bought)!);
  assert.equal(ready.phase, 'roll');
  assert.equal(ready.currentPlayer, 0);
  assert.equal(ready.doubles, 1);
  assert.equal(ready.properties[3].level, 2);
  assert.deepEqual(ready.lastRoll, landed.lastRoll);
  assert.equal(automaticAction(ready), null);
  // Older snapshots may still carry the previous automatic-doubles flag.
  ready.automaticRoll = true;
  assert.equal(automaticAction(ready), null);
});

test('upgrade is offered once; skip clears the visit, purchase/build decisions auto-finish', () => {
  const state = game(); state.phase = 'end'; state.players[0].position = 3;
  state.propertyVisit = { playerId: 'player-1', tileId: 3, ownerIdOnArrival: 'player-1', levelOnArrival: 1 };
  state.properties[3] = { ownerId: 'player-1', level: 1, mortgaged: false, business: 'residence' };
  assert.equal(hasLandingChoice(state), true);
  assert.equal(automaticAction(state), null);
  const skipped = reduceGame(state, { type: 'END_TURN' });
  assert.equal(skipped.propertyVisit, undefined);
  assert.ok(reduceGame(skipped, { type: 'BUILD', tileId: 3, level: 2 }).error);
  const built = reduceGame(state, { type: 'BUILD', tileId: 3, level: 2 });
  assert.equal(built.error, null);
  assert.equal(hasLandingChoice(built), false);
  assert.deepEqual(automaticAction(built), { type: 'END_TURN' });
  const landed = reduceGame(game(), { type: 'ROLL', dice: [1, 2] });
  const bought = reduceGame(landed, { type: 'BUY', level: 1 });
  assert.deepEqual(automaticAction(bought), { type: 'END_TURN' });
});

test('card effects auto-apply only after reveal and never choose a valid target for the player', () => {
  const state = game(); state.phase = 'card';
  state.drawnCard = { deck: 'chance', cardId: 'chance-08', revealed: false };
  assert.equal(automaticAction(state), null);
  const revealed = reduceGame(state, { type: 'DRAW_CARD' });
  assert.deepEqual(automaticAction(revealed), { type: 'RESOLVE_CARD' });
  revealed.drawnCard!.cardId = 'chance-18';
  assert.deepEqual(automaticAction(revealed), { type: 'RESOLVE_CARD' });
  revealed.properties[3] = { ownerId: 'player-2', level: 1, mortgaged: false, business: 'residence' };
  assert.equal(automaticAction(revealed), null);
  revealed.drawnCard!.cardId = 'chance-23';
  revealed.properties[3].ownerId = 'player-1';
  assert.equal(automaticAction(revealed), null);
  revealed.debt = { debtorId: 'player-1', creditorId: null, amount: 50, reason: 'test' };
  revealed.drawnCard!.cardId = 'chance-08';
  assert.equal(automaticAction(revealed), null);
});
