import type { Rate, Service } from '../../../shared/types/appointments';
import { getAccessToken } from '../../../shared/infra/authServer';
import { listRemoteServices } from '../../../shared/infra/remoteCatalog';
import type { ActionResult } from '../../../shared/infra/result';

export interface ServiceCatalogResult {
  services: Service[];
  rates: Rate[];
}

/**
 * The tenant's services with their current rates (feature 008 — US1).
 * SERVER-ONLY (feature 010): the API is the only source; there is no in-memory
 * fallback and failures surface to the caller (FR-002/FR-010).
 */
export async function listServices(tenantId: string): Promise<ActionResult<ServiceCatalogResult>> {
  const token = await getAccessToken();
  return listRemoteServices(token, tenantId);
}