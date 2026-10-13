import type { Rate, Resource, Service } from '../../../shared/types/appointments';
import { getStore } from '../../../shared/infra/store';
import { getAccessToken, getEffectiveSession } from '../../../shared/infra/authServer';
import { listRemoteServices } from '../../../shared/infra/remoteCatalog';

export interface ServiceCatalogResult {
  services: Service[];
  rates: Rate[];
}

/**
 * The tenant's services with their current rates (feature 008 — US1).
 * Remote-first when a tenant-bound session exists; graceful fallback to the
 * local seam on any failure or when live auth is not configured (US3).
 */
export async function listServices(tenantId: string): Promise<ServiceCatalogResult> {
  const session = await getEffectiveSession();
  if (session?.tenantId === tenantId) {
    const token = await getAccessToken();
    const remote = await listRemoteServices(token, tenantId);
    if (remote.ok) return remote.data;
  }
  const services = getStore().services.filter((service) => service.tenantId === tenantId);
  const serviceIds = new Set(services.map((service) => service.id));
  return {
    services,
    rates: getStore().rates.filter((rate) => serviceIds.has(rate.serviceId)),
  };
}

/** All resources (professionals/rooms/assets) — local seam (availability still local). */
export function listResources(): Resource[] {
  return [...getStore().resources];
}