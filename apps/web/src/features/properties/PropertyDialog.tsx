import type { ReactNode } from 'react';
import type { GameState } from '@typhu/contracts';
import {
  boardFor,
  buildingName,
  groupsFor,
  mapTilesFor,
  VIETNAM_CITIES,
} from '@typhu/game-content';
import { ownedTiles, propertyRentPreview, resortRentProgress } from '@typhu/game-engine';
import {
  ArrowRight,
  Coins,
  House,
  Landmark,
  MapPin,
  TreePalm,
  UserRound,
  Wallet,
} from 'lucide-react';
import { Modal } from '../../shared/Modal';
import { formatMoney } from '../../shared/format';
import { PropertyBuildingArt } from './PropertyBuildingArt';
import { ResortArtwork } from './ResortArtwork';
import './property-dialog.css';

export function PropertyDialog({
  title,
  icon,
  onClose,
  transaction = false,
  variant = '',
  children,
}: {
  title: string;
  icon: ReactNode;
  onClose?: () => void;
  transaction?: boolean;
  variant?: string;
  children: ReactNode;
}) {
  return (
    <Modal
      title={title}
      headerIcon={icon}
      onClose={onClose}
      showHeaderActions={!transaction}
      showExitAction={false}
      dismissOnBackdrop={!transaction}
      className={`cartoon-property-dialog ${variant}`}
    >
      <div className="property-dialog-body">{children}</div>
    </Modal>
  );
}

export function propertyLevelLabel(level: number) {
  return (
    ['Đất trống', 'Đất đã đánh dấu', 'Nhà một tầng', 'Nhà hai tầng', 'Khu nhà'][level] ??
    'Đặc trưng'
  );
}

export function LandmarkArtwork({ game, tileId }: { game: GameState; tileId: number }) {
  const city = VIETNAM_CITIES[tileId]?.name;
  const model =
    game.boardId === 'vietnam-32'
      ? mapTilesFor(game)[tileId]?.model
      : mapTilesFor({}).find((tile) => tile.name === city)?.model;
  return model ? (
    <img
      className="property-landmark-art"
      src={`/assets/landmarks/cartoon-v1/${model}.webp`}
      alt={buildingName(tileId, 5, game.boardId, game.boardLayout)}
    />
  ) : (
    <Landmark className="property-landmark-fallback" size={70} />
  );
}

export function PropertyHero({
  game,
  tileId,
  level,
  landmark = false,
  children,
}: {
  game: GameState;
  tileId: number;
  level: number;
  landmark?: boolean;
  children?: ReactNode;
}) {
  const tile = boardFor(game)[tileId];
  const resort = !!tile.resort;
  return (
    <div
      className={`property-dialog-hero ${landmark ? 'is-landmark' : ''} ${resort ? 'is-resort' : ''}`}
    >
      <div className="property-hero-copy">
        <span className="property-region">
          <MapPin size={11} />
          {landmark
            ? tile.name
            : tile.group
              ? groupsFor(game)[tile.group].name
              : resort
                ? 'Resort biển'
                : tile.kind === 'railroad'
                  ? 'Đường sắt'
                  : 'Tiện ích'}
        </span>
        <h3>{landmark ? buildingName(tileId, 5, game.boardId, game.boardLayout) : tile.name}</h3>
        {children ??
          (!resort && (
            <span className="property-level-summary">
              <House size={12} />
              <strong>
                {level === 5 ? 'Đặc trưng' : `Cấp ${level} · ${propertyLevelLabel(level)}`}
              </strong>
            </span>
          ))}
      </div>
      {landmark || level === 5 ? (
        <LandmarkArtwork game={game} tileId={tileId} />
      ) : resort ? (
        <ResortArtwork />
      ) : (
        <PropertyBuildingArt level={Math.max(1, level)} large />
      )}
      <span className="property-hero-sun" />
    </div>
  );
}

export function PropertyPayment({ amount, label }: { amount: number; label: string }) {
  return (
    <div className="property-payment">
      <span>{label}</span>
      <strong>
        <span className="property-coin">₫</span>
        {amount.toLocaleString('vi-VN')}
      </strong>
    </div>
  );
}
export function PropertyWallet({ cash }: { cash: number }) {
  return (
    <div className="property-wallet">
      <span>
        <Wallet size={13} />
        Tiền của bạn
      </span>
      <strong>{formatMoney(cash)}</strong>
    </div>
  );
}
export function PropertyEconomy({
  cash,
  rent,
  previousRent,
}: {
  cash: number;
  rent: number;
  previousRent?: number;
}) {
  return (
    <div className="property-economy">
      <div>
        <span>
          <Coins size={13} />
          Tiền thuê
        </span>
        <strong>
          {previousRent !== undefined && (
            <>
              <del>{formatMoney(previousRent)}</del>
              <ArrowRight size={12} />
            </>
          )}
          {formatMoney(rent)}
        </strong>
      </div>
      <div>
        <span>
          <Wallet size={13} />
          Tiền của bạn
        </span>
        <strong>{formatMoney(cash)}</strong>
      </div>
    </div>
  );
}
export function PropertyOwner({ name, transfer = false }: { name: string; transfer?: boolean }) {
  return (
    <div className="property-ownership">
      <span>Chủ sở hữu</span>
      <div>
        <span className="property-owner-chip">
          <UserRound size={12} />
          {name}
        </span>
        {transfer && (
          <>
            <ArrowRight size={15} />
            <span className="property-owner-chip is-buyer">
              <UserRound size={12} />
              Bạn
            </span>
          </>
        )}
      </div>
    </div>
  );
}
export function ResortProgress({
  game,
  tileId,
  playerId,
  previewPurchase = false,
}: {
  game: GameState;
  tileId: number;
  playerId: string;
  previewPurchase?: boolean;
}) {
  const count = ownedTiles(game, playerId).filter((tile) => tile.kind === 'railroad').length;
  const quotes = resortRentProgress(game, tileId, playerId);
  return (
    <div className="property-resort-progress">
      <div className="property-progress-heading">
        <strong>Tiền thuê theo số {boardFor(game)[tileId].resort ? 'resort' : 'ga'}</strong>
        {previewPurchase && (
          <span>
            ×{count}
            <ArrowRight size={12} />×{count + 1}
          </span>
        )}
      </div>
      <div className="property-resort-steps">
        {quotes.map((item) => (
          <div
            key={item.count}
            className={`property-resort-step ${item.count === count ? 'is-current' : ''} ${previewPurchase && item.count === count + 1 ? 'is-next' : ''}`}
            aria-label={`${item.count} resort, ${formatMoney(item.rent)}${item.count === count ? ', hiện tại' : previewPurchase && item.count === count + 1 ? ', sau khi mua' : ''}`}
          >
            <span>
              <TreePalm size={17} />
              <strong>×{item.count}</strong>
            </span>
            <b>{formatMoney(item.rent)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
export function PropertyRentGrid({
  game,
  tileId,
  ownerId,
}: {
  game: GameState;
  tileId: number;
  ownerId: string;
}) {
  const current = game.properties[tileId]?.level;
  return (
    <div className="property-info-rents">
      <h4>Tiền thuê theo cấp</h4>
      <div>
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={level === current ? 'is-current' : ''}
            aria-current={level === current ? 'true' : undefined}
          >
            <span>
              {level === 5 ? <Landmark size={12} /> : <House size={12} />}{' '}
              {level === 0 ? 'Đất trống' : level === 5 ? 'Đặc trưng' : `Cấp ${level}`}
            </span>
            <strong>{formatMoney(propertyRentPreview(game, tileId, ownerId, level))}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
