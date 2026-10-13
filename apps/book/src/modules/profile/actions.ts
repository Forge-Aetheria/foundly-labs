import { apiRequest } from '../../shared/api/client';
import { TenantsDocument } from '../../shared/api/generated';
import { fail, ok, type ActionResult } from '../../shared/types/result';
import { mapTenant } from '../../shared/tenancy/queries';
import type { PortalPolicy, Tenant } from '../../shared/types/tenancy';

/**
 * Profile module — server data access (feature 011; constitution §5.VI).
 * Identity/contact come from the API; policies have no backend (empty).
 */

export async function getTenantProfile(tenantId: string): Promise<ActionResult<Tenant>> {
  const result = await apiRequest(TenantsDocument, {});
  if (!result.ok) return result;
  const tenant = result.data.tenants.find((item) => item.id === tenantId);
  if (!tenant) return fail('NOT_FOUND', 'Negocio no encontrado.');
  return ok(mapTenant(tenant));
}

/** Policies have no backend counterpart yet: intentionally empty, never mocked. */
export function listPolicies(): PortalPolicy[] {
  return [];
}