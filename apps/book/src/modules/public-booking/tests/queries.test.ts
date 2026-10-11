import { beforeEach, describe, expect, it } from 'vitest';
import type { Appointment } from '../../../shared/types/appointments';
import type { BusinessHours, Tenant } from '../../../shared/types/tenancy';
import { getStore, resetStore } from '../../../shared/infra/store';
import { getOfferedSlots, getPublicBusiness } from '../utils/queries';

const NOW = '2026-10-09T00:00:00.000Z';
const hours: BusinessHours[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
  weekday === 0
    ? { weekday, isOpen: false, startTime: '', endTime: '' }
    : { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' },
);

function makeTenant(id: string, slug: string, status: Tenant['status']): Tenant {
  return {
    id,
    name: `Negocio ${slug}`,
    slug,
    category: 'Salón',
    status,
    ownerUserId: `u-${id}`,
    defaultAppointmentDurationMinutes: 30,
    businessHours: hours,
    currency: 'EUR',
    timezone: 'Europe/Madrid',
    onlineBookingEnabled: true,
    license: null,
    avatar: null,
    cover: null,
    bio: null,
    address: null,
    phone: null,
    social: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe('public-booking queries (contracts/portal-profile.contract.md)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('resolves an active tenant with its full profile (FR-016)', () => {
    const result = getPublicBusiness('estudio-ana');
    expect(result.status).toBe('available');
    if (result.status === 'available') {
      expect(result.business.name).toBe('Estudio Ana');
      expect(result.business.category).toBe('Peluquería');
      expect(result.business.bio).toContain('Madrid');
      expect(result.business.address).toBe('Calle Mayor 7, 28013 Madrid');
      expect(result.business.phone).toBe('+34 612 345 678');
      expect(result.business.social?.instagram).toBe('https://instagram.com/estudioana');
      expect(result.business.social?.whatsapp).toMatch(/wa\.me/);
      // services carry the current rate
      expect(result.business.services).toHaveLength(1);
      expect(result.business.services[0]?.id).toBe('svc-corte');
      expect(result.business.services[0]?.priceCents).toBe(2000);
      // specialists are the tenant's active resources
      expect(result.business.specialists.map((specialist) => specialist.id)).toEqual([
        'res-ana',
        'res-luis',
      ]);
      expect(result.business.weeklyHours).toHaveLength(7);
      expect(result.business.policies).toHaveLength(2);
    }
  });

  it('exposes no data for unknown, draft or suspended tenants', () => {
    getStore().tenants.push(makeTenant('t-draft', 'draft-shop', 'draft'));
    getStore().tenants.push(makeTenant('t-susp', 'suspended-shop', 'suspended'));

    expect(getPublicBusiness('no-existe').status).toBe('unavailable');
    expect(getPublicBusiness('draft-shop').status).toBe('unavailable');
    expect(getPublicBusiness('suspended-shop').status).toBe('unavailable');
  });

  it('offers slots that respect business hours (deterministic now)', () => {
    const tenant = getStore().tenants.find((item) => item.slug === 'estudio-ana');
    const service = getStore().services[0];
    if (!tenant || !service) throw new Error('seed missing');

    const now = new Date('2026-10-09T07:00:00Z');
    const days = getOfferedSlots(
      tenant,
      service.id,
      { startDate: '2026-10-09', endDate: '2026-10-11' },
      now,
    );

    const friday = days.find((day) => day.date === '2026-10-09');
    expect(friday?.slots.length).toBeGreaterThan(0);
    const saturday = days.find((day) => day.date === '2026-10-10');
    expect(saturday?.reason).toBe('no-working-hours');
  });

  it('excludes an occupied slot (respects existing appointments)', () => {
    const tenant = getStore().tenants.find((item) => item.slug === 'estudio-ana');
    const service = getStore().services[0];
    const resource = getStore().resources.find((item) => item.tenantId === tenant?.id);
    if (!tenant || !service || !resource) throw new Error('seed missing');

    const now = new Date('2026-10-09T07:00:00Z');
    const range = { startDate: '2026-10-09', endDate: '2026-10-09' };
    const before = getOfferedSlots(tenant, service.id, range, now);
    const takenStart = before[0]?.slots[0]?.startAt;
    if (!takenStart) throw new Error('no slots offered');

    const appointment: Appointment = {
      id: crypto.randomUUID(),
      resourceId: resource.id,
      serviceId: service.id,
      clientName: 'Ocupado',
      clientContact: null,
      startAt: takenStart.toISOString(),
      endAt: new Date(takenStart.getTime() + 30 * 60_000).toISOString(),
      status: 'confirmed',
      notes: null,
      appliedDurationMinutes: 30,
      appliedAmountCents: 0,
      appliedCurrency: 'EUR',
      origin: 'online',
      cancellationReason: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    getStore().appointments.push(appointment);

    const after = getOfferedSlots(tenant, service.id, range, now);
    expect(after[0]?.slots.some((slot) => slot.startAt.getTime() === takenStart.getTime())).toBe(
      false,
    );
  });

  it('scopes offered slots to a specialist via resourceId (research R5)', () => {
    const tenant = getStore().tenants.find((item) => item.slug === 'estudio-ana');
    const service = getStore().services[0];
    if (!tenant || !service) throw new Error('seed missing');

    // Luis only works Friday 10:00–12:00 (Europe/Madrid).
    getStore().availabilityRules.push({
      id: 'rule-luis-fri',
      resourceId: 'res-luis',
      weekday: 5,
      startTime: '10:00',
      endTime: '12:00',
      slotGranularityMinutes: 30,
      minLeadTimeMinutes: 0,
      bookingHorizonDays: 60,
    });

    const now = new Date('2026-10-09T07:00:00Z');
    const range = { startDate: '2026-10-09', endDate: '2026-10-09' };

    const ana = getOfferedSlots(tenant, service.id, range, now, 'res-ana');
    const luis = getOfferedSlots(tenant, service.id, range, now, 'res-luis');

    // 09:00 Europe/Madrid = 07:00Z ; 10:00 Europe/Madrid = 08:00Z.
    const anaFirst = ana[0]?.slots[0]?.startAt.getTime();
    const luisFirst = luis[0]?.slots[0]?.startAt.getTime();
    expect(anaFirst).toBe(new Date('2026-10-09T07:00:00Z').getTime());
    expect(luisFirst).toBe(new Date('2026-10-09T08:00:00Z').getTime());
    expect(anaFirst).not.toBe(luisFirst);
  });
});
