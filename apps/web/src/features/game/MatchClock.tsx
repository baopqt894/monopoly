import { useEffect, useState, type Ref } from 'react';
import './match-clock.css';

export function MatchClock({
  deadlineAt,
  endedAt,
  elementRef,
}: {
  deadlineAt: number;
  endedAt?: number;
  elementRef?: Ref<HTMLDivElement>;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (endedAt !== undefined) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [deadlineAt, endedAt]);
  const seconds = Math.max(0, Math.ceil((deadlineAt - (endedAt ?? now)) / 1000));
  const minutes = Math.floor(seconds / 60);
  const time = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <div
      ref={elementRef}
      className={`match-clock ${seconds <= 60 ? 'is-urgent' : ''}`}
      role="timer"
      aria-label={`Thời gian ván còn lại ${minutes} phút ${seconds % 60} giây`}
    >
      <span className="match-clock-face" aria-hidden="true">
        {time}
      </span>
    </div>
  );
}
