'use server';

import * as slugRules from '../../../shared/utils/slug';
import { fetchTenantBySlug } from '../../../shared/infra/remoteTenancy';
import { fail, zodFields, type ActionResult } from '../../../shared/infra/result';
import { createBusinessSchema } from './schemas';
import type { SlugReason } from '../../../shared/utils/slug';
import { provisionOnboardingRemote } from './server';

export type SlugAvailability = { available: true } | { available: false; reason: SlugReason };

/**
 * Server-side slug availability (feature 010 — no store).
 * Format + reserved rules are pure; uniqueness is checked against the backend
 * (`tenant(slug)`), so no in-memory list is ever consulted.
 */
export async function validateSlug(slug: string): Promise<SlugAvailability> {
  const local = slugRules.validateSlug(slug, []);
  if (!local.ok) return { available: false, reason: local.reason };

  const normalized = slugRules.normalizeSlug(slug);
  const remote = await fetchTenantBySlug(normalized);
  if (remote.ok && remote.data) return { available: false, reason: 'taken' };
  return { available: true };
}

export type CreateBusinessResult = { tenantId: string; redirectTo: string };

/**
 * Create a business for the owner (server-only).
 * Supabase sign-up → createTenant via the API → `tenant_id` binding. There is
 * NO local fallback: without live auth configured, provisioning fails visibly
 * (feature 010 — FR-006/FR-010).
 */
export async function createBusiness(
  input: unknown,
): Promise<ActionResult<CreateBusinessResult>> {
  const parsed = createBusinessSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos del formulario.', zodFields(parsed.error));
  }
  return provisionOnboardingRemote(parsed.data);
}