import { Crown } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { GameState } from '@typhu/contracts';
import { groupsFor } from '@typhu/game-content';
import './monopoly-notice.css';

type MonopolyEvent = Extract<NonNullable<GameState['lastBoardEvent']>, { kind: 'monopoly' }>;
export function MonopolyNotice({ game, event }: { game: GameState; event: MonopolyEvent }) {
  return (
    <aside className="monopoly-notice" role="status" aria-label="MONOPOLY">
      <div className="monopoly-crown" aria-hidden="true">
        <Crown size={42} strokeWidth={2.2} />
      </div>
      <strong className="monopoly-word">MONOPOLY</strong>
      <div className="monopoly-groups">
        {event.monopolies.map((m) => {
          const player = game.players.find((p) => p.id === m.playerId);
          return (
            <span key={`${m.playerId}:${m.group}`}>
              <i style={{ background: player?.color }} />
              {player?.name} · {groupsFor(game)[m.group].name}
            </span>
          );
        })}
      </div>
      <div className="monopoly-sparks" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} style={{ '--spark': i } as CSSProperties}>
            ✦
          </i>
        ))}
      </div>
    </aside>
  );
}
