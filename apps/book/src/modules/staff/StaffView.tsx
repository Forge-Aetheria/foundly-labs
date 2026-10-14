import { StaffManager } from './components/StaffManager';
import { listStaff } from './actions';
import { listServices } from '../services/actions';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Staff module view (server): roster + tenant catalog for the editor. */
export async function StaffView() {
  const tenantId = await getAdminTenantId();
  const [staffResult, catalogResult] = await Promise.all([listStaff(tenantId), listServices(tenantId)]);
  const staff = staffResult.ok ? staffResult.data : [];
  const services = catalogResult.ok ? catalogResult.data.services : [];
  const error =
    !staffResult.ok ? staffResult.error.message : !catalogResult.ok ? catalogResult.error.message : null;
  return <StaffManager staff={staff} services={services} error={error} tenantId={tenantId} />;
}