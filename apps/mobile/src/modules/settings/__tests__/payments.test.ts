import {
  paymentDetailSummary,
  parsePaymentDetails,
  serializePaymentDetails,
} from '../payments';
import { TENANT_CATEGORIES, TENANT_CATEGORY_LABELS, tenantCategoryLabel } from '../categories';

describe('payment method helpers', () => {
  it('parses structured details and falls back to account text', () => {
    expect(parsePaymentDetails('{"holder":"Ana","phone":"555"}')).toEqual({
      holder: 'Ana',
      phone: '555',
    });
    expect(parsePaymentDetails('Banco Nacional 123')).toEqual({ account: 'Banco Nacional 123' });
    expect(parsePaymentDetails(null)).toBeNull();
  });

  it('serializes only non-empty details', () => {
    expect(serializePaymentDetails({ holder: ' Ana ', phone: ' ' })).toBe('{"holder":"Ana"}');
    expect(serializePaymentDetails({})).toBeNull();
  });

  it('builds a readable summary', () => {
    expect(paymentDetailSummary({ holder: 'Ana', bank: 'Banesco' })).toBe(
      'Titular: Ana · Banco: Banesco',
    );
  });
});

describe('tenant categories', () => {
  it('labels every category and falls back to the raw value', () => {
    for (const category of TENANT_CATEGORIES) {
      expect(tenantCategoryLabel(category)).toBe(TENANT_CATEGORY_LABELS[category]);
    }
    expect(tenantCategoryLabel('DESCONOCIDA')).toBe('DESCONOCIDA');
  });
});
