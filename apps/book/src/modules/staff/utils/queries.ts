import type { Resource } from '../../../shared/types/appointments';
import { getAccessToken } from '../../../shared/infra/authServer';
import { listRemoteSpecialists } from '../../../shared/infra/remoteCatalog';
import type { ActionResult } from '../../../shared/infra/result';

/**
 * The tenant's professionals, active and inactive (feature 008 — US1).
 * SERVER-ONLY (feature 010 — T010): no in-memory fallback; failures surface.
 */
export async function listStaff(tenantId: string): Promise<ActionResult<Resource[]>> {
  const token = await getAccessToken();
  return listRemoteSpecialists(token, tenantId);
}