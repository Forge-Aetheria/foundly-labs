import { redirect } from 'next/navigation';
import type { Tenant, TenantStatus } from '../types/tenancy';
import { requireTenant } from '../infra/auth';
import { getEffectiveSession } from '../infra/authServer';
import { fetchTenantBySlug, fetchTenantById, type TenantDto } from '../infra/remoteTenancy';
import { fail, ok, type ActionResult } from '../infra/result';
import { LOGIN_ROUTE, REGISTRATION_ROUTE } from '../infra/authConstants';
import type { Session } from '../infra/auth';

/** Map an API `TenantDto` → domain `Tenant` (feature 010 — T013). Known gaps */
/** not served by the API surface fall back to neutral values (data-model §5). */
export function mapTenantDto(dto: TenantDto): Tenant {
  const profile = dto.profile;
  const social =
    profile?.instagram || profile?.whatsapp
      ? {
          instagram: profile?.instagram ?? undefined,
          whatsapp: profile?.whatsapp ?? undefined,
        }
      : null;
  return {
    id: dto.id,
    name: dto.name,
    slug: profile?.slug ?? '',
    category: dto.category,
    status: mapTenantStatus(dto.status),
    ownerUserId: '',
    defaultAppointmentDurationMinutes: 30,
    businessHours: [],
    currency: dto.currency,
    timezone: dto.timezone,
    onlineBookingEnabled: true,
    license: null,
    avatar: profile?.logo ?? null,
    cover: profile?.cover ?? null,
    bio: profile?.bio ?? null,
    address: profile?.address ?? null,
    phone: profile?.phone ?? null,
    social,
    createdAt: '',
    updatedAt: '',
  };
}

function mapTenantStatus(status: string): TenantStatus {
  return status === 'active' || status === 'suspended' || status === 'draft' ? status : 'draft';
}

/**
 * Resolve a tenant by its public URL slug (portal, FR-017).
 * SERVER-ONLY via `tenant(slug)`; no store (feature 010 — T013).
 */
export async function getTenantBySlug(slug: string): Promise<ActionResult<Tenant | null>> {
  const result = await fetchTenantBySlug(slug);
  if (!result.ok) return result;
  return { ok: true, data: result.data ? mapTenantDto(result.data) : null };
}

/**
 * Resolve the tenant bound to the session (admin, FR-015).
 * SERVER-ONLY via the API; the session is the only scope (feature 010 — T013).
 */
export async function getCurrentTenant(session: Session | null): Promise<ActionResult<Tenant>> {
  if (!session?.tenantId) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de negocio.');
  }
  const result = await fetchTenantById(session.tenantId);
  if (!result.ok) return result;
  if (!result.data) {
    return fail('NOT_FOUND', 'Negocio no encontrado.');
  }
  return ok(mapTenantDto(result.data));
}

/**
 * Tenant id for admin pages, sourced from the session (never the URL).
 * Unauthenticated → `/login`; authenticated but unbound → onboarding (FR-016, 009-US2).
 * Live session only (feature 010).
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