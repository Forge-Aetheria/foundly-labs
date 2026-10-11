import { describe, expect, it } from 'vitest';
import { clientDetailsSchema } from '../utils/schemas';

describe('client details schema (contracts/booking-flow.contract.md)', () => {
  it('accepts valid details', () => {
    const result = clientDetailsSchema.safeParse({
      clientName: 'Luis',
      clientEmail: 'luis@mail.dev',
      clientPhone: '+34600123456',
      notes: 'Primera visita',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(
      clientDetailsSchema.safeParse({
        clientName: 'L',
        clientEmail: 'no-email',
        clientPhone: '+34600123456',
      }).success,
    ).toBe(false);
  });

  it('rejects a short or misformatted phone', () => {
    expect(
      clientDetailsSchema.safeParse({
        clientName: 'L',
        clientEmail: 'l@mail.dev',
        clientPhone: '123',
      }).success,
    ).toBe(false);
    expect(
      clientDetailsSchema.safeParse({
        clientName: 'L',
        clientEmail: 'l@mail.dev',
        clientPhone: 'abc',
      }).success,
    ).toBe(false);
  });

  it('requires a name', () => {
    expect(
      clientDetailsSchema.safeParse({
        clientName: '',
        clientEmail: 'l@mail.dev',
        clientPhone: '+34600123456',
      }).success,
    ).toBe(false);
  });
});
