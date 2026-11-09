import { apiRequest } from '../../shared/api/client';
import { RegisterBusinessDocument, TenantBySlugDocument } from '../../shared/api/generated';
import { createBrowserSupabaseClient } from '../../shared/auth/supabase';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import * as slugRules from '../../shared/utils/slug';
import type { SlugReason } from '../../shared/utils/slug';
import { createBusinessSchema } from './utils/schemas';

/**
 * Onboarding module — client data access (feature 024).
 * The privileged account/tenant binding is performed by `apps/api`
 * (`registerBusiness`); the browser only signs in afterwards.
 */

export type SlugAvailability = { available: true } | { available: false; reason: SlugReason };
export type CreateBusinessResult = { tenantId: string; redirectTo: string };

/** Slug availability: format/reserved locally + uniqueness via the public API. */
export async function validateSlug(slug: string): Promise<SlugAvailability> {
  const local = slugRules.validateSlug(slug, []);
  if (!local.ok) return { available: false, reason: local.reason };

  const normalized = slugRules.normalizeSlug(slug);
  const remote = await apiRequest(TenantBySlugDocument, { slug: normalized });
  if (remote.ok && remote.data.tenant) return { available: false, reason: 'taken' };
  return { available: true };
}

/** Create account + business through the API, then sign in the new owner. */
export async function createBusiness(input: unknown): Promise<ActionResult<CreateBusinessResult>> {
  const parsed = createBusinessSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos del formulario.', zodFields(parsed.error));
  }
  const { account, business } = parsed.data;

  const created = await apiRequest(RegisterBusinessDocument, {
    input: {
      account: {
        fullName: account.fullName,
        email: account.email,
        password: account.password,
      },
      business: {
        name: business.name,
        category: business.category,
        slug: business.slug,
      },
    },
  });
  if (!created.ok) return created;

  const supabase = createBrowserSupabaseClient();
  if (!supabase) {
    return fail('STATE_ERROR', 'La autenticación no está disponible.');
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });
  if (error) {
    return fail(
      'STATE_ERROR',
      'El negocio se creó, pero no pudimos iniciar sesión. Inicia sesión manualmente.',
    );
  }

  return ok({ tenantId: created.data.registerBusiness.tenantId, redirectTo: '/admin/agenda' });
}
