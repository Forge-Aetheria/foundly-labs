import { AdvanceKind } from '@/shared/api/generated';
import type { Service } from '../services';
import {
  EMPTY_SERVICE_DRAFT,
  advanceLabel,
  buildServiceInput,
  draftFromService,
  formatPrice,
  validateServiceDraft,
} from '../service-form';

const service: Service = {
  id: 's1',
  name: 'Corte',
  description: 'Corte clásico',
  priceCents: 2500,
  durationMinutes: 30,
  category: 'Pelo',
  active: true,
  requiresAdvance: true,
  advanceKind: AdvanceKind.Fixed,
  advanceValue: 1000,
};

describe('service form helpers', () => {
  it('converts a service into an editable draft', () => {
    expect(draftFromService(service)).toMatchObject({
      name: 'Corte',
      duration: '30',
      price: '25',
      requiresAdvance: true,
      advanceKind: 'fixed',
      advanceValue: '10',
    });
  });

  it('builds a valid create input with cents conversion', () => {
    const input = buildServiceInput({
      ...EMPTY_SERVICE_DRAFT,
      name: ' Manicura ',
      duration: '45',
      price: '19.99',
      requiresAdvance: true,
      advanceKind: 'percent',
      advanceValue: '25',
    });

    expect(input).toMatchObject({
      name: 'Manicura',
      durationMinutes: 45,
      priceCents: 1999,
      requiresAdvance: true,
      advanceKind: 'percent',
      advanceValue: 25,
    });
  });

  it('validates required fields and advance limits', () => {
    expect(validateServiceDraft(EMPTY_SERVICE_DRAFT).name).toBeDefined();
    expect(
      validateServiceDraft({
        ...EMPTY_SERVICE_DRAFT,
        name: 'Corte',
        duration: '30',
        price: '20',
        requiresAdvance: true,
        advanceKind: 'percent',
        advanceValue: '150',
      }).advanceValue,
    ).toBeDefined();
  });

  it('formats price and advance labels', () => {
    expect(formatPrice(2500)).toContain('25');
    expect(advanceLabel(service)).toContain('10');
    expect(advanceLabel({ ...service, advanceValue: null })).toBe('Sin adelanto');
  });
});
