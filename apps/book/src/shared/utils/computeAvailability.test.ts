import { describe, expect, it } from 'vitest';
import { computeAvailability } from './computeAvailability';
import type { AvailabilityRequest } from '../types/availability';

const DATE = '2026-06-03';
const WEEKDAY = new Date(`${DATE}T00:00:00Z`).getUTCDay();
const NOW = new Date('2026-06-02T00:00:00Z');

function baseRequest(overrides: Partial<AvailabilityRequest> = {}): AvailabilityRequest {
  return {
    resourceId: 'r1',
    service: { durationMinutes: 30, bufferMinutes: 0 },
    range: { startDate: DATE, endDate: DATE },
    timezone: 'UTC',
    rules: [
      {
        weekday: WEEKDAY,
        startTime: '09:00',
        endTime: '12:00',
        slotGranularityMinutes: 30,
        minLeadTimeMinutes: 0,
        bookingHorizonDays: 60,
      },
    ],
    blocks: [],
    appointments: [],
    now: NOW,
    ...overrides,
  };
}

function starts(result: ReturnType<typeof computeAvailability>): string[] {
  return (result[0]?.slots ?? []).map((slot) => slot.startAt.toISOString());
}

describe('computeAvailability (contracts/availability.contract.md)', () => {
  it('reports no-working-hours for a day without rules', () => {
    const otherDay = '2026-06-04';
    const result = computeAvailability(
      baseRequest({ range: { startDate: otherDay, endDate: otherDay } }),
    );
    expect(result[0]?.slots).toHaveLength(0);
    expect(result[0]?.reason).toBe('no-working-hours');
  });

  it('generates slots aligned to the granularity inside working hours', () => {
    const result = computeAvailability(baseRequest());
    expect(starts(result)).toEqual([
      '2026-06-03T09:00:00.000Z',
      '2026-06-03T09:30:00.000Z',
      '2026-06-03T10:00:00.000Z',
      '2026-06-03T10:30:00.000Z',
      '2026-06-03T11:00:00.000Z',
      '2026-06-03T11:30:00.000Z',
    ]);
  });

  it('excludes slots overlapping a break/block', () => {
    const result = computeAvailability(
      baseRequest({
        blocks: [
          {
            startAt: new Date('2026-06-03T10:00:00Z'),
            endAt: new Date('2026-06-03T10:30:00Z'),
            kind: 'break',
          },
        ],
      }),
    );
    const list = starts(result);
    expect(list).not.toContain('2026-06-03T10:00:00.000Z');
    expect(list).toContain('2026-06-03T09:30:00.000Z');
    expect(list).toContain('2026-06-03T10:30:00.000Z');
  });

  it('respects the service buffer around an existing appointment', () => {
    const result = computeAvailability(
      baseRequest({
        service: { durationMinutes: 30, bufferMinutes: 10 },
        appointments: [
          {
            startAt: new Date('2026-06-03T09:00:00Z'),
            endAt: new Date('2026-06-03T09:30:00Z'),
            status: 'confirmed',
          },
        ],
      }),
    );
    const list = starts(result);
    expect(list).not.toContain('2026-06-03T09:00:00.000Z');
    expect(list).not.toContain('2026-06-03T09:30:00.000Z');
    expect(list).toContain('2026-06-03T10:00:00.000Z');
  });

  it('never offers a slot overlapping an active appointment', () => {
    const appointment = {
      startAt: new Date('2026-06-03T10:00:00Z'),
      endAt: new Date('2026-06-03T10:30:00Z'),
      status: 'pending' as const,
    };
    const result = computeAvailability(baseRequest({ appointments: [appointment] }));
    for (const slot of result[0]?.slots ?? []) {
      const overlaps = slot.startAt < appointment.endAt && appointment.startAt < slot.endAt;
      expect(overlaps).toBe(false);
    }
  });

  it('honours the minimum lead time', () => {
    const result = computeAvailability(
      baseRequest({
        now: new Date('2026-06-03T09:00:00Z'),
        rules: [
          {
            weekday: WEEKDAY,
            startTime: '09:00',
            endTime: '12:00',
            slotGranularityMinutes: 30,
            minLeadTimeMinutes: 60,
            bookingHorizonDays: 60,
          },
        ],
      }),
    );
    expect(starts(result)[0]).toBe('2026-06-03T10:00:00.000Z');
  });

  it('reports beyond-horizon for days past the booking horizon', () => {
    const result = computeAvailability(
      baseRequest({
        rules: [
          {
            weekday: WEEKDAY,
            startTime: '09:00',
            endTime: '12:00',
            slotGranularityMinutes: 30,
            minLeadTimeMinutes: 0,
            bookingHorizonDays: 0,
          },
        ],
      }),
    );
    expect(result[0]?.slots).toHaveLength(0);
    expect(result[0]?.reason).toBe('beyond-horizon');
  });

  it('handles a DST transition day without throwing', () => {
    // Europe/Madrid spring-forward: 2026-03-29 (02:00 → 03:00).
    const weekday = new Date('2026-03-29T00:00:00Z').getUTCDay();
    const result = computeAvailability({
      resourceId: 'r1',
      service: { durationMinutes: 30, bufferMinutes: 0 },
      range: { startDate: '2026-03-29', endDate: '2026-03-29' },
      timezone: 'Europe/Madrid',
      rules: [
        {
          weekday,
          startTime: '09:00',
          endTime: '10:00',
          slotGranularityMinutes: 30,
          minLeadTimeMinutes: 0,
          bookingHorizonDays: 60,
        },
      ],
      blocks: [],
      appointments: [],
      now: new Date('2026-03-28T00:00:00Z'),
    });
    expect(result[0]?.slots.length).toBeGreaterThan(0);
  });
});
