import { createContext, useContext, useEffect, useState } from 'react';
import './action-clock.css';

export const ActionClockContext = createContext<{ expiresAt: number; startsAt?: number } | null>(null);

export function ActionClock() {
  const timing = useContext(ActionClockContext);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (!timing) return;
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [timing?.expiresAt]);
  if (!timing) return null;
  const duration = Math.max(1, timing.expiresAt - (timing.startsAt ?? timing.expiresAt - 15_000));
  const left = Math.max(0, Math.min(duration, timing.expiresAt - now));
  const seconds = Math.ceil(left / 1000);
  return <span className={`action-clock ${seconds <= 5 ? 'is-urgent' : ''}`} role="timer" aria-label={`${seconds} giây còn lại`}>
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle className="clock-track" cx="20" cy="20" r="17" />
      <circle className="clock-progress" cx="20" cy="20" r="17" pathLength="100" strokeDasharray={`${left / duration * 100} 100`} />
    </svg>
    <strong aria-hidden="true">{seconds}</strong>
  </span>;
}
