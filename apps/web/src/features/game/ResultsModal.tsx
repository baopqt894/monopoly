import { Crown, DoorOpen, Trophy } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { GameState } from '@typhu/contracts';
import { gameOutcome, netWorth } from '@typhu/game-engine';
import { InfoRoomDialog } from './InfoRoomDialog';
import { formatMoney } from '../../shared/format';
import { PlayerPortrait } from '../multiplayer/PlayerPortrait';
import { pawnPortraitKey } from '../scene3d/pawns/portrait-key';
import './results.css';

export function ResultsModal({
  game,
  portraits = {},
  onClose,
  onNewGame,
}: {
  game: GameState;
  portraits?: Record<string, string>;
  onClose: () => void;
  onNewGame: () => void;
}) {
  const { ranked, leaders } = gameOutcome(game);
  const winner = leaders[0];
  const reasons = {
    'side-monopoly': 'Sở hữu toàn bộ tài sản trên một cạnh',
    'triple-monopoly': 'Sở hữu đủ 3 nhóm màu',
    'resort-monopoly': 'Sở hữu đủ 4 resort',
    bankruptcy: 'Các đối thủ đã phá sản',
    'accept-winnings': 'Các đối thủ đã rời bàn',
    capital: 'Dẫn đầu tài sản',
    'time-limit': 'Hết thời gian · Xếp hạng theo tổng tài sản',
  };
  const reason = game.winReason ? reasons[game.winReason] : null;
  const portrait = (player: GameState['players'][number]) => (
    <PlayerPortrait
      index={game.players.findIndex((entry) => entry.id === player.id)}
      color={player.color}
      token={player.token}
      image={portraits[pawnPortraitKey(player.token, player.color)]}
    />
  );
  return (
    <InfoRoomDialog
      title="Bảng xếp hạng"
      icon={<Trophy size={18} />}
      className="results-modal"
      onClose={onClose}
    >
      {winner ? (
        <section
          className="results-winner"
          aria-label={leaders.length > 1 ? 'Đồng chiến thắng' : 'Người chiến thắng'}
        >
          <div
            className="results-winner-portrait"
            style={{ '--player-color': winner.color } as CSSProperties}
          >
            {leaders.length > 1 ? <Trophy size={38} aria-hidden="true" /> : portrait(winner)}
            <span className="results-crown">
              <Crown size={19} aria-hidden="true" />
            </span>
          </div>
          <div className="results-winner-copy">
            <span className="results-winner-label">
              {leaders.length > 1 ? 'ĐỒNG CHIẾN THẮNG' : 'CHIẾN THẮNG!'}
            </span>
            <h3>{leaders.map((player) => player.name).join(' & ')}</h3>
            {reason && <p>{reason}</p>}
          </div>
        </section>
      ) : (
        <div className="results-no-winner">
          <Trophy size={28} aria-hidden="true" />
          <strong>Ván chơi đã kết thúc</strong>
        </div>
      )}
      <table className="results-table" aria-label="Xếp hạng người chơi cuối ván">
        <colgroup>
          <col className="results-rank-col" />
          <col />
          <col className="results-worth-col" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Hạng</th>
            <th scope="col">Người chơi</th>
            <th scope="col">Tài sản ròng</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((player, index) => (
            <tr
              key={player.id}
              className={`${leaders.some((leader) => leader.id === player.id) ? 'is-winner' : ''} ${player.bankrupt ? 'is-bankrupt' : ''}`}
            >
              <th scope="row">
                <span className="results-rank">{String(index + 1).padStart(2, '0')}</span>
              </th>
              <td>
                <div className="results-player">
                  <span
                    className="results-avatar"
                    style={{ '--player-color': player.color } as CSSProperties}
                  >
                    {portrait(player)}
                  </span>
                  <strong title={player.name}>{player.name}</strong>
                </div>
              </td>
              <td className="results-worth">
                {player.bankrupt ? (
                  <span className="results-bankrupt">Phá sản</span>
                ) : (
                  formatMoney(netWorth(game, player.id))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="info-room-primary results-lobby-button" onClick={onNewGame}>
        <DoorOpen size={18} />
        Về sảnh
      </button>
    </InfoRoomDialog>
  );
}
