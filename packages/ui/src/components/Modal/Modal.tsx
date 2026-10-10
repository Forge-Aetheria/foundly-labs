import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import type { ReactNode } from 'react';
import { RADIUS } from '../../theme';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  disableBackdropClose?: boolean;
  disableEscapeClose?: boolean;
  /** Glassmorphism surface (translucent `surface.glass` + blur) over the app canvas. */
  glass?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  disableBackdropClose = false,
  disableEscapeClose = false,
  glass = false,
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' && disableBackdropClose) return;
        onClose();
      }}
      disableEscapeKeyDown={disableEscapeClose}
      slotProps={{
        paper: {
          sx: glass
            ? (theme) => ({
                borderRadius: `${RADIUS.overlay}px`,
                backgroundColor: theme.palette.surface.glass,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              })
            : { borderRadius: `${RADIUS.overlay}px` },
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      {actions ? <DialogActions>{actions}</DialogActions> : null}
    </Dialog>
  );
}