import { useParams } from 'react-router-dom';
import { PublicBookingView } from '../../modules/public-booking/PublicBookingView';

/** Public mini-site route (dynamic `/:tenantSlug`). */
export default function TenantPortalPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  return <PublicBookingView slug={tenantSlug ?? ''} />;
}
