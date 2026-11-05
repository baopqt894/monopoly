import type { ReactNode } from 'react';
import { ActionClockContext } from '../../shared/ActionClock';
import { PropertyDialog } from '../properties/PropertyDialog';
import './info-room-dialog.css';

export function InfoRoomDialog({
  title,
  icon,
  children,
  onClose,
  className,
  locked = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  className: string;
  locked?: boolean;
}) {
  return (
    <ActionClockContext.Provider value={null}>
      <PropertyDialog
        title={title}
        icon={icon}
        onClose={onClose}
        transaction={locked}
        variant={`info-room-dialog ${className}`}
      >
        {children}
      </PropertyDialog>
    </ActionClockContext.Provider>
  );
}
