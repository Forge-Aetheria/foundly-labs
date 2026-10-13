import { StaffManager } from './components/StaffManager';
import { listStaff } from './utils/queries';
import { listServices } from '../services/utils/queries';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Staff module view (server): roster + tenant catalog for the editor. */
export async function StaffView() {
  const tenantId = await getAdminTenantId();
  const [staff, catalog] = await Promise.all([listStaff(tenantId), listServices(tenantId)]);
  return <StaffManager staff={staff} services={catalog.services} />;
}