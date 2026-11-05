import {
  Building2,
  CircleHelp,
  Gift,
  Landmark,
  MapPin,
  TrainFront,
  TreePalm,
  Flag,
  Receipt,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import type { GameAction, GameState } from '@typhu/contracts';
import { boardFor, groupsFor, buildingName } from '@typhu/game-content';
import {
  rentFor,
  buyBackQuote,
  usesLandingRules,
  randomEventTileIds,
  festivalRentMultiplier,
  managingPlayer,
  usesFullLiquidation,
  landedOnOwnProperty,
} from '@typhu/game-engine';
import { Modal } from '../../shared/Modal';
import { businessNames, formatMoney } from '../../shared/format';
import { PropertyActions } from './PropertyActions';
import { LandmarkUpgradeModal } from './LandmarkUpgradeModal';
import { PropertyUpgradeModal } from './PropertyUpgradeModal';
import { PropertyBuybackModal } from './PropertyBuybackModal';
import { PropertyInfoModal } from './PropertyInfoModal';
import { AirportInfoModal } from './AirportInfoModal';
import './properties.css';
import './deed.css';

const explanations: Record<string, string> = {
  go: 'Đi tiến qua hoặc đến Xuất phát nhận tiền theo cài đặt phòng và hoàn thành một vòng cá nhân. Máy bay cũng được tính; bị đưa thẳng ra Đảo hoang không nhận khoản này.',
  chance:
    'Rút và xem một thẻ Cơ hội rồi thực hiện. Nếu thẻ cần chọn mục tiêu, chọn trực tiếp ô hợp lệ trên bàn cờ. Mọi người cùng thấy thẻ vừa rút.',
  chest:
    'Rút một thẻ Quỹ Cộng đồng để nhận tiền, thanh toán hoặc di chuyển theo nội dung thẻ. Thẻ ra đảo được giữ đến khi sử dụng.',
  tax: 'Nộp thuế bằng 10% tổng tiền mặt và giá trị hiện tại của đất, nhà và resort/ga đang sở hữu, làm tròn lên.',
  jail: 'Đáp ô Đảo hoang bị giữ lại và kết thúc lượt. Dùng thẻ hoặc trả ₫200 để ra rồi tung bình thường. Tung đôi để thoát thì đi theo tổng điểm và được tung thêm; lần thử thứ ba được ra miễn phí.',
  parking: 'Nghỉ chân miễn phí. Không nhận tiền thưởng và không phải trả tiền.',
  airport:
    'Đến Sân bay kết thúc lượt, kể cả đôi. Lượt kế tiếp đủ ₫50 thì chọn ô chưa có chủ hoặc đất của mình để bay; không được chọn ô rút thẻ, Thuế, Lễ hội, Đảo hoang hay đất đối thủ. Thiếu tiền hoặc hết giờ chọn thì bỏ vé và tung xúc xắc. Qua Xuất phát vẫn nhận tiền và tính vòng; xử lý ô đến xong vẫn được tung, trừ khi ô đó kết thúc lượt.',
};

export function PropertyModal({
  game,
  tileId,
  canManage = true,
  dispatch,
  onClose,
  onSkip,
  landingDialog = false,
}: {
  game: GameState;
  tileId: number;
  canManage?: boolean;
  dispatch: (action: GameAction) => void;
  onClose: () => void;
  onSkip?: () => void;
  landingDialog?: boolean;
}) {
  const tile = boardFor(game)[tileId];
  if (tile.kind === 'airport') return <AirportInfoModal onClose={onClose} />;
  const property = game.properties[tileId];
  const owner = game.players.find((player) => player.id === property?.ownerId);
  const buyback = buyBackQuote(game, tileId);
  const buybackVisible =
    canManage &&
    usesLandingRules(game) &&
    property &&
    property.ownerId !== game.players[game.currentPlayer].id &&
    tile.kind === 'street' &&
    game.propertyVisit?.tileId === tileId &&
    game.phase === 'end';
  const buybackProblem = buyback.error;
  const showManagement =
    canManage &&
    property?.ownerId === managingPlayer(game).id &&
    (!usesFullLiquidation(game) ||
      (tile.kind === 'street' && property.level < 5 && landedOnOwnProperty(game, tileId)));
  if (
    landingDialog &&
    usesLandingRules(game) &&
    tile.kind === 'street' &&
    (property?.level ?? 0) >= 4 &&
    landedOnOwnProperty(game, tileId) &&
    game.propertyVisit?.levelOnArrival === 4
  ) {
    return (
      <LandmarkUpgradeModal
        game={game}
        tileId={tileId}
        dispatch={dispatch}
        onClose={onClose}
        onSkip={onSkip}
        disabled={!canManage}
      />
    );
  }
  if (landingDialog && property && property.level < 4 && landedOnOwnProperty(game, tileId)) {
    return (
      <PropertyUpgradeModal
        game={game}
        tileId={tileId}
        dispatch={dispatch}
        onClose={onClose}
        onSkip={onSkip}
        disabled={!canManage}
      />
    );
  }
  if (landingDialog && buybackVisible && property.level < 5) {
    return (
      <PropertyBuybackModal
        game={game}
        tileId={tileId}
        dispatch={dispatch}
        onClose={onClose}
        onSkip={onSkip}
        disabled={!canManage}
      />
    );
  }
  if (game.boardId === 'vietnam-32' && usesLandingRules(game) && tile.price) {
    return <PropertyInfoModal game={game} tileId={tileId} onClose={onClose} />;
  }
  const explanation =
    tile.kind === 'parking' && usesLandingRules(game)
      ? 'Chọn một thành phố của mình để tổ chức Lễ hội. Toàn bàn chỉ có một nơi tổ chức tại một thời điểm; chọn mới sẽ chuyển Lễ hội tới đó.'
      : explanations[tile.kind];
  const color = tile.group ? groupsFor(game)[tile.group].color : '#65a997';
  const Icon =
    tile.kind === 'jail' || tile.resort
      ? TreePalm
      : tile.kind === 'go'
        ? Flag
        : tile.kind === 'tax'
          ? Receipt
          : tile.kind === 'chance'
            ? CircleHelp
            : tile.kind === 'chest'
              ? Gift
              : tile.kind === 'railroad'
                ? TrainFront
                : tile.price
                  ? Building2
                  : MapPin;
  return (
    <Modal
      title={tile.price ? 'Thông tin đất' : 'Thông tin ô'}
      className="property-modal"
      onClose={onClose}
      dismissOnBackdrop={!onSkip}
      showHeaderActions={!onSkip}
    >
      <div
        className="property-scroll-body"
        role="region"
        aria-label={`Thông tin ${tile.name}`}
        tabIndex={0}
      >
        <div className="deed-banner" style={{ '--deed-color': color } as CSSProperties}>
          <span className="deed-icon">
            <Icon size={28} strokeWidth={1.6} />
          </span>
          <span className="deed-title">
            {tile.group ? groupsFor(game)[tile.group].name : tile.resort ? 'Khu du lịch' : 'Bàn cờ'}
            <strong>{tile.name}</strong>
          </span>
        </div>
        {tile.price ? (
          <>
            {randomEventTileIds(game).includes(tileId) && (
              <div className="deed-status">
                <Gift size={14} /> Ô sự kiện · Tiền thuê ×1,25
              </div>
            )}
            {game.festivalTileId === tileId && (
              <div className="deed-status">
                <Landmark size={14} /> Lễ hội · Tiền thuê ×
                {festivalRentMultiplier(game, tileId).toLocaleString('vi-VN')}
              </div>
            )}
            <div className="deed-stats">
              <span>
                Giá niêm yết<strong className="money">{formatMoney(tile.price)}</strong>
              </span>
              <span>
                Chủ sở hữu<strong>{owner?.name ?? 'Ngân hàng'}</strong>
              </span>
              <span>
                Tiền thuê hiện tại
                <strong className="money">
                  {property ? formatMoney(rentFor(game, tileId)) : '—'}
                </strong>
              </span>
            </div>
            {property && (
              <div className="deed-status">
                <Landmark size={14} />
                {property.disabledLaps
                  ? `Tạm ngưng thu thuê · ${property.disabledLaps} vòng`
                  : property.mortgaged
                    ? 'Đang thế chấp · không thu tiền thuê'
                    : property.level
                      ? `${game.mode === 'city' ? businessNames[property.business] : 'Công trình'} · ${buildingName(tileId, property.level, game.boardId, game.boardLayout)}`
                      : tile.resort
                        ? 'Khu du lịch'
                        : tile.kind === 'railroad'
                          ? 'Nhà ga'
                          : tile.kind === 'utility'
                            ? 'Tiện ích'
                            : 'Lô đất chưa xây dựng'}
              </div>
            )}
            {buybackVisible && (
              <div className="buyback-action">
                <div className="property-total">
                  <span>Tổng giá mua lại</span>
                  <strong>{formatMoney(buyback.totalCost)}</strong>
                </div>
                {buyback.constructionCost > 0 && (
                  <p>Trong đó xây cấp 1: {formatMoney(buyback.constructionCost)}</p>
                )}
                <button
                  className="primary-button"
                  disabled={!!buybackProblem}
                  onClick={() => dispatch({ type: 'BUY_BACK', tileId })}
                >
                  Mua lại {tile.name}
                </button>
                {buybackProblem && <p role="status">{buybackProblem}</p>}
              </div>
            )}
            {showManagement && (
              <div className="deed-management">
                <PropertyActions game={game} tileId={tileId} dispatch={dispatch} />
              </div>
            )}
            {tile.rents ? (
              <>
                <div className="deed-rent-heading">
                  <strong>Bảng thuê cơ bản</strong>
                  <span>Trước hệ số</span>
                </div>
                <div className="deed-rent-block">
                  <table className="deed-rent-table" aria-label="Tiền thuê theo cấp công trình">
                    <tbody>
                      {tile.rents.map((rent, level) => (
                        <tr
                          key={level}
                          className={property?.level === level ? 'current-level' : ''}
                          aria-current={property?.level === level ? 'true' : undefined}
                        >
                          <td>
                            <span className="deed-rent-level">{level}</span>
                          </td>
                          <th scope="row">
                            {level === 0
                              ? 'Đất trống'
                              : buildingName(tileId, level, game.boardId, game.boardLayout)}
                          </th>
                          <td>{formatMoney(rent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="modal-note">
                {tile.kind === 'railroad'
                  ? `Sở hữu 1 / 2 / 3 / 4 ${tile.resort ? 'resort' : 'ga'}: tiền thuê lần lượt ₫25 / ₫50 / ₫100 / ₫200.`
                  : 'Sở hữu 1 tiện ích: tiền thuê bằng 4 lần tổng xúc xắc. Sở hữu cả 2: tiền thuê bằng 10 lần.'}
              </p>
            )}
          </>
        ) : (
          <p className="modal-body">{explanation}</p>
        )}
        {game.error && (
          <p className="toast property-error" role="alert">
            {game.error}
          </p>
        )}
      </div>
      {onSkip && (
        <div className="modal-actions">
          <button className="secondary-button" onClick={onSkip}>
            Bỏ qua
          </button>
        </div>
      )}
    </Modal>
  );
}
