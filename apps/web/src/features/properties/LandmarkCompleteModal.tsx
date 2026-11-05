import { Check, ShieldCheck } from 'lucide-react';
import type { GameState } from '@typhu/contracts';
import { boardFor, buildingName } from '@typhu/game-content';
import { rentFor } from '@typhu/game-engine';
import { ActionClockContext } from '../../shared/ActionClock';
import { formatMoney } from '../../shared/format';
import { LandmarkArtwork, PropertyDialog } from './PropertyDialog';
import './landmark-complete.css';

export function LandmarkCompleteModal({
  game,
  tileId,
  onClose,
}: {
  game: GameState;
  tileId: number;
  onClose: () => void;
}) {
  const tile = boardFor(game)[tileId];
  return (
    <ActionClockContext.Provider value={null}>
      <PropertyDialog
        title="Công trình hoàn thành"
        icon={<Check size={18} />}
        onClose={onClose}
        variant="landmark-complete-dialog"
      >
        <div className="landmark-complete-stage">
          <span className="landmark-complete-halo" aria-hidden="true" />
          <LandmarkArtwork game={game} tileId={tileId} />
          <span className="landmark-complete-seal" aria-label="Đã hoàn thành">
            <Check size={19} strokeWidth={3} />
          </span>
        </div>
        <div className="landmark-complete-title">
          <span>{tile.name}</span>
          <h3>{buildingName(tileId, 5, game.boardId, game.boardLayout)}</h3>
          <span className="landmark-complete-badge">Công trình đặc trưng</span>
        </div>
        <div className="landmark-complete-reward">
          <div>
            <span className="landmark-complete-coin" aria-hidden="true">
              ₫
            </span>
            <span>Tiền thuê</span>
            <strong>{formatMoney(rentFor(game, tileId))}</strong>
          </div>
          <p>
            <ShieldCheck size={16} />
            Không thể bị mua lại
          </p>
        </div>
        <div className="property-dialog-actions">
          <button className="property-confirm" onClick={onClose}>
            <Check size={16} />
            Hoàn tất
          </button>
        </div>
      </PropertyDialog>
    </ActionClockContext.Provider>
  );
}
