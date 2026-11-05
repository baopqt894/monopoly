import { Plane, Ticket } from 'lucide-react';
import type { GameState } from '@typhu/contracts';
import { FLIGHT_FEE } from '@typhu/game-engine';
import type { BoardEventNotice } from './useBoardEventNotice';
import { formatMoney } from '../../shared/format';
import './shared-board-notice.css';
import {MonopolyNotice} from './MonopolyNotice';

export function SharedBoardNotice({ game, event }: { game: GameState; event: BoardEventNotice }) {
  if(event.kind==='monopoly')return <MonopolyNotice game={game} event={event}/>;
  const player = game.players.find(player => player.id === event.playerId);
  if (!player) return null;
  return (
    <aside className="shared-board-notice" role="status" aria-label={`${player.name} đến Sân bay`}>
      <div className="shared-board-notice-art" aria-hidden="true">
        <Plane size={44} strokeWidth={1.6} />
        <span><Ticket size={22} strokeWidth={1.7} /></span>
      </div>
      <div className="shared-board-notice-copy">
        <h2>{player.name} đến Sân bay</h2>
        <p>Lượt kế tiếp có thể bay nếu đủ <strong>{formatMoney(FLIGHT_FEE)}</strong>.</p>
      </div>
    </aside>
  );
}
