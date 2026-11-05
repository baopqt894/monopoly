import { useEffect, useRef, useState } from 'react';
import type { RoomChatMessage } from '@typhu/contracts/multiplayer';
import './avatar-chat-bubble.css';

/** Show only new messages from this seat, never replay old history on reconnect. */
export function AvatarChatBubble({
  messages,
  seatId,
}: {
  messages: RoomChatMessage[];
  seatId: string;
}) {
  const latest = messages.filter((message) => message.seatId === seatId).at(-1);
  const seen = useRef(latest?.id);
  const [bubble, setBubble] = useState<RoomChatMessage | null>(null);
  useEffect(() => {
    if (!latest || latest.id === seen.current) return;
    seen.current = latest.id;
    setBubble(latest);
    const timer = setTimeout(
      () => setBubble(null),
      Math.min(10000, Math.max(5000, latest.text.length * 55)),
    );
    return () => clearTimeout(timer);
  }, [latest?.id]);
  if (!bubble) return null;
  return (
    <span
      className="avatar-chat-bubble"
      role="status"
      aria-live="polite"
      aria-label={`${bubble.name}: ${bubble.text}`}
      title={bubble.text}
    >
      <span>{bubble.text}</span>
    </span>
  );
}
