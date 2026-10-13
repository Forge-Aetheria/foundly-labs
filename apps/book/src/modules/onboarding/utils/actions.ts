import * as slugRules from '../../../shared/utils/slug';
import { getStore } from '../../../shared/infra/store';
import { fail, ok, zodFields, type ActionResult } from '../../../shared/infra/result';
import { hasLiveAuth } from '../../../shared/infra/supabase/env';
import { createBusinessSchema, type CreateBusinessInput } from './schemas';
import type { SlugReason } from '../../../shared/utils/slug';
import { provisionLocalBusiness } from './provisionLocal';
import { provisionOnboardingRemote } from './server';

export type SlugAvailability = { available: true } | { available: false; reason: SlugReason };

/** Live slug check: format + reserved + uniqueness against the store (FR-008/FR-014). */
export function validateSlug(slug: string): SlugAvailability {
  const taken = getStore().tenants.map((tenant) => tenant.slug);
  const result = slugRules.validateSlug(slug, taken);
  return result.ok ? { available: true } : { available: false, reason: result.reason };
}

export type CreateBusinessResult = { tenantId: string; redirectTo: string };

/**
 * Create a business for the owner.
 * - With live Supabase/API configured: remote path (sign-up → createTenant →
 *   tenant_id binding → refresh) via the `provisionOnboardingRemote` server action.
 * - Otherwise: local seam (idempotent per draftId). Feature 008 (US2).
 */
export async function createBusiness(
  input: unknown,
): Promise<ActionResult<CreateBusinessResult>> {
  const parsed = createBusinessSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos del formulario.', zodFields(parsed.error));
  }
  if (hasLiveAuth()) {
    return provisionOnboardingRemote(parsed.data);
  }
  return createBusinessLocal(parsed.data);
}

/** Local seam provisioning — idempotent per `draftId` (FR-011, FR-012, FR-014). */
function createBusinessLocal(parsed: CreateBusinessInput): ActionResult<CreateBusinessResult> {
  const { draftId } = parsed;
  const store = getStore();

  const existingProvision = store.onboardingProvisions.find((item) => item.draftId === draftId);
  if (existingProvision) {
    return ok({ tenantId: existingProvision.tenantId, redirectTo: '/admin/agenda' });
  }

  if (store.users.some((user) => user.email.toLowerCase() === parsed.account.email.toLowerCase())) {
    return fail('EMAIL_TAKEN', 'Ese email ya está registrado.', {
      email: 'El email ya está en uso.',
    });
  }

  const takenSlugs = store.tenants.map((tenant) => tenant.slug);
  const slugCheck = slugRules.validateSlug(parsed.business.slug, takenSlugs);
  if (!slugCheck.ok) {
    const message =
      slugCheck.reason === 'format'
        ? 'Formato de URL no válido.'
        : slugCheck.reason === 'reserved'
          ? 'Esa URL está reservada.'
          : 'Esa URL ya está en uso.';
    return fail('SLUG_TAKEN', message, { slug: message });
  }

  const tenantId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  provisionLocalBusiness(parsed, { tenantId, userId });

  return ok({ tenantId, redirectTo: '/admin/agenda' });
}