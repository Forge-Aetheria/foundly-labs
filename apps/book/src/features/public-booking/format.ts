/** Format an integer minor-unit amount as an es-ES currency string. */
export function formatPrice(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amountCents / 100);
}

/** Extract an `HH:mm` label from an ISO-8601 instant (UTC slice). */
export function formatTimeLabel(iso: string): string {
  return iso.slice(11, 16);
}

const WEEKDAYS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const;

/** Minimalist day-pill label for a `yyyy-mm-dd` key (e.g. "lun 12"). */
export function formatDayKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const weekday = WEEKDAYS_ES[new Date(year ?? 0, (month ?? 1) - 1, day ?? 1).getDay()] ?? '';
  return `${weekday} ${String(day ?? 0).padStart(2, '0')}`;
}