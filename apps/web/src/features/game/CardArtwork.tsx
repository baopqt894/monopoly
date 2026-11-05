import type { GameCard, DeckKind } from '@typhu/contracts';
import { cardArtUrl } from './card-art-loading';

function lines(text: string, width: number) {
  const result: string[] = [];
  for (const word of text.split(/\s+/)) {
    const last = result.length - 1;
    if (last < 0 || `${result[last]} ${word}`.length > width) result.push(word);
    else result[last] += ` ${word}`;
  }
  return result;
}

/** Every card has its own approved-style illustration, independent of board-specific copy. */
export function cardIllustration(card: GameCard): string {
  return card.id;
}

/** Text is drawn inside the SVG card image, keeping Vietnamese/rules exact. */
export function CardArtwork({
  card,
  deck,
  detail,
  onArtLoad,
}: {
  card: GameCard | null;
  deck: DeckKind;
  detail?: string;
  onArtLoad?: () => void;
}) {
  const title = card ? lines(card.title, 27) : [];
  const copy = card ? lines(card.description, 39) : [];
  const artwork = card ? cardArtUrl(cardIllustration(card)) : '';
  const accent = deck === 'chance' ? '#12a9bc' : '#ed876c';
  return (
    <svg
      className="chance-artwork"
      viewBox="0 0 600 800"
      role="img"
      aria-label={
        card
          ? `${card.title}. ${card.description}${detail ? `. ${detail}` : ''}`
          : `Đang rút thẻ ${deck === 'chance' ? 'Cơ hội' : 'Quỹ cộng đồng'}`
      }
    >
      <rect
        x="5"
        y="5"
        width="590"
        height="790"
        rx="24"
        fill="#fff9e9"
        stroke="#77bed0"
        strokeWidth="3"
      />
      <rect x="20" y="20" width="560" height="76" rx="16" fill={accent} />
      <text
        x="300"
        y="69"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="25"
        fontWeight="800"
        letterSpacing="3"
      >
        {deck === 'chance' ? 'CƠ HỘI' : 'QUỸ CỘNG ĐỒNG'}
      </text>
      {card ? (
        <>
          <image
            href={artwork}
            onLoad={onArtLoad}
            onError={onArtLoad}
            x="68"
            y="104"
            width="464"
            height="464"
            preserveAspectRatio="xMidYMid meet"
          />
          <text
            x="300"
            y={title.length > 1 ? 607 : 624}
            textAnchor="middle"
            fill="#153e56"
            fontSize="32"
            fontWeight="800"
          >
            {title.map((line, i) => (
              <tspan key={i} x="300" dy={i ? 39 : 0}>
                {line}
              </tspan>
            ))}
          </text>
          <text x="300" y="674" textAnchor="middle" fill="#344f5a" fontSize="24" fontWeight="600">
            {copy.map((line, i) => (
              <tspan key={i} x="300" dy={i ? 32 : 0}>
                {line}
              </tspan>
            ))}
          </text>
          {detail && (
            <text x="300" y="774" textAnchor="middle" fill="#397e80" fontSize="22" fontWeight="800">
              {detail}
            </text>
          )}
        </>
      ) : (
        <>
          <rect x="24" y="108" width="552" height="664" rx="18" fill={accent} />
          <circle cx="300" cy="390" r="170" fill="#ffffff" opacity="0.12" />
          {deck === 'chance' ? (
            <path
              d="M150 415L420 270L345 495L281 413L211 461L232 382Z"
              fill="#fff7df"
              stroke="#153e56"
              strokeWidth="8"
              strokeLinejoin="round"
            />
          ) : (
            <g stroke="#153e56" strokeWidth="8" strokeLinejoin="round">
              <path d="M174 340H426V490H174Z" fill="#fff7df" />
              <path d="M160 315H440V365H160Z" fill="#ffda70" />
              <path d="M280 315V490H320V315Z" fill="#ffda70" />
              <path
                d="M300 315C205 325 201 225 245 238C278 247 300 315 300 315C300 315 322 247 355 238C399 225 395 325 300 315Z"
                fill="#ffda70"
              />
            </g>
          )}
          <text x="300" y="660" textAnchor="middle" fontSize="110" fontWeight="900" fill="#fff4cf">
            ?
          </text>
        </>
      )}
    </svg>
  );
}
