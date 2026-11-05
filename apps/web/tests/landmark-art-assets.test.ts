import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { mapTilesFor } from '@typhu/game-content';

test('every current landmark has a distinct approved WebP with recorded provenance', async () => {
  const manifest = JSON.parse(await fs.readFile('docs/art/landmarks-cartoon-v1.json', 'utf8'));
  const expected = mapTilesFor({ boardLayout: 'districts-v1' })
    .filter((tile) => tile.kind === 'city')
    .map((tile) => tile.model)
    .sort();
  assert.deepEqual(manifest.assets.map((item: { kind: string }) => item.kind).sort(), expected);
  const hashes = new Set();
  let total = 0;
  for (const item of manifest.assets) {
    const data = await fs.readFile(item.file);
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    const hash = createHash('sha256').update(data).digest('hex');
    assert.equal(hash, item.sha256);
    assert.equal(item.hasAlpha, true);
    assert.ok(item.prompt && item.originalSha256);
    hashes.add(hash);
    total += data.length;
  }
  assert.equal(hashes.size, 20);
  assert.ok(total < 1500000);
});
