import assert from 'node:assert/strict';
import test from 'node:test';
import { MAP_TILES, board32Layout } from './board-layout';

test('board has all 32 gameplay tiles with approved landmarks and card positions', () => {
  assert.equal(MAP_TILES.length, 32);
  for (const [kind, count] of Object.entries({
    city: 20,
    tourism: 4,
    chance: 3,
    tax: 1,
    go: 1,
    island: 1,
    festival: 1,
    airport: 1,
  })) {
    assert.equal(MAP_TILES.filter((t) => t.kind === kind).length, count, kind);
  }
  assert.deepEqual(
    [0, 8, 16, 24].map((i) => MAP_TILES[i].kind),
    ['go', 'island', 'festival', 'airport'],
  );
  assert.deepEqual(
    Array.from({ length: 8 }, (_, group) => MAP_TILES.filter((t) => t.group === group).length),
    [2, 3, 2, 3, 3, 2, 3, 2],
  );
  const named = MAP_TILES.filter((t) => t.kind !== 'chance').map((t) => t.name);
  assert.equal(new Set(named).size, named.length);
  assert.equal(MAP_TILES.find((t) => t.name === 'Kon Tum')?.model, 'rong');
  assert.equal(MAP_TILES.find((t) => t.name === 'Phan Thiết')?.model, 'water-tower');
  assert.equal(MAP_TILES.find((t) => t.name === 'Đồng Hới')?.model, 'church');
});

test('all 32 tile footprints stay on the board without overlapping', () => {
  const tiles = MAP_TILES.map((_, i) => {
    const layout = board32Layout(i),
      sideways = Math.floor(i / 8) % 2 === 1;
    const w = sideways ? layout.depth : layout.width,
      d = sideways ? layout.width : layout.depth;
    assert.ok(Math.abs(layout.x) + w / 2 <= 5.59);
    assert.ok(Math.abs(layout.z) + d / 2 <= 5.59);
    return { ...layout, w, d };
  });
  tiles.forEach((a, i) =>
    tiles.slice(i + 1).forEach((b) => {
      const overlapX = (a.w + b.w) / 2 - Math.abs(a.x - b.x);
      const overlapZ = (a.d + b.d) / 2 - Math.abs(a.z - b.z);
      assert.ok(overlapX < 0.00001 || overlapZ < 0.00001, `overlap near ${i}`);
    }),
  );
  assert.throws(() => board32Layout(32));
});

test('chance, tourism and tax match the user-specified seven-tile row positions exactly', () => {
  const rows = Array.from({ length: 4 }, (_, row) => MAP_TILES.slice(row * 8 + 1, row * 8 + 8));
  const positions = (kind: string) =>
    rows.map((tiles) => tiles.flatMap((t, i) => (t.kind === kind ? [i + 1] : [])));
  assert.deepEqual(positions('chance'), [[], [4], [4], [4]]);
  assert.deepEqual(positions('tourism'), [[4], [6], [2], [1]]);
  assert.deepEqual(positions('tax'), [[], [], [], [6]]);
  assert.deepEqual(
    rows.flatMap((r) => r.filter((t) => t.kind === 'tourism').map((t) => t.name)),
    ['Phú Quốc', 'Lăng Cô', 'Mỹ Khê', 'Cô Tô'],
  );
  assert.ok(
    MAP_TILES.filter((t) => t.kind === 'city' || t.kind === 'tourism').every(
      (t) => Number.isFinite(t.price) && t.price! > 0,
    ),
  );
});

