/** Optimized static files avoid a cold on-demand image conversion when a card is drawn. */
export const CHANCE_ART = [
  ...Array.from({ length: 23 }, (_, i) => `chance-${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 16 }, (_, i) => `chest-${String(i + 1).padStart(2, '0')}`),
] as const;
export const cardArtUrl = (id: string) => `/assets/cards/cartoon-v1/${id}.webp`;
let warmed = false;

/** Warm both browser cache and decoded pixels while the player is still in the lobby. */
export function preloadCardArt(): void {
  if (warmed || typeof Image === 'undefined') return;
  warmed = true;
  for (const name of CHANCE_ART) {
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = 'low';
    image.src = cardArtUrl(name);
    void image.decode().catch(() => {});
  }
}
