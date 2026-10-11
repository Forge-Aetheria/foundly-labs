import { redirect } from 'next/navigation';
import type { Tenant } from '../types/tenancy';
import { getCurrentSession, requireTenant } from '../infra/auth';
import { getStore } from '../infra/store';
import { fail, ok, type ActionResult } from '../infra/result';
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
 * Redirects unauthenticated requests to the registration entry point (FR-016).
 */
export function getAdminTenantId(): string {
  const auth = requireTenant(getCurrentSession());
  if (!auth.ok || !auth.data.tenantId) {
    redirect('/onboarding');
  }
  return auth.data.tenantId;
}
