import type { PortalPolicy, Tenant } from '../../../shared/types/tenancy';
import { fetchTenantById } from '../../../shared/infra/remoteTenancy';
import { fail, type ActionResult } from '../../../shared/infra/result';
import { mapTenantDto } from '../../../shared/tenancy/queries';

/**
 * The tenant profile (identity, contact, about) — read from the API
 * (feature 010 — T015). Fields without an API counterpart fall back to
 * neutral values via `mapTenantDto`.
 */
export async function getTenantProfile(tenantId: string): Promise<ActionResult<Tenant>> {
  const result = await fetchTenantById(tenantId);
  if (!result.ok) return result;
  if (!result.data) return fail('NOT_FOUND', 'Negocio no encontrado.');
  return { ok: true, data: mapTenantDto(result.data) };
}

/**
 * Reservation/cancellation policies have no backend counterpart yet
 * (feature 010 — T015): intentionally empty, never mocked (FR-007).
 */
export function listPolicies(): PortalPolicy[] {
  return [];
}