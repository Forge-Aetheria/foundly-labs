import type { AppointmentStatus } from '../../../shared/types/appointments';

const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled', 'no-show'],
  confirmed: ['checked-in', 'cancelled', 'no-show'],
  'checked-in': ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  'no-show': [],
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function isTerminal(status: AppointmentStatus): boolean {
  return (TRANSITIONS[status] ?? []).length === 0;
}
