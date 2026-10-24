'use server';

import { apiRequestAdmin } from '../../shared/api/admin-request';
import {
  TenantsDocument,
  UpdateBusinessProfileDocument,
  type TenantsQuery,
} from '../../shared/api/generated';
import { mapTenant } from '../../shared/tenancy/queries';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import type { Tenant } from '../../shared/types/tenancy';
import { updateProfileSchema } from './utils/schemas';

/**
 * Profile module — server data access (feature 014; constitution §5.VI).
 * Codegen documents/types only. Reads/writes go through the session-aware
 * transport (`apiRequestAdmin`) so session expiry is handled globally.
 */

type ApiTenant = TenantsQuery['tenants'][number];

/** The authenticated owner's business profile (identity, contact, policies). */
export async function getProfile(tenantId: string): Promise<ActionResult<Tenant>> {
  const result = await apiRequestAdmin(TenantsDocument, {});
  if (!result.ok) return result;
  const tenant: ApiTenant | undefined = result.data.tenants.find((item) => item.id === tenantId);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');
  return ok(mapTenant(tenant));
}

/** Persist the owner's profile edits. */
export async function updateProfile(input: unknown): Promise<ActionResult<Tenant>> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Revisa los datos del perfil.', zodFields(parsed.error));
  }
  const data = parsed.data;

  const result = await apiRequestAdmin(UpdateBusinessProfileDocument, {
    input: {
      name: data.name,
      category: data.category,
      slug: data.slug,
      bio: data.bio ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      instagram: data.instagram ?? null,
      whatsapp: data.whatsapp ?? null,
      logo: data.logo ?? null,
      cover: data.cover ?? null,
      isPublic: data.isPublic,
      tags: data.tags,
      policies: data.policies.map((policy) => ({ title: policy.title, body: policy.body })),
    },
  });
  if (!result.ok) {
    if (result.error.code === 'CONFLICT') {
      return fail('CONFLICT', 'Esa URL pública ya está en uso.', {
        slug: 'Esa URL pública ya está en uso.',
      });
    }
    return result;
  }
  return ok(mapTenant(result.data.updateMyBusinessProfile));
}
