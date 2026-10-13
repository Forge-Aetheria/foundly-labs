'use server';

import { apiRequest } from '../../shared/api/client';
import {
  AvailabilityDocument,
  CreateAvailabilityDocument,
  RemoveAvailabilityDocument,
  UpdateAvailabilityDocument,
  type AvailabilityQuery,
} from '../../shared/api/generated';
import { fail, ok, type ActionResult } from '../../shared/types/result';
import { adminTenantId } from '../../shared/utils/tenant-scope';
import type { AvailabilityRule, TimeBlock } from '../../shared/types/appointments';
import { saveAvailabilitySchema } from './utils/schemas';

/**
 * Availability module — server data access (feature 011; constitution §5.VI).
 * Codegen documents/types only. Time blocks have no backend counterpart.
 */

type ApiAvailability = AvailabilityQuery['availability'][number];

/** Tenant-level availability (`specialistId` null) → domain rule. */
function mapRule(dto: ApiAvailability, tenantId: string): AvailabilityRule {
  return {
    id: dto.id,
    resourceId: tenantId,
    weekday: dto.weekday,
    startTime: dto.startTime,
    endTime: dto.endTime,
    slotGranularityMinutes: dto.slotGranularityMinutes,
    minLeadTimeMinutes: dto.minLeadTimeMinutes,
    bookingHorizonDays: dto.bookingHorizonDays,
  };
}

/** The tenant's weekly availability rules. SERVER-ONLY, no fallback. */
export async function listAvailabilityRules(
  tenantId: string,
): Promise<ActionResult<AvailabilityRule[]>> {
  const result = await apiRequest(AvailabilityDocument, {
    tenantId,
    tenantSlug: null,
    specialistId: null,
  });
  if (!result.ok) return result;
  return ok(
    result.data.availability
      .filter((dto) => dto.specialistId === null)
      .map((dto) => mapRule(dto, tenantId)),
  );
}

/** Time blocks have no backend counterpart yet (feature 010): empty. */
export async function listTimeBlocks(): Promise<TimeBlock[]> {
  return [];
}

const DEFAULTS = {
  slotGranularityMinutes: 30,
  minLeadTimeMinutes: 0,
  bookingHorizonDays: 60,
} as const;

/** Reconcile the tenant weekly availability on the API. Failures surface. */
export async function saveWeeklyAvailability(
  input: unknown,
): Promise<ActionResult<{ updated: true }>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;

  const parsed = saveAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de disponibilidad inválidos.');
  }

  const current = await apiRequest(AvailabilityDocument, {
    tenantId: tenant.data,
    tenantSlug: null,
    specialistId: null,
  });
  if (!current.ok) return current;
  const existingByWeekday = new Map(
    current.data.availability
      .filter((dto) => dto.specialistId === null)
      .map((dto) => [dto.weekday, dto]),
  );

  for (const day of parsed.data.days) {
    const existing = existingByWeekday.get(day.weekday);
    const open = day.isOpen && Boolean(day.startTime && day.endTime);

    if (!open) {
      if (existing) {
        const removed = await apiRequest(RemoveAvailabilityDocument, { id: existing.id });
        if (!removed.ok) return removed;
      }
      continue;
    }

    const payload = {
      weekday: day.weekday,
      startTime: day.startTime,
      endTime: day.endTime,
      ...DEFAULTS,
    };
    if (existing) {
      const updated = await apiRequest(UpdateAvailabilityDocument, { id: existing.id, input: payload });
      if (!updated.ok) return updated;
    } else {
      const created = await apiRequest(CreateAvailabilityDocument, {
        input: { tenantId: tenant.data, ...payload },
      });
      if (!created.ok) return created;
    }
  }

  return ok({ updated: true });
}