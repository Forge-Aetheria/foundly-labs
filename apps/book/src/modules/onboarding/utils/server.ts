'use server';

import { createClient } from '@supabase/supabase-js';
import { liveAuthEnv, supabaseAdminEnv } from '../../../shared/infra/supabase/env';
import { createRemoteTenant } from '../../../shared/infra/remoteTenancy';
import { provisionLocalBusiness } from './provisionLocal';
import { fail, ok, type ActionResult } from '../../../shared/infra/result';
import type { CreateBusinessInput } from './schemas';
import type { CreateBusinessResult } from './actions';

/**
 * Remote onboarding provider (feature 008 — US2 binder, session-auth.contract.md):
 *   1. Supabase sign-up
 *   2. createTenant via the API (authoritative business record)
 *   3. bind `tenant_id` into the identity's `app_metadata` (merge, server-only)
 *   4. mirror into the local seam (best-effort, keeps local-only surfaces working)
 *
 * The client (WizardShell → createBusiness) only reaches this when live auth env is
 * configured; `SUPABASE_SERVICE_ROLE_KEY` never leaves the server.
 */
export async function provisionOnboardingRemote(
  input: CreateBusinessInput,
): Promise<ActionResult<CreateBusinessResult>> {
  const authEnv = liveAuthEnv();
  const adminEnv = supabaseAdminEnv();
  if (!authEnv || !adminEnv) {
    return fail('STATE_ERROR', 'La autenticación remota no está configurada.');
  }

  // 1) Sign-up (server-side anon client; project auth hooks/captcha apply).
  const auth = createClient(authEnv.url, authEnv.anonKey, { auth: { persistSession: false } });
  const { data: signUp, error: signUpError } = await auth.auth.signUp({
    email: input.account.email,
    password: input.account.password,
    options: { data: { full_name: input.account.fullName } },
  });
  if (signUpError || !signUp.user?.id) {
    const message = signUpError?.message ?? '';
    return message.toLowerCase().includes('already') || message.toLowerCase().includes('registered')
      ? fail('EMAIL_TAKEN', 'Ese email ya está registrado.', {
          email: 'El email ya está en uso.',
        })
      : fail('UNAUTHENTICATED', message || 'No se pudo crear la cuenta.');
  }
  const userId = signUp.user.id;

  // 2) Create the tenant (authoritative).
  const created = await createRemoteTenant({
    name: input.business.name,
    category: input.business.category,
    timezone: 'Europe/Madrid',
    profile: {
      slug: input.business.slug,
      bio: null,
      address: null,
      phone: null,
      instagram: null,
      whatsapp: null,
      logo: null,
      cover: null,
    },
  });
  if (!created.ok) return created;
  const tenantId = created.data.id;

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

  // 4) Local mirror (best-effort, FR-007).
  provisionLocalBusiness(input, { tenantId, userId });

  return ok({ tenantId, redirectTo: '/admin/agenda' });
}