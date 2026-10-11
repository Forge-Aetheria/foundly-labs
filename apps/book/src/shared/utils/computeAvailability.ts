import type {
  AvailabilityRequest,
  DayAvailability,
  DayUnavailableReason,
  Slot,
} from '../types/availability';
import { ACTIVE_STATUSES } from '../types/availability';

interface Interval {
  start: number;
  end: number;
}

const MINUTE_MS = 60_000;

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Deterministic weekday for a business-local ISO date, independent of the server timezone. */
function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function toEpochDay(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 86_400_000);
}

/**
 * Pure availability engine (contracts/availability.contract.md).
 * No framework, React, MUI or database imports.
 */
export function computeAvailability(request: AvailabilityRequest): DayAvailability[] {
  const { range, rules, blocks, appointments, now, timezone, service } = request;
  const durationMs = service.durationMinutes * MINUTE_MS;
  const bufferMs = service.bufferMinutes * MINUTE_MS;

  const occupied: Interval[] = [
    ...blocks.map((block) => ({ start: block.startAt.getTime(), end: block.endAt.getTime() })),
    ...appointments
      .filter((appointment) => ACTIVE_STATUSES.includes(appointment.status))
      .map((appointment) => ({
        start: appointment.startAt.getTime(),
        end: appointment.endAt.getTime() + bufferMs,
      })),
  ];

  const nowMs = now.getTime();
  const nowEpochDay = toEpochDay(now.toISOString().slice(0, 10));
  const startEpochDay = toEpochDay(range.startDate);
  const endEpochDay = toEpochDay(range.endDate);

  const days: DayAvailability[] = [];

  for (let epochDay = startEpochDay; epochDay <= endEpochDay; epochDay += 1) {
    const date = new Date(epochDay * 86_400_000).toISOString().slice(0, 10);
    const weekday = weekdayOf(date);
    const dayRules = rules.filter((rule) => rule.weekday === weekday);

    if (dayRules.length === 0) {
      days.push({ date, slots: [], reason: 'no-working-hours' });
      continue;
    }

    const daysFromNow = epochDay - nowEpochDay;
    const inHorizon = dayRules.some((rule) => daysFromNow <= rule.bookingHorizonDays);
    const slotsByStart = new Map<number, Slot>();

    if (inHorizon) {
      for (const rule of dayRules) {
        if (daysFromNow > rule.bookingHorizonDays) continue;
        const intervalStart = zonedTimeToUtc(`${date}T${rule.startTime}:00`, timezone);
        const intervalEnd = zonedTimeToUtc(`${date}T${rule.endTime}:00`, timezone);
        const step = rule.slotGranularityMinutes * MINUTE_MS;
        const minStart = nowMs + rule.minLeadTimeMinutes * MINUTE_MS;

        for (let start = intervalStart; start + durationMs <= intervalEnd; start += step) {
          const end = start + durationMs;
          if (start < minStart) continue;
          const candidate: Interval = { start, end };
          if (occupied.some((busy) => overlaps(candidate, busy))) continue;
          if (!slotsByStart.has(start)) {
            slotsByStart.set(start, { startAt: new Date(start), endAt: new Date(end) });
          }
        }
      }
    }

    const slots = [...slotsByStart.values()].sort(
      (a, b) => a.startAt.getTime() - b.startAt.getTime(),
    );

    if (slots.length > 0) {
      days.push({ date, slots });
    } else {
      let reason: DayUnavailableReason = 'booked';
      if (!inHorizon) reason = 'beyond-horizon';
      else if (zonedTimeToUtc(`${date}T23:59:59`, timezone) < nowMs) reason = 'past';
      days.push({ date, slots: [], reason });
    }
  }

  return days;
}

/**
 * Convert a business-local wall clock ("YYYY-MM-DDTHH:mm:ss") to a UTC epoch in ms.
 * Uses the IANA timezone offset at that wall time, honouring DST.
 */
function zonedTimeToUtc(local: string, timezone: string): number {
  const asUtc = Date.parse(`${local}Z`);
  if (Number.isNaN(asUtc)) {
    throw new Error(`Invalid local datetime: ${local}`);
  }
  const guess = new Date(asUtc);
  const offsetMs = timezoneOffsetMs(guess, timezone);
  return asUtc - offsetMs;
}

function timezoneOffsetMs(instant: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(instant);
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return asUtc - instant.getTime();
}
