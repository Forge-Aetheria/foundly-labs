import type { Tenant, User } from '../../../shared/types/tenancy';
import * as slugRules from '../../../shared/utils/slug';
import { provisionDefaults } from '../../../shared/utils/provision';
import { getStore } from '../../../shared/infra/store';
import { fail, ok, zodFields, type ActionResult } from '../../../shared/infra/result';
import { createBusinessSchema } from './schemas';
import type { SlugReason } from '../../../shared/utils/slug';

export type SlugAvailability = { available: true } | { available: false; reason: SlugReason };

/** Live slug check: format + reserved + uniqueness against the store (FR-008/FR-014). */
export function validateSlug(slug: string): SlugAvailability {
  const taken = getStore().tenants.map((tenant) => tenant.slug);
  const result = slugRules.validateSlug(slug, taken);
  return result.ok ? { available: true } : { available: false, reason: result.reason };
}

export type CreateBusinessResult = { tenantId: string; redirectTo: string };

/**
 * Create a tenant + owner and provision the initial configuration.
 * Idempotent per `draftId`: a retry returns the same tenant and never creates
 * a duplicate business (FR-011, FR-012, FR-014).
 */
export function createBusiness(input: unknown): ActionResult<CreateBusinessResult> {
  const parsed = createBusinessSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos del formulario.', zodFields(parsed.error));
  }
  const { draftId, account, business, setup } = parsed.data;
  const store = getStore();

  const existingProvision = store.onboardingProvisions.find((item) => item.draftId === draftId);
  if (existingProvision) {
    return ok({ tenantId: existingProvision.tenantId, redirectTo: '/admin/agenda' });
  }

  if (store.users.some((user) => user.email.toLowerCase() === account.email.toLowerCase())) {
    return fail('EMAIL_TAKEN', 'Ese email ya está registrado.', {
      email: 'El email ya está en uso.',
    });
  }

  const takenSlugs = store.tenants.map((tenant) => tenant.slug);
  const slugCheck = slugRules.validateSlug(business.slug, takenSlugs);
  if (!slugCheck.ok) {
    const message =
      slugCheck.reason === 'format'
        ? 'Formato de URL no válido.'
        : slugCheck.reason === 'reserved'
          ? 'Esa URL está reservada.'
          : 'Esa URL ya está en uso.';
    return fail('SLUG_TAKEN', message, { slug: message });
  }

  const now = new Date().toISOString();
  const user: User = {
    id: crypto.randomUUID(),
    fullName: account.fullName,
    email: account.email.toLowerCase(),
    credential: account.password,
    role: 'owner',
    tenantId: '',
    status: 'active',
    createdAt: now,
  };
  const tenant: Tenant = {
    id: crypto.randomUUID(),
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
  store.tenants.push(tenant);
  store.users.push(user);
  store.resources.push(defaults.resource);
  store.availabilityRules.push(...defaults.rules);
  store.services.push(defaults.service);
  store.onboardingProvisions.push({ draftId, tenantId: tenant.id, userId: user.id });

  return ok({ tenantId: tenant.id, redirectTo: '/admin/agenda' });
}
