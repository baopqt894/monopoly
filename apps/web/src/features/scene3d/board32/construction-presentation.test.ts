import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSTRUCTION_DURATION,
  constructionPose,
  isNewConstruction,
} from './construction-presentation';
test('construction triggers for purchase, multi-level upgrade and final landmark only', () => {
  for (const [before, after] of [
    [0, 1],
    [0, 3],
    [1, 3],
    [4, 5],
  ])
    assert.ok(isNewConstruction({ city: 'Huế', level: before }, { city: 'Huế', level: after }));
  for (const [before, after] of [
    [3, 3],
    [4, 3],
    [2, 0],
    [0, 0],
  ])
    assert.equal(
      isNewConstruction({ city: 'Huế', level: before }, { city: 'Huế', level: after }),
      false,
    );
  assert.equal(isNewConstruction({ city: 'Huế', level: 2 }, { city: 'Hội An', level: 4 }), false);
});
test('construction remains grounded, finite and settles to exact normal scale', () => {
  for (let i = 0; i <= 120; i++) {
    const p = constructionPose((i * CONSTRUCTION_DURATION) / 120);
    assert.ok(p.scaleY > 0 && p.scaleY < 1.1);
    assert.ok(p.scaleXZ >= 0.92 && p.scaleXZ <= 1);
    assert.ok(p.opacity >= 0 && p.opacity <= 1);
  }
  const final = constructionPose(CONSTRUCTION_DURATION + 1);
  assert.equal(final.scaleY, 1);
  assert.equal(final.scaleXZ, 1);
  assert.equal(final.progress, 1);
});
