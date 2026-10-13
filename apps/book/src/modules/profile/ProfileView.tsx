import { ProfileEditor } from './components/ProfileEditor';
import { getProfile } from './actions';
import { getAdminTenantId } from '../../shared/tenancy/queries';

/** Profile module view (server): real editable profile for the tenant. */
export async function ProfileView() {
  const tenantId = await getAdminTenantId();
  const profile = await getProfile(tenantId);
  if (!profile.ok) {
    return <ProfileEditor profile={null} error={profile.error.message} />;
  }
  return <ProfileEditor profile={profile.data} />;
}
