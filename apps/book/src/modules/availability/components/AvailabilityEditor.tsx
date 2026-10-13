'use client';

import { useState } from 'react';
import { Badge, Button, Card, Chip, Stack, TextField, Typography } from '@foundly/ui';
import type { AvailabilityRule, TimeBlock } from '../../../shared/types/appointments';
import { useSaveAvailability } from '../hooks';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface DayConfig {
  weekday: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

const EMPTY_DAY = (weekday: number): DayConfig => ({
  weekday,
  isOpen: false,
  startTime: '09:00',
  endTime: '18:00',
  breakStart: '',
  breakEnd: '',
});

function initialDays(rules: AvailabilityRule[]): DayConfig[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const rule = rules.find((item) => item.weekday === weekday);
    return rule
      ? {
          weekday,
          isOpen: true,
          startTime: rule.startTime,
          endTime: rule.endTime,
          breakStart: '',
          breakEnd: '',
        }
      : EMPTY_DAY(weekday);
  });
}

export interface AvailabilityEditorProps {
  rules: AvailabilityRule[];
  blocks: TimeBlock[];
  /** Backend/load error surfaced to the user (FR-010). */
  error?: string | null;
}

/** Weekly availability editor: day toggles, time ranges and breaks (Clean Light UI). */
export function AvailabilityEditor({ rules, blocks, error }: AvailabilityEditorProps) {
  const saveAvailability = useSaveAvailability();
  const [days, setDays] = useState<DayConfig[]>(() => initialDays(rules));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function update(weekday: number, patch: Partial<DayConfig>) {
    setSaved(false);
    setDays((prev) => prev.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)));
  }

  function toggle(weekday: number) {
    const day = days.find((item) => item.weekday === weekday);
    update(weekday, { isOpen: !(day?.isOpen ?? false) });
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    const result = await saveAvailability({
      days: days.map((day) => ({
        weekday: day.weekday,
        isOpen: day.isOpen,
        startTime: day.startTime,
        endTime: day.endTime,
      })),
    });
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <Card
      header={
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.25}>
            <Typography variant="h5" component="h1">
              Disponibilidad
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Horario semanal, rangos y pausas por día.
            </Typography>
          </Stack>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar disponibilidad'}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1.5}>
        <ApiErrorDialog title="No se pudo cargar la disponibilidad" message={error} />
        {days.map((day) => (
          <Stack
            key={day.weekday}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems="center"
            sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}
          >
            <Chip
              label={WEEKDAYS[day.weekday]}
              selectable
              selected={day.isOpen}
              onClick={() => toggle(day.weekday)}
            />
            {day.isOpen ? (
              <>
                <TextField
                  label="Inicio"
                  type="time"
                  value={day.startTime}
                  onChange={(value) => update(day.weekday, { startTime: value })}
                />
                <TextField
                  label="Fin"
                  type="time"
                  value={day.endTime}
                  onChange={(value) => update(day.weekday, { endTime: value })}
                />
                <TextField
                  label="Pausa inicio"
                  type="time"
                  value={day.breakStart}
                  onChange={(value) => update(day.weekday, { breakStart: value })}
                />
                <TextField
                  label="Pausa fin"
                  type="time"
                  value={day.breakEnd}
                  onChange={(value) => update(day.weekday, { breakEnd: value })}
                />
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Cerrado
              </Typography>
            )}
          </Stack>
        ))}

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {blocks.length} bloqueo(s) de horario configurados.
          </Typography>
          {saveError ? (
            <Badge pill status="negative">
              {saveError}
            </Badge>
          ) : saved ? (
            <Badge pill status="positive">
              Guardado
            </Badge>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}