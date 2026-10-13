import type { AvailabilityQuery } from '../../../shared/api/generated';
import type { BusinessHours } from '../../../shared/types/tenancy';

type ApiAvailability = AvailabilityQuery['availability'][number];

/**
 * Derive the tenant's weekly opening hours from its tenant-level availability
 * (`specialistId` null). Pure helper (feature 011).
 */
export function deriveWeeklyHours(dtos: ApiAvailability[]): BusinessHours[] {
  const tenantLevel = dtos.filter((dto) => dto.specialistId === null);
  if (tenantLevel.length === 0) return [];
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const rule = tenantLevel.find((item) => item.weekday === weekday);
    return rule
      ? { weekday, isOpen: true, startTime: rule.startTime, endTime: rule.endTime }
      : { weekday, isOpen: false, startTime: '', endTime: '' };
  });
}