import type { GalleryPhoto, Tenant } from '../../../shared/types/tenancy';
import { getStore } from '../../../shared/infra/store';

/** The tenant's profile (identity, contact and gallery). */
export function getTenantProfile(tenantId: string): Tenant | undefined {
  return getStore().tenants.find((tenant) => tenant.id === tenantId);
}

/** Gallery photos of the tenant (Galería, 006). */
export function listGallery(tenantId: string): GalleryPhoto[] {
  return getTenantProfile(tenantId)?.gallery ?? [];
}
