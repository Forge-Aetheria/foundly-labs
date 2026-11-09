import { Button, Chip, Modal, Stack, TextField, Typography } from '@foundly/ui';
import type { Resource, Service } from '../../../../shared/types/appointments';

export interface AppointmentCreateForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  specialistId: string;
  date: string;
  time: string;
}

export interface CreateAppointmentDialogProps {
  open: boolean;
  form: AppointmentCreateForm;
  services: Service[];
  resources: Resource[];
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onChange: (patch: Partial<AppointmentCreateForm>) => void;
  onSave: () => void;
}

/** Manual appointment creation modal (feature 011/017). */
export function CreateAppointmentDialog({
  open,
  form,
  services,
  resources,
  error,
  saving,
  onClose,
  onChange,
  onSave,
}: CreateAppointmentDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Nueva cita">
      <Stack spacing={2}>
        <TextField
          label="Cliente"
          value={form.clientName}
          onChange={(clientName) => onChange({ clientName })}
        />
        <TextField
          label="Email"
          type="email"
          value={form.clientEmail}
          onChange={(clientEmail) => onChange({ clientEmail })}
        />
        <TextField
          label="Teléfono"
          value={form.clientPhone}
          onChange={(clientPhone) => onChange({ clientPhone })}
        />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Servicio
        </Typography>
        {services.length > 0 ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {services.map((service) => (
              <Chip
                key={service.id}
                label={service.name}
                selectable
                selected={form.serviceId === service.id}
                onClick={() => onChange({ serviceId: service.id })}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            No hay servicios disponibles.
          </Typography>
        )}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Profesional
        </Typography>
        {resources.length > 0 ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {resources.map((resource) => (
              <Chip
                key={resource.id}
                label={resource.name}
                selectable
                selected={form.specialistId === resource.id}
                onClick={() => onChange({ specialistId: resource.id })}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            No hay profesionales disponibles.
          </Typography>
        )}
        <TextField
          label="Fecha"
          type="date"
          value={form.date}
          onChange={(date) => onChange({ date })}
        />
        <TextField
          label="Hora"
          type="time"
          value={form.time}
          onChange={(time) => onChange({ time })}
        />
        {error ? (
          <Typography variant="body2" color="error" role="alert">
            {error}
          </Typography>
        ) : null}
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSave} loading={saving}>
            Guardar
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
