'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Stack, Typography } from '@foundly/ui';
import { PRIMARY_BUTTON_SX, SECONDARY_BUTTON_SX } from '../../../shared/utils/landingCanon';
import type { SlotDay } from '../actions';
import { useFetchOfferedSlots } from '../hooks';
import { formatTimeLabel } from '../../../shared/utils/format';

const WEEKDAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayKey(): string {
  return dateKey(new Date());
}

/** Sunday-based start of the grid that contains the first day of `month`. */
function gridStart(month: Date): Date {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  return new Date(first.getFullYear(), first.getMonth(), first.getDate() - first.getDay());
}

function gridDays(month: Date): string[] {
  const start = gridStart(month);
  return Array.from({ length: 42 }, (_, index) =>
    dateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)),
  );
}

const MONTH_LABEL = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

/** Step 2 — real month calendar; selecting a day reveals its slots below (FR-005). */
export function CalendarStep({
  tenantSlug,
  serviceId,
  resourceId,
  value,
  onSelect,
  onContinue,
  onBack,
}: {
  tenantSlug: string;
  serviceId: string;
  resourceId?: string;
  value: { startAt: string; endAt: string } | null;
  onSelect: (slot: { startAt: string; endAt: string }) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daysData, setDaysData] = useState<SlotDay[]>([]);
  const fetchSlots = useFetchOfferedSlots();

  useEffect(() => {
    setMounted(true);
  }, []);

  const days = useMemo(() => gridDays(cursor), [cursor]);
  const availability = useMemo(() => {
    const map = new Map<string, SlotDay['slots']>();
    for (const day of daysData) {
      map.set(day.date, day.slots);
    }
    return map;
  }, [daysData]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const start = days[0];
    const end = days[days.length - 1];
    if (!start || !end) return;
    void (async () => {
      const result = await fetchSlots({
        tenantSlug,
        serviceId,
        resourceId,
        startDate: start,
        endDate: end,
      });
      if (!cancelled) setDaysData(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, cursor, resourceId, serviceId, tenantSlug]);

  const today = todayKey();
  const slots = selectedDate ? (availability.get(selectedDate) ?? []) : [];
  const canGoBack = cursor.getFullYear() > new Date().getFullYear() ||
    (cursor.getFullYear() === new Date().getFullYear() && cursor.getMonth() > new Date().getMonth());

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Elige el día y la hora
      </Typography>

      <Card sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Button
              variant="secondary"
              sx={SECONDARY_BUTTON_SX}
              disabled={!canGoBack}
              aria-label="Mes anterior"
              onClick={() => {
                setSelectedDate(null);
                setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
              }}
            >
              ‹
            </Button>
            <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {MONTH_LABEL.format(cursor)}
            </Typography>
            <Button
              variant="secondary"
              sx={SECONDARY_BUTTON_SX}
              aria-label="Mes siguiente"
              onClick={() => {
                setSelectedDate(null);
                setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
              }}
            >
              ›
            </Button>
          </Stack>

          <Stack
            direction="row"
            role="row"
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}
            aria-hidden="true"
          >
            {WEEKDAY_HEADERS.map((label, index) => (
              <Typography key={`${label}-${index}`} variant="caption" color="text.secondary" align="center">
                {label}
              </Typography>
            ))}
          </Stack>

          <Stack
            role="grid"
            aria-label="Calendario de disponibilidad"
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}
          >
            {days.map((day) => {
              const hasSlots = (availability.get(day)?.length ?? 0) > 0;
              const isPast = day < today;
              const selectable = hasSlots && !isPast;
              const isSelected = day === selectedDate;
              return (
                <Button
                  key={day}
                  variant={isSelected ? 'primary' : 'secondary'}
                  sx={isSelected ? PRIMARY_BUTTON_SX : SECONDARY_BUTTON_SX}
                  disabled={!selectable}
                  aria-pressed={isSelected}
                  aria-label={`${day}${selectable ? ' con huecos disponibles' : ' sin disponibilidad'}`}
                  onClick={() => setSelectedDate(day)}
                >
                  {Number(day.slice(8, 10))}
                </Button>
              );
            })}
          </Stack>
        </Stack>
      </Card>

      {selectedDate ? (
        slots.length > 0 ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} aria-label="Franjas horarias">
            {slots.map((slot) => (
              <Button
                key={slot.startAt}
                variant={value?.startAt === slot.startAt ? 'primary' : 'secondary'}
                sx={value?.startAt === slot.startAt ? PRIMARY_BUTTON_SX : SECONDARY_BUTTON_SX}
                onClick={() => onSelect(slot)}
              >
                {formatTimeLabel(slot.startAt)}
              </Button>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sin huecos disponibles para este día.
          </Typography>
        )
      ) : (
        <Typography variant="body2" color="text.secondary">
          Selecciona un día para ver sus horarios.
        </Typography>
      )}

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="secondary" sx={SECONDARY_BUTTON_SX} onClick={onBack}>
          Atrás
        </Button>
        <Button variant="primary" sx={PRIMARY_BUTTON_SX} disabled={!value} onClick={onContinue}>
          Continuar
        </Button>
      </Stack>
    </Stack>
  );
}
