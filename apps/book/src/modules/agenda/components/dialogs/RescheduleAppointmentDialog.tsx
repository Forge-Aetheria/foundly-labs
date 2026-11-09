import { Button, Modal, Stack, TextField, Typography } from '@foundly/ui';

export interface RescheduleAppointmentDialogProps {
  open: boolean;
  clientName: string;
  date: string;
  time: string;
  error: string | null;
  saving: boolean;
  onChange: (patch: { date?: string; time?: string }) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Reschedule modal: picks a new date/time for an appointment. */
export function RescheduleAppointmentDialog({
  open,
  clientName,
  date,
  time,
  error,
  saving,
  onChange,
  onConfirm,
  onCancel,
}: RescheduleAppointmentDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title="Reagendar cita">
      <Stack spacing={2}>
        <Typography variant="body2">Nueva fecha y hora para {clientName}.</Typography>
        <TextField
          label="Fecha"
          type="date"
          value={date}
          onChange={(value) => onChange({ date: value })}
        />
        <TextField
          label="Hora"
          type="time"
          value={time}
          onChange={(value) => onChange({ time: value })}
        />
        {error ? (
          <Typography variant="body2" color="error" role="alert">
            {error}
          </Typography>
        ) : null}
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirm} loading={saving}>
            Reagendar
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
