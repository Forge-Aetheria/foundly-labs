import { PaymentMethodType } from '@/shared/api/generated';

export { PaymentMethodType };

export const PAYMENT_METHOD_ORDER: PaymentMethodType[] = [
  PaymentMethodType.PagoMovil,
  PaymentMethodType.Binance,
  PaymentMethodType.Zelle,
  PaymentMethodType.Transfer,
  PaymentMethodType.Cash,
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  [PaymentMethodType.PagoMovil]: 'Pago Móvil',
  [PaymentMethodType.Binance]: 'Binance Pay',
  [PaymentMethodType.Zelle]: 'Zelle',
  [PaymentMethodType.Transfer]: 'Transferencia',
  [PaymentMethodType.Cash]: 'Efectivo',
};

export type PaymentDetailKey =
  | 'holder'
  | 'cedula'
  | 'phone'
  | 'bank'
  | 'payId'
  | 'email'
  | 'account';

export type PaymentMethodDetails = Partial<Record<PaymentDetailKey, string>>;

export const PAYMENT_DETAIL_LABELS: Record<PaymentDetailKey, string> = {
  holder: 'Titular',
  cedula: 'Cédula / RIF',
  phone: 'Teléfono',
  bank: 'Banco',
  payId: 'Pay ID',
  email: 'Email',
  account: 'Cuenta',
};

export const PAYMENT_TYPE_FIELDS: Record<PaymentMethodType, PaymentDetailKey[]> = {
  [PaymentMethodType.PagoMovil]: ['holder', 'cedula', 'phone', 'bank'],
  [PaymentMethodType.Binance]: ['payId', 'holder'],
  [PaymentMethodType.Zelle]: ['email', 'holder'],
  [PaymentMethodType.Transfer]: ['account', 'holder'],
  [PaymentMethodType.Cash]: ['holder'],
};

export function parsePaymentDetails(raw: string | null | undefined): PaymentMethodDetails | null {
  if (!raw?.trim()) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as PaymentMethodDetails;
    }
    return { account: raw };
  } catch {
    return { account: raw };
  }
}

export function serializePaymentDetails(details: PaymentMethodDetails): string | null {
  const entries = Object.entries(details)
    .map(([key, value]) => [key, value?.trim()] as const)
    .filter(([, value]) => Boolean(value));
  return entries.length > 0 ? JSON.stringify(Object.fromEntries(entries)) : null;
}

export function paymentDetailSummary(details: PaymentMethodDetails | null): string {
  if (!details) return '';
  return (Object.keys(PAYMENT_DETAIL_LABELS) as PaymentDetailKey[])
    .filter((key) => details[key]?.trim())
    .map((key) => `${PAYMENT_DETAIL_LABELS[key]}: ${details[key]}`)
    .join(' · ');
}
