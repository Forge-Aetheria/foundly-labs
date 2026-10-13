import { ServiceCatalog } from './components/ServiceCatalog';
import { listServices } from './actions';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Services module view (server): catalog + current rates for the tenant. */
export async function ServicesView() {
  const tenantId = await getAdminTenantId();
  const result = await listServices(tenantId);
  if (!result.ok) {
    return <ServiceCatalog services={[]} rates={[]} error={result.error.message} />;
  }
  return <ServiceCatalog services={result.data.services} rates={result.data.rates} />;
}