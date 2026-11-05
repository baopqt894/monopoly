import type { CSSProperties } from 'react';
import { VIETNAM_PAWNS } from '@typhu/game-content';
import { Token } from '../../shared/Token';
import './player-portrait.css';

export function PlayerPortrait({
  index,
  color,
  token,
  image,
}: {
  index: number;
  color: string;
  token?: string;
  image?: string;
}) {
  if (token) {
    const legacyNames: Record<string, string> = {
      leaf: 'Mèo',
      sun: 'Cốc cà phê',
      diamond: 'Kim cương',
      sailboat: 'Thuyền buồm',
      cyclo: 'Chú xích lô',
      'buffalo-boy': 'Chú bé chăn trâu',
      vendor: 'Cô hàng rong',
    };
    const name =
      VIETNAM_PAWNS.find((pawn) => pawn.id === token)?.name ?? legacyNames[token] ?? token;
    return image ? (
      <img className="investor-portrait pawn-portrait" src={image} alt={`Quân cờ: ${name}`} />
    ) : (
      <span
        role="img"
        aria-label={`Quân cờ: ${name}`}
        className="investor-portrait pawn-portrait pawn-portrait-loading"
        style={{ backgroundColor: color }}
      >
        <Token token={token} size={28} />
      </span>
    );
  }
  const positions = ['0% 0%', '100% 0%', '0% 100%', '100% 100%'];
  return (
    <span
      role="img"
      aria-label={`Nhân vật nhà đầu tư ${index + 1}`}
      className="investor-portrait"
      style={{ backgroundColor: color, backgroundPosition: positions[index % 4] } as CSSProperties}
    />
  );
}
