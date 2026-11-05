import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, Vector3 } from 'three';
import {
  pawnPortraitBounds,
  pawnPortraitCamera,
  portraitPixels,
} from '../src/features/scene3d/pawns/portrait-raster';
import { pawnPortraitKey } from '../src/features/scene3d/pawns/portrait-key';

test('portrait framing keeps wide vehicles, tall lanterns and offset models inside the image', () => {
  for (const [min, max] of [
    [
      [-0.25, 0, -0.25],
      [0.25, 0.7, 0.25],
    ],
    [
      [-0.5, 0, -0.2],
      [0.5, 0.45, 0.2],
    ],
    [
      [-0.2, 0, -0.1],
      [0.2, 1.4, 0.1],
    ],
    [
      [2, -1, 4],
      [3, 1, 4.5],
    ],
  ]) {
    const bounds = new Box3(new Vector3(...min), new Vector3(...max));
    const camera = pawnPortraitCamera(bounds);
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new Vector3(x, y, z).project(camera);
          assert.ok(
            Math.abs(point.x) <= 0.901 && Math.abs(point.y) <= 0.901,
            JSON.stringify(point),
          );
          assert.ok(point.z >= -1 && point.z <= 1);
        }
  }
});

test('portrait readback flips rows without changing colors, alpha or the source pixels', () => {
  const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 255, 255, 0, 0]);
  const before = pixels.slice();
  assert.deepEqual([...portraitPixels(pixels, 2, 2)], [...pixels.slice(8), ...pixels.slice(0, 8)]);
  assert.deepEqual(pixels, before);
  assert.notEqual(pawnPortraitKey('gymmer', '#276951'), pawnPortraitKey('gymmer', '#d49b50'));
});

test('character portraits focus the head and upper chest independently of oversized props', () => {
  const full = new Box3(new Vector3(-1, 0, -1), new Vector3(1, 2, 1));
  for (const token of [
    'street-rider',
    'creator',
    'gymmer',
    'wibu',
    'pickleball',
    'xe-om',
    'star-vendor',
    'ao-dai',
  ]) {
    const focus = pawnPortraitBounds(token, full);
    assert.ok(focus.min.y > 0.2, `${token} excludes the base and lower body`);
    assert.ok(focus.getSize(new Vector3()).y < 0.3, `${token} keeps the face large`);
    const camera = pawnPortraitCamera(focus);
    assert.ok(new Vector3(0, 0, 0).project(camera).y < -1, `${token} base is outside the crop`);
  }
  assert.ok(pawnPortraitBounds('star-vendor', full).max.y < 2.4 * 0.31 * 0.86);
  assert.equal(pawnPortraitBounds('leaf', full), full);
});
