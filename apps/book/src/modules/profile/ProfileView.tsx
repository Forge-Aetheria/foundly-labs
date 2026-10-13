import { ProfileEditor } from './components/ProfileEditor';
import { getTenantProfile, listPolicies } from './utils/queries';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Profile module view (server): tenant profile + policies for the editor. */
export async function ProfileView() {
  const tenantId = await getAdminTenantId();
  const profile = getTenantProfile(tenantId);
  if (!profile) return null;
  return <ProfileEditor profile={profile} policies={listPolicies(tenantId)} />;
}
