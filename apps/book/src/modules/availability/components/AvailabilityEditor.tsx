'use client';

import { useState, type ChangeEvent, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import { alpha, type Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { AlertDialog, Badge, Button, Card, Chip, Stack, Switch, Typography } from '@foundly/ui';
import type { AvailabilityRule, TimeBlock } from '../../../shared/types/appointments';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useAddTimeBlock, useRemoveTimeBlock, useSaveAvailability } from '../hooks';

/** Sunday-first weekday labels (index = weekday). */
const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
/** Rendered Monday-first, while keeping `weekday` indices. */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Compact, token-based input skin (feature 022): subtle border, rounded, primary focus ring. */
const INPUT_BASE_SX: SystemStyleObject<Theme> = {
  px: 1.25,
  py: 0.75,
  border: '1px solid',
  borderColor: 'border.subtle',
  borderRadius: '10px',
  backgroundColor: 'surface.cardLight',
  color: 'text.primary',
  fontSize: '0.875rem',
  lineHeight: 1.4,
  outline: 'none',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
  '&:hover': { borderColor: 'border.lavender' },
  '&:focus-visible': {
    borderColor: 'primary.main',
    boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
  },
};

/** Neutral card surface for the schedule rows / form / list items. */
const CARD_ROW_SX: SystemStyleObject<Theme> = {
  border: '1px solid',
  borderColor: 'border.subtle',
  borderRadius: '16px',
  backgroundColor: 'surface.cardLight',
};

/** Field with a clear, subtle label above the control (no label/placeholder overlap). */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

/** Compact input (text/time/date) with an accessible label and optional inline error. */
function CompactInput({
  type,
  label,
  value,
  onChange,
  error = false,
  errorMessage,
  fullWidth = false,
}: {
  type: 'text' | 'time' | 'date';
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  errorMessage?: string | null;
  fullWidth?: boolean;
}) {
  const width = type === 'time' ? 116 : type === 'date' ? 150 : 220;
  return (
    <Stack spacing={0.5} sx={fullWidth ? { width: '100%' } : undefined}>
      <Box
        component="input"
        type={type}
        aria-label={label}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        sx={[
          INPUT_BASE_SX,
          {
            width: fullWidth ? '100%' : width,
            fontVariantNumeric: type === 'time' ? 'tabular-nums' : 'normal',
            borderColor: error ? 'error.main' : 'border.subtle',
            '&:focus-visible': {
              borderColor: error ? 'error.main' : 'primary.main',
              boxShadow: (theme) =>
                `0 0 0 3px ${alpha(
                  error ? theme.palette.error.main : theme.palette.primary.main,
                  0.16,
                )}`,
            },
          },
        ]}
      />
      {error && errorMessage ? (
        <Typography variant="caption" color="error">
          {errorMessage}
        </Typography>
      ) : null}
    </Stack>
  );
}

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
            const label = WEEKDAY_LABELS[weekday];
            return (
              <Box key={weekday} sx={[CARD_ROW_SX, { p: 1.5, '&:hover': { borderColor: 'border.lavender' } }]}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Switch
                    checked={day.isOpen}
                    onChange={(checked) => toggle(weekday, checked)}
                    label={label}
                  />
                  {day.isOpen ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CompactInput
                        type="time"
                        label={`Hora de inicio · ${label}`}
                        value={day.startTime}
                        onChange={(value) => update(weekday, { startTime: value })}
                      />
                      <Typography variant="caption" color="text.secondary" aria-hidden>
                        –
                      </Typography>
                      <CompactInput
                        type="time"
                        label={`Hora de fin · ${label}`}
                        value={day.endTime}
                        onChange={(value) => update(weekday, { endTime: value })}
                      />
                    </Stack>
                  ) : (
                    <Badge pill status="neutral">
                      Cerrado
                    </Badge>
                  )}
                </Stack>
              </Box>
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
        <Stack spacing={2.5}>
          <Box sx={[CARD_ROW_SX, { p: { xs: 2, sm: 3 } }]}>
            <Stack spacing={2.5}>
              <Field label="Tipo de bloqueo">
                <Box
                  role="group"
                  aria-label="Tipo de bloqueo"
                  sx={{
                    display: 'inline-flex',
                    gap: 0.5,
                    p: 0.5,
                    border: '1px solid',
                    borderColor: 'border.subtle',
                    borderRadius: '9999px',
                    backgroundColor: 'surface.badgePill',
                    width: 'fit-content',
                  }}
                >
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
                </Box>
              </Field>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                <Field label="Fecha">
                  <CompactInput
                    type="date"
                    label="Fecha"
                    value={draft.date}
                    onChange={(value) => setDraft((prev) => ({ ...prev, date: value }))}
                    error={Boolean(blockErrors?.date)}
                    errorMessage={blockErrors?.date}
                  />
                </Field>
                {draft.mode === 'range' ? (
                  <>
                    <Field label="Hora de inicio">
                      <CompactInput
                        type="time"
                        label="Hora de inicio"
                        value={draft.startTime}
                        onChange={(value) => setDraft((prev) => ({ ...prev, startTime: value }))}
                      />
                    </Field>
                    <Field label="Hora de fin">
                      <CompactInput
                        type="time"
                        label="Hora de fin"
                        value={draft.endTime}
                        onChange={(value) => setDraft((prev) => ({ ...prev, endTime: value }))}
                        error={Boolean(blockErrors?.endTime)}
                        errorMessage={blockErrors?.endTime}
                      />
                    </Field>
                  </>
                ) : (
                  <Field label="Duración">
                    <Stack justifyContent="center" sx={{ height: 40 }}>
                      <Typography variant="body2" color="text.secondary">
                        Todo el día
                      </Typography>
                    </Stack>
                  </Field>
                )}
              </Stack>

              <Field label="Motivo (opcional)">
                <CompactInput
                  type="text"
                  label="Motivo (opcional)"
                  value={draft.reason}
                  onChange={(value) => setDraft((prev) => ({ ...prev, reason: value }))}
                  error={Boolean(blockErrors?.reason)}
                  errorMessage={blockErrors?.reason}
                  fullWidth
                />
              </Field>

              <Stack direction="row" justifyContent="flex-start">
                <Button variant="primary" onClick={addBlock}>
                  Bloquear
                </Button>
              </Stack>
            </Stack>
          </Box>

          {items.length > 0 ? (
            <Stack spacing={1.5}>
              {items.map((block) => (
                <Box key={block.id} sx={[CARD_ROW_SX, { p: 2 }]}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
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
                </Box>
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
