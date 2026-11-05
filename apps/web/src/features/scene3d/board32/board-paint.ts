import { paintTravelGarden } from './travel-garden-paint';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { type MapTile } from './board-layout';

export function canvasMap(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 256,
) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!, w, h);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}
function line(ctx: CanvasRenderingContext2D, points: number[][], fill: string) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function tourism(ctx: CanvasRenderingContext2D, name: string) {
  ctx.fillStyle = '#d7f0ee';
  ctx.beginPath();
  ctx.arc(0, 0, 99, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  if (name === 'Sa Pa') {
    line(
      ctx,
      [
        [-92, 55],
        [-20, -65],
        [35, 55],
      ],
      '#4c9d92',
    );
    line(
      ctx,
      [
        [-12, 55],
        [39, -42],
        [96, 55],
      ],
      '#6fb5a1',
    );
    line(
      ctx,
      [
        [-42, -28],
        [-20, -65],
        [1, -28],
        [-17, -35],
      ],
      '#fffef3',
    );
    line(
      ctx,
      [
        [24, -14],
        [39, -42],
        [56, -14],
      ],
      '#fffef3',
    );
  } else if (name === 'Đà Lạt') {
    ctx.fillStyle = '#bd8a50';
    ctx.fillRect(-7, 22, 14, 51);
    line(
      ctx,
      [
        [-53, 39],
        [0, -74],
        [53, 39],
      ],
      '#368c73',
    );
    line(
      ctx,
      [
        [-39, -7],
        [0, -74],
        [39, -7],
      ],
      '#57aa82',
    );
    ctx.fillStyle = '#efc968';
    ctx.beginPath();
    ctx.arc(57, -45, 20, 0, Math.PI * 2);
    ctx.fill();
  } else if (name === 'Phú Quốc') {
    ctx.strokeStyle = '#bd8a50';
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.lineTo(0, 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -20, 64, Math.PI, 0);
    ctx.fillStyle = '#ef976a';
    ctx.fill();
    line(
      ctx,
      [
        [-18, -20],
        [0, -84],
        [18, -20],
      ],
      '#fff4d9',
    );
    ctx.strokeStyle = '#53acbc';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-70, 65);
    ctx.quadraticCurveTo(0, 42, 70, 65);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#71aa7a';
    for (const [x, y, r] of [
      [-42, -42, 20],
      [42, -42, 20],
      [-42, 42, 20],
      [42, 42, 20],
      [0, -76, 22],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.65, r, x < 0 ? -0.7 : 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3e8973';
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 61, 0, 0, Math.PI * 2);
    ctx.fill();
    line(
      ctx,
      [
        [0, -37],
        [28, -15],
        [28, 18],
        [0, 40],
        [-28, 18],
        [-28, -15],
      ],
      '#80bd8f',
    );
  }
}
export function symbolMap(tile: MapTile) {
  return canvasMap(
    (ctx) => {
      ctx.translate(256, 256);
      if (tile.kind === 'tourism') tourism(ctx, tile.name);
      if (tile.kind === 'chance') {
        ctx.save();
        ctx.rotate(-0.13);
        ctx.fillStyle = '#e7bc57';
        ctx.beginPath();
        ctx.roundRect(-76, -100, 152, 200, 20);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fffef6';
        ctx.strokeStyle = '#dba44d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(-69, -103, 142, 190, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#dc9b3e';
        ctx.font = '900 140px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 4, 0);
      }
      if (tile.kind === 'tax') {
        ctx.fillStyle = '#727eae';
        ctx.fillRect(-80, 52, 160, 15);
        ctx.fillRect(-70, 33, 140, 12);
        for (const x of [-48, -8, 32]) ctx.fillRect(x, -29, 16, 61);
        line(
          ctx,
          [
            [-86, -36],
            [0, -86],
            [86, -36],
          ],
          '#727eae',
        );
        ctx.fillStyle = '#e2ba60';
        ctx.beginPath();
        ctx.arc(52, 48, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff5d9';
        ctx.font = '800 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('₫', 52, 61);
      }
    },
    512,
    512,
  );
}
function boldTileText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, strokeWidth = 2) {
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y, maxWidth);
  ctx.fillText(text, x, y, maxWidth);
}
export function tileMap(tile: MapTile, selected: boolean, hovered: boolean, index: number, amount?: number, ownerColor?: string) {
  return canvasMap(
    (ctx, w, h) => {
      const city = tile.kind === 'city',
        corner = ['go', 'island', 'festival', 'airport'].includes(tile.kind);
      const accent =
        tile.kind !== 'city' && tile.kind !== 'tourism'
          ? tile.kind === 'tax'
            ? '#9399c2'
            : tile.kind === 'chance'
              ? '#efbf66'
              : '#6bbebf'
          : ownerColor ?? '#c6bca7';
      ctx.fillStyle =
        tile.kind === 'chance'
          ? '#fff6db'
          : tile.kind === 'tax'
            ? '#efeff9'
            : tile.kind === 'tourism'
              ? '#e6f4ee'
              : '#fff9ec';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = selected ? '#329c95' : hovered ? '#80c8bc' : '#d8ccb2';
      ctx.lineWidth = selected ? 16 : hovered ? 12 : 4;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      if (city) {
        ctx.fillStyle = accent + '24';
        ctx.fillRect(12, 12, w - 24, h * 0.4);
        ctx.fillStyle = accent;
        ctx.fillRect(8, 9, w - 16, 32);
        ctx.fillRect(8, h * 0.415, w - 16, 13);
        ctx.strokeStyle = accent + '50';
        ctx.lineWidth = 2;
        ctx.strokeRect(35, 70, w - 70, h * 0.28);
      } else if (!corner) {
        ctx.fillStyle = accent;
        ctx.fillRect(8, 9, w - 16, 17);
        ctx.fillStyle = accent + '32';
        ctx.fillRect(36, h * 0.6, w - 72, 3);
      }
      ctx.fillStyle = '#fffefd';
      ctx.fillRect(12, h - 12, w - 24, 3);
      if (!corner) {
        ctx.save();
        ctx.translate(w / 2, h * 0.73);
        const side = Math.floor(index / 8);
        if (side === 0 || side === 3) ctx.rotate(Math.PI);
        ctx.fillStyle = tile.kind === 'chance' ? '#a36d2f' : '#2f4147';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const split = tile.name.length > 12,
          words = tile.name.split(' ');
        ctx.font = `900 ${split ? 65 : 78}px "Be Vietnam Pro",sans-serif`;
        if (split) {
          const at = Math.ceil(words.length / 2);
          boldTileText(ctx, words.slice(0, at).join(' '), 0, -73, w - 35);
          boldTileText(ctx, words.slice(at).join(' '), 0, -6, w - 35);
        } else boldTileText(ctx, tile.name, 0, amount === undefined ? 0 : -28, w - 35);
        if (amount !== undefined) {
          ctx.fillStyle = '#000000';
          ctx.font = '900 104px "Arial Black","Be Vietnam Pro",sans-serif';
          boldTileText(ctx,
            (tile.kind === 'tax' ? '−' : '') + '₫' + amount.toLocaleString('vi-VN'),
            0,
            78,
            w - 30,
            6,
          );
        }
        ctx.restore();
      }
    },
    512,
    768,
  );
}
export function labelMap(text: string, price = false, color = '#334c50') {
  return canvasMap(
    (ctx, w, h) => {
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const words = text.split(' '),
        split = text.length > 12 && !price;
      ctx.font = `800 ${price ? 110 : split ? 80 : 90}px "Be Vietnam Pro",sans-serif`;
      if (split) {
        const at = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, at).join(' '), w / 2, h * 0.28, w - 24);
        ctx.fillText(words.slice(at).join(' '), w / 2, h * 0.74, w - 24);
      } else ctx.fillText(text, w / 2, h / 2, w - 24);
    },
    512,
    price ? 160 : 208,
  );
}
export function centerMap() {
  return canvasMap(paintTravelGarden, 2048, 2048);
}
