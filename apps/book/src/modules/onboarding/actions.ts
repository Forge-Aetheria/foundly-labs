'use server';

import { createClient } from '@supabase/supabase-js';
import { apiRequest } from '../../shared/api/client';
import { CreateTenantDocument, TenantBySlugDocument } from '../../shared/api/generated';
import { liveAuthEnv, supabaseAdminEnv } from '../../shared/auth/supabase/env';
import { fail, zodFields, type ActionResult } from '../../shared/types/result';
import * as slugRules from '../../shared/utils/slug';
import type { SlugReason } from '../../shared/utils/slug';
import { createBusinessSchema } from './utils/schemas';

/**
 * Onboarding module — server data access (feature 011; constitution §5.VI).
 * Codegen documents/types only; Supabase sign-up + tenant binding stay server-only.
 */

export type SlugAvailability = { available: true } | { available: false; reason: SlugReason };

export type CreateBusinessResult = { tenantId: string; redirectTo: string };

/** Server-side slug availability: format/reserved local + uniqueness via the API. */
export async function validateSlug(slug: string): Promise<SlugAvailability> {
  const local = slugRules.validateSlug(slug, []);
  if (!local.ok) return { available: false, reason: local.reason };

  const normalized = slugRules.normalizeSlug(slug);
  const remote = await apiRequest(TenantBySlugDocument, { slug: normalized });
  if (remote.ok && remote.data.tenant) return { available: false, reason: 'taken' };
  return { available: true };
}

/**
 * Create a business for the owner (server-only): Supabase sign-up →
 * createTenant via the API → `tenant_id` binding. No local fallback.
 */
export async function createBusiness(input: unknown): Promise<ActionResult<CreateBusinessResult>> {
  const parsed = createBusinessSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos del formulario.', zodFields(parsed.error));
  }

  const authEnv = liveAuthEnv();
  const adminEnv = supabaseAdminEnv();
  if (!authEnv || !adminEnv) {
    return fail('STATE_ERROR', 'La autenticación remota no está configurada.');
  }

  // 1) Sign-up (server-side anon client; project auth hooks/captcha apply).
  const auth = createClient(authEnv.url, authEnv.anonKey, { auth: { persistSession: false } });
  const { data: signUp, error: signUpError } = await auth.auth.signUp({
    email: parsed.data.account.email,
    password: parsed.data.account.password,
    options: { data: { full_name: parsed.data.account.fullName } },
  });
  if (signUpError || !signUp.user?.id) {
    const message = signUpError?.message ?? '';
    return message.toLowerCase().includes('already') || message.toLowerCase().includes('registered')
      ? fail('EMAIL_TAKEN', 'Ese email ya está registrado.', { email: 'El email ya está en uso.' })
      : fail('UNAUTHENTICATED', message || 'No se pudo crear la cuenta.');
  }
  const userId = signUp.user.id;

  // 2) Create the tenant (authoritative) through the API.
  const created = await apiRequest(CreateTenantDocument, {
    input: {
      name: parsed.data.business.name,
      category: parsed.data.business.category,
      timezone: 'Europe/Madrid',
      profile: { slug: parsed.data.business.slug },
    },
  });
  if (!created.ok) return created;
  const tenantId = created.data.createTenant.id;

  // 3) Bind tenant_id into app_metadata (merge — never clobber provider/roles).
  const admin = createClient(adminEnv.url, adminEnv.serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: user } = await admin.auth.admin.getUserById(userId);
  const existingMetadata = (user?.user?.app_metadata ?? {}) as Record<string, unknown>;
  const merged = { ...existingMetadata, tenant_id: tenantId };
  const { error: bindError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: merged,
  });
  if (bindError) {
    return fail('STATE_ERROR', 'No se pudo vincular el negocio a tu cuenta.');
  }

  return { ok: true, data: { tenantId, redirectTo: '/admin/agenda' } };
}