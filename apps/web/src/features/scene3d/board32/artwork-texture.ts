import { CanvasTexture, SRGBColorSpace } from 'three';

export function artworkTexture(
  image: CanvasImageSource,
  crop: [number, number, number, number],
  flip = false,
  polygon?: readonly (readonly number[])[],
) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(crop[2]);
  canvas.height = Math.ceil(crop[3]);
  const ctx = canvas.getContext('2d')!;
  if (flip) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  if (polygon) {
    ctx.beginPath();
    polygon.forEach(([x, y], index) =>
      index ? ctx.lineTo(x - crop[0], y - crop[1]) : ctx.moveTo(x - crop[0], y - crop[1]),
    );
    ctx.closePath();
    ctx.clip();
  }
  ctx.drawImage(image, ...crop, 0, 0, canvas.width, canvas.height);
  // Mask only the ivory background connected to the crop perimeter. Enclosed light
  // walls remain intact; original PNG files and artwork colours are never changed.
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = pixels;
  const seen = new Uint8Array(canvas.width * canvas.height);
  const queue: number[] = [];
  const visit = (p: number) => {
    if (seen[p]) return;
    seen[p] = 1;
    const i = p * 4;
    if (
      data[i + 3] === 0 ||
      (data[i] > 229 && data[i + 1] > 217 && data[i + 2] > 190 && data[i] - data[i + 2] < 49)
    )
      queue.push(p);
  };
  for (let x = 0; x < canvas.width; x++) {
    visit(x);
    visit((canvas.height - 1) * canvas.width + x);
  }
  for (let y = 0; y < canvas.height; y++) {
    visit(y * canvas.width);
    visit(y * canvas.width + canvas.width - 1);
  }
  for (let head = 0; head < queue.length; head++) {
    const p = queue[head];
    data[p * 4 + 3] = 0;
    const x = p % canvas.width,
      y = Math.floor(p / canvas.width);
    if (x > 0) visit(p - 1);
    if (x < canvas.width - 1) visit(p + 1);
    if (y > 0) visit(p - canvas.width);
    if (y < canvas.height - 1) visit(p + canvas.width);
  }
  // A sprite-sheet cell can include a sliver of its neighbour. Keep the main
  // connected artwork only, so those detached slivers cannot appear on the board.
  const labelled = new Uint8Array(canvas.width * canvas.height);
  let largest: number[] = [];
  for (let seed = 0; seed < labelled.length; seed++) {
    if (labelled[seed] || !data[seed * 4 + 3]) continue;
    const component = [seed];
    labelled[seed] = 1;
    for (let head = 0; head < component.length; head++) {
      const p = component[head],
        x = p % canvas.width;
      for (const next of [
        x > 0 ? p - 1 : -1,
        x < canvas.width - 1 ? p + 1 : -1,
        p - canvas.width,
        p + canvas.width,
      ]) {
        if (next >= 0 && next < labelled.length && !labelled[next] && data[next * 4 + 3]) {
          labelled[next] = 1;
          component.push(next);
        }
      }
    }
    if (component.length > largest.length) largest = component;
  }
  const keep = new Uint8Array(labelled.length);
  largest.forEach((p) => {
    keep[p] = 1;
  });
  for (let p = 0; p < keep.length; p++) if (!keep[p]) data[p * 4 + 3] = 0;
  ctx.putImageData(pixels, 0, 0);

  // Tight bounds give every asset the same footprint anchor, irrespective of sheet padding.
  let left = canvas.width,
    top = canvas.height,
    right = 0,
    bottom = 0;
  for (const p of largest) {
    const x = p % canvas.width,
      y = Math.floor(p / canvas.width);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  const trimmed = document.createElement('canvas');
  trimmed.width = right - left + 1;
  trimmed.height = bottom - top + 1;
  trimmed
    .getContext('2d')!
    .drawImage(
      canvas,
      left,
      top,
      trimmed.width,
      trimmed.height,
      0,
      0,
      trimmed.width,
      trimmed.height,
    );
  const map = new CanvasTexture(trimmed);
  map.colorSpace = SRGBColorSpace;
  return {
    map,
    aspect: trimmed.height / trimmed.width,
    bounds: { left, top, width: trimmed.width, height: trimmed.height },
  };
}
