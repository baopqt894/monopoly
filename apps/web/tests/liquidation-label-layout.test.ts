import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrthographicCamera, Vector3 } from 'three';
import { BOARD, BOARD_32 } from '@typhu/game-content';
import { tileLayout } from '../src/features/scene3d/board-layout';
import { arrangeSaleLabels } from '../src/features/scene3d/liquidation-label-layout';

for (const board of [BOARD_32, BOARD]) {
  for (const [width, height, badgeWidth] of [
    [320, 680, 42],
    [390, 844, 42],
    [1280, 720, 72],
  ]) {
    test(`${board.length} board sale labels remain distinct at ${width}px, including adjacent tiles`, () => {
      const camera = new OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        0.1,
        250,
      );
      camera.position.set(13, board === BOARD_32 ? 13 : 17, 13);
      camera.lookAt(0, 0.55, 0);
      camera.zoom = Math.min(width / 17.8, height / 13);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const anchors = board
        .filter((tile) => tile.price !== undefined)
        .map((tile) => {
          const layout = tileLayout(tile.id, board === BOARD_32 ? 'vietnam-32' : undefined);
          const point = new Vector3(layout.x, board === BOARD_32 ? 0.58 : 0.44, layout.z).project(
            camera,
          );
          return {
            id: tile.id,
            x: ((point.x + 1) * width) / 2,
            y: ((1 - point.y) * height) / 2,
            width: badgeWidth,
            height: width < 600 ? 25 : 32,
          };
        });
      const labels = arrangeSaleLabels(anchors, width, height);
      for (const [index, a] of labels.entries()) {
        assert.ok(a.x >= a.width / 2 && a.x <= width - a.width / 2);
        assert.ok(a.y >= a.height / 2 && a.y <= height - a.height / 2);
        assert.ok(Math.hypot(a.x - anchors[index].x, a.y - anchors[index].y) <= 120.01);
        for (const b of labels.slice(index + 1)) {
          assert.ok(
            Math.abs(a.x - b.x) >= (a.width + b.width) / 2 ||
              Math.abs(a.y - b.y) >= (a.height + b.height) / 2,
            `${a.id} and ${b.id} overlap`,
          );
        }
      }
    });
  }
}
