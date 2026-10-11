import { beforeEach, describe, expect, it } from 'vitest';
import { getStore, resetStore } from '../infra/store';
import { SLUG_PATTERN } from '../utils/slug';
import type { Tenant } from './tenancy';

describe('tenancy invariants (data-model §1–§6)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('seeds an active tenant whose invariants hold', () => {
    const store = getStore();
    const tenant = store.tenants.find((item) => item.id === 'ten-ana');
    expect(tenant).toBeDefined();
    if (!tenant) return;

    // "Tenant.slug MUST be unique, valid and not reserved; Tenant.ownerUserId MUST reference the owning user."
    expect(SLUG_PATTERN.test(tenant.slug)).toBe(true);
    expect(store.tenants.filter((item) => item.slug === tenant.slug)).toHaveLength(1);
    const owner = store.users.find((user) => user.id === tenant.ownerUserId);
    expect(owner).toBeDefined();
    expect(owner?.tenantId).toBe(tenant.id);

    // "User.email MUST be unique and well-formed."
    const emails = store.users.map((user) => user.email.toLowerCase());
    expect(new Set(emails).size).toBe(emails.length);
    expect(emails[0]).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);

    // "BusinessHours.endTime MUST be strictly after startTime when isOpen is true."
    for (const hours of tenant.businessHours) {
      if (hours.isOpen) {
        expect(hours.endTime > hours.startTime).toBe(true);
      }
    }

    // "defaultAppointmentDurationMinutes MUST be > 0."
    expect(tenant.defaultAppointmentDurationMinutes).toBeGreaterThan(0);
    // Portal only exposes active tenants (data-model §6).
    expect(tenant.status).toBe('active');
  });

  it('returns an empty tenancy state when seeding is disabled', () => {
    resetStore({ seed: false });
    const store = getStore();
    expect(store.tenants).toEqual([]);
    expect(store.users).toEqual([]);
    expect(store.onboardingProvisions).toEqual([]);
  });

  it('keeps the sample tenant compliant with TenantStatus', () => {
    const tenant: Tenant | undefined = getStore().tenants[0];
    expect(['draft', 'active', 'suspended']).toContain(tenant?.status);
  });
});
