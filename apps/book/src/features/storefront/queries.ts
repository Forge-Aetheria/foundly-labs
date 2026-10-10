import type { Resource } from '../../domain/appointments/types';
import type { Tenant } from '../../domain/tenancy/types';
import { getStore } from '../../server/store';

/** Read helpers for the storefront admin sections (scoped by tenant id). */

/** Active and inactive professionals of the tenant (Equipo). */
export function listStaff(tenantId: string): Resource[] {
  return getStore().resources.filter((resource) => resource.tenantId === tenantId);
}

/** The tenant's profile (identity, contact and gallery). */
export function getTenantProfile(tenantId: string): Tenant | undefined {
  return getStore().tenants.find((tenant) => tenant.id === tenantId);
}

/** Gallery image URLs of the tenant (Galería). */
export function listGallery(tenantId: string): string[] {
  return getTenantProfile(tenantId)?.gallery ?? [];
}
