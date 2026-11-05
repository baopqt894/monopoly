import { useEffect, useRef, useState } from 'react';
import { MessagesSquare, Send, X } from 'lucide-react';
import type { ClientMessage, RoomSnapshot } from '@typhu/contracts/multiplayer';
import './room-chat.css';

export function RoomChat({
  room,
  seatId,
  connected,
  send,
}: {
  room: RoomSnapshot;
  seatId: string;
  connected: boolean;
  send: (message: ClientMessage) => void;
}) {
  const messages = room.chat ?? [];
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [seen, setSeen] = useState(messages.at(-1)?.id);
  const [cooldown, setCooldown] = useState(false);
  const list = useRef<HTMLDivElement>(null),
    field = useRef<HTMLInputElement>(null);
  const latest = messages.at(-1)?.id;
  const seenIndex = messages.findIndex((message) => message.id === seen);
  const unread = historyOpen
    ? 0
    : messages.slice(seenIndex + 1).filter((message) => message.seatId !== seatId).length;
  useEffect(() => {
    if (!historyOpen) return;
    setSeen(latest);
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [latest, historyOpen]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(false), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  return (
    <div className="room-chat">
      <form
        id="room-chat-composer"
        className="chat-composer"
        aria-label="Nhập tin nhắn"
        onSubmit={(event) => {
          event.preventDefault();
          const text = draft.trim();
          if (!text || !connected || cooldown) return;
          send({ type: 'CHAT', text });
          setDraft('');
          setCooldown(true);
        }}
      >
        <input
          ref={field}
          aria-label="Nội dung tin nhắn"
          placeholder="Nhắn với mọi người…"
          maxLength={240}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!connected}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              setHistoryOpen(false);
              field.current?.blur();
            }
          }}
        />
        <button
          type="submit"
          disabled={!connected || cooldown || !draft.trim()}
          aria-label="Gửi tin nhắn"
        >
          <Send size={18} />
        </button>
      </form>
      <button
        className="chat-toggle chat-history-toggle"
        onClick={() => {
          setHistoryOpen((value) => !value);
        }}
        aria-expanded={historyOpen}
        aria-controls="room-chat-history"
        aria-label="Lịch sử trò chuyện"
        title="Lịch sử trò chuyện"
      >
        <MessagesSquare size={20} />
        {unread > 0 && <b>{unread > 9 ? '9+' : unread}</b>}
      </button>
      {historyOpen && (
        <section id="room-chat-history" className="chat-panel" aria-label="Lịch sử trò chuyện">
          <header>
            <strong>Lịch sử trò chuyện</strong>
            <button onClick={() => setHistoryOpen(false)} aria-label="Đóng lịch sử trò chuyện">
              <X size={18} />
            </button>
          </header>
          <div ref={list} className="chat-messages" role="log" aria-live="off" tabIndex={0} aria-label="Tin nhắn trong phòng">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.seatId === seatId ? 'is-self' : ''}`}
              >
                <strong>{message.name}</strong>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
