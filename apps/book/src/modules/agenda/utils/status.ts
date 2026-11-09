import type { BadgeStatus } from '@foundly/ui';

export const STATUS_BADGE: Record<string, BadgeStatus> = {
  pending: 'warning',
  confirmed: 'positive',
  'checked-in': 'info',
  completed: 'info',
  cancelled: 'neutral',
  'no-show': 'neutral',
};

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  'checked-in': 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  'no-show': 'No asistió',
};

export function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}
