import { StaffManager } from './components/StaffManager';
import { listStaff } from './utils/queries';
import { listServices } from '../services/utils/queries';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Staff module view (server): roster + tenant catalog for the editor. */
export function StaffView() {
  const tenantId = getAdminTenantId();
  return <StaffManager staff={listStaff(tenantId)} services={listServices(tenantId)} />;
}
