export interface SaleLabelBox {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Keep prices close to their tile anchors while reserving room for every badge. */
export function arrangeSaleLabels(
  labels: SaleLabelBox[],
  width: number,
  height: number,
): SaleLabelBox[] {
  const placed: SaleLabelBox[] = [];
  const centerX = labels.reduce((sum, label) => sum + label.x, 0) / (labels.length || 1);
  const centerY = labels.reduce((sum, label) => sum + label.y, 0) / (labels.length || 1);
  for (const label of labels) {
    const angle = Math.atan2(label.y - centerY, label.x - centerX);
    const candidates = [{ x: label.x, y: label.y }];
    for (let radius = 6; radius <= 120; radius += 6) {
      for (const turn of [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75, 1]) {
        const direction = angle + Math.PI * turn;
        candidates.push({
          x: label.x + Math.cos(direction) * radius,
          y: label.y + Math.sin(direction) * radius,
        });
      }
    }
    const position =
      candidates.find(
        (candidate) =>
          candidate.x >= label.width / 2 + 2 &&
          candidate.x <= width - label.width / 2 - 2 &&
          candidate.y >= label.height / 2 + 2 &&
          candidate.y <= height - label.height / 2 - 2 &&
          placed.every(
            (other) =>
              Math.abs(candidate.x - other.x) >= (label.width + other.width) / 2 + 3 ||
              Math.abs(candidate.y - other.y) >= (label.height + other.height) / 2 + 3,
          ),
      ) ?? candidates[0];
    placed.push({ ...label, ...position });
  }
  return placed;
}
