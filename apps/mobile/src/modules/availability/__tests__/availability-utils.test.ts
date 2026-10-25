import {
  buildTimeBlockInput,
  daysFromRules,
  formatBlockRange,
  isFullDayBlock,
  validateDays,
  validateTimeBlockDraft,
  type AvailabilityRule,
  type TimeBlock,
} from '../availability-utils';

const rule: AvailabilityRule = {
  id: 'a1',
  tenantId: 't1',
  specialistId: null,
  weekday: 1,
  startTime: '09:00',
  endTime: '18:00',
  slotGranularityMinutes: 30,
  minLeadTimeMinutes: 0,
  bookingHorizonDays: 60,
  breaks: null,
};

describe('availability utils', () => {
  it('maps rules into seven day drafts', () => {
    const days = daysFromRules([rule]);
    expect(days).toHaveLength(7);
    expect(days.find((day) => day.weekday === 1)).toMatchObject({
      isOpen: true,
      startTime: '09:00',
      endTime: '18:00',
    });
    expect(days.find((day) => day.weekday === 2)?.isOpen).toBe(false);
  });

  it('validates open day ranges', () => {
    expect(
      validateDays([{ weekday: 1, isOpen: true, startTime: '18:00', endTime: '09:00' }])['day-1'],
    ).toBeDefined();
    expect(
      validateDays([{ weekday: 1, isOpen: true, startTime: '09:00', endTime: '18:00' }]),
    ).toEqual({});
  });

  it('builds range and full-day time block inputs', () => {
    expect(
      buildTimeBlockInput({
        mode: 'range',
        date: '2026-10-25',
        startTime: '09:00',
        endTime: '13:00',
        reason: 'Cita',
      }),
    ).toEqual({
      startAt: '2026-10-25T09:00:00',
      endAt: '2026-10-25T13:00:00',
      reason: 'Cita',
    });
    expect(
      buildTimeBlockInput({
        mode: 'fullday',
        date: '2026-10-25',
        startTime: '09:00',
        endTime: '13:00',
        reason: ' ',
      }),
    ).toMatchObject({
      startAt: '2026-10-25T00:00:00',
      endAt: '2026-10-25T23:59:00',
      reason: null,
    });
  });

  it('validates block drafts and formats blocks', () => {
    expect(
      validateTimeBlockDraft({
        mode: 'range',
        date: '',
        startTime: '13:00',
        endTime: '09:00',
        reason: '',
      }),
    ).toMatchObject({ date: expect.any(String), time: expect.any(String) });

    const block: TimeBlock = {
      id: 'b1',
      tenantId: 't1',
      specialistId: null,
      startAt: '2026-10-25T09:00:00',
      endAt: '2026-10-25T13:00:00',
      reason: null,
    };
    expect(isFullDayBlock(block)).toBe(false);
    expect(formatBlockRange(block)).toContain('09:00–13:00');
  });
});
