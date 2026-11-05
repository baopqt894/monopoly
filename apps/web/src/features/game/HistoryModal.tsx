import { Coins, History, House, Info, Sparkles } from 'lucide-react';
import type { GameState } from '@typhu/contracts';
import { InfoRoomDialog } from './InfoRoomDialog';
import './game.css';
import './history.css';

const entryIcons = { info: Info, money: Coins, property: House, event: Sparkles };

export function HistoryModal({ game, onClose }: { game: GameState; onClose: () => void }) {
  return (
    <InfoRoomDialog
      title="Nhật ký ván chơi"
      icon={<History size={18} />}
      className="history-modal"
      onClose={onClose}
    >
      <div className="history-summary">
        <span>{game.log.length} hoạt động gần nhất</span>
        <span>Mới nhất trước</span>
      </div>
      <div className="history-scroll-frame">
        <ol className="city-history-list" aria-label="Hoạt động trong ván" tabIndex={0}>
          {game.log.map((entry) => {
            const Icon = entryIcons[entry.kind];
            return (
              <li key={entry.id} className={`city-history-entry is-${entry.kind}`}>
                <span className="history-entry-icon">
                  <Icon size={15} aria-hidden="true" />
                </span>
                <p>{entry.message}</p>
                <span className="history-round">Vòng {entry.round}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </InfoRoomDialog>
  );
}
