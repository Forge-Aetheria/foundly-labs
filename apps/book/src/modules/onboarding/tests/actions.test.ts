import { beforeEach, describe, expect, it } from 'vitest';
import { getStore, resetStore } from '../../../shared/infra/store';
import { createBusiness, validateSlug } from '../utils/actions';
import type { BookingDraft } from '../../../shared/types/tenancy';

const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
  weekday === 0
    ? { weekday, isOpen: false, startTime: '', endTime: '' }
    : { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' },
);

const input = {
  draftId: 'draft-new-1',
  account: { fullName: 'Raúl Gómez', email: 'raul@nuevo.dev', password: 'secreto123' },
  business: { name: 'Estudio Nuevo', slug: 'estudio-nuevo', category: 'Estética' },
  setup: { defaultAppointmentDurationMinutes: 45, businessHours: hours },
};

describe('onboarding actions (contracts/onboarding.contract.md)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('rejects a registered email with EMAIL_TAKEN', () => {
    const result = createBusiness({
      ...input,
      draftId: 'd-email',
      account: { ...input.account, email: 'ana@foundly.dev' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects an existing slug with SLUG_TAKEN', () => {
    const result = createBusiness({
      ...input,
      draftId: 'd-slug',
      business: { ...input.business, slug: 'estudio-ana' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('SLUG_TAKEN');
  });

  it('provisions tenant + owner + defaults and is idempotent per draftId', () => {
    const first = createBusiness(input);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.data.redirectTo).toBe('/admin/agenda');

    const second = createBusiness(input);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.data.tenantId).toBe(first.data.tenantId);

    const tenants = getStore().tenants.filter((tenant) => tenant.slug === 'estudio-nuevo');
    expect(tenants).toHaveLength(1);
  });

  it('provisions a default resource, service and availability rules (SC-005)', () => {
    const result = createBusiness(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const tenant = getStore().tenants.find((item) => item.slug === 'estudio-nuevo');
    if (!tenant) throw new Error('tenant missing');

    expect(tenant.status).toBe('active');
    expect(tenant.defaultAppointmentDurationMinutes).toBe(45);
    expect(tenant.businessHours.filter((hours) => hours.isOpen)).toHaveLength(6);

    const resource = getStore().resources.find((item) => item.id === `res-${tenant.id}`);
    expect(resource).toBeDefined();

    const rules = getStore().availabilityRules.filter((rule) => rule.resourceId === resource?.id);
    expect(rules.length).toBe(6);

    const service = getStore().services.find((item) => item.id === `svc-${tenant.id}`);
    expect(service?.durationMinutes).toBe(45);

    const owner = getStore().users.find((user) => user.id === tenant.ownerUserId);
    expect(owner?.tenantId).toBe(tenant.id);
    expect(owner?.role).toBe('owner');
  });

  it('reports slug availability', () => {
    expect(validateSlug('estudio-nuevo')).toEqual({ available: true });
    expect(validateSlug('estudio-ana')).toEqual({ available: false, reason: 'taken' });
    expect(validateSlug('admin')).toEqual({ available: false, reason: 'reserved' });
    expect(validateSlug('Mi Negocio')).toEqual({ available: false, reason: 'format' });
  });

  it('rejects an invalid draft shape with VALIDATION_ERROR', () => {
    const result = createBusiness({
      ...input,
      setup: { ...input.setup, defaultAppointmentDurationMinutes: 0 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('keeps BookingDraft structurally compatible', () => {
    const draft: BookingDraft = {
      draftId: input.draftId,
      step: 3,
      account: input.account,
      business: input.business,
      setup: input.setup,
    };
    expect(draft.step).toBe(3);
  });
});
