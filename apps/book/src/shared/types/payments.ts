/**
 * Domain types for advance payments (feature 017, extended by 022).
 * Pure TypeScript — no persistence technology is defined or implied here.
 */

/** Closed set of payment method kinds (mirrors the API `PaymentMethodType`). */
export type PaymentMethodType = 'pago_movil' | 'binance' | 'zelle' | 'transfer' | 'cash';

/** Display order and labels for the configured methods (feature 022). */
export const PAYMENT_METHOD_ORDER: PaymentMethodType[] = [
  'pago_movil',
  'binance',
  'zelle',
  'transfer',
  'cash',
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  pago_movil: 'Pago Móvil',
  binance: 'Binance Pay',
  zelle: 'Zelle',
  transfer: 'Transferencia',
  cash: 'Efectivo',
};

/** Structured receiving data persisted as a flexible JSON object (feature 022). */
export interface PaymentMethodDetails {
  /** Titular de la cuenta / beneficiario. */
  holder?: string;
  /** Cédula / RIF (Pago Móvil). */
  cedula?: string;
  /** Teléfono (Pago Móvil). */
  phone?: string;
  /** Banco (Pago Móvil / transferencia). */
  bank?: string;
  /** Binance Pay ID. */
  payId?: string;
  /** Email (Zelle). */
  email?: string;
  /** Cuenta / número de cuenta (transferencia). */
  account?: string;
}

/** Human labels for every structured detail field. */
export const PAYMENT_DETAIL_LABELS: Record<keyof PaymentMethodDetails, string> = {
  holder: 'Titular',
  cedula: 'Cédula / RIF',
  phone: 'Teléfono',
  bank: 'Banco',
  payId: 'Pay ID',
  email: 'Email',
  account: 'Cuenta',
};

/** Which structured fields apply to each method type. */
export const PAYMENT_TYPE_FIELDS: Record<PaymentMethodType, (keyof PaymentMethodDetails)[]> = {
  pago_movil: ['holder', 'cedula', 'phone', 'bank'],
  binance: ['payId', 'holder'],
  zelle: ['email', 'holder'],
  transfer: ['account', 'holder'],
  cash: ['holder'],
};

/** How a service advance is expressed. */
export type AdvanceKind = 'fixed' | 'percent';

export const ADVANCE_KIND_LABELS: Record<AdvanceKind, string> = {
  fixed: 'Importe fijo',
  percent: 'Porcentaje',
};

/** A way the business receives an advance (features 017/022). */
export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: PaymentMethodType;
  title: string | null;
  details: PaymentMethodDetails | null;
  instructions: string | null;
  active: boolean;
}

/** The advance a client submitted with a booking (feature 017). */
export interface AdvancePayment {
  methodType: PaymentMethodType;
  amountCents: number;
  reference: string;
  proofUrl: string;
  submittedAt: string;
}

export function isPaymentMethodType(value: string): value is PaymentMethodType {
  return (PAYMENT_METHOD_ORDER as string[]).includes(value);
}

export function isAdvanceKind(value: string): value is AdvanceKind {
  return value === 'fixed' || value === 'percent';
}

/** Parse the API `details` JSON string into the structured object (legacy text → `account`). */
export function parsePaymentDetails(raw: string | null | undefined): PaymentMethodDetails | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as PaymentMethodDetails;
    }
    return { account: text };
  } catch {
    // Backward-compatible: previous free-form receiving data.
    return { account: text };
  }
}

/** Serialize a structured object to the JSON string stored on `PaymentMethod.details`. */
export function serializePaymentDetails(
  details: PaymentMethodDetails | null | undefined,
): string | null {
  if (!details) return null;
  const entries = Object.entries(details).filter(([, value]) => value != null && String(value).trim());
  if (entries.length === 0) return null;
  return JSON.stringify(Object.fromEntries(entries));
}

/** One-line summary of the configured structured data (used in cards and the booking step). */
export function paymentDetailSummary(details: PaymentMethodDetails | null): string {
  if (!details) return '';
  return (Object.keys(PAYMENT_DETAIL_LABELS) as (keyof PaymentMethodDetails)[])
    .filter((key) => details[key])
    .map((key) => `${PAYMENT_DETAIL_LABELS[key]}: ${details[key]}`)
    .join(' · ');
}

/** Compute the expected advance (cents) from a service rule, or null when undefined. */
export function expectedAdvance(
  priceCents: number,
  kind: AdvanceKind | null,
  value: number | null,
): number | null {
  if (value == null || value < 1) {
    return null;
  }
  if (kind === 'fixed') {
    return value;
  }
  if (kind === 'percent') {
    const computed = Math.round((priceCents * value) / 100);
    return computed > 0 ? computed : null;
  }
  return null;
}
