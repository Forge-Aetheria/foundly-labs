export type AppointmentStatus =
  'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';

export const ACTIVE_STATUSES: readonly AppointmentStatus[] = ['pending', 'confirmed', 'checked-in'];

export interface AvailabilityRuleInput {
  weekday: number; // 0 (Sunday) – 6 (Saturday)
  startTime: string; // "HH:mm" business-local
  endTime: string; // "HH:mm" business-local
  slotGranularityMinutes: number;
  minLeadTimeMinutes: number;
  bookingHorizonDays: number;
}

export interface TimeBlockInput {
  startAt: Date;
  endAt: Date;
  kind: 'break' | 'block';
}

export interface AppointmentInput {
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
}

export interface AvailabilityRequest {
  resourceId: string;
  service: { durationMinutes: number; bufferMinutes: number };
  /** Business-local ISO dates, inclusive. */
  range: { startDate: string; endDate: string };
  timezone: string;
  rules: AvailabilityRuleInput[];
  blocks: TimeBlockInput[];
  appointments: AppointmentInput[];
  now: Date;
}

export interface Slot {
  startAt: Date;
  endAt: Date;
}

export type DayUnavailableReason = 'no-working-hours' | 'beyond-horizon' | 'past' | 'booked';

export interface DayAvailability {
  date: string;
  slots: Slot[];
  reason?: DayUnavailableReason;
}
