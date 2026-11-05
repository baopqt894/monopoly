import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CHANCE_ART, cardArtUrl } from '../src/features/game/card-art-loading';
import {
  CHANCE_CARDS,
  CHEST_CARDS,
  PROPERTY_EVENT_CARDS,
  TRAVEL_GIFT_CARDS,
} from '@typhu/game-content';
import { createHash } from 'node:crypto';

test('all 39 card IDs have a dedicated cartoon illustration, including landing-rule extras', () => {
  const ids = [...CHANCE_CARDS, ...PROPERTY_EVENT_CARDS, ...TRAVEL_GIFT_CARDS, ...CHEST_CARDS].map(
    (card) => card.id,
  );
  assert.equal(ids.length, 39);
  assert.deepEqual([...CHANCE_ART].sort(), ids.sort());
});

test('every preloaded card illustration has a static WebP within the download budget', async () => {
  let total = 0;
  const hashes = new Set<string>();
  for (const name of CHANCE_ART) {
    const url = cardArtUrl(name);
    const file = await readFile(new URL(`../../../public${url}`, import.meta.url));
    assert.equal(file.toString('ascii', 0, 4), 'RIFF');
    assert.equal(file.toString('ascii', 8, 12), 'WEBP');
    assert.ok(file.length < 150_000, `${name} exceeds the per-card budget`);
    total += file.length;
    hashes.add(createHash('sha256').update(file).digest('hex'));
  }
  assert.equal(hashes.size, 39, 'every card must have its own illustration');
  assert.ok(total < 2_500_000, '39 distinct illustrations must stay under 2.5 MB');
});
