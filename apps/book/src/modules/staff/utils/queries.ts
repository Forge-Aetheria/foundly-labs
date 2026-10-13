import type { Resource } from '../../../shared/types/appointments';
import { getStore } from '../../../shared/infra/store';
import { getAccessToken, getEffectiveSession } from '../../../shared/infra/authServer';
import { listRemoteSpecialists } from '../../../shared/infra/remoteCatalog';

/**
 * The tenant's professionals, active and inactive (feature 008 — US1).
 * Remote-first with store fallback (US3). `serviceIds`/`timezone` stay local.
 */
export async function listStaff(tenantId: string): Promise<Resource[]> {
  const session = await getEffectiveSession();
  if (session?.tenantId === tenantId) {
    const token = await getAccessToken();
    const remote = await listRemoteSpecialists(token, tenantId);
    if (remote.ok) return remote.data;
  }
  return getStore().resources.filter((resource) => resource.tenantId === tenantId);
}