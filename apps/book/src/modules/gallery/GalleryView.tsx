'use client';

import { GalleryManager } from './components/GalleryManager';
import { listGallery } from './actions';
import { useAdminWorkspace } from '../../shared/admin/AdminWorkspaceContext';
import { useAdminResource } from '../../shared/hooks/useAdminResource';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';

/** Gallery module view (client): real photos loaded after mount. */
export function GalleryView() {
  const workspace = useAdminWorkspace();
  const state = useAdminResource(workspace?.tenantId, listGallery);

  if (state.status === 'loading') {
    return <ModuleSkeleton rows={3} />;
  }

  const photos = state.status === 'ready' ? state.data : [];
  const error = state.status === 'error' ? state.message : null;

  return (
    <GalleryManager
      photos={photos}
      error={error}
      tenantId={workspace?.tenantId ?? ''}
    />
  );
}
