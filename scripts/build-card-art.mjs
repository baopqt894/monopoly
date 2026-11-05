import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

// Source PNGs are retained by image_gen; ship bounded static WebPs to the browser.
const inputDir = process.argv[2];
if (!inputDir) throw new Error('Usage: node scripts/build-card-art.mjs <source-png-directory>');
const manifestPath = 'docs/art/cards-cartoon-v1.json';
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
let total = 0;
for (const asset of manifest.assets) {
  if (!asset.originalFile) throw new Error(`Missing original source for ${asset.id}`);
  const source = await fs.readFile(path.join(inputDir, asset.originalFile));
  const metadata = await sharp(source).metadata();
  if (metadata.width !== metadata.height)
    throw new Error(`Expected square illustration: ${asset.id}`);
  const output = await sharp(source)
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toBuffer();
  if (output.length >= 150_000) throw new Error(`Per-card budget exceeded: ${asset.id}`);
  await fs.mkdir(path.dirname(asset.file), { recursive: true });
  await fs.writeFile(asset.file, output);
  Object.assign(asset, {
    width: 512,
    height: 512,
    bytes: output.length,
    sha256: createHash('sha256').update(output).digest('hex'),
    originalSha256: createHash('sha256').update(source).digest('hex'),
  });
  total += output.length;
}
if (total >= 2_500_000) throw new Error('Full illustration set exceeds 2.5 MB');
manifest.totalBytes = total;
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built ${manifest.assets.length} illustrations, ${total} bytes total.`);
