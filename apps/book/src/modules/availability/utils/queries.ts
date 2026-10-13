import type { AvailabilityRule, TimeBlock } from '../../../shared/types/appointments';
import { listRemoteAvailability } from '../../../shared/infra/remoteAvailability';
import type { ActionResult } from '../../../shared/infra/result';

/**
 * Map an API availability row (tenant-level, `specialistId` null) to a domain
 * rule. The admin schedule is tenant-wide; `resourceId: tenantId` is the
 * synthetic key used by the editor (the API keeps `specialistId` null).
 */
export function mapAvailabilityRule(dto: {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotGranularityMinutes: number;
  minLeadTimeMinutes: number;
  bookingHorizonDays: number;
}, tenantId: string): AvailabilityRule {
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

/**
 * The tenant's weekly availability rules (feature 010 — T011).
 * SERVER-ONLY: reads `availability(tenantId)` from the API, keeping the
 * tenant-level entries (no inventory of fake local rules).
 */
export async function listAvailabilityRules(
  tenantId: string,
): Promise<ActionResult<AvailabilityRule[]>> {
  const result = await listRemoteAvailability({ tenantId });
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data
      .filter((dto) => dto.specialistId === null)
      .map((dto) => mapAvailabilityRule(dto, tenantId)),
  };
}

/** Time blocks have no backend counterpart yet (feature 010 — T011): empty. */
export async function listTimeBlocks(): Promise<TimeBlock[]> {
  return [];
}