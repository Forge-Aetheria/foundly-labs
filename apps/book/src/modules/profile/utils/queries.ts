import type { PortalPolicy, Tenant } from '../../../shared/types/tenancy';
import { getStore } from '../../../shared/infra/store';

/** The tenant's profile (identity, contact and gallery). */
export function getTenantProfile(tenantId: string): Tenant | undefined {
  return getStore().tenants.find((tenant) => tenant.id === tenantId);
}

/** Reservation/cancellation policies of the tenant (Perfil, 007). */
export function listPolicies(tenantId: string): PortalPolicy[] {
  return getStore().portalPolicies.filter((policy) => policy.tenantId === tenantId);
}
