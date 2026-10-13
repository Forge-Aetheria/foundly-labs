import { AvailabilityEditor } from './components/AvailabilityEditor';
import { listAvailabilityRules, listTimeBlocks } from './actions';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Availability module view (server): rules + time blocks for the tenant. */
export async function AvailabilityView() {
  const tenantId = await getAdminTenantId();
  const [rulesResult, blocks] = await Promise.all([
    listAvailabilityRules(tenantId),
    listTimeBlocks(),
  ]);
  const rules = rulesResult.ok ? rulesResult.data : [];
  const error = rulesResult.ok ? null : rulesResult.error.message;
  return <AvailabilityEditor rules={rules} blocks={blocks} error={error} />;
}