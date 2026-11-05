/** A quiet play plaza surrounded by a miniature journey from terraces to the coast. */
export function paintTravelGarden(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.scale(w / 1000, h / 1000);
  const lawn = ctx.createLinearGradient(0, 0, 1000, 1000);
  lawn.addColorStop(0, '#98ce93');
  lawn.addColorStop(1, '#c4dda0');
  ctx.fillStyle = lawn;
  ctx.fillRect(0, 0, 1000, 1000);
  const ellipse = (x: number, y: number, rx: number, ry: number, color: string, angle = 0) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
    ctx.fill();
  };
  // Rounded garden boundary and fine cream promenade.
  ctx.strokeStyle = '#eff3cc';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.roundRect(24, 24, 952, 952, 30);
  ctx.stroke();
  ctx.strokeStyle = '#6da989';
  ctx.lineWidth = 2;
  ctx.stroke();
  // A coastal inlet runs along the far edge and curls down the right bank.
  ctx.beginPath();
  ctx.moveTo(410, 42);
  ctx.bezierCurveTo(510, 116, 561, 55, 667, 50);
  ctx.bezierCurveTo(881, 18, 976, 144, 943, 277);
  ctx.bezierCurveTo(912, 391, 899, 386, 926, 479);
  ctx.bezierCurveTo(952, 567, 864, 643, 870, 744);
  ctx.bezierCurveTo(874, 825, 945, 868, 945, 943);
  ctx.lineTo(817, 943);
  ctx.bezierCurveTo(833, 839, 752, 802, 768, 727);
  ctx.bezierCurveTo(801, 594, 868, 565, 842, 475);
  ctx.bezierCurveTo(820, 401, 853, 341, 843, 290);
  ctx.bezierCurveTo(822, 179, 751, 201, 691, 217);
  ctx.bezierCurveTo(569, 245, 510, 170, 410, 166);
  ctx.closePath();
  ctx.fillStyle = '#f4dfaa';
  ctx.strokeStyle = '#e9d6a7';
  ctx.lineWidth = 24;
  ctx.stroke();
  const sea = ctx.createLinearGradient(600, 30, 950, 900);
  sea.addColorStop(0, '#43bac2');
  sea.addColorStop(0.55, '#70d4c8');
  sea.addColorStop(1, '#2caeb9');
  ctx.fillStyle = sea;
  ctx.fill();
  // Fine water ripples, clipped to the inlet rather than scattered across the play area.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = '#c2f3de';
  ctx.lineWidth = 2;
  for (let y = 85; y < 960; y += 24) {
    ctx.beginPath();
    for (let x = 430; x < 980; x += 8) {
      const yy = y + Math.sin(x * 0.037 + y) * 3;
      if (x === 430) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
  // Terraced fields of the northern highlands: alternating harvested and green ribbons.
  for (let i = 0; i < 7; i++) {
    ellipse(
      167 - i * 3,
      169 - i * 6,
      149 - i * 17,
      119 - i * 13,
      i % 2 ? '#d9d363' : '#80b66d',
      -0.3,
    );
    ctx.strokeStyle = '#e8e6a6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(167 - i * 3, 169 - i * 6, 149 - i * 17, 119 - i * 13, -0.3, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Winding footpath joins the rice gardens to the central gathering place.
  ctx.strokeStyle = '#f3e5bd';
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(91, 322);
  ctx.bezierCurveTo(205, 260, 267, 322, 263, 414);
  ctx.bezierCurveTo(257, 557, 161, 642, 173, 799);
  ctx.bezierCurveTo(177, 879, 285, 908, 395, 916);
  ctx.stroke();
  ctx.strokeStyle = '#d1c893';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Broad, restrained stone plaza stays free for dice and future game controls.
  ctx.fillStyle = '#e9edcd';
  ctx.beginPath();
  ctx.roundRect(302, 298, 441, 390, 98);
  ctx.fill();
  ctx.strokeStyle = '#f8f5dc';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = '#c3d3a2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(314, 310, 417, 366, 89);
  ctx.stroke();
  // Lotus pond towards the near bank, with only a few flowers and lily pads.
  ellipse(442, 875, 174, 55, '#e8dcb1', 0.04);
  ellipse(442, 875, 163, 46, '#63c4b6', 0.04);
  for (const [x, y, r] of [
    [336, 869, 17],
    [392, 891, 13],
    [475, 855, 19],
    [535, 884, 16],
    [582, 868, 11],
  ]) {
    ellipse(x, y, r, r * 0.55, '#4c9f71');
  }
  for (const [x, y] of [
    [376, 866],
    [500, 882],
    [550, 863],
  ]) {
    for (let i = 0; i < 5; i++)
      ellipse(x + Math.cos(i * 1.26) * 6, y + Math.sin(i * 1.26) * 4, 4, 9, '#f3a49c', i * 1.26);
    ellipse(x, y, 3, 3, '#ffe9a4');
  }
  // Small planted borders, kept below the height and contrast of purchasable landmarks.
  for (const [x, y] of [
    [83, 429],
    [87, 663],
    [103, 897],
    [691, 906],
    [755, 188],
    [926, 668],
  ]) {
    ellipse(x + 3, y + 5, 24, 15, '#83b179');
    ellipse(x, y, 20, 14, '#64a575');
    ellipse(x - 8, y - 5, 13, 10, '#8dbb78');
    for (let i = 0; i < 3; i++)
      ellipse(x - 12 + i * 11, y + 13, 3, 3, i % 2 ? '#f3ae7b' : '#f5d57e');
  }
  // Existing game title remains the only lettering in the garden.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#346a59';
  ctx.font = '900 76px "Be Vietnam Pro",sans-serif';
  ctx.fillText('TỶ PHÚ', 522, 474);
  ctx.fillStyle = '#769369';
  ctx.font = '700 19px "Be Vietnam Pro",sans-serif';
  ctx.fillText('V I Ệ T  N A M', 522, 511);
  ctx.restore();
}
