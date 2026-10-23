'use client';

import { ServiceCatalog } from './components/ServiceCatalog';
import { listServices } from './actions';
import { useAdminWorkspace } from '../../shared/admin/AdminWorkspaceContext';
import { useAdminResource } from '../../shared/hooks/useAdminResource';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';

/** Services module view (client): catalog + rates, loaded after mount. */
export function ServicesView() {
  const workspace = useAdminWorkspace();
  const state = useAdminResource(workspace?.tenantId, listServices);

  if (state.status === 'loading') {
    return <ModuleSkeleton />;
  }

  if (state.status === 'error') {
    return <ServiceCatalog services={[]} rates={[]} error={state.message} />;
  }

  return <ServiceCatalog services={state.data.services} rates={state.data.rates} />;
}
