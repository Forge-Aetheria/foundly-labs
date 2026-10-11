import type { AvailabilityRule, TimeBlock } from '../../../shared/types/appointments';
import { getStore } from '../../../shared/infra/store';

function tenantResourceIds(tenantId: string): Set<string> {
  return new Set(
    getStore()
      .resources.filter((resource) => resource.tenantId === tenantId)
      .map((resource) => resource.id),
  );
}

/** The tenant's weekly availability rules (via its resources). */
export function listAvailabilityRules(tenantId: string): AvailabilityRule[] {
  const resourceIds = tenantResourceIds(tenantId);
  return getStore().availabilityRules.filter((rule) => resourceIds.has(rule.resourceId));
}

/** The tenant's time blocks (via its resources). */
export function listTimeBlocks(tenantId: string): TimeBlock[] {
  const resourceIds = tenantResourceIds(tenantId);
  return getStore().timeBlocks.filter((block) => resourceIds.has(block.resourceId));
}
