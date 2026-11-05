import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { LogEntry } from '@typhu/contracts';
import { propertyExitCue, exitPose } from './property-exit-presentation';
const prev = { city: 'Huế', level: 3, logId: 10 };
const log: LogEntry[] = [
  {
    id: 12,
    round: 1,
    kind: 'property',
    message: 'server result',
    propertyChange: { tileId: 1, kind: 'sell' },
  },
];
test('sale/destruction cues require a new authoritative event and a real level decrease', () => {
  assert.deepEqual(propertyExitCue(prev, { city: 'Huế', level: 0 }, 1, log), {
    id: 12,
    city: 'Huế',
    level: 3,
    kind: 'sell',
  });
  const fire: LogEntry[] = [{ ...log[0], propertyChange: { tileId: 1, kind: 'destroy' } }];
  assert.equal(propertyExitCue(prev, { city: 'Huế', level: 2 }, 1, fire)?.kind, 'destroy');
  for (const [before, after, id, entries] of [
    [prev, { city: 'Huế', level: 3 }, 1, log],
    [{ ...prev, logId: 12 }, { city: 'Huế', level: 0 }, 1, log],
    [prev, { city: 'Huế', level: 0 }, 2, log],
    [prev, { city: 'Hội An', level: 0 }, 1, log],
    [prev, { city: 'Huế', level: 0 }, 1, []],
    [{ ...prev, level: 0 }, { city: 'Huế', level: 0 }, 1, log],
  ] as const)
    assert.equal(propertyExitCue(before, after, id, entries), null);
});
test('exit transforms remain finite, grounded and finish fully transparent', () => {
  for (const kind of ['sell', 'destroy'] as const) {
    assert.equal(exitPose(kind, 0).opacity, 1);
    for (let i = 0; i < 150; i++) {
      const p = exitPose(kind, i / 100);
      Object.values(p).forEach((v) => assert.ok(Number.isFinite(v)));
      assert.ok(p.lift >= 0);
      assert.ok(p.scale > 0 && p.scaleY > 0);
      assert.ok(p.opacity >= 0 && p.opacity <= 1);
    }
    const end = exitPose(kind, 2);
    assert.equal(end.progress, 1);
    assert.equal(end.opacity, 0);
  }
});
