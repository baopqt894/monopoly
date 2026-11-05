import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

/** Project a board-space anchor into the overlay, keeping the fixed camera unchanged. */
export function BoardClockAnchor({ element }: { element: HTMLDivElement }) {
  const { camera, size } = useThree();
  const point = useMemo(() => new Vector3(), []);
  useFrame(() => {
    // Keep the complete sign inside the empty garden, away from the far-side lots.
    point.set(-1.6, 0.48, -1.6).project(camera);
    const left = `${((point.x + 1) * size.width) / 2}px`;
    const top = `${((1 - point.y) * size.height) / 2}px`;
    if (element.style.left !== left) element.style.left = left;
    if (element.style.top !== top) element.style.top = top;
  });
  return null;
}
