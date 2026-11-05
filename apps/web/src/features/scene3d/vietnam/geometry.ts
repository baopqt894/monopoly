import type { Business } from '@typhu/contracts';
import { VIETNAM_CITIES } from '@typhu/game-content';
import { Miniature, type ModelGeometry } from './miniature';
import { landmark } from './landmarks';

const cache = new Map<string, ModelGeometry>();

function home(m: Miniature, id: number, level: number, business: Business) {
  const city = VIETNAM_CITIES[id],
    style = city.architecture;
  const raised = style === 'delta' || style === 'highland';
  const colonial = style === 'heritage' || style === 'imperial';
  const modern = style === 'urban';
  const bottom = raised ? 0.22 : 0.12;
  const floors = level === 1 ? 1 : level === 4 ? 3 : 2;
  const height = floors * 0.43;
  const wing = level >= 3;
  const width = level === 4 ? 1.22 : 1.02;
  m.box('trim', [width + 0.18, 0.1, 0.96], [0, 0.05, 0]);
  if (raised)
    for (const x of [-0.4, 0.4])
      for (const z of [-0.3, 0.3]) m.cylinder('wood', 0.035, 0.045, bottom, [x, bottom / 2, z], 10);
  m.box('wall', [width, height, 0.72], [0, bottom + height / 2, 0]);
  for (let f = 0; f < floors; f++) {
    const y = bottom + 0.1 + f * 0.43;
    for (const x of [-width * 0.28, width * 0.28]) m.window(x, y, 0.365, 0.2, 0.28);
    for (const x of [-1, 1])
      for (const z of [-0.19, 0.19])
        m.box('glass', [0.025, 0.23, 0.16], [x * (width / 2 + 0.015), y + 0.14, z]);
    m.box('trim', [width + 0.08, 0.045, 0.8], [0, bottom + (f + 1) * 0.43, 0]);
    if (f > 0) {
      m.box('trim', [width + 0.16, 0.05, 0.21], [0, y - 0.08, 0.46]);
      m.box('roof', [width + 0.13, 0.08, 0.025], [0, y + 0.07, 0.56]);
      for (let p = 0; p < 7; p++)
        m.box('trim', [0.018, 0.14, 0.025], [-width * 0.46 + p * width * 0.153, y, 0.55]);
    }
  }
  m.window(0, bottom, 0.38, 0.22, 0.34);
  if (modern && level > 1) {
    m.box('roof', [width + 0.12, 0.1, 0.86], [0, bottom + height + 0.06, 0]);
    m.box('trim', [width + 0.08, 0.1, 0.04], [0, bottom + height + 0.15, 0.4]);
    m.shrub(width * 0.29, -0.18, 0.8);
  } else
    m.roof(width + 0.17, 0.96, style === 'highland' ? 0.36 : 0.25, [0, bottom + height + 0.04, 0]);
  if (wing) {
    const w = 0.34,
      wh = level === 4 ? 0.7 : 0.47;
    m.box('wall', [w, wh, 0.66], [-width / 2 - 0.16, bottom + wh / 2, -0.04]);
    m.roof(w + 0.12, 0.81, 0.2, [-width / 2 - 0.16, bottom + wh + 0.015, -0.04]);
    m.window(-width / 2 - 0.16, bottom + 0.07, 0.3, 0.18, 0.24);
  }
  if (colonial) {
    for (const x of [-width * 0.48, width * 0.48])
      m.cylinder('trim', 0.035, 0.045, height, [x, bottom + height / 2, 0.42], 10);
    m.box('trim', [width + 0.14, 0.08, 0.18], [0, bottom + height, 0.43]);
  }
  if (business === 'cafe') {
    for (let i = 0; i < 7; i++)
      m.box(
        i % 2 ? 'trim' : 'roof',
        [width / 7, 0.045, 0.29],
        [-width / 2 + ((i + 0.5) * width) / 7, bottom + 0.38, 0.5],
        [-0.16, 0, 0],
      );
    m.cylinder('wood', 0.1, 0.1, 0.04, [0.42, 0.22, 0.64], 16);
    m.cylinder('trim', 0.018, 0.03, 0.18, [0.42, 0.12, 0.64], 10);
  }
  m.steps(0.32, 0.57, bottom);
  m.shrub(-width * 0.46, 0.46, 0.8);
  m.shrub(width * 0.46, 0.46, 0.8);
}

export function vietnamGeometry(
  tileId: number,
  level: number,
  business: Business = 'residence',
): ModelGeometry {
  const city = VIETNAM_CITIES[tileId];
  if (!city) throw new Error('Missing Vietnamese city ' + tileId);
  if (!Number.isInteger(level) || level < 1 || level > 5) throw new Error('Invalid building level');
  const key =
    level === 5 ? 'landmark:' + city.model : city.architecture + ':' + level + ':' + business;
  if (cache.has(key)) return cache.get(key)!;
  const model = new Miniature();
  if (level === 5) landmark(model, city.model);
  else home(model, tileId, level, business);
  const result = model.finish();
  cache.set(key, result);
  return result;
}
