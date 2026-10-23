'use client';

import { useEffect, useState } from 'react';
import { AvailabilityEditor } from './components/AvailabilityEditor';
import { listAvailabilityRules, listTimeBlocks } from './actions';
import { useAdminWorkspace } from '../../shared/admin/AdminWorkspaceContext';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';
import type { AdminResourceState } from '../../shared/hooks/useAdminResource';
import type { AvailabilityRule, TimeBlock } from '../../shared/types/appointments';

interface AvailabilityData {
  rules: AvailabilityRule[];
  blocks: TimeBlock[];
}

/** Availability module view (client): weekly rules + time blocks loaded after mount. */
export function AvailabilityView() {
  const workspace = useAdminWorkspace();
  const tenantId = workspace?.tenantId;
  const [state, setState] = useState<AdminResourceState<AvailabilityData>>({ status: 'loading' });

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    let active = true;
    setState({ status: 'loading' });

    Promise.all([listAvailabilityRules(tenantId), listTimeBlocks(tenantId)])
      .then(([rulesResult, blocksResult]) => {
        if (!active) {
          return;
        }
        if (rulesResult.ok && blocksResult.ok) {
          setState({
            status: 'ready',
            data: { rules: rulesResult.data, blocks: blocksResult.data },
          });
          return;
        }
        setState({
          status: 'error',
          message: !rulesResult.ok
            ? rulesResult.error.message
            : blocksResult.ok
              ? 'No pudimos cargar la disponibilidad.'
              : blocksResult.error.message,
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setState({
          status: 'error',
          message:
            error instanceof Error ? error.message : 'No pudimos cargar la disponibilidad.',
        });
      });

    return () => {
      active = false;
    };
  }, [tenantId]);

  if (state.status === 'loading') {
    return <ModuleSkeleton rows={5} />;
  }

  return (
    <AvailabilityEditor
      rules={state.status === 'ready' ? state.data.rules : []}
      blocks={state.status === 'ready' ? state.data.blocks : []}
      error={state.status === 'error' ? state.message : null}
    />
  );
}
