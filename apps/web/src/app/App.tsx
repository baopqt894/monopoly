import { GameScreen } from '../features/multiplayer/GameScreen';
import { Lobby } from '../features/multiplayer/Lobby';
import { useRoom } from '../features/multiplayer/useRoom';

export function App() {
  const { room, identity, status, error, busy, send, clearError } = useRoom();
  return room?.game && identity ? (
    <GameScreen
      room={room}
      seatId={identity.seatId}
      status={status}
      pending={busy}
      error={error}
      send={send}
      clearError={clearError}
    />
  ) : (
    <Lobby
      room={room}
      seatId={identity?.seatId ?? null}
      status={status}
      error={error}
      busy={busy}
      send={send}
    />
  );
}
