import { StaffManager } from '../../../features/storefront/components/StaffManager';
import { listStaff } from '../../../features/storefront/queries';
import { getAdminTenantId } from '../../../features/tenants/queries';

export const dynamic = 'force-dynamic';

export default function StaffPage() {
  const tenantId = getAdminTenantId();
  return <StaffManager staff={listStaff(tenantId)} />;
}