import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessHours, Tenant } from '../types/tenancy';
import type { Session } from '../infra/auth';
import { getStore, resetStore } from '../infra/store';
import { getCurrentTenant } from './queries';

const NOW = '2026-10-09T00:00:00.000Z';
const hours: BusinessHours[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
  weekday === 0
    ? { weekday, isOpen: false, startTime: '', endTime: '' }
    : { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' },
);

function makeTenant(id: string, slug: string): Tenant {
  return {
    id,
    name: `Negocio ${slug}`,
    slug,
    category: 'Salón',
    status: 'active',
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

describe('tenancy queries (SC-008, contracts/routes.contract.md)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('returns the session tenant', () => {
    const session: Session = { userId: 'u-owner-ana', role: 'admin', tenantId: 'ten-ana' };
    const result = getCurrentTenant(session);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBe('ten-ana');
  });

  it('scopes resolution to the bound tenant (cross-tenant isolation)', () => {
    const store = getStore();
    store.tenants.push(makeTenant('ten-b', 'b-shop'));

    const sessionA: Session = { userId: 'u-a', role: 'admin', tenantId: 'ten-ana' };
    const sessionB: Session = { userId: 'u-b', role: 'admin', tenantId: 'ten-b' };

    const a = getCurrentTenant(sessionA);
    const b = getCurrentTenant(sessionB);
    expect(a.ok && a.data.id).toBe('ten-ana');
    expect(b.ok && b.data.id).toBe('ten-b');
    expect(b.ok && b.data.slug).toBe('b-shop');
  });

  it('rejects sessions without a tenant', () => {
    const session: Session = { userId: 'u-x', role: 'admin' };
    const result = getCurrentTenant(session);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects null sessions', () => {
    const result = getCurrentTenant(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('UNAUTHENTICATED');
  });
});
