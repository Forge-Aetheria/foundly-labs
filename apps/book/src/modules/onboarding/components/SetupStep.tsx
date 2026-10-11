'use client';

import { useState } from 'react';
import { Button, Chip, Stack, TextField, Typography } from '@foundly/ui';
import { setupSchema, type DayHours, type SetupFields } from '../utils/schemas';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DEFAULT_HOURS: DayHours[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
  weekday === 0
    ? { weekday, isOpen: false, startTime: '', endTime: '' }
    : { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' },
);

export interface SetupStepProps {
  initial: SetupFields | null;
  error?: string | null;
  submitting?: boolean;
  onSubmit: (setup: SetupFields) => void;
}

/** Step 3 — initial configuration: default duration + general hours (FR-010). */
export function SetupStep({ initial, error, submitting = false, onSubmit }: SetupStepProps) {
  const [values, setValues] = useState<SetupFields>(
    initial ?? { defaultAppointmentDurationMinutes: 30, businessHours: DEFAULT_HOURS },
  );
  const [errors, setErrors] = useState<{ duration?: string; hours?: Record<number, string> }>({});

  function setDuration(value: string) {
    const parsed = Number(value);
    setValues((prev) => ({
      ...prev,
      defaultAppointmentDurationMinutes: Number.isFinite(parsed) ? parsed : 0,
    }));
  }

  function toggleDay(weekday: number) {
    setValues((prev) => ({
      ...prev,
      businessHours: prev.businessHours.map((hours) =>
        hours.weekday === weekday ? { ...hours, isOpen: !hours.isOpen } : hours,
      ),
    }));
  }

  function setTime(weekday: number, field: 'startTime' | 'endTime', value: string) {
    setValues((prev) => ({
      ...prev,
      businessHours: prev.businessHours.map((hours) =>
        hours.weekday === weekday ? { ...hours, [field]: value } : hours,
      ),
    }));
  }

  function submit() {
    const parsed = setupSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: { duration?: string; hours?: Record<number, string> } = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path;
        if (path[0] === 'defaultAppointmentDurationMinutes') {
          fieldErrors.duration = issue.message;
        } else if (path[0] === 'businessHours' && typeof path[1] === 'number') {
          fieldErrors.hours ??= {};
          const weekday = values.businessHours[path[1]]?.weekday ?? -1;
          fieldErrors.hours[weekday] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    onSubmit(parsed.data);
  }

  return (
    <Stack spacing={2}>
      <TextField
        label="Duración por defecto (min)"
        name="duration"
        type="number"
        required
        fullWidth
        value={
          values.defaultAppointmentDurationMinutes > 0
            ? String(values.defaultAppointmentDurationMinutes)
            : ''
        }
        onChange={setDuration}
        error={Boolean(errors.duration)}
        helperText={errors.duration}
      />

      <Stack spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Horario de atención general
        </Typography>
        {values.businessHours.map((hours) => (
          <Stack key={hours.weekday} direction="row" alignItems="center" spacing={1}>
            <Chip
              label={WEEKDAYS[hours.weekday]}
              selectable
              selected={hours.isOpen}
              onClick={() => toggleDay(hours.weekday)}
            />
            {hours.isOpen ? (
              <>
                <TextField
                  label="Inicio"
                  type="time"
                  value={hours.startTime}
                  onChange={(value) => setTime(hours.weekday, 'startTime', value)}
                />
                <TextField
                  label="Fin"
                  type="time"
                  value={hours.endTime}
                  onChange={(value) => setTime(hours.weekday, 'endTime', value)}
                />
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Cerrado
              </Typography>
            )}
          </Stack>
        ))}
      </Stack>

      {error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="primary" disabled={submitting} onClick={submit}>
          {submitting ? 'Creando…' : 'Crear negocio'}
        </Button>
      </Stack>
    </Stack>
  );
}
