import { Button, Modal, Stack, TextField, Typography } from '@foundly/ui';

export interface RejectAppointmentDialogProps {
  open: boolean;
  clientName: string;
  reason: string;
  error: string | null;
  saving: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation modal for rejecting an appointment with a reason. */
export function RejectAppointmentDialog({
  open,
  clientName,
  reason,
  error,
  saving,
  onReasonChange,
  onConfirm,
  onCancel,
}: RejectAppointmentDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title="Rechazar cita">
      <Stack spacing={2}>
        <Typography variant="body2">
          ¿Rechazar la cita de {clientName}? El cliente recibirá una notificación.
        </Typography>
        <TextField label="Motivo" value={reason} onChange={onReasonChange} fullWidth />
        {error ? (
          <Typography variant="body2" color="error" role="alert">
            {error}
          </Typography>
        ) : null}
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={saving}>
            Rechazar
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
