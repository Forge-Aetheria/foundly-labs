import { ServiceCatalog } from './components/ServiceCatalog';
import { listServices } from './utils/queries';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Services module view (server): catalog + current rates for the tenant. */
export async function ServicesView() {
  const tenantId = await getAdminTenantId();
  const { services, rates } = await listServices(tenantId);
  return <ServiceCatalog services={services} rates={rates} />;
}