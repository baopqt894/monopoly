import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAWN_STEP_MS, PAWN_SINGLE_MOVE_MS, FLIGHT_STEP_MS } from '@typhu/game-content';
import { pawnMotionFrame } from '../src/features/scene3d/pawn-motion';

const walk = { id: 1, playerId: 'A', path: [31, 0, 1] };
test('walks cross GO in order, pause at each tile, and finish only after the entire path', () => {
  assert.deepEqual(pawnMotionFrame(walk, 30, 0), {
    from: 30,
    to: 31,
    progress: 0,
    hop: 0,
    done: false,
  });
  assert.equal(pawnMotionFrame(walk, 30, PAWN_STEP_MS * 0.9).progress, 1);
  assert.equal(pawnMotionFrame(walk, 30, PAWN_STEP_MS * 0.9).done, false);
  assert.equal(pawnMotionFrame(walk, 30, PAWN_STEP_MS).to, 0);
  assert.equal(pawnMotionFrame(walk, 30, PAWN_STEP_MS * 3 - 1).done, false);
  assert.equal(pawnMotionFrame(walk, 30, PAWN_STEP_MS * 3).done, true);
  assert.equal(pawnMotionFrame(walk, 30, PAWN_STEP_MS * 3).to, 1);
});
test('flights use fast timing while direct transfers retain their duration', () => {
  const flight = { id: 2, playerId: 'A', path: [8], mode: 'flight' as const };
  assert.equal(pawnMotionFrame(flight, 24, FLIGHT_STEP_MS - 1).done, false);
  assert.equal(pawnMotionFrame(flight, 24, FLIGHT_STEP_MS).done, true);
  assert.equal(pawnMotionFrame({ ...flight, mode: undefined }, 24, PAWN_SINGLE_MOVE_MS - 1).done, false);
  assert.equal(pawnMotionFrame({ ...flight, path: [] }, 24, 0).to, 24);
});

test('long flights finish the complete route at the shared fast timing', () => {
  const flight = { id: 3, playerId: 'A', path: [31, 0, 1], mode: 'flight' as const };
  assert.equal(pawnMotionFrame(flight, 30, FLIGHT_STEP_MS).to, 0);
  assert.equal(pawnMotionFrame(flight, 30, 3 * FLIGHT_STEP_MS - 1).done, false);
  assert.equal(pawnMotionFrame(flight, 30, 3 * FLIGHT_STEP_MS).done, true);
  assert.equal(pawnMotionFrame(flight, 30, 3 * FLIGHT_STEP_MS).to, 1);
});

test('GO crossing can be reported at the reached step, even when frames skip multiple tiles', async () => {
  const { pawnReachedStep } = await import('../src/features/scene3d/pawn-motion');
  assert.equal(pawnReachedStep(walk, 0), -1);
  assert.equal(pawnReachedStep(walk, PAWN_STEP_MS * 0.8), 0);
  assert.equal(pawnReachedStep(walk, PAWN_STEP_MS * 1.8), 1);
  assert.equal(pawnReachedStep(walk, PAWN_STEP_MS * 20), 2);
  const flight = { ...walk, mode: 'flight' as const };
  assert.equal(pawnReachedStep(flight, FLIGHT_STEP_MS * 1.8), 1);
});
