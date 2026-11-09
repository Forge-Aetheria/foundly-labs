import { describe, expect, it } from 'vitest';
import { manualPaymentSchema } from '../utils/schemas';

const valid = {
  gateway: 'PAGO_MOVIL' as const,
  referenceNumber: 'REF-1',
  bank: 'Banesco',
  amount: '29.99',
  currency: 'USD' as const,
  phone: '04120000',
};

describe('manualPaymentSchema', () => {
  it('accepts a valid manual payment', () => {
    expect(manualPaymentSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty reference, bank and phone', () => {
    const result = manualPaymentSchema.safeParse({
      ...valid,
      referenceNumber: ' ',
      bank: '',
      phone: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive amount and unsupported currency', () => {
    expect(manualPaymentSchema.safeParse({ ...valid, amount: '0' }).success).toBe(false);
    expect(manualPaymentSchema.safeParse({ ...valid, amount: 'abc' }).success).toBe(false);
    expect(manualPaymentSchema.safeParse({ ...valid, currency: 'EUR' }).success).toBe(false);
  });
});
