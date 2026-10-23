'use client';

import { ProfileEditor } from './components/ProfileEditor';
import { getProfile } from './actions';
import { useAdminWorkspace } from '../../shared/admin/AdminWorkspaceContext';
import { useAdminResource } from '../../shared/hooks/useAdminResource';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';

/** Profile module view (client): real editable profile loaded after mount. */
export function ProfileView({ embedded = false }: { embedded?: boolean }) {
  const workspace = useAdminWorkspace();
  const state = useAdminResource(workspace?.tenantId, getProfile);

  if (state.status === 'loading') {
    return <ModuleSkeleton rows={3} />;
  }

  if (state.status === 'error') {
    return <ProfileEditor profile={null} error={state.message} embedded={embedded} />;
  }

  return <ProfileEditor profile={state.data} embedded={embedded} />;
}
