import { GalleryManager } from './components/GalleryManager';
import { listGallery } from './utils/queries';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Gallery module view (server): photo catalog for the manager. */
export async function GalleryView() {
  const tenantId = await getAdminTenantId();
  return <GalleryManager gallery={listGallery(tenantId)} />;
}
