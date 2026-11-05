import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import type { Surface } from '../vietnam/miniature';
const cache = new Map<string, Texture>();
/** Locally authored micro-surfaces; no generated image substitutes for the 3D model. */
export function landmarkTexture(model: string, surface: Surface): Texture | undefined {
  const clock = model === 'market' && surface === 'green';
  const reflection = model === 'museum' && surface === 'glass';
  const water = surface === 'water';
  const brick = ['cham', 'church'].includes(model) && (surface === 'wall' || surface === 'roof');
  const stone = ['imperial', 'gate', 'bridge', 'turtle'].includes(model) && surface === 'wall';
  const goldRoof = model === 'imperial' && surface === 'gold';
  const roof = surface === 'roof' && !['museum', 'sail', 'dragon', 'lotus'].includes(model);
  const wood = surface === 'wood' && ['coffee', 'rong', 'bridge'].includes(model);
  const weave = model === 'hats' && surface === 'trim';
  if (!brick && !stone && !roof && !wood && !weave && !reflection && !water && !clock && !goldRoof)
    return undefined;
  const style = clock
    ? 'clock'
    : reflection
      ? 'museum-glass'
      : water
        ? 'water'
        : brick
          ? 'brick'
          : stone
            ? 'stone'
            : wood
              ? 'wood'
              : weave
                ? 'weave'
                : model === 'rong'
                  ? 'thatch'
                  : 'tiles';
  if (cache.has(style)) return cache.get(style);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);
  if (style === 'clock') {
    ctx.fillStyle = '#fff8e6';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#326078';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 246, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#28556b';
    ctx.font = 'bold 58px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let n = 1; n <= 12; n++) {
      const a = (n * Math.PI) / 6;
      ctx.fillText(String(n), 256 + Math.sin(a) * 185, 256 - Math.cos(a) * 185);
    }
  } else if (style === 'museum-glass') {
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#354752');
    gradient.addColorStop(0.5, '#202b34');
    gradient.addColorStop(1, '#78603b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#b28b4438' : '#e0eced0c';
      ctx.fillRect(i * 61, i % 3 === 0 ? 300 : 0, 20 + (i % 3) * 14, 512);
    }
  } else if (style === 'water') {
    ctx.fillStyle = '#ededed';
    ctx.fillRect(0, 0, 512, 512);
    for (let j = 0; j < 12; j++)
      for (let i = 0; i < 10; i++) {
        const light = 211 + ((i * 13 + j * 7) % 42);
        ctx.fillStyle = `rgb(${light},${light},${light})`;
        ctx.fillRect(i * 52 + (j % 2) * 13, j * 43, 49, 40);
      }
  } else if (style === 'brick' || style === 'stone') {
    const rows = style === 'brick' ? 24 : 22,
      cols = style === 'brick' ? 10 : 10;
    const h = 512 / rows,
      w = 512 / cols;
    for (let j = 0; j < rows; j++)
      for (let i = -1; i < cols + 1; i++) {
        const v = 230 + ((j * 17 + i * 11 + 31) % 22);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(i * w + ((j % 2) * w) / 2 + 1, j * h + 1, w - 2, h - 2);
      }
    ctx.strokeStyle = '#d3cbbf';
    ctx.lineWidth = style === 'brick' ? 1.8 : 1.2;
    for (let j = 0; j < rows; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * h);
      ctx.lineTo(512, j * h);
      ctx.stroke();
      for (let i = 0; i < cols + 1; i++) {
        const x = i * w + ((j % 2) * w) / 2;
        ctx.beginPath();
        ctx.moveTo(x, j * h);
        ctx.lineTo(x, (j + 1) * h);
        ctx.stroke();
      }
    }
  } else if (style === 'tiles') {
    // Fine terracotta barrel tiles: long vertical channels, restrained cross courses.
    for (let y = 0; y < 512; y += 20)
      for (let x = -6; x < 512; x += 6) {
        const dx = x + ((y / 20) % 2) * 3;
        ctx.fillStyle = '#f2ede6';
        ctx.fillRect(dx + 0.5, y + 0.5, 5, 19);
        ctx.strokeStyle = '#c4bcb1';
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(dx + 0.5, y);
        ctx.lineTo(dx + 0.5, y + 18);
        ctx.quadraticCurveTo(dx + 3, y + 21, dx + 5.5, y + 18);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(dx + 2, y + 1);
        ctx.lineTo(dx + 2, y + 17);
        ctx.stroke();
      }
  } else if (style === 'thatch') {
    // UV u runs down the roof slope: straw fibres follow u, with sparse binding courses.
    for (let y = 0; y < 512; y += 4) {
      ctx.strokeStyle = y % 12 === 0 ? '#c3b18d' : '#dfd2b6';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + 1);
      ctx.stroke();
    }
    for (let x = 0; x < 512; x += 112) {
      ctx.strokeStyle = '#e7ddc7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
  } else {
    const spacing = style === 'wood' ? 36 : 8;
    for (let x = 0; x < 512; x += spacing) {
      ctx.strokeStyle = style === 'wood' ? '#b7a58b' : '#d1c5aa';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 2, 512);
      ctx.stroke();
      for (let y = 0; y < 512; y += style === 'weave' ? 10 : 48) {
        ctx.strokeStyle = style === 'wood' ? '#eee7dc' : '#dfd5bd';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + spacing, y + 2);
        ctx.stroke();
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  cache.set(style, texture);
  return texture;
}
