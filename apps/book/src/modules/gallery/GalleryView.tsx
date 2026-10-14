import { GalleryManager } from './components/GalleryManager';
import { listGallery } from './actions';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Gallery module view (server): real photos for the tenant from the backend. */
export async function GalleryView() {
  const tenantId = await getAdminTenantId();
  const result = await listGallery(tenantId);
  const photos = result.ok ? result.data : [];
  const error = result.ok ? null : result.error.message;
  return <GalleryManager photos={photos} error={error} tenantId={tenantId} />;
}
