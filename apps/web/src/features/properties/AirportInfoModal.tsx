import { AirportIcon } from './AirportIcon';
import { FLIGHT_FEE } from '@typhu/game-engine';
import { ActionClockContext } from '../../shared/ActionClock';
import { formatMoney } from '../../shared/format';
import { PropertyDialog } from './PropertyDialog';
import './airport-info.css';

function AirportArtwork() {
  return <img className="airport-info-art" src="/assets/ui/airport-terminal-v2.webp" alt="" />;
}

export function AirportInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <ActionClockContext.Provider value={null}>
      <PropertyDialog
        title="Thông tin sân bay"
        icon={<AirportIcon kind="plane" />}
        onClose={onClose}
        variant="airport-info-dialog"
      >
        <div className="airport-info-hero">
          <h3>Sân bay</h3>
          <AirportArtwork />
        </div>
        <div className="airport-info-metrics">
          <div>
            <span>Phí chuyến bay</span>
            <strong>{formatMoney(FLIGHT_FEE)}</strong>
          </div>
          <div>
            <span>Thời điểm bay</span>
            <strong>Lượt kế tiếp</strong>
          </div>
        </div>
        <div className="airport-info-rules">
          <div>
            <span className="airport-rule-icon">
              <AirportIcon kind="destination" />
            </span>
            <div>
              <strong>Chọn điểm đến</strong>
              <p>Đất của bạn hoặc ô đất chưa có chủ</p>
            </div>
          </div>
          <div>
            <span className="airport-rule-icon">
              <AirportIcon kind="dice" />
            </span>
            <div>
              <strong>Bay xong, tiếp tục tung</strong>
              <p>Sau khi xử lý ô đến</p>
            </div>
          </div>
        </div>
      </PropertyDialog>
    </ActionClockContext.Provider>
  );
}
