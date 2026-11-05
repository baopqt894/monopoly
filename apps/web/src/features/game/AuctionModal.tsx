import { useState } from 'react';
import { Gavel } from 'lucide-react';
import type { GameAction, GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import { Modal } from '../../shared/Modal';
import { formatMoney } from '../../shared/format';

export function AuctionModal({
  game,
  dispatch,
}: {
  game: GameState;
  dispatch: (action: GameAction) => void;
}) {
  const auction = game.auction!;
  const bidder = game.players[auction.bidderIndex];
  const tile = boardFor(game)[auction.tileId];
  const [amount, setAmount] = useState(auction.highestBid + 10);
  const highBidder = game.players.find((p) => p.id === auction.highestBidderId);
  return (
    <Modal title={`Đấu giá · ${tile.name}`}>
      <div className="auction-hero">
        <Gavel size={35} />
        <p>Giá cao nhất hiện tại</p>
        <strong className="money">{formatMoney(auction.highestBid)}</strong>
        <span>{highBidder?.name ?? 'Chưa có người trả giá'}</span>
      </div>
      <p className="modal-body">
        <strong>{bidder.name}</strong>, đến lượt bạn. Bạn có {formatMoney(bidder.cash)}. Bỏ lượt
        đồng nghĩa rời phiên đấu giá này.
      </p>
      <label className="field" style={{ marginTop: 18 }}>
        Mức giá của bạn
        <input
          type="number"
          min={auction.highestBid + 1}
          max={bidder.cash}
          step="1"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </label>
      <div className="modal-actions">
        <button className="secondary-button" onClick={() => dispatch({ type: 'PASS_BID' })}>
          Bỏ lượt
        </button>
        <button
          className="primary-button"
          disabled={
            !Number.isInteger(amount) || amount <= auction.highestBid || amount > bidder.cash
          }
          onClick={() => dispatch({ type: 'BID', amount })}
        >
          Trả giá {formatMoney(amount)}
        </button>
      </div>
      {game.error && (
        <p className="toast property-error" role="alert">
          {game.error}
        </p>
      )}
    </Modal>
  );
}
