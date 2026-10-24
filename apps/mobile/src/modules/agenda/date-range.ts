function partsFor(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return { year: value('year'), month: value('month'), day: value('day') };
}

export function getAgendaRange(date: Date, timeZone: string): { from: string; to: string } {
  const { year, month, day } = partsFor(date, timeZone);
  const isoDay = `${year}-${month}-${day}`;
  return {
    from: `${isoDay}T00:00:00.000Z`,
    to: `${isoDay}T23:59:59.999Z`,
  };
}

export function formatAppointmentTime(startAt: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(startAt));
}

export function formatAppointmentDate(startAt: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  }).format(new Date(startAt));
}
