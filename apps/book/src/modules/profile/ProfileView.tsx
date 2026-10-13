import { ProfileEditor } from './components/ProfileEditor';
import { getTenantProfile, listPolicies } from './actions';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Profile module view (server): profile via API + empty policies (no backend). */
export async function ProfileView() {
  const tenantId = await getAdminTenantId();
  const profile = await getTenantProfile(tenantId);
  if (!profile.ok) {
    return <ProfileEditor profile={null} policies={[]} error={profile.error.message} />;
  }
  return <ProfileEditor profile={profile.data} policies={listPolicies()} />;
}