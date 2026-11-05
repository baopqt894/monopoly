import type { ReactNode } from 'react';
import './board-selection-prompt.css';

export function BoardSelectionPrompt({
  title,
  label,
  prompt,
  children,
  actions,
  className = '',
}: {
  title: string;
  label: string;
  prompt: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`board-selection-prompt ${className}`} aria-label={label}>
      <div className="board-selection-card">
        <h2 className="board-selection-title">{title}</h2>
        <div className="board-selection-body">
          <p className="board-selection-message">{prompt}</p>
          {children}
        </div>
        {actions && <div className="board-selection-actions">{actions}</div>}
      </div>
    </section>
  );
}
