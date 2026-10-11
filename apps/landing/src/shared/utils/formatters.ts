const DEFAULT_LOCALE = 'es-ES';
const DEFAULT_CURRENCY = 'EUR';

export function formatCents(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatInteger(value: number, locale: string = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}
