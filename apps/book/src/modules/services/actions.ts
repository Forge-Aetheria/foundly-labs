import { apiRequest } from '../../shared/api/client';
import { MyServicesDocument, type MyServicesQuery } from '../../shared/api/generated';
import { getAccessToken } from '../../shared/auth/authServer';
import { ok, type ActionResult } from '../../shared/types/result';
import type { Rate, Service } from '../../shared/types/appointments';

/**
 * Services module — server data access (feature 011; constitution §5.VI).
 * Uses the codegen documents/types exclusively; no hand-written DTOs.
 */

export interface ServiceCatalogResult {
  services: Service[];
  rates: Rate[];
}

type ApiService = MyServicesQuery['myServices'][number];

const LOCAL_CURRENCY = 'EUR';

/** Map an API `MyService` → book `Service` + derived active `Rate`. */
export function mapMyService(dto: ApiService, tenantId: string): { service: Service; rate: Rate } {
  const service: Service = {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? null,
    durationMinutes: dto.durationMinutes,
    bufferMinutes: 0, // not served by the API surface (data-model §5 known gap)
    category: dto.category ?? null,
    active: dto.active,
    tenantId,
  };
  const rate: Rate = {
    id: dto.id,
    serviceId: dto.id,
    amountCents: dto.priceCents,
    currency: LOCAL_CURRENCY,
    effectiveFrom: new Date().toISOString(),
    effectiveTo: null,
  };
  return { service, rate };
}

/** The tenant's services with their current rates. SERVER-ONLY, no fallback. */
export async function listServices(tenantId: string): Promise<ActionResult<ServiceCatalogResult>> {
  const token = await getAccessToken();
  const result = await apiRequest(MyServicesDocument, { active: null }, { token });
  if (!result.ok) return result;
  const mapped = result.data.myServices.map((dto) => mapMyService(dto, tenantId));
  return ok({
    services: mapped.map((entry) => entry.service),
    rates: mapped.map((entry) => entry.rate),
  });
}