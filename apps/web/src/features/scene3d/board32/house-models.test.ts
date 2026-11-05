import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, Vector3 } from 'three';
import { assetHouseGeometry } from './house-models';
import { cityLandmarkGeometry } from './landmark-models';

test('all 32 house models are grounded, finite and fit their building zone without a raised plinth', () => {
  for (let group = 0; group < 8; group++) {
    const heights: number[] = [];
    for (let level = 1; level <= 4; level++) {
      const parts = assetHouseGeometry(group, level);
      const bounds = new Box3();
      for (const geometry of Object.values(parts)) {
        assert.ok(geometry.getAttribute('position').count > 0);
        for (const value of geometry.getAttribute('position').array)
          assert.ok(Number.isFinite(value));
        geometry.computeBoundingBox();
        bounds.union(geometry.boundingBox!);
        assert.ok(geometry.getAttribute('normal'));
      }
      const size = bounds.getSize(new Vector3());
      heights.push(size.y);
      assert.ok(Math.abs(bounds.min.y) < 1e-6, `ground: ${group}/${level}`);
      assert.ok(size.x * 0.62 <= 0.97 && size.z * 0.62 <= 0.7, `footprint: ${group}/${level}`);
    }
    assert.ok(heights[1] > heights[0], `two-storey upgrade: ${group}`);
    assert.ok(heights[3] > heights[2], `three-storey upgrade: ${group}`);
  }
});

test('final-tier city meshes are grounded and fit the same city footprint', () => {
  for (const name of ['turtle', 'market'] as const) {
    const bounds = new Box3();
    for (const geometry of Object.values(cityLandmarkGeometry(name))) {
      geometry.computeBoundingBox();
      bounds.union(geometry.boundingBox!);
      for (const value of geometry.getAttribute('position').array)
        assert.ok(Number.isFinite(value));
    }
    const size = bounds.getSize(new Vector3());
    assert.ok(Math.abs(bounds.min.y) < 1e-6);
    assert.ok(size.x * 0.72 <= 0.97 && size.z * 0.72 <= 0.7);
  }
});
