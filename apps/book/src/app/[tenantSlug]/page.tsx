import type { Metadata } from 'next';
import { PublicBookingView } from '../../modules/public-booking/PublicBookingView';

interface TenantPortalPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export const metadata: Metadata = {
  title: 'Foundly Book',
};

export const dynamic = 'force-dynamic';

/** Public mini-site (public `/book/<slug>`, guest booking): thin route. */
export default async function TenantPortalPage({ params }: TenantPortalPageProps) {
  const { tenantSlug } = await params;
  return <PublicBookingView slug={tenantSlug} />;
}
