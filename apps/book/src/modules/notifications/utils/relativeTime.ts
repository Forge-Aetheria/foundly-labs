const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Spanish relative date used in the notification inbox, e.g. "Ahora mismo",
 * "Hace 10 minutos", "Ayer a las 14:30". Pure and deterministic via `now`.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (diffMinutes < 1) {
    return 'Ahora mismo';
  }
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? 'Hace 1 minuto' : `Hace ${diffMinutes} minutos`;
  }

  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (dayDiff === 0) {
    const hours = Math.floor(diffMinutes / 60);
    return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
  }
  if (dayDiff === 1) {
    return `Ayer a las ${time}`;
  }
  if (dayDiff === 2) {
    return `Anteayer a las ${time}`;
  }

  return `${date.getDate()} ${MONTHS[date.getMonth()]} a las ${time}`;
}
