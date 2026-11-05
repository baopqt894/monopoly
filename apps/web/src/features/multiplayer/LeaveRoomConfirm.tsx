import { LogOut } from 'lucide-react';
import { InfoRoomDialog } from '../game/InfoRoomDialog';
import { ExitRoomArtwork } from '../game/RoomArtwork';
import './leave-room.css';

export function LeaveRoomConfirm({
  playing,
  pending,
  onCancel,
  onConfirm,
  endsGame = false,
}: {
  playing: boolean;
  endsGame?: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <InfoRoomDialog
      title="Thoát phòng?"
      icon={<LogOut size={18} />}
      onClose={pending ? undefined : onCancel}
      locked={pending}
      className="leave-room-confirm"
    >
      <div className="leave-room-symbol">
        <ExitRoomArtwork />
      </div>
      <p>
        {playing && endsGame
          ? 'Bạn rời bàn sẽ kết thúc ván và người chơi còn lại giành chiến thắng.'
          : playing
            ? 'Bot sẽ tiếp quản và chơi tiếp. Bạn không thể vào lại ván đang diễn ra.'
            : 'Bạn sẽ rời khỏi phòng này.'}
      </p>
      <div className="info-room-actions">
        <button className="info-room-secondary" disabled={pending} onClick={onCancel}>
          Ở lại
        </button>
        <button
          className="info-room-primary leave-room-accept"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? 'Đang thoát…' : 'Thoát phòng'}
        </button>
      </div>
    </InfoRoomDialog>
  );
}
