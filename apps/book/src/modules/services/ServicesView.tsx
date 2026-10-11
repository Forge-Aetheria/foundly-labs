import { ServiceCatalog } from './components/ServiceCatalog';
import { listServices } from './utils/queries';
import { getStore } from '../../shared/infra/store';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Services module view (server): catalog + current rates for the tenant. */
export function ServicesView() {
  const tenantId = getAdminTenantId();
  const services = listServices(tenantId);
  const serviceIds = new Set(services.map((service) => service.id));
  const rates = getStore().rates.filter((rate) => serviceIds.has(rate.serviceId));
  return <ServiceCatalog services={services} rates={rates} />;
}
