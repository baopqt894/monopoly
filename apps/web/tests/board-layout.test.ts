import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, BOARD_32, VIETNAM_CITIES } from '@typhu/game-content';
import { tileLayout, buildingModelId } from '../src/features/scene3d/board-layout';

for (const count of [32, 40]) {
  test(`${count} tiles cover a closed perimeter with no gaps, overlap or duplicate positions`, () => {
    const tiles = Array.from({ length: count }, (_, id) =>
      tileLayout(id, count === 32 ? 'vietnam-32' : undefined),
    );
    assert.equal(new Set(tiles.map((tile) => `${tile.x},${tile.z}`)).size, count);
    for (let id = 0; id < count; id++) {
      const a = tiles[id],
        b = tiles[(id + 1) % count];
      assert.ok([a.x, a.z, a.width, a.depth].every(Number.isFinite));
      const xDistance = Math.abs(a.x - b.x),
        zDistance = Math.abs(a.z - b.z);
      assert.ok(xDistance === 0 || zDistance === 0, `adjacent tiles ${id} must share one axis`);
      const expected = xDistance ? (a.width + b.width) / 2 : (a.depth + b.depth) / 2;
      assert.ok(
        Math.abs(xDistance + zDistance - expected) < 0.001,
        `tiles ${id} and ${(id + 1) % count} meet at their edges`,
      );
    }
    const edge = count === 32 ? 4.68 : 5.225;
    assert.deepEqual(
      [0, 1, 2, 3].map((side) => tiles[(side * count) / 4]).map(({ x, z }) => [x, z]),
      [
        [edge, edge],
        [-edge, edge],
        [-edge, -edge],
        [edge, -edge],
      ],
    );
  });
}

test('street tiles on both boards resolve their building catalog by city identity', () => {
  for (const board of [BOARD, BOARD_32]) {
    for (const tile of board.filter((tile) => tile.kind === 'street')) {
      const modelId = buildingModelId(tile);
      if (modelId === undefined) assert.ok(['Kon Tum', 'Vinh'].includes(tile.name), tile.name);
      else assert.equal(VIETNAM_CITIES[modelId].name, tile.name);
    }
  }
});
