import { Box3, OrthographicCamera, Vector3 } from 'three';

/** Portrait-only focus regions: accessories never shrink the character's face. */
export function pawnPortraitBounds(token: string, fallback: Box3): Box3 {
  // Raw model head positions, plus space for hats, shoulders and upper chest.
  const heads: Record<string, [number, number, number, number?]> = {
    'street-rider': [-0.18, 1.48, 0],
    creator: [0, 1.45, 0],
    gymmer: [0, 1.68, 0],
    wibu: [0, 1.54, 0.015],
    pickleball: [0, 1.61, 0],
    'xe-om': [-0.18, 1.49, 0],
    'star-vendor': [-0.07, 1.4, 0.015, 0.86],
    'ao-dai': [0, 1.51, 0],
    cyclo: [0, 1.49, -0.44, 0.92],
    'buffalo-boy': [-0.08, 1.46, 0.02],
    vendor: [0, 1.46, 0],
  };
  const head = heads[token];
  if (!head) return fallback;
  const [x, y, z, scale = 1] = head;
  const unit = 0.31 * scale;
  return new Box3(
    new Vector3(x - 0.43, y - 0.53, z - 0.2).multiplyScalar(unit),
    new Vector3(x + 0.43, y + 0.36, z + 0.28).multiplyScalar(unit),
  );
}

/** Fit the portrait region using a near-front view for readable faces. */
export function pawnPortraitCamera(bounds: Box3): OrthographicCamera {
  const center = bounds.getCenter(new Vector3());
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.copy(center).add(new Vector3(0.8, 0.5, 6));
  camera.lookAt(center);
  camera.updateMatrixWorld();
  const projected = new Box3();
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z])
        projected.expandByPoint(new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
  const extent = projected.getSize(new Vector3());
  camera.zoom = 1.8 / Math.max(extent.x, extent.y, 0.001);
  camera.updateProjectionMatrix();
  return camera;
}

/** WebGL readback is bottom-up; canvas ImageData is top-down. */
export function portraitPixels(
  pixels: Uint8Array,
  width: number,
  height: number,
): Uint8ClampedArray<ArrayBuffer> {
  const result = new Uint8ClampedArray(width * height * 4);
  const row = width * 4;
  for (let y = 0; y < height; y++)
    result.set(pixels.subarray((height - y - 1) * row, (height - y) * row), y * row);
  return result;
}
