import {
  AddTimeBlockDocument,
  AvailabilityDocument,
  CreateAvailabilityDocument,
  RemoveAvailabilityDocument,
  RemoveTimeBlockDocument,
  TimeBlocksDocument,
  UpdateAvailabilityDocument,
  type AddTimeBlockInput,
  type AddTimeBlockMutation,
  type AvailabilityQuery,
  type RemoveTimeBlockMutation,
  type TimeBlocksQuery,
} from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, ok, type ActionResult } from '@/shared/api/result';
import type { AvailabilityRule, DayDraft, TimeBlock } from './availability-utils';

const DEFAULTS = {
  slotGranularityMinutes: 30,
  minLeadTimeMinutes: 0,
  bookingHorizonDays: 60,
} as const;

export async function fetchAvailability(
  tenantId: string,
): Promise<ActionResult<AvailabilityRule[]>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<AvailabilityQuery>(
    AvailabilityDocument,
    { tenantId, tenantSlug: null, specialistId: null },
    { token },
  );
  if (!result.ok) return result;
  return ok(result.data.availability.filter((rule) => rule.specialistId === null));
}

export async function fetchTimeBlocks(tenantId: string): Promise<ActionResult<TimeBlock[]>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<TimeBlocksQuery>(
    TimeBlocksDocument,
    { tenantId, tenantSlug: null, specialistId: null },
    { token },
  );
  return result.ok ? ok(result.data.timeBlocks) : result;
}

export async function saveWeeklyAvailability(
  tenantId: string,
  days: DayDraft[],
): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');

  const current = await apiRequest<AvailabilityQuery>(
    AvailabilityDocument,
    { tenantId, tenantSlug: null, specialistId: null },
    { token },
  );
  if (!current.ok) return current;

  const existingByWeekday = new Map(
    current.data.availability
      .filter((rule) => rule.specialistId === null)
      .map((rule) => [rule.weekday, rule]),
  );

  for (const day of days) {
    const existing = existingByWeekday.get(day.weekday);
    const open = day.isOpen && Boolean(day.startTime && day.endTime);

    if (!open) {
      if (existing) {
        const removed = await apiRequest<{ removeAvailability: boolean }>(
          RemoveAvailabilityDocument,
          { id: existing.id },
          { token },
        );
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
      const updated = await apiRequest(
        UpdateAvailabilityDocument,
        { id: existing.id, input: payload },
        { token },
      );
      if (!updated.ok) return updated;
    } else {
      const created = await apiRequest(
        CreateAvailabilityDocument,
        { input: { tenantId, ...payload } },
        { token },
      );
      if (!created.ok) return created;
    }
  }

  return ok(true);
}

export async function addTimeBlock(input: AddTimeBlockInput): Promise<ActionResult<TimeBlock>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<AddTimeBlockMutation>(AddTimeBlockDocument, { input }, { token });
  return result.ok ? ok(result.data.addTimeBlock) : result;
}

export async function removeTimeBlock(id: string): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<RemoveTimeBlockMutation>(
    RemoveTimeBlockDocument,
    { id },
    { token },
  );
  return result.ok ? ok(true) : result;
}
