import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { LogOut, X } from 'lucide-react';
import { RoomExitContext } from './room-exit-context';
import { ActionClock } from './ActionClock';
import './modal.css';

export function Modal({
  title,
  onClose,
  children,
  className = '',
  dismissOnBackdrop = true,
  showHeaderActions = true,
  headerIcon,
  showExitAction = true,
}: {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  dismissOnBackdrop?: boolean;
  showHeaderActions?: boolean;
  headerIcon?: ReactNode;
  showExitAction?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const onExit = useContext(RoomExitContext);
  useEffect(() => {
    const element = ref.current!;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissOnBackdrop) onClose?.();
      }}
      onClick={(event) => {
        if (dismissOnBackdrop && event.target === ref.current) onClose?.();
      }}
      aria-label={title}
    >
      <div className="modal-header">
        {headerIcon && (
          <span className="modal-title-icon" aria-hidden="true">
            {headerIcon}
          </span>
        )}
        <h2>{title}</h2>
        <ActionClock />
        {showHeaderActions && showExitAction && onExit && (
          <button
            className="icon-button"
            onClick={onExit}
            aria-label="Thoát phòng"
            title="Thoát phòng"
          >
            <LogOut size={18} />
          </button>
        )}
        {showHeaderActions && onClose && (
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}
