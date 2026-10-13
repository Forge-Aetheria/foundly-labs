'use server';

import { apiRequest } from '../../shared/api/client';
import { apiRequestAdmin } from '../../shared/api/admin-request';
import {
  AddTimeBlockDocument,
  AvailabilityDocument,
  CreateAvailabilityDocument,
  RemoveAvailabilityDocument,
  RemoveTimeBlockDocument,
  TimeBlocksDocument,
  UpdateAvailabilityDocument,
  type AvailabilityQuery,
  type TimeBlocksQuery,
} from '../../shared/api/generated';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import { adminTenantId } from '../../shared/utils/tenant-scope';
import type { AvailabilityRule, TimeBlock } from '../../shared/types/appointments';
import { removeTimeBlockSchema, saveAvailabilitySchema, timeBlockSchema } from './utils/schemas';

/**
 * Availability module — server data access (feature 011/015; constitution §5.VI).
 * Codegen documents/types only. Weekly rules use the public transport; time
 * blocks use the session-aware transport (`apiRequestAdmin`).
 */

type ApiAvailability = AvailabilityQuery['availability'][number];
type ApiTimeBlock = TimeBlocksQuery['timeBlocks'][number];

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

/** Map an API time block → domain TimeBlock (feature 015). */
function mapTimeBlock(dto: ApiTimeBlock, tenantId: string): TimeBlock {
  return {
    id: dto.id,
    resourceId: dto.specialistId ?? tenantId,
    startAt: dto.startAt,
    endAt: dto.endAt,
    kind: 'block',
    recurrence: 'none',
    recurrenceUntil: null,
    reason: dto.reason ?? null,
  };
}

/** The tenant's concrete time blocks. SERVER-ONLY, no fallback. */
export async function listTimeBlocks(tenantId: string): Promise<ActionResult<TimeBlock[]>> {
  const result = await apiRequestAdmin(TimeBlocksDocument, {
    tenantId,
    tenantSlug: null,
    specialistId: null,
  });
  if (!result.ok) return result;
  return ok(result.data.timeBlocks.map((dto) => mapTimeBlock(dto, tenantId)));
}

/** Block a concrete date/time range for the authenticated owner's business. */
export async function addTimeBlock(input: unknown): Promise<ActionResult<TimeBlock>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;

  const parsed = timeBlockSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del bloqueo inválidos.', zodFields(parsed.error));
  }
  const { date, startTime, endTime, reason } = parsed.data;
  const result = await apiRequestAdmin(AddTimeBlockDocument, {
    input: {
      startAt: `${date}T${startTime}:00`,
      endAt: `${date}T${endTime}:00`,
      reason: reason?.trim() ? reason.trim() : null,
    },
  });
  if (!result.ok) return result;
  return ok(mapTimeBlock(result.data.addTimeBlock, tenant.data));
}

/** Remove one of the authenticated owner's time blocks. */
export async function removeTimeBlock(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = removeTimeBlockSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Bloqueo inválido.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(RemoveTimeBlockDocument, { id: parsed.data.id });
  if (!result.ok) return result;
  return ok({ id: parsed.data.id });
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