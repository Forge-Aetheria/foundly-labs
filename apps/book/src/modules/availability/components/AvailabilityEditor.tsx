'use client';

import { useState } from 'react';
import { AlertDialog, Badge, Button, Card, Chip, Stack, Switch, TextField, Typography } from '@foundly/ui';
import type { AvailabilityRule, TimeBlock } from '../../../shared/types/appointments';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useAddTimeBlock, useRemoveTimeBlock, useSaveAvailability } from '../hooks';

/** Sunday-first weekday labels (index = weekday). */
const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
/** Rendered Monday-first, while keeping `weekday` indices. */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface DayConfig {
  weekday: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

const EMPTY_DAY = (weekday: number): DayConfig => ({
  weekday,
  isOpen: false,
  startTime: '09:00',
  endTime: '18:00',
});

function initialDays(rules: AvailabilityRule[]): DayConfig[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const rule = rules.find((item) => item.weekday === weekday);
    return rule
      ? { weekday, isOpen: true, startTime: rule.startTime, endTime: rule.endTime }
      : EMPTY_DAY(weekday);
  });
}

type BlockMode = 'range' | 'fullday';

interface BlockDraft {
  mode: BlockMode;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

const EMPTY_BLOCK: BlockDraft = {
  mode: 'range',
  date: '',
  startTime: '09:00',
  endTime: '13:00',
  reason: '',
};

function formatBlock(block: TimeBlock): string {
  return `${block.startAt.slice(0, 10)} · ${block.startAt.slice(11, 16)}–${block.endAt.slice(11, 16)}`;
}

function isFullDay(block: TimeBlock): boolean {
  return block.startAt.slice(11, 16) === '00:00' && block.endAt.slice(11, 16) === '23:59';
}

export interface AvailabilityEditorProps {
  rules: AvailabilityRule[];
  blocks: TimeBlock[];
  /** Backend/load error surfaced to the user (FR-010). */
  error?: string | null;
}

/** Weekly schedule + concrete time blocks (features 015/022; Clean Light UI). */
export function AvailabilityEditor({ rules, blocks, error }: AvailabilityEditorProps) {
  const saveAvailability = useSaveAvailability();
  const addTimeBlock = useAddTimeBlock();
  const removeTimeBlock = useRemoveTimeBlock();

  const [days, setDays] = useState<DayConfig[]>(() => initialDays(rules));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [items, setItems] = useState<TimeBlock[]>(blocks);
  const [draft, setDraft] = useState<BlockDraft>(EMPTY_BLOCK);
  const [blockErrors, setBlockErrors] = useState<Record<string, string> | null>(null);
  const [blockNotice, setBlockNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeBlock | null>(null);

  function update(weekday: number, patch: Partial<DayConfig>) {
    setSaved(false);
    setDays((prev) => prev.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)));
  }

