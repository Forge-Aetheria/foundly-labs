import type { Tenant, User } from '../../../shared/types/tenancy';
import { provisionDefaults } from '../../../shared/utils/provision';
import { getStore } from '../../../shared/infra/store';
import type { CreateBusinessInput } from './schemas';

export interface ProvisionIds {
  tenantId: string;
  userId: string;
}

/**
 * Mirror a provisioned business into the local seam (best-effort).
 * Keeps local-only surfaces (opening hours, availability, portal merge fields)
 * working while the canonical record lives in the backend. Feature 008 (FR-007).
 */
export function provisionLocalBusiness(input: CreateBusinessInput, ids: ProvisionIds): void {
  const { account, business, setup, draftId } = input;
  const now = new Date().toISOString();

  const user: User = {
    id: ids.userId,
    fullName: account.fullName,
    email: account.email.toLowerCase(),
    credential: account.password,
    role: 'owner',
    tenantId: ids.tenantId,
    status: 'active',
    createdAt: now,
  };
  const tenant: Tenant = {
    id: ids.tenantId,
    name: business.name,
    slug: business.slug,
    category: business.category,
    status: 'active',
    ownerUserId: user.id,
    defaultAppointmentDurationMinutes: setup.defaultAppointmentDurationMinutes,
    businessHours: setup.businessHours,
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
    createdAt: now,
    updatedAt: now,
  };
  user.tenantId = tenant.id;

  const defaults = provisionDefaults(tenant);
  const store = getStore();
  store.tenants.push(tenant);
  store.users.push(user);
  store.resources.push(defaults.resource);
  store.availabilityRules.push(...defaults.rules);
  store.services.push(defaults.service);
  store.onboardingProvisions.push({ draftId, tenantId: tenant.id, userId: user.id });
}