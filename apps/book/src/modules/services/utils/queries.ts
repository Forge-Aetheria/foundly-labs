import type { Resource, Service } from '../../../shared/types/appointments';
import { getStore } from '../../../shared/infra/store';

/** The tenant's services only. */
export function listServices(tenantId: string): Service[] {
  return getStore().services.filter((service) => service.tenantId === tenantId);
}

/** All resources (professionals/rooms/assets). */
export function listResources(): Resource[] {
  return [...getStore().resources];
}
