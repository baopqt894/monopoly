import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CHANCE_CARDS,
  CHEST_CARDS,
  PROPERTY_EVENT_CARDS,
  TRAVEL_GIFT_CARDS,
  getCard,
} from '@typhu/game-content';
import type { DeckKind, GameCard } from '@typhu/contracts';
import { CardArtwork } from '../apps/web/src/features/game/CardArtwork';

const outputDir = process.argv[2] ?? 'artifacts/cards-cartoon-v1';
const items: { deck: DeckKind; card: GameCard | null; label: string; detail?: string }[] = [
  ...[...CHANCE_CARDS, ...PROPERTY_EVENT_CARDS, ...TRAVEL_GIFT_CARDS].map((card) => ({
    deck: 'chance' as const,
    card: getCard('chance', card.id, 'vietnam-32', 'districts-v1'),
    label: card.id,
  })),
  { deck: 'chance', card: null, label: 'Mặt sau · Cơ hội' },
  ...CHEST_CARDS.map((card) => ({
    deck: 'chest' as const,
    card: getCard('chest', card.id, 'vietnam-32', 'districts-v1'),
    label: card.id,
  })),
  { deck: 'chest', card: null, label: 'Mặt sau · Quỹ cộng đồng' },
  {
    deck: 'chance',
    card: getCard('chance', 'chance-21', 'vietnam-32', 'districts-v1'),
    label: 'Đích Lễ hội',
    detail: 'Hội An',
  },
];
const sheets = Array.from(
  { length: 7 },
  (_, index) =>
    `<section data-sheet="${index + 1}" id="sheet-${index + 1}"><h1>Bộ thẻ hoạt hình · ${index + 1}/7</h1><p>23 thẻ Cơ hội · 16 thẻ Quỹ cộng đồng · 2 mặt sau · 1 biến thể có đích đến</p><div class="grid">${items
      .slice(index * 6, index * 6 + 6)
      .map(
        (item) =>
          `<article><span class="id">${item.label}</span>${renderToStaticMarkup(<CardArtwork {...item} />)}</article>`,
      )
      .join('')}</div></section>`,
).join('');
let html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bộ thẻ hoạt hình · Tỷ Phú</title><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0;background:#e7f2f4;color:#153e56;font-family:'Be Vietnam Pro',sans-serif}nav{padding:18px;text-align:center;position:sticky;top:0;background:#f8fcf7ed;z-index:2}nav a{color:#238b9c;margin:0 10px}main{max-width:940px;margin:auto;padding:16px}section{padding-bottom:28px;break-after:page}h1{font-size:22px;margin:0 0 6px}p{font-size:11px;margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 18px}article{min-width:0}.id{display:block;text-align:center;font-size:11px;font-weight:700;margin-bottom:5px}.chance-artwork{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 4px #315c5a18);font-family:'Be Vietnam Pro',sans-serif}body.single nav{display:none}body.single section{display:none}body.single section.visible{display:block}body.overview nav,body.overview h1,body.overview p{display:none}body.overview main{max-width:1550px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:14px;padding:24px}body.overview section,body.overview .grid{display:contents}@media(max-width:600px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media print{nav{display:none}}</style><nav>${Array.from({ length: 7 }, (_, i) => `<a href="#sheet-${i + 1}">Trang ${i + 1}</a>`).join('')}</nav><main>${sheets}</main><script>const q=new URLSearchParams(location.search),sheet=q.get('sheet');if(sheet){document.body.classList.add('single');document.querySelector('[data-sheet="'+sheet+'"]')?.classList.add('visible');}if(q.has('overview'))document.body.classList.add('overview');</script></html>`;
const paths = [
  ...new Set([...html.matchAll(/href="(\/assets\/cards\/[^\"]+)"/g)].map((match) => match[1])),
];
for (const url of paths) {
  const data = await fs.readFile(path.join('public', url));
  html = html.replaceAll(
    `href="${url}"`,
    `href="data:image/webp;base64,${data.toString('base64')}"`,
  );
}
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, 'all-cards.html'), html);
console.log(`Exported ${items.length} card views to ${outputDir}/all-cards.html`);
