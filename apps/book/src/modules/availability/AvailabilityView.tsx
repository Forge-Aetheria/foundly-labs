import { AvailabilityEditor } from './components/AvailabilityEditor';
import { listAvailabilityRules, listTimeBlocks } from './actions';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Availability module view (server): weekly rules + concrete time blocks. */
export async function AvailabilityView() {
  const tenantId = await getAdminTenantId();
  const [rulesResult, blocksResult] = await Promise.all([
    listAvailabilityRules(tenantId),
    listTimeBlocks(tenantId),
  ]);
  const rules = rulesResult.ok ? rulesResult.data : [];
  const blocks = blocksResult.ok ? blocksResult.data : [];
  const error = !rulesResult.ok
    ? rulesResult.error.message
    : !blocksResult.ok
      ? blocksResult.error.message
      : null;
  return <AvailabilityEditor rules={rules} blocks={blocks} error={error} />;
}
