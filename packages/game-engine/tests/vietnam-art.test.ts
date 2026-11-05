import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { BOARD, VIETNAM_CITIES, buildingName } from '@typhu/game-content';
import { vietnamGeometry } from '../../../apps/web/src/features/scene3d/vietnam/geometry';

test('Vietnam assigns every street exactly one unique city and landmark without touching special IDs', () => {
  const streets = BOARD.filter((tile) => tile.kind === 'street');
  assert.deepEqual(
    Object.keys(VIETNAM_CITIES).map(Number),
    streets.map((tile) => tile.id),
  );
  assert.equal(new Set(streets.map((tile) => tile.name)).size, 22);
  assert.equal(new Set(Object.values(VIETNAM_CITIES).map((city) => city.model)).size, 22);
  for (const tile of streets) {
    assert.equal(tile.name, VIETNAM_CITIES[tile.id].name);
    assert.equal(buildingName(tile.id, 5), VIETNAM_CITIES[tile.id].landmark);
    assert.equal(tile.rents!.length, 6);
  }
  assert.equal(BOARD[30].kind, 'airport');
  assert.equal(BOARD[37].price, 350);
  assert.equal(BOARD[39].price, 400);
});

test('all 110 Vietnam models have finite geometry, complete normals/UVs and a grounded, bounded footprint', () => {
  for (const id of Object.keys(VIETNAM_CITIES).map(Number)) {
    const signatures = new Set<string>();
    for (let level = 1; level <= 5; level++) {
      const parts = vietnamGeometry(id, level);
      const bounds = new Box3();
      let vertices = 0;
      for (const geometry of Object.values(parts)) {
        const pos = geometry.getAttribute('position');
        assert.equal(pos.count, geometry.getAttribute('normal').count);
        assert.equal(pos.count, geometry.getAttribute('uv').count);
        assert.ok(Array.from(pos.array).every(Number.isFinite));
        vertices += pos.count;
        bounds.union(geometry.boundingBox!);
      }
      const size = bounds.getSize(new Vector3());
      assert.ok(Math.abs(bounds.min.y) < 1e-5, id + ':' + level + ' pivot');
      assert.ok(
        size.x <= 1.421 && size.z <= 1.121 && size.y <= 2.051,
        id + ':' + level + ' footprint',
      );
      assert.ok(vertices > 100 && vertices < 70000, id + ':' + level + ' vertex budget');
      signatures.add([vertices, size.x.toFixed(4), size.y.toFixed(4), size.z.toFixed(4)].join(':'));
      assert.equal(parts, vietnamGeometry(id, level), 'geometry reused');
    }
    assert.equal(signatures.size, 5, 'five distinct silhouettes for ' + id);
  }
});

test('landmark identity survives business changes, and invalid city/level inputs fail explicitly', () => {
  assert.equal(vietnamGeometry(27, 5, 'cafe'), vietnamGeometry(27, 5, 'hotel'));
  assert.notEqual(vietnamGeometry(24, 2, 'cafe'), vietnamGeometry(24, 2, 'residence'));
  assert.throws(() => vietnamGeometry(0, 5), /Missing/);
  assert.throws(() => vietnamGeometry(37, 6), /Invalid/);
});
