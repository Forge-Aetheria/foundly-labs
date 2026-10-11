import { AvailabilityEditor } from './components/AvailabilityEditor';
import { listAvailabilityRules, listTimeBlocks } from './utils/queries';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Availability module view (server): rules + time blocks for the tenant. */
export function AvailabilityView() {
  const tenantId = getAdminTenantId();
  return (
    <AvailabilityEditor rules={listAvailabilityRules(tenantId)} blocks={listTimeBlocks(tenantId)} />
  );
}
