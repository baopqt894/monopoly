import { board32Layout } from './board32/board-layout';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { BoardTile, ColorGroup } from '@typhu/contracts';
import { VIETNAM_CITIES } from '@typhu/game-content';

/** Legacy art catalog IDs are separate from board32 IDs. Modern scenes use HouseModel. */
export function buildingModelId(tile: BoardTile): number | undefined {
  const entry = Object.entries(VIETNAM_CITIES).find(([, city]) => city.name === tile.name);
  return entry ? Number(entry[0]) : undefined;
}

export const BOARD_WIDTH = 11.9;
export const CORNER_WIDTH = 1.45;
const axisCenters = [-5.225, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5.225];
export const DISTRICT_COLORS: Record<ColorGroup, string> = {
  brown: '#a87a51',
  sky: '#82c8df',
  pink: '#df8caa',
  orange: '#eda452',
  red: '#e17d67',
  yellow: '#e8cc63',
  green: '#6dbb90',
  blue: '#5e9acc',
};

export function tileLayout(id: number, boardId?: 'vietnam-32') {
  if (boardId === 'vietnam-32') {
    const layout = board32Layout(id),
      sideways = Math.floor(id / 8) % 2 === 1;
    return {
      x: layout.x,
      z: layout.z,
      width: sideways ? layout.depth : layout.width,
      depth: sideways ? layout.width : layout.depth,
    };
  }
  const [row, col] =
    id === 0
      ? [10, 10]
      : id <= 10
        ? [10, 10 - id]
        : id <= 20
          ? [20 - id, 0]
          : id <= 30
            ? [0, id - 20]
            : [id - 30, 10];
  return {
    x: axisCenters[col],
    z: axisCenters[row],
    width: col === 0 || col === 10 ? CORNER_WIDTH : 1,
    depth: row === 0 || row === 10 ? CORNER_WIDTH : 1,
  };
}
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function tileIcon(
  ctx: CanvasRenderingContext2D,
  tile: BoardTile,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (tile.kind) {
    case 'street':
      ctx.beginPath();
      ctx.moveTo(-31, -4);
      ctx.lineTo(0, -31);
      ctx.lineTo(31, -4);
      ctx.moveTo(-23, -10);
      ctx.lineTo(-23, 30);
      ctx.lineTo(23, 30);
      ctx.lineTo(23, -10);
      ctx.moveTo(-7, 30);
      ctx.lineTo(-7, 9);
      ctx.lineTo(7, 9);
      ctx.lineTo(7, 30);
      ctx.stroke();
      break;
    case 'railroad':
      rounded(ctx, -29, -37, 58, 65, 12);
      ctx.stroke();
      rounded(ctx, -20, -24, 40, 22, 4);
      ctx.stroke();
      for (const a of [-16, 16]) {
        ctx.beginPath();
        ctx.arc(a, 15, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(-18, 29);
      ctx.lineTo(-32, 43);
      ctx.moveTo(18, 29);
      ctx.lineTo(32, 43);
      ctx.moveTo(-25, 37);
      ctx.lineTo(25, 37);
      ctx.stroke();
      break;
    case 'utility':
      if (tile.id === 12) {
        ctx.beginPath();
        ctx.moveTo(5, -43);
        ctx.lineTo(-28, 7);
        ctx.lineTo(-3, 7);
        ctx.lineTo(-9, 43);
        ctx.lineTo(28, -9);
        ctx.lineTo(4, -9);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.bezierCurveTo(-20, -15, -34, 0, -27, 23);
        ctx.bezierCurveTo(-17, 54, 27, 48, 29, 17);
        ctx.bezierCurveTo(30, 1, 11, -27, 0, -42);
        ctx.fill();
        ctx.strokeStyle = '#fffcf0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, 9);
        ctx.quadraticCurveTo(-20, 27, -7, 30);
        ctx.stroke();
      }
      break;
    case 'chance':
      ctx.font = '800 112px "Be Vietnam Pro",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 0);
      for (const [a, b] of [
        [-42, -30],
        [41, 28],
      ]) {
        ctx.beginPath();
        ctx.moveTo(a - 5, b);
        ctx.lineTo(a + 5, b);
        ctx.moveTo(a, b - 5);
        ctx.lineTo(a, b + 5);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      break;
    case 'chest':
      rounded(ctx, -36, -11, 72, 47, 5);
      ctx.stroke();
      rounded(ctx, -41, -24, 82, 18, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -23);
      ctx.lineTo(0, 36);
      ctx.moveTo(0, -24);
      ctx.bezierCurveTo(-35, -24, -29, -55, -11, -42);
      ctx.lineTo(0, -24);
      ctx.bezierCurveTo(35, -24, 29, -55, 11, -42);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'go':
      ctx.beginPath();
      ctx.moveTo(-44, -15);
      ctx.lineTo(8, -15);
      ctx.lineTo(8, -35);
      ctx.lineTo(46, 0);
      ctx.lineTo(8, 35);
      ctx.lineTo(8, 15);
      ctx.lineTo(-44, 15);
      ctx.closePath();
      ctx.fill();
      break;
    case 'parking':
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.font = '800 62px "Manrope",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 0, 3);
      break;
    case 'airport':
      ctx.beginPath();
      ctx.moveTo(0, -45);
      ctx.lineTo(9, -10);
      ctx.lineTo(44, 12);
      ctx.lineTo(44, 23);
      ctx.lineTo(9, 9);
      ctx.lineTo(7, 31);
      ctx.lineTo(20, 41);
      ctx.lineTo(20, 47);
      ctx.lineTo(0, 40);
      ctx.lineTo(-20, 47);
      ctx.lineTo(-20, 41);
      ctx.lineTo(-7, 31);
      ctx.lineTo(-9, 9);
      ctx.lineTo(-44, 23);
      ctx.lineTo(-44, 12);
      ctx.lineTo(-9, -10);
      ctx.closePath();
      ctx.fill();
      break;
    case 'jail':
      // Island silhouette replaces prison bars; internal kind stays stable for saved rooms.
      ctx.beginPath();
      ctx.ellipse(0, 23, 40, 13, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.quadraticCurveTo(12, -6, 7, -29);
      ctx.stroke();
      for (const [x, y] of [
        [-29, -24],
        [-18, -43],
        [30, -24],
        [25, -43],
      ]) {
        ctx.beginPath();
        ctx.moveTo(7, -29);
        ctx.quadraticCurveTo(x, -47, x, y);
        ctx.stroke();
      }
      break;
    case 'tax':
      ctx.beginPath();
      ctx.moveTo(-29, -39);
      ctx.lineTo(29, -39);
      ctx.lineTo(29, 38);
      ctx.lineTo(15, 30);
      ctx.lineTo(0, 38);
      ctx.lineTo(-15, 30);
      ctx.lineTo(-29, 38);
      ctx.closePath();
      ctx.stroke();
      for (const b of [-19, -3, 13]) {
        ctx.beginPath();
        ctx.moveTo(-14, b);
        ctx.lineTo(14, b);
        ctx.stroke();
      }
      break;
  }
  ctx.restore();
}
function textureFrom(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

export function tileTexture(tile: BoardTile, amount?: number, ownerColor?: string): CanvasTexture {
  const corner = tile.id % 10 === 0;
  const source = document.createElement('canvas');
  source.width = corner ? 435 : 300;
  source.height = 435;
  const ctx = source.getContext('2d')!;
  const w = source.width;
  const isStreet = tile.kind === 'street';
  const special = tile.kind === 'chance' || tile.kind === 'chest';
  ctx.fillStyle = corner
    ? '#f0eadb'
    : tile.kind === 'chance'
      ? '#f6e6bd'
      : tile.kind === 'chest'
        ? '#dfeceb'
        : '#fffaf0';
  ctx.fillRect(0, 0, w, 435);
  ctx.strokeStyle = '#c6d5ce';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, w - 4, 431);
  if (tile.group) {
    ctx.fillStyle = ownerColor ?? '#c6bca7';
    ctx.fillRect(0, 0, w, 49);
    ctx.fillStyle = '#ffffff40';
    ctx.fillRect(0, 0, w, 5);
    ctx.fillStyle = '#34585b25';
    ctx.fillRect(0, 43, w, 6);
  }
  const ink = '#284c59';
  const accent =
    tile.kind === 'chance'
      ? '#ba8b3e'
      : tile.kind === 'chest'
        ? '#548d8d'
        : tile.kind === 'go'
          ? '#c36f52'
          : '#587b7c';
  if (isStreet) {
    // Leave a quiet architectural plot behind the physical building.
    ctx.fillStyle = '#e9f0e7';
    rounded(ctx, 29, 65, w - 58, 91, 18);
    ctx.fill();
    ctx.strokeStyle = '#c8d9cc';
    ctx.lineWidth = 3;
    rounded(ctx, 41, 77, w - 82, 67, 10);
    ctx.stroke();
  } else {
    tileIcon(ctx, tile, w / 2, corner ? 133 : 129, corner ? 114 : 94, accent);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  ctx.font = `900 ${corner ? 37 : 36}px "Be Vietnam Pro",sans-serif`;
  const lines = wrap(ctx, corner ? tile.name.toLocaleUpperCase('vi') : tile.name, w - 38);
  const start = isStreet ? 215 : corner ? 253 : 252;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, start + i * 44));
  if (amount !== undefined) {
    ctx.strokeStyle = '#d8e1d7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, 302);
    ctx.lineTo(w - 28, 302);
    ctx.stroke();
    ctx.font = '900 47px "Arial Black","Manrope",sans-serif';
    ctx.fillStyle = '#e8eddf';
    rounded(ctx, w / 2 - 87, 325, 174, 61, 17);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeText(`₫${amount.toLocaleString('vi-VN')}`, w / 2, 357);
    ctx.fillText(`₫${amount.toLocaleString('vi-VN')}`, w / 2, 357);
  } else if (corner) {
    ctx.font = '500 22px "Be Vietnam Pro",sans-serif';
    ctx.fillStyle = '#7a8b82';
    ctx.fillText(tile.subtitle ?? '', w / 2, 339);
  } else if (special) {
    ctx.font = '700 17px "Be Vietnam Pro",sans-serif';
    ctx.fillStyle = accent;
    ctx.fillText('RÚT MỘT THẺ', w / 2, 371);
  }
  if (corner) return textureFrom(source);
  const layout = tileLayout(tile.id);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(layout.width * 300);
  canvas.height = Math.round(layout.depth * 300);
  const target = canvas.getContext('2d')!;
  if (tile.id <= 10) target.drawImage(source, 0, 0);
  else if (tile.id <= 20) {
    target.translate(canvas.width, 0);
    target.rotate(Math.PI / 2);
    target.drawImage(source, 0, 0);
  } else if (tile.id <= 30) {
    target.translate(canvas.width, canvas.height);
    target.rotate(Math.PI);
    target.drawImage(source, 0, 0);
  } else {
    target.translate(0, canvas.height);
    target.rotate(-Math.PI / 2);
    target.drawImage(source, 0, 0);
  }
  return textureFrom(canvas);
}

export function labelTexture(
  text: string,
  subtitle: string,
  color: string,
  background?: string,
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1024, 320);
    ctx.strokeStyle = '#ffffff55';
    ctx.lineWidth = 4;
    ctx.strokeRect(22, 22, 980, 276);
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.font = '800 126px "Be Vietnam Pro",sans-serif';
  ctx.fillText(text, 512, 147);
  ctx.font = '600 32px "Be Vietnam Pro",sans-serif';
  ctx.fillText(subtitle, 512, 232);
  return textureFrom(canvas);
}
