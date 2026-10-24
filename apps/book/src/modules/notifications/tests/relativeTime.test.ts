import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from '../utils/relativeTime';

// Build dates in local time so the assertions are timezone-independent.
const NOW = new Date(2026, 9, 24, 15, 0, 0);

function at(year: number, month: number, day: number, hour: number, minute: number): string {
  return formatRelativeTime(new Date(year, month, day, hour, minute).toISOString(), NOW);
}

describe('formatRelativeTime', () => {
  it('says "Ahora mismo" for the last minute', () => {
    expect(formatRelativeTime(new Date(2026, 9, 24, 14, 59, 30).toISOString(), NOW)).toBe(
      'Ahora mismo',
    );
  });

  it('formats minutes', () => {
    expect(at(2026, 9, 24, 14, 50)).toBe('Hace 10 minutos');
    expect(at(2026, 9, 24, 14, 59)).toBe('Hace 1 minuto');
  });

  it('formats hours on the same day', () => {
    expect(at(2026, 9, 24, 12, 0)).toBe('Hace 3 horas');
  });

  it('formats yesterday with the time', () => {
    expect(at(2026, 9, 23, 14, 30)).toBe('Ayer a las 14:30');
  });

  it('formats the day before yesterday', () => {
    expect(at(2026, 9, 22, 9, 5)).toBe('Anteayer a las 09:05');
  });

  it('formats older dates with an explicit day and month', () => {
    expect(at(2026, 9, 1, 8, 15)).toBe('1 octubre a las 08:15');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatRelativeTime('not-a-date', NOW)).toBe('');
  });
});
