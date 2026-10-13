'use client';

import { useEffect, useState } from 'react';
import { Button, Modal, Typography } from '@foundly/ui';

export interface ApiErrorDialogProps {
  /** Dialog heading (e.g. "No se pudo cargar el catálogo"). */
  title: string;
  /** Localized error message; `null`/empty keeps the dialog closed. */
  message?: string | null;
}

/**
 * Clean modal alert for transient/state API failures (feature 012).
 *
 * Replaces raw inline error text with a dismissible dialog so a failed request
 * is never rendered as broken copy inside the view. Session errors do NOT reach
 * here: `apiRequestAdmin` routes them to the global session-expiry handler.
 */
export function ApiErrorDialog({ title, message }: ApiErrorDialogProps) {
  const [open, setOpen] = useState(Boolean(message));

  useEffect(() => {
    setOpen(Boolean(message));
  }, [message]);

  if (!message) return null;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={title}
      actions={
        <Button variant="primary" onClick={() => setOpen(false)}>
          Entendido
        </Button>
      }
    >
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Modal>
  );
}
