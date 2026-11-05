import { automaticAction, FLIGHT_FEE } from '@typhu/game-engine';
import { ArrowRight, Gift, Gavel, Plane } from 'lucide-react';
import { RollButton, RollDiceArtwork } from './RollButton';
import { IslandActions } from './IslandActions';
import type { GameAction, GameState } from '@typhu/contracts';
import './flight.css';
import './turn-animation.css';

export function GameControls({
  game,
  pending,
  moving,
  canAct,
  actorName,
  dispatch,
  onAssets,
  onPurchase,
  rolling,
  showingResult,
  onRoll,
  onFlight,
}: {
  game: GameState;
  pending: boolean;
  moving: boolean;
  canAct: boolean;
  actorName: string;
  dispatch: (action: GameAction) => void;
  onAssets: () => void;
  onPurchase: () => void;
  rolling: boolean;
  showingResult: boolean;
  onRoll: () => void;
  onFlight: () => void;
}) {
  const player = game.players[game.currentPlayer];
  if (rolling)
    return (
      <div className="turn-dice-status cartoon-roll-status" role="status">
        <RollDiceArtwork />
        Đang tung…
      </div>
    );
  if (showingResult)
    return null;
  if (moving)
    return (
      <div className="game-center-status" role="status">
        Đang di chuyển đến ô…
      </div>
    );
  if (game.phase === 'finished')
    return <div className="game-center-status">Ván chơi đã kết thúc</div>;
  if (game.phase === 'end' && player.flight === 'waiting')
    return <div className="game-center-status"><Plane size={18} /> Chờ chuyến bay lượt sau</div>;
  if (!canAct)
    return (
      <div className="game-wait-bubble">
        <span className="waiting-dots">
          <i />
          <i />
          <i />
        </span>
        <strong>{actorName}</strong>
        <span>
          {game.phase === 'auction'
            ? 'đang đấu giá'
            : game.phase === 'card'
              ? 'đang rút thẻ'
              : game.phase === 'festival'
                ? 'đang chọn nơi tổ chức Lễ hội'
                : 'đang chơi…'}
        </span>
      </div>
    );
  return (
    <div className={`game-center-controls ${game.phase === 'roll' ? `is-roll-controls ${player.jailed ? 'is-island-controls' : ''}` : ''}`}>
      {game.debt ? (
        <button className="play-button urgent" onClick={onAssets}>
          XỬ LÝ KHOẢN NỢ
          <ArrowRight size={19} />
        </button>
      ) : game.phase === 'roll' && automaticAction(game)?.type === 'ROLL' ? null : game.phase === 'roll' ? (
        <>
          <span className="your-turn-bubble cartoon-turn-label">{player.jailed ? 'ĐANG Ở ĐẢO HOANG' : 'ĐẾN LƯỢT BẠN!'}</span>
          {player.jailed && <IslandActions player={player} disabled={rolling || pending} dispatch={dispatch} />}
          <RollButton onClick={onRoll} disabled={rolling || pending} label={pending ? 'Đang chờ…' : player.jailed ? 'Thử tung đôi' : 'Tung xúc xắc'} />
          {player.flight === 'ready' && !player.jailed && (
            <button
              className="flight-button"
              disabled={pending || rolling || player.cash < FLIGHT_FEE}
              onClick={onFlight}
            >
              <Plane size={18} /> DÙNG VÉ MÁY BAY · ₫{FLIGHT_FEE}
            </button>
          )}
        </>
      ) : game.phase === 'end' ? (
        null
      ) : game.phase === 'purchase' ? (
        <button className="play-button" onClick={onPurchase}>
          MUA BẤT ĐỘNG SẢN
          <ArrowRight size={19} />
        </button>
      ) : (
        <span className="game-center-status">
          {game.phase === 'card' ? <Gift size={17} /> : <Gavel size={17} />}
          {game.phase === 'festival' ? 'Chọn nơi tổ chức Lễ hội…' : 'Đang xử lý thẻ…'}
        </span>
      )}
    </div>
  );
}
