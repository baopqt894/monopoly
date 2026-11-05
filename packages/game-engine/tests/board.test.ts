import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, DECKS, GROUPS, CITY_EVENTS } from '@typhu/game-content';
import { tileLayout } from '../../../apps/web/src/features/scene3d/board-layout';

test('standard board has exactly 40 stable clockwise IDs and the four correct corners', () => {
  assert.equal(BOARD.length, 40);
  assert.deepEqual(BOARD.map((tile) => tile.id), Array.from({ length: 40 }, (_, i) => i));
  assert.deepEqual([0, 10, 20, 30].map((id) => BOARD[id].kind), ['go', 'jail', 'parking', 'airport']);
});
test('standard tile counts and both event deck positions are preserved', () => {
  const counts = Object.fromEntries([...new Set(BOARD.map((tile) => tile.kind))].map((kind) => [kind, BOARD.filter((tile) => tile.kind === kind).length]));
  assert.equal(counts.street, 22); assert.equal(counts.railroad, 4); assert.equal(counts.utility, 2); assert.equal(counts.tax, 2);
  assert.deepEqual(BOARD.filter((tile) => tile.kind === 'chance').map((tile) => tile.id), [7, 22, 36]);
  assert.deepEqual(BOARD.filter((tile) => tile.kind === 'chest').map((tile) => tile.id), [2, 17, 33]);
});
test('all eight color sets and price/rent schedules are complete', () => {
  assert.deepEqual(Object.keys(GROUPS).map((group) => BOARD.filter((tile) => tile.group === group).length), [2, 3, 3, 3, 3, 3, 3, 2]);
  for (const tile of BOARD.filter((entry) => entry.kind === 'street')) {
    assert.equal(tile.rents?.length, 6); assert.ok(tile.price! > 0); assert.ok(tile.buildCost! > 0);
    assert.ok(tile.rents!.every((rent, i, rents) => i === 0 || rent > rents[i - 1]));
  }
});
test('the two independent decks have 16 unique cards and valid destinations', () => {
  for (const cards of Object.values(DECKS)) {
    assert.equal(cards.length, 16); assert.equal(new Set(cards.map((card) => card.id)).size, 16);
    for (const card of cards) if (card.effect.type === 'move') assert.ok(BOARD[card.effect.destination]);
  }
  for (const event of CITY_EVENTS) assert.ok(event.groups.every((group) => group in GROUPS));
});
test('2.5D tile positions form a non-overlapping square perimeter with GO at front-right', () => {
  const positions = BOARD.map((tile) => tileLayout(tile.id));
  assert.equal(new Set(positions.map((p) => `${p.x}:${p.z}`)).size, 40);
  assert.deepEqual([0, 10, 20, 30].map((id) => [Math.sign(positions[id].x), Math.sign(positions[id].z)]), [[1, 1], [-1, 1], [-1, -1], [1, -1]]);
  for (const position of positions) {
    assert.ok(Math.abs(position.x) + position.width / 2 <= 5.951);
    assert.ok(Math.abs(position.z) + position.depth / 2 <= 5.951);
  }
});
