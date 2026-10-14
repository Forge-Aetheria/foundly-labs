import { describe, expect, it } from 'vitest';
import { formatDirectoryHours } from '../utils/hours';
import type { DirectoryHoursRange } from '../utils/types';

const range = (weekday: number, startTime = '09:00', endTime = '18:00'): DirectoryHoursRange => ({
  weekday,
  startTime,
  endTime,
});

describe('formatDirectoryHours (019)', () => {
  it('returns null for no availability', () => {
    expect(formatDirectoryHours([])).toBeNull();
  });

  it('groups contiguous weekdays with identical hours', () => {
    const ranges = [1, 2, 3, 4, 5].map((day) => range(day));
    expect(formatDirectoryHours(ranges)).toBe('Lun–Vie 09:00–18:00');
  });

  it('labels a single weekday', () => {
    expect(formatDirectoryHours([range(6, '10:00', '14:00')])).toBe('Sáb 10:00–14:00');
  });

  it('splits groups when hours differ and sorts by weekday', () => {
    const ranges = [range(5), range(1), range(3, '11:00', '20:00')];
    expect(formatDirectoryHours(ranges)).toBe('Lun 09:00–18:00 · Mié 11:00–20:00 · Vie 09:00–18:00');
  });

  it('tolerates duplicate weekdays', () => {
    expect(formatDirectoryHours([range(1), range(1)])).toBe('Lun 09:00–18:00');
  });
});
