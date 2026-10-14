import type { DirectoryHoursRange } from './types';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

function dayLabel(start: number, end: number): string {
  const from = WEEKDAY_LABELS[start] ?? '?';
  if (start === end) {
    return from;
  }
  return `${from}–${WEEKDAY_LABELS[end] ?? '?'}`;
}

/**
 * Compact, human-readable label for a business's general weekly hours.
 * Contiguous weekdays sharing the same range are grouped (e.g. `Lun–Vie 09:00–18:00`).
 * Returns `null` when there is no configured availability.
 */
export function formatDirectoryHours(ranges: DirectoryHoursRange[]): string | null {
  if (ranges.length === 0) {
    return null;
  }
  const byDay = [...new Map(ranges.map((range) => [range.weekday, range])).values()].sort(
    (a, b) => a.weekday - b.weekday,
  );
  const groups: { start: number; end: number; startTime: string; endTime: string }[] = [];
  for (const range of byDay) {
    const last = groups[groups.length - 1];
    if (
      last &&
      range.weekday === last.end + 1 &&
      range.startTime === last.startTime &&
      range.endTime === last.endTime
    ) {
      last.end = range.weekday;
      continue;
    }
    groups.push({
      start: range.weekday,
      end: range.weekday,
      startTime: range.startTime,
      endTime: range.endTime,
    });
  }
  return groups.map((group) => `${dayLabel(group.start, group.end)} ${group.startTime}–${group.endTime}`).join(' · ');
}
