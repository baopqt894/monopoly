import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '@typhu/game-engine';
import type { CashEvent } from '@typhu/contracts';
import {
  CASH_EVENT_MS,
  CashPresentationQueue,
} from '../src/features/multiplayer/cash-presentation';

const initial = () => createGame({ names: ['An', 'Bình'] });
const earned: CashEvent = {
  id: 1,
  reason: 'GO',
  changes: [{ playerId: 'player-1', amount: 200, balance: 1700 }],
  trigger: { movementId: 5, at: 'step', stepIndex: 0 },
};
const paid: CashEvent = {
  id: 2,
  reason: 'rent',
  changes: [
    { playerId: 'player-1', amount: -200, balance: 1500 },
    { playerId: 'player-2', amount: 200, balance: 1700 },
  ],
  trigger: { movementId: 5, at: 'arrival' },
};
function snapshot() {
  const state = initial();
  state.movement = { id: 5, playerId: 'player-1', path: [0, 1, 2, 3] };
  state.players[1].cash = 1700;
  state.cashEvents = [earned, paid];
  return state;
}
test('net-zero balance still shows +200 at GO and -200 at arrival, with the creditor paid in the same event', () => {
  const queue = new CashPresentationQueue(initial());
  queue.accept(snapshot());
  queue.tick(0);
  assert.equal(queue.view().balances['player-1'], 1500);
  assert.equal(queue.view().active, null);
  queue.step(5, 0);
  queue.tick(10);
  assert.equal(queue.view().balances['player-1'], 1700);
  assert.equal(queue.view().active?.changes[0].amount, 200);
  assert.equal(queue.view().balances['player-2'], 1500);
  queue.tick(10 + CASH_EVENT_MS);
  assert.equal(queue.view().active, null);
  assert.equal(queue.view().busy, true);
  queue.arrive(5);
  queue.tick(1000);
  assert.equal(queue.view().balances['player-1'], 1500);
  assert.equal(queue.view().balances['player-2'], 1700);
  assert.equal(queue.view().active?.reason, 'rent');
  queue.tick(1000 + CASH_EVENT_MS);
  assert.equal(queue.view().busy, false);
  queue.accept(snapshot());
  queue.tick(3000);
  assert.equal(queue.view().busy, false);
});
test('new snapshots join the queue without cancelling or netting the currently displayed event', () => {
  const queue = new CashPresentationQueue(initial());
  const state = snapshot();
  state.cashEvents = [{ ...earned, trigger: undefined }];
  state.players[0].cash = 1700;
  state.players[1].cash = 1500;
  queue.accept(state);
  queue.tick(0);
  const next = {
    ...state,
    cashEvents: [...state.cashEvents, { ...paid, trigger: undefined }],
    players: snapshot().players,
  };
  queue.accept(next);
  queue.tick(100);
  assert.equal(queue.view().active?.id, 1);
  queue.tick(CASH_EVENT_MS);
  assert.equal(queue.view().active?.id, 2);
  assert.equal(queue.view().balances['player-1'], 1500);
});
test('reconnect starts from authoritative balances and never replays historical credits', () => {
  const state = snapshot();
  const queue = new CashPresentationQueue(state);
  queue.tick(0);
  assert.equal(queue.view().busy, false);
  assert.equal(queue.view().balances['player-2'], 1700);
  queue.accept(state);
  queue.tick(1000);
  assert.equal(queue.view().active, null);
});
test('an interrupted or skipped route releases old events instead of stalling the queue', () => {
  const queue = new CashPresentationQueue(initial());
  queue.accept(snapshot());
  const next = snapshot();
  next.movement = { id: 8, playerId: 'player-2', path: [4] };
  queue.accept(next);
  queue.tick(0);
  assert.equal(queue.view().active?.id, 1);
  queue.tick(CASH_EVENT_MS);
  assert.equal(queue.view().active?.id, 2);
  queue.tick(CASH_EVENT_MS * 2);
  assert.equal(queue.view().busy, false);
});
test('legacy snapshots defer their fallback update to arrival, and bounded-history gaps snap to truth', () => {
  const queue = new CashPresentationQueue(initial());
  const old = initial();
  old.players[0].cash = 1400;
  old.movement = { id: 6, playerId: 'player-1', path: [3] };
  queue.accept(old);
  queue.tick(0);
  assert.equal(queue.view().balances['player-1'], 1500);
  queue.arrive(6);
  queue.tick(1);
  assert.equal(queue.view().balances['player-1'], 1400);
  const missed = snapshot();
  missed.cashEvents = [{ ...paid, id: 90 }];
  queue.accept(missed);
  assert.equal(queue.view().busy, false);
  assert.equal(queue.view().balances['player-2'], 1700);
});

test('movement callbacks arriving before the snapshot effect are retained without releasing arrival payments early', () => {
  const queue = new CashPresentationQueue(initial());
  queue.step(5, 0);
  queue.accept(snapshot());
  queue.tick(0);
  assert.equal(queue.view().active?.id, 1);
  queue.tick(CASH_EVENT_MS);
  assert.equal(queue.view().active, null);
  assert.equal(queue.view().balances['player-2'], 1500);
  queue.arrive(5);
  queue.tick(CASH_EVENT_MS + 1);
  assert.equal(queue.view().active?.id, 2);
});

test('a new game discards old movement milestones even if movement IDs are reused', () => {
  const queue = new CashPresentationQueue(initial());
  queue.accept(snapshot());queue.arrive(5);queue.tick(0);queue.tick(CASH_EVENT_MS);queue.tick(CASH_EVENT_MS * 2);
  queue.accept(initial());
  queue.accept(snapshot());queue.tick(3000);
  assert.equal(queue.view().active, null);
  assert.equal(queue.view().balances['player-1'], 1500);
  queue.step(5, 0);queue.tick(3001);
  assert.equal(queue.view().active?.reason, 'GO');
});
