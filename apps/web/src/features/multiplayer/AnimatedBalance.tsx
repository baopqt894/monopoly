import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '../../shared/format';
import './animated-balance.css';

/** Each displayed balance/change is supplied by the authoritative transaction presentation queue. */
export function AnimatedBalance({
  amount,
  change,
}: {
  amount: number;
  change?: { id: number; amount: number; reason: string };
}) {
  const [display, setDisplay] = useState(amount);
  const rendered = useRef(amount);
  useEffect(() => {
    if (amount === rendered.current) return;
    const from = rendered.current;
    let started: number | undefined,
      frame = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function tick(now: number) {
      started ??= now;
      const progress = reduced ? 1 : Math.min(1, (now - started) / 400);
      rendered.current = Math.round(from + (amount - from) * (1 - (1 - progress) ** 3));
      setDisplay(rendered.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [amount]);
  return (
    <>
      <span
        className="player-cash"
        aria-label={`Số dư ${formatMoney(amount)}`}
        title={formatMoney(amount)}
      >
        <span className="game-coin">₫</span>
        <span>{formatMoney(display).slice(1)}</span>
      </span>
      <span className="cash-changes" role="status" aria-live="polite" aria-atomic="true">
        {change && (
          <span
            key={change.id}
            title={change.reason}
            aria-label={`${change.reason}: ${change.amount > 0 ? '+' : '−'}${formatMoney(Math.abs(change.amount))}`}
            className={`cash-change ${change.amount > 0 ? 'is-credit' : 'is-debit'}`}
          >
            {change.amount > 0 ? '+' : '−'}
            {formatMoney(Math.abs(change.amount))}
          </span>
        )}
      </span>
    </>
  );
}
