import type { Resource } from '../../../shared/types/appointments';
import { getStore } from '../../../shared/infra/store';

/** Active and inactive professionals of the tenant (Equipo). */
export function listStaff(tenantId: string): Resource[] {
  return getStore().resources.filter((resource) => resource.tenantId === tenantId);
}
