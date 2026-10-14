/**
 * Domain types for advance payments (feature 017).
 * Pure TypeScript — no persistence technology is defined or implied here.
 */

/** Closed set of payment method kinds (mirrors the API `PaymentMethodType`). */
export type PaymentMethodType = 'mobile_payment' | 'bank_transfer' | 'binance';

/** Display order and labels for the three configured methods. */
export const PAYMENT_METHOD_ORDER: PaymentMethodType[] = [
  'mobile_payment',
  'bank_transfer',
  'binance',
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  mobile_payment: 'Pago Móvil',
  bank_transfer: 'Transferencia bancaria',
  binance: 'Binance',
};

/** How a service advance is expressed. */
export type AdvanceKind = 'fixed' | 'percent';

export const ADVANCE_KIND_LABELS: Record<AdvanceKind, string> = {
  fixed: 'Importe fijo',
  percent: 'Porcentaje',
};

/** A way the business receives an advance (feature 017). */
export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: PaymentMethodType;
  label: string | null;
  /** Free-form receiving data. */
  details: string | null;
  /** Free-form instructions shown to the client. */
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
