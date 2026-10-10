import { GalleryManager } from '../../../features/storefront/components/GalleryManager';
import { listGallery } from '../../../features/storefront/queries';
import { getAdminTenantId } from '../../../features/tenants/queries';

export const dynamic = 'force-dynamic';

export default function GalleryPage() {
  const tenantId = getAdminTenantId();
  return <GalleryManager gallery={listGallery(tenantId)} />;
}