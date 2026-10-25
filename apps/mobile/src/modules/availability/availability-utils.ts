import type { AddTimeBlockInput } from '@/shared/api/generated';
import type { AvailabilityQuery, TimeBlocksQuery } from '@/shared/api/generated';

export type AvailabilityRule = AvailabilityQuery['availability'][number];
export type TimeBlock = TimeBlocksQuery['timeBlocks'][number];

export const WEEKDAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export interface DayDraft {
  weekday: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export function defaultDays(): DayDraft[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    isOpen: false,
    startTime: '09:00',
    endTime: '18:00',
  }));
}

export function daysFromRules(rules: AvailabilityRule[]): DayDraft[] {
  return defaultDays().map((day) => {
    const rule = rules.find((item) => item.weekday === day.weekday && item.specialistId === null);
    return rule
      ? {
          weekday: day.weekday,
          isOpen: true,
          startTime: rule.startTime,
          endTime: rule.endTime,
        }
      : day;
  });
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function validateDays(days: DayDraft[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const day of days) {
    if (!day.isOpen) continue;
    if (!isValidTime(day.startTime) || !isValidTime(day.endTime)) {
      errors[`day-${day.weekday}`] = 'Usa un horario válido HH:mm.';
      continue;
    }
    if (day.endTime <= day.startTime) {
      errors[`day-${day.weekday}`] = 'La hora de fin debe ser posterior a la de inicio.';
    }
  }
  return errors;
}

export type TimeBlockMode = 'range' | 'fullday';

export interface TimeBlockDraft {
  mode: TimeBlockMode;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export const EMPTY_TIME_BLOCK_DRAFT: TimeBlockDraft = {
  mode: 'range',
  date: '',
  startTime: '09:00',
  endTime: '13:00',
  reason: '',
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateTimeBlockDraft(draft: TimeBlockDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!DATE_PATTERN.test(draft.date)) {
    errors.date = 'Indica una fecha válida.';
  }
  if (draft.mode === 'range') {
    if (!isValidTime(draft.startTime) || !isValidTime(draft.endTime)) {
      errors.time = 'Usa un horario válido HH:mm.';
    } else if (draft.endTime <= draft.startTime) {
      errors.time = 'La hora de fin debe ser posterior a la de inicio.';
    }
  }
  return errors;
}

export function buildTimeBlockInput(draft: TimeBlockDraft): AddTimeBlockInput {
  const fullDay = draft.mode === 'fullday';
  return {
    startAt: `${draft.date}T${fullDay ? '00:00' : draft.startTime}:00`,
    endAt: `${draft.date}T${fullDay ? '23:59' : draft.endTime}:00`,
    reason: draft.reason.trim() || null,
  };
}

export function isFullDayBlock(block: TimeBlock): boolean {
  return block.startAt.slice(11, 16) === '00:00' && block.endAt.slice(11, 16) === '23:59';
}

export function formatBlockRange(block: TimeBlock): string {
  const date = block.startAt.slice(0, 10);
  if (isFullDayBlock(block)) return `${date} · Día completo`;
  return `${date} · ${block.startAt.slice(11, 16)}–${block.endAt.slice(11, 16)}`;
}
