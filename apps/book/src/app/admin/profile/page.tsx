import { ProfileEditor } from '../../../features/storefront/components/ProfileEditor';
import { listPolicies, getTenantProfile } from '../../../features/storefront/queries';
import { getAdminTenantId } from '../../../features/tenants/queries';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const tenantId = getAdminTenantId();
  const profile = getTenantProfile(tenantId);
  if (!profile) return null;
  return <ProfileEditor profile={profile} policies={listPolicies(tenantId)} />;
}