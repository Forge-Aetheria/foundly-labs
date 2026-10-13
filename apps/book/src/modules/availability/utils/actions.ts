'use server';

import { z } from 'zod';
import { adminTenantId } from '../../../shared/utils/tenant-scope';
import {
  createRemoteAvailability,
  listRemoteAvailability,
  removeRemoteAvailability,
  updateRemoteAvailability,
} from '../../../shared/infra/remoteAvailability';
import { fail, ok, type ActionResult } from '../../../shared/infra/result';

const availabilityDaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  startTime: z.string(),
  endTime: z.string(),
});

/** One entry per weekday (0 = Sunday) with the open/closed schedule. */
const saveAvailabilitySchema = z.object({
  days: z.array(availabilityDaySchema),
});
export type SaveAvailabilityInput = z.infer<typeof saveAvailabilitySchema>;

/** Defaults when the API row is not provided (mirrors the API create defaults). */
const DEFAULTS = {
  slotGranularityMinutes: 30,
  minLeadTimeMinutes: 0,
  bookingHorizonDays: 60,
} as const;

/**
 * Reconcile the tenant weekly availability on the API (feature 010 — T011).
 * Open days are upserted (`create`/`update` via `remoteAvailability`); closed
 * days remove any existing tenant-level rule. Time blocks have no backend and
 * are intentionally ignored. Failures surface — no silent fallback (FR-010).
 */
export async function saveWeeklyAvailability(
  input: unknown,
): Promise<ActionResult<{ updated: true }>> {
  const tenant = await adminTenantId();
  if (!tenant.ok) return tenant;

  const parsed = saveAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos de disponibilidad inválidos.');
  }

  const current = await listRemoteAvailability({ tenantId: tenant.data });
  if (!current.ok) return current;
  const existingByWeekday = new Map(
    current.data
      .filter((dto) => dto.specialistId === null)
      .map((dto) => [dto.weekday, dto]),
  );

  for (const day of parsed.data.days) {
    const existing = existingByWeekday.get(day.weekday);
    const open = day.isOpen && Boolean(day.startTime && day.endTime);

    if (!open) {
      if (existing) {
        const removed = await removeRemoteAvailability(existing.id);
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
      const updated = await updateRemoteAvailability(existing.id, payload);
      if (!updated.ok) return updated;
    } else {
      const created = await createRemoteAvailability({ tenantId: tenant.data, ...payload });
      if (!created.ok) return created;
    }
  }

  return ok({ updated: true });
}