import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, Vector3, Mesh, MeshBasicMaterial, DoubleSide, Raycaster } from 'three';
import { createHash } from 'node:crypto';
import { MAP_TILES } from './board-layout';
import { resolveCityBuilding, landmarkColors } from './building-catalog';
import { cityLandmarkGeometry } from './landmark-models';

const EXPECTED = [
  ['Châu Đốc', 'temple', 'Miếu Bà Chúa Xứ'],
  ['Cần Thơ', 'villa', 'Nhà cổ Bình Thủy'],
  ['Sóc Trăng', 'khmer', 'Chùa Khleang'],
  ['Bạc Liêu', 'hats', 'Nhà hát Cao Văn Lầu'],
  ['Cà Mau', 'sail', 'Biểu tượng Đất Mũi'],
  ['Buôn Ma Thuột', 'coffee', 'Bảo tàng Thế giới Cà phê'],
  ['Kon Tum', 'rong', 'Nhà rông Kon Klor'],
  ['Quy Nhơn', 'cham', 'Tháp Đôi'],
  ['Nha Trang', 'lotus', 'Tháp Trầm Hương'],
  ['Phan Thiết', 'water-tower', 'Tháp nước Phan Thiết'],
  ['Huế', 'imperial', 'Ngọ Môn'],
  ['Đà Nẵng', 'dragon', 'Cầu Rồng'],
  ['Hội An', 'bridge', 'Chùa Cầu'],
  ['Vinh', 'gate', 'Cổng thành cổ Vinh'],
  ['Đồng Hới', 'church', 'Tháp chuông Tam Tòa'],
  ['Ninh Bình', 'pagoda', 'Bảo tháp Bái Đính'],
  ['Hạ Long', 'museum', 'Bảo tàng Quảng Ninh'],
  ['Hải Phòng', 'theater', 'Nhà hát lớn Hải Phòng'],
  ['Hà Nội', 'turtle', 'Tháp Rùa'],
  ['TP. Hồ Chí Minh', 'market', 'Chợ Bến Thành'],
];
test('every city upgrades from its regional house to its own approved landmark', () => {
  assert.equal(MAP_TILES.filter((t) => t.kind === 'city').length, EXPECTED.length);
  const keys = new Set<string>();
  for (const [city, model, name] of EXPECTED) {
    assert.equal(resolveCityBuilding(city, 0), null);
    for (let level = 1; level <= 4; level++) {
      const building = resolveCityBuilding(city, level)!;
      assert.equal(building.kind, 'house');
      if (building.kind === 'house') assert.equal(building.level, level);
    }
    const building = resolveCityBuilding(city, 5)!;
    assert.equal(building.kind, 'landmark');
    if (building.kind === 'landmark') {
      assert.equal(building.model, model);
      assert.equal(building.name, name);
      keys.add(building.key);
    }
  }
  assert.equal(keys.size, 20);
  // Cities in the same region share ordinary homes, but never final-tier identity.
  for (let level = 1; level <= 4; level++)
    assert.deepEqual(resolveCityBuilding('Đà Nẵng', level), resolveCityBuilding('Hội An', level));
  assert.notDeepEqual(resolveCityBuilding('Đà Nẵng', 5), resolveCityBuilding('Hội An', 5));
  assert.throws(() => resolveCityBuilding('Phú Quốc', 1));
  assert.throws(() => resolveCityBuilding('Đà Nẵng', 6));
});
test('all twenty city-specific meshes and palettes are available, finite, grounded and fit their plots', () => {
  const signatures = new Set<string>();
  for (const [city, model] of EXPECTED) {
    const bounds = new Box3();
    const parts = cityLandmarkGeometry(model);
    const fingerprint = createHash('sha256');
    let vertices = 0;
    for (const [surface, geometry] of Object.entries(parts)) {
      vertices += geometry.getAttribute('position').count;
      fingerprint.update(Buffer.from(geometry.getAttribute('position').array.buffer));
      assert.equal(geometry.getAttribute('uv').count, geometry.getAttribute('position').count);
      assert.equal(geometry.getAttribute('normal').count, geometry.getAttribute('position').count);
      assert.ok(landmarkColors(model)[surface as keyof ReturnType<typeof landmarkColors>]);
      for (const value of geometry.getAttribute('position').array)
        assert.ok(Number.isFinite(value), city);
      geometry.computeBoundingBox();
      bounds.union(geometry.boundingBox!);
    }
    assert.ok(vertices < 70000, city + ' vertex budget');
    signatures.add(fingerprint.digest('hex'));
    const size = bounds.getSize(new Vector3()),
      scale = ['turtle', 'market'].includes(model) ? 0.72 : 0.6;
    assert.ok(Math.abs(bounds.min.y) < 1e-6, city);
    assert.ok(size.x * scale <= 0.97 && size.z * scale <= 0.7, city);
  }
  assert.equal(signatures.size, 20, 'Every city has a distinct silhouette');
  assert.throws(() => cityLandmarkGeometry('unknown'));
});

test('Ngo Mon central passage is a true opening through the wall mesh', () => {
  const wall = cityLandmarkGeometry('imperial').wall!;
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(wall, material);
  mesh.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(0, 0.18, 2), new Vector3(0, 0, -1));
  assert.equal(ray.intersectObject(mesh).length, 0);
  material.dispose();
});

test('Turtle Tower side arches are open passages rather than painted windows', () => {
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(cityLandmarkGeometry('turtle').wall!, material);
  mesh.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(2, 0.2, 0.122), new Vector3(-1, 0, 0));
  assert.equal(ray.intersectObject(mesh).length, 0);
  material.dispose();
});