  function toggle(weekday: number, checked: boolean) {
    update(weekday, { isOpen: checked });
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

  async function addBlock() {
    setBlockErrors(null);
    setBlockNotice(null);
    const fullDay = draft.mode === 'fullday';
    const result = await addTimeBlock({
      date: draft.date,
      startTime: fullDay ? '00:00' : draft.startTime,
      endTime: fullDay ? '23:59' : draft.endTime,
      reason: draft.reason,
    });
    if (!result.ok) {
      if (result.error.fields) setBlockErrors(result.error.fields);
      else setBlockNotice(result.error.message);
      return;
    }
    setItems((prev) => [...prev, result.data]);
    setDraft(EMPTY_BLOCK);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const result = await removeTimeBlock({ id: deleteTarget.id });
    if (result.ok) {
      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    } else {
      setBlockNotice(result.error.message);
    }
    setDeleteTarget(null);
  }

  return (
    <Stack spacing={3}>
      <ApiErrorDialog title="No se pudo cargar la disponibilidad" message={error} />
      <ApiErrorDialog title="No se pudo completar la acción" message={blockNotice} />

      <Card
        header={
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack spacing={0.25}>
              <Typography variant="h5" component="h1">
                Horario y disponibilidad
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Horario semanal de atención y bloqueos puntuales.
              </Typography>
            </Stack>
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar horario semanal'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={1.5}>
          {WEEKDAY_ORDER.map((weekday) => {
            const day = days.find((item) => item.weekday === weekday) ?? EMPTY_DAY(weekday);
            return (
              <Stack
                key={weekday}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}
              >
                <Switch
                  checked={day.isOpen}
                  onChange={(checked) => toggle(weekday, checked)}
                  label={WEEKDAY_LABELS[weekday]}
                />
                {day.isOpen ? (
                  <>
                    <TextField
                      label="Inicio"
                      type="time"
                      value={day.startTime}
                      onChange={(value) => update(weekday, { startTime: value })}
                    />
                    <TextField
                      label="Fin"
                      type="time"
                      value={day.endTime}
                      onChange={(value) => update(weekday, { endTime: value })}
                    />
                  </>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Cerrado
                  </Typography>
                )}
              </Stack>
            );
          })}

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {items.length} bloqueo(s) configurados.
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

      <Card
        header={
          <Stack spacing={0.25}>
            <Typography variant="h6" component="h2">
              Bloqueos de disponibilidad
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bloquea un rango de horas o un día completo (festivos, pausas, tiempo personal).
            </Typography>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Tipo de bloqueo
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip
                label="Rango de horas"
                selectable
                selected={draft.mode === 'range'}
                onClick={() => setDraft((prev) => ({ ...prev, mode: 'range' }))}
              />
              <Chip
                label="Días completos"
                selectable
                selected={draft.mode === 'fullday'}
                onClick={() => setDraft((prev) => ({ ...prev, mode: 'fullday' }))}
              />
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              label="Fecha"
              type="date"
              value={draft.date}
              onChange={(value) => setDraft((prev) => ({ ...prev, date: value }))}
              error={Boolean(blockErrors?.date)}
              helperText={blockErrors?.date}
            />
            {draft.mode === 'range' ? (
              <>
                <TextField
                  label="Hora de inicio"
                  type="time"
                  value={draft.startTime}
                  onChange={(value) => setDraft((prev) => ({ ...prev, startTime: value }))}
                />
                <TextField
                  label="Hora de fin"
                  type="time"
                  value={draft.endTime}
                  onChange={(value) => setDraft((prev) => ({ ...prev, endTime: value }))}
                  error={Boolean(blockErrors?.endTime)}
                  helperText={blockErrors?.endTime}
                />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Se bloqueará todo el día.
              </Typography>
            )}
            <TextField
              label="Motivo (opcional)"
              value={draft.reason}
              onChange={(value) => setDraft((prev) => ({ ...prev, reason: value }))}
              error={Boolean(blockErrors?.reason)}
              helperText={blockErrors?.reason}
              maxLength={200}
            />
            <Button variant="primary" onClick={addBlock}>
              Bloquear
            </Button>
          </Stack>

          {items.length > 0 ? (
            <Stack spacing={1}>
              {items.map((block) => (
                <Stack
                  key={block.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatBlock(block)}
                    </Typography>
                    {isFullDay(block) ? (
                      <Badge pill status="neutral">
                        Día completo
                      </Badge>
                    ) : null}
                    {block.reason ? (
                      <Typography variant="caption" color="text.secondary">
                        {block.reason}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Button variant="destructive" onClick={() => setDeleteTarget(block)}>
                    Desbloquear
                  </Button>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hay bloqueos. Añade uno con la fecha y el rango horario.
            </Typography>
          )}
        </Stack>
      </Card>

      {deleteTarget ? (
        <AlertDialog
          open
          title="Desbloquear franja"
          description={`¿Quitar el bloqueo ${formatBlock(deleteTarget)}? La franja volverá a estar disponible.`}
          confirmLabel="Sí, desbloquear"
          cancelLabel="Cancelar"
          tone="destructive"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </Stack>
  );
}
