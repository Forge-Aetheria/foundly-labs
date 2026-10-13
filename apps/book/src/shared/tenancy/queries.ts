import { redirect } from 'next/navigation';
import type { Tenant } from '../types/tenancy';
import { requireTenant } from '../infra/auth';
import { getEffectiveSession } from '../infra/authServer';
import { getStore } from '../infra/store';
import { fail, ok, type ActionResult } from '../infra/result';
import { LOGIN_ROUTE, REGISTRATION_ROUTE } from '../infra/authConstants';
import type { Session } from '../infra/auth';

/** Resolve a tenant by its public URL slug (portal, FR-017). */
export function getTenantBySlug(slug: string): Tenant | undefined {
  return getStore().tenants.find((tenant) => tenant.slug === slug);
}

/** Resolve the tenant bound to the session (admin, FR-015). */
export function getCurrentTenant(session: Session | null): ActionResult<Tenant> {
  if (!session?.tenantId) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de negocio.');
  }
  const tenant = getStore().tenants.find((item) => item.id === session.tenantId);
  if (!tenant) {
    return fail('NOT_FOUND', 'Negocio no encontrado.');
  }
  return ok(tenant);
}

/**
 * Tenant id for admin pages, sourced from the session (never the URL).
 * Unauthenticated → `/login`; authenticated but unbound → onboarding (FR-016, 009-US2).
 * Live session first, then the local cookie seam (feature 009).
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
