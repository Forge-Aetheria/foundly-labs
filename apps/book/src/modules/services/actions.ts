'use server';

import { apiRequestAdmin } from '../../shared/api/admin-request';
import {
  CreateMyServiceDocument,
  DeleteMyServiceDocument,
  MyServicesDocument,
  UpdateMyServiceDocument,
  type MyServicesQuery,
} from '../../shared/api/generated';
import { getEffectiveSession } from '../../shared/auth/authServer';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import type { Rate, Service } from '../../shared/types/appointments';
import { deleteServiceSchema, serviceSchema, updateServiceSchema } from './utils/schemas';

/**
 * Services module — server data access (feature 011; constitution §5.VI).
 * Uses the codegen documents/types exclusively; no hand-written DTOs.
 * Reads/writes go through the session-aware transport (`apiRequestAdmin`).
 */

export interface ServiceCatalogResult {
  services: Service[];
  rates: Rate[];
}

type ApiService = MyServicesQuery['myServices'][number];

const LOCAL_CURRENCY = 'EUR';

function toNullableText(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

/** Map an API `MyService` → book `Service` + derived active `Rate`. */
function mapMyService(dto: ApiService, tenantId: string): { service: Service; rate: Rate } {
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
  const result = await apiRequestAdmin(MyServicesDocument, { active: null });
  if (!result.ok) return result;
  const mapped = result.data.myServices.map((dto) => mapMyService(dto, tenantId));
  return ok({
    services: mapped.map((entry) => entry.service),
    rates: mapped.map((entry) => entry.rate),
  });
}

/** Create a service for the authenticated owner (feature 016, US5). */
export async function createService(input: unknown): Promise<ActionResult<Service>> {
  const session = await getEffectiveSession();
  if (!session?.tenantId) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de Foundly Pass.');
  }
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del servicio inválidos.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(CreateMyServiceDocument, {
    input: {
      name: parsed.data.name,
      description: toNullableText(parsed.data.description),
      priceCents: parsed.data.priceCents,
      durationMinutes: parsed.data.durationMinutes,
      category: toNullableText(parsed.data.category),
      active: true,
    },
  });
  if (!result.ok) return result;
  return ok(mapMyService(result.data.createMyService, session.tenantId).service);
}

/** Update one of the authenticated owner's services. */
export async function updateService(input: unknown): Promise<ActionResult<Service>> {
  const session = await getEffectiveSession();
  if (!session?.tenantId) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de Foundly Pass.');
  }
  const parsed = updateServiceSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del servicio inválidos.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(UpdateMyServiceDocument, {
    id: parsed.data.id,
    input: {
      name: parsed.data.name,
      description: toNullableText(parsed.data.description),
      priceCents: parsed.data.priceCents,
      durationMinutes: parsed.data.durationMinutes,
      category: toNullableText(parsed.data.category),
    },
  });
  if (!result.ok) return result;
  return ok(mapMyService(result.data.updateMyService, session.tenantId).service);
}

/** Delete one of the authenticated owner's services. */
export async function deleteService(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteServiceSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Servicio inválido.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(DeleteMyServiceDocument, { id: parsed.data.id });
  if (!result.ok) return result;
  return ok({ id: parsed.data.id });
}
