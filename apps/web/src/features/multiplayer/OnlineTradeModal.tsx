import { useState } from 'react';
import { ArrowRightLeft, Check, Handshake, Hourglass, X } from 'lucide-react';
import type { GameState } from '@typhu/contracts';
import type { ClientMessage, RoomSnapshot } from '@typhu/contracts/multiplayer';
import { boardFor } from '@typhu/game-content';
import { groupTiles, ownedTiles } from '@typhu/game-engine';
import { Modal } from '../../shared/Modal';
import { formatMoney } from '../../shared/format';

export function OnlineTradeModal({
  room,
  playerId,
  send,
  onClose,
}: {
  room: RoomSnapshot;
  playerId: string;
  send: (message: ClientMessage) => void;
  onClose: () => void;
}) {
  const game = room.game!;
  const player = game.players.find((p) => p.id === playerId)!;
  const partners = game.players.filter(
    (p) =>
      p.id !== playerId &&
      !p.bankrupt &&
      room.seats.some((s) => s.gamePlayerId === p.id && s.connected),
  );
  const [toId, setToId] = useState(partners[0]?.id ?? '');
  const [give, setGive] = useState('');
  const [take, setTake] = useState('');
  const [giveCash, setGiveCash] = useState(0);
  const [takeCash, setTakeCash] = useState(0);
  const partner = game.players.find((p) => p.id === toId);
  function tradable(id: string) {
    return ownedTiles(game, id).filter(
      (tile) =>
        !game.properties[tile.id].mortgaged &&
        !game.properties[tile.id].level &&
        !groupTiles(tile, game).some((other) => (game.properties[other.id]?.level ?? 0) > 0),
    );
  }
  const valid =
    !!partner &&
    Number.isInteger(giveCash) &&
    Number.isInteger(takeCash) &&
    giveCash >= 0 &&
    takeCash >= 0 &&
    giveCash <= player.cash &&
    takeCash <= partner.cash &&
    !!(give || take || giveCash || takeCash);
  return (
    <Modal title="Đề nghị giao dịch" onClose={onClose}>
      {!partners.length ? (
        <p className="modal-body">Chưa có đối tác đang trực tuyến để giao dịch.</p>
      ) : (
        <>
          <p className="modal-note" style={{ marginTop: 0, marginBottom: 18 }}>
            Đề nghị sẽ được gửi đến thiết bị của đối tác. Chỉ thực hiện khi họ chấp nhận.
          </p>
          <label className="field">
            Gửi đến
            <select
              value={toId}
              onChange={(event) => {
                setToId(event.target.value);
                setTake('');
              }}
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {formatMoney(p.cash)}
                </option>
              ))}
            </select>
          </label>
          <div className="trade-columns">
            <section>
              <h3>Bạn trao</h3>
              <label className="field">
                Bất động sản
                <select value={give} onChange={(event) => setGive(event.target.value)}>
                  <option value="">Không có đất</option>
                  {tradable(playerId).map((tile) => (
                    <option key={tile.id} value={tile.id}>
                      {tile.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Tiền mặt
                <input
                  type="number"
                  min={0}
                  max={player.cash}
                  value={giveCash}
                  onChange={(event) => setGiveCash(Number(event.target.value))}
                />
              </label>
            </section>
            <section>
              <h3>Bạn nhận</h3>
              <label className="field">
                Bất động sản
                <select value={take} onChange={(event) => setTake(event.target.value)}>
                  <option value="">Không có đất</option>
                  {tradable(toId).map((tile) => (
                    <option key={tile.id} value={tile.id}>
                      {tile.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Tiền mặt
                <input
                  type="number"
                  min={0}
                  max={partner?.cash}
                  value={takeCash}
                  onChange={(event) => setTakeCash(Number(event.target.value))}
                />
              </label>
            </section>
          </div>
          <button
            className="primary-button"
            style={{ width: '100%', marginTop: 23 }}
            disabled={!valid}
            onClick={() => {
              send({
                type: 'PROPOSE_TRADE',
                offer: {
                  fromId: playerId,
                  toId,
                  giveTileId: give ? Number(give) : null,
                  takeTileId: take ? Number(take) : null,
                  giveCash,
                  takeCash,
                },
              });
              onClose();
            }}
          >
            Gửi đề nghị
            <ArrowRightLeft size={16} />
          </button>
        </>
      )}
    </Modal>
  );
}

export function PendingTradeModal({
  room,
  playerId,
  send,
}: {
  room: RoomSnapshot;
  playerId: string;
  send: (message: ClientMessage) => void;
}) {
  const trade = room.pendingTrade!;
  const game = room.game as GameState;
  const offer = trade.offer;
  const incoming = offer.toId === playerId;
  const partner = game.players.find((p) => p.id === (incoming ? offer.fromId : offer.toId))!;
  const receivedTile = incoming ? offer.giveTileId : offer.takeTileId;
  const givenTile = incoming ? offer.takeTileId : offer.giveTileId;
  return (
    <Modal title={incoming ? `${partner.name} muốn giao dịch` : 'Đã gửi đề nghị giao dịch'}>
      <div className="trade-review-icon">
        {incoming ? <Handshake size={36} /> : <Hourglass size={32} />}
      </div>
      <p className="modal-body">
        {incoming
          ? 'Hãy kiểm tra tài sản và tiền mặt trước khi chấp nhận.'
          : `Đang chờ ${partner.name} phản hồi trên thiết bị của họ. Đề nghị hết hạn sau 15 giây.`}
      </p>
      <div className="trade-review">
        <p>
          Bạn nhận
          <strong>
            {receivedTile !== null ? boardFor(game)[receivedTile].name : 'Không có đất'} +{' '}
            {formatMoney(incoming ? offer.giveCash : offer.takeCash)}
          </strong>
        </p>
        <ArrowRightLeft size={18} />
        <p>
          Bạn trao
          <strong>
            {givenTile !== null ? boardFor(game)[givenTile].name : 'Không có đất'} +{' '}
            {formatMoney(incoming ? offer.takeCash : offer.giveCash)}
          </strong>
        </p>
      </div>
      <div className="modal-actions">
        {incoming ? (
          <>
            <button
              className="secondary-button"
              onClick={() => send({ type: 'RESPOND_TRADE', accept: false })}
            >
              <X size={15} />
              Từ chối
            </button>
            <button
              className="primary-button"
              onClick={() => send({ type: 'RESPOND_TRADE', accept: true })}
            >
              <Check size={15} />
              Chấp nhận
            </button>
          </>
        ) : (
          <button className="secondary-button" onClick={() => send({ type: 'CANCEL_TRADE' })}>
            Hủy đề nghị
          </button>
        )}
      </div>
    </Modal>
  );
}
