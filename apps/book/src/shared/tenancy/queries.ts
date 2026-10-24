import { redirect } from 'next/navigation';
import { apiRequest } from '../api/client';
import { TenantBySlugDocument, TenantsDocument, type TenantsQuery } from '../api/generated';
import { requireTenant } from '../auth/auth';
import { getEffectiveSession } from '../auth/authServer';
import { LOGIN_ROUTE, REGISTRATION_ROUTE } from '../auth/authConstants';
import { fail, ok, type ActionResult } from '../types/result';
import type { Session } from '../auth/auth';
import type { PortalPolicy, Tenant, TenantStatus } from '../types/tenancy';

/**
 * Tenancy reads (feature 011; constitution §5.VI). Codegen documents/types only;
 * `shared/tenancy` is the cross-cutting owner of tenant resolution.
 */

type ApiTenant = TenantsQuery['tenants'][number];

function mapTenantStatus(status: string): TenantStatus {
  return status === 'active' || status === 'suspended' || status === 'draft' ? status : 'draft';
}

/** Map an API `TenantObject` → domain `Tenant`. Known-gap fields fall back. */
export function mapTenant(dto: ApiTenant): Tenant {
  const profile = dto.profile;
  const social =
    profile?.instagram || profile?.whatsapp
      ? {
          instagram: profile?.instagram ?? undefined,
          whatsapp: profile?.whatsapp ?? undefined,
        }
      : null;
  const policies: PortalPolicy[] = (profile?.policies ?? []).map((policy, index) => ({
    id: `policy-${index}`,
    tenantId: dto.id,
    title: policy.title,
    body: policy.body,
  }));
  return {
    id: dto.id,
    name: dto.name,
    slug: profile?.slug ?? '',
    category: dto.category,
    tags: dto.tags,
    status: mapTenantStatus(dto.status),
    ownerUserId: '',
    defaultAppointmentDurationMinutes: 30,
    businessHours: [],
    currency: dto.currency,
    timezone: dto.timezone,
    isPublic: dto.isPublic,
    license: null,
    avatar: profile?.logo ?? null,
    cover: profile?.cover ?? null,
    bio: profile?.bio ?? null,
    address: profile?.address ?? null,
    phone: profile?.phone ?? null,
    social,
    policies,
    createdAt: '',
    updatedAt: '',
  };
}

/** Resolve a tenant by its public URL slug. SERVER-ONLY via `tenant(slug)`. */
export async function getTenantBySlug(slug: string): Promise<ActionResult<Tenant | null>> {
  const result = await apiRequest(TenantBySlugDocument, { slug });
  if (!result.ok) return result;
  return ok(result.data.tenant ? mapTenant(result.data.tenant) : null);
}

/** Resolve the tenant bound to the session. SERVER-ONLY; the session is the scope. */
export async function getCurrentTenant(session: Session | null): Promise<ActionResult<Tenant>> {
  if (!session?.tenantId) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de negocio.');
  }
  const result = await apiRequest(TenantsDocument, {});
  if (!result.ok) return result;
  const tenant = result.data.tenants.find((item) => item.id === session.tenantId);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');
  return ok(mapTenant(tenant));
}

/**
 * Tenant id for admin pages, sourced from the session (never the URL).
 * Unauthenticated → `/login`; authenticated but unbound → onboarding.
 */
export async function getAdminTenantId(): Promise<string> {
  const auth = requireTenant(await getEffectiveSession());
  if (!auth.ok) {
    redirect(auth.error.code === 'FORBIDDEN' ? REGISTRATION_ROUTE : LOGIN_ROUTE);
  }
  if (!auth.data.tenantId) {
    redirect(REGISTRATION_ROUTE);
  }
  return auth.data.tenantId;
}
