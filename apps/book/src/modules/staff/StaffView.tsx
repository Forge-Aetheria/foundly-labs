'use client';

import { useEffect, useState } from 'react';
import { StaffManager } from './components/StaffManager';
import { listStaff } from './actions';
import { listServices } from '../services/actions';
import { useAdminWorkspace } from '../../shared/admin/AdminWorkspaceContext';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';
import type { AdminResourceState } from '../../shared/hooks/useAdminResource';
import type { Resource, Service } from '../../shared/types/appointments';

interface StaffData {
  staff: Resource[];
  services: Service[];
}

/** Staff module view (client): roster + service catalog loaded after mount. */
export function StaffView() {
  const workspace = useAdminWorkspace();
  const tenantId = workspace?.tenantId;
  const [state, setState] = useState<AdminResourceState<StaffData>>({ status: 'loading' });

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    let active = true;
    setState({ status: 'loading' });

    Promise.all([listStaff(tenantId), listServices(tenantId)])
      .then(([staffResult, catalogResult]) => {
        if (!active) {
          return;
        }
        if (staffResult.ok && catalogResult.ok) {
          setState({
            status: 'ready',
            data: { staff: staffResult.data, services: catalogResult.data.services },
          });
          return;
        }
        setState({
          status: 'error',
          message: !staffResult.ok
            ? staffResult.error.message
            : catalogResult.ok
              ? 'No pudimos cargar el equipo.'
              : catalogResult.error.message,
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'No pudimos cargar el equipo.',
        });
      });

    return () => {
      active = false;
    };
  }, [tenantId]);

  if (state.status === 'loading') {
    return <ModuleSkeleton />;
  }

  return (
    <StaffManager
      staff={state.status === 'ready' ? state.data.staff : []}
      services={state.status === 'ready' ? state.data.services : []}
      error={state.status === 'error' ? state.message : null}
      tenantId={tenantId ?? ''}
    />
  );
}
