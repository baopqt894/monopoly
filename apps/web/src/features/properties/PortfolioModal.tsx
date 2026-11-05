import { Landmark, Wallet } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { GameAction, GameState } from '@typhu/contracts';
import { groupsFor, buildingName } from '@typhu/game-content';
import {
  propertyValue,
  managingPlayer,
  netWorth,
  ownedTiles,
  usesFullLiquidation,
  usesLandingRules,
  buildProblem,
} from '@typhu/game-engine';
import { Modal } from '../../shared/Modal';
import { businessNames, formatMoney } from '../../shared/format';
import { PropertyActions } from './PropertyActions';
import { PlayerPortrait } from '../multiplayer/PlayerPortrait';
import { pawnPortraitKey } from '../scene3d/pawns/portrait-key';
import { LandmarkArtwork, propertyLevelLabel } from './PropertyDialog';
import { PropertyBuildingArt } from './PropertyBuildingArt';
import { ResortArtwork } from './ResortArtwork';
import './properties.css';
import './portfolio.css';

export function PortfolioModal({
  game,
  portraits = {},
  canManage = true,
  playerId,
  viewerId,
  dispatch,
  onClose,
  onPlayerChange,
}: {
  game: GameState;
  portraits?: Record<string, string>;
  canManage?: boolean;
  playerId: string;
  viewerId?: string;
  dispatch: (action: GameAction) => void;
  onClose: () => void;
  onPlayerChange: (id: string) => void;
}) {
  const debt = game.debt && (!viewerId || game.debt.debtorId === viewerId) ? game.debt : null;
  if (debt && usesFullLiquidation(game)) return null;
  const player = game.players.find((entry) => entry.id === (debt?.debtorId ?? playerId))!;
  const tiles = ownedTiles(game, player.id);
  const potential = tiles.reduce((sum, tile) => {
    const property = game.properties[tile.id];
    return (
      sum +
      (property.level * (tile.buildCost ?? 0)) / 2 +
      (!property.mortgaged ? (tile.price ?? 0) / 2 : 0)
    );
  }, player.cash);
  return (
    <Modal
      title={debt ? `Thanh toán khoản nợ · ${player.name}` : 'Danh mục tài sản'}
      onClose={debt ? undefined : onClose}
      className={`cartoon-property-dialog portfolio-modal ${debt ? 'is-debt' : ''}`}
      headerIcon={debt ? <Wallet size={18} /> : <Landmark size={18} />}
      showExitAction={false}
    >
      <div className="portfolio-body">
        {debt ? (
          <div className="debt-callout">
            <Wallet size={22} />
            <div>
              <strong>Còn thiếu {formatMoney(debt.amount)}</strong>
              <p>
                {debt.reason}. Bán công trình hoặc thế chấp đất để tiếp tục. Khoản thu sẽ tự trả vào
                nợ.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="portfolio-players"
            role="group"
            aria-label="Chọn nhà đầu tư"
            style={{ '--player-count': game.players.length } as CSSProperties}
          >
            {game.players.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                aria-label={`Xem tài sản của ${entry.name}`}
                aria-pressed={entry.id === player.id}
                title={entry.name}
                onClick={() => onPlayerChange(entry.id)}
                style={{ '--player-color': entry.color } as CSSProperties}
              >
                <span className="portfolio-player-portrait">
                  <PlayerPortrait
                    index={index}
                    color={entry.color}
                    token={entry.token}
                    image={portraits[pawnPortraitKey(entry.token, entry.color)]}
                  />
                </span>
                <strong>{entry.name}</strong>
              </button>
            ))}
          </div>
        )}
        <div className="portfolio-summary">
          <span>
            Tiền mặt<strong className="money">{formatMoney(player.cash)}</strong>
          </span>
          <span>
            Tài sản ròng<strong className="money">{formatMoney(netWorth(game, player.id))}</strong>
          </span>
          <span>
            Bất động sản<strong>{tiles.length} lô</strong>
          </span>
        </div>
        <div className="portfolio-list-header">
          <strong>Bất động sản</strong>
          <span>Giá trị</span>
        </div>
        <div className="portfolio-scroll-frame">
          <div
            key={player.id}
            className="portfolio-list"
            role="region"
            aria-label={`Tài sản của ${player.name}`}
            tabIndex={0}
          >
            {tiles.length ? (
              tiles.map((tile) => {
                const property = game.properties[tile.id];
                return (
                  <div className="portfolio-property" key={tile.id}>
                    <div className="portfolio-property-heading">
                      <span
                        className="property-swatch"
                        style={
                          {
                            '--property-color': tile.group
                              ? groupsFor(game)[tile.group].color
                              : '#82b5b3',
                          } as CSSProperties
                        }
                      >
                        {property.level === 5 && tile.kind === 'street' ? (
                          <LandmarkArtwork game={game} tileId={tile.id} />
                        ) : tile.resort ? (
                          <ResortArtwork />
                        ) : (
                          <PropertyBuildingArt level={Math.max(1, property.level)} />
                        )}
                      </span>
                      <div className="portfolio-property-copy">
                        <strong>{tile.name}</strong>
                        <small>
                          {property.mortgaged
                            ? 'Đang thế chấp'
                            : property.level
                              ? `${game.mode === 'city' ? `${businessNames[property.business]} · ` : ''}${property.level === 5 ? buildingName(tile.id, property.level, game.boardId, game.boardLayout) : propertyLevelLabel(property.level)}`
                              : tile.group
                                ? groupsFor(game)[tile.group].name
                                : tile.resort
                                  ? 'Resort biển'
                                  : 'Hạ tầng thành phố'}
                        </small>
                      </div>
                      <div className="portfolio-property-value">
                        <strong className="money">
                          {formatMoney(
                            usesFullLiquidation(game) ? propertyValue(game, tile.id) : tile.price!,
                          )}
                        </strong>
                        <span
                          className={`portfolio-level ${property.level === 5 ? 'is-landmark' : ''}`}
                        >
                          {tile.resort
                            ? 'Resort'
                            : tile.kind !== 'street'
                              ? tile.kind === 'railroad'
                                ? 'Ga'
                                : 'Tiện ích'
                              : property.level === 5
                                ? 'Đặc trưng'
                                : property.level
                                  ? `Cấp ${property.level}`
                                  : 'Đất trống'}
                        </span>
                      </div>
                    </div>
                    {canManage &&
                      player.id === managingPlayer(game).id &&
                      (!viewerId || viewerId === player.id) &&
                      (!usesLandingRules(game) ||
                        !usesFullLiquidation(game) ||
                        !buildProblem(game, tile.id)) && (
                        <PropertyActions compact game={game} tileId={tile.id} dispatch={dispatch} />
                      )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <Landmark size={34} />
                <strong>Chưa có bất động sản</strong>
              </div>
            )}
          </div>
        </div>
        {debt && (
          <>
            <button
              className="bankruptcy-button"
              disabled={!canManage || potential >= debt.amount}
              onClick={() => dispatch({ type: 'DECLARE_BANKRUPTCY' })}
            >
              Tuyên bố phá sản
            </button>
            <p className="modal-note">
              Chỉ có thể phá sản sau khi giá trị có thể thanh lý không đủ trả nợ.
            </p>
          </>
        )}
        {game.error && (
          <p className="toast property-error" role="alert">
            {game.error}
          </p>
        )}
      </div>
    </Modal>
  );
}
