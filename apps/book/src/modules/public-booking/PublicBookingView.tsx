import { PublicPortal } from './components/PublicPortal';
import { UnavailablePanel } from './components/UnavailablePanel';
import { getPublicBusiness } from './utils/queries';

/** Public mini-site view (server): resolves a tenant slug and renders its portal. */
export function PublicBookingView({ slug }: { slug: string }) {
  const resolved = getPublicBusiness(slug);

  if (resolved.status !== 'available') {
    const message =
      resolved.reason === 'not-found'
        ? 'No encontramos ese negocio.'
        : 'Este negocio no está disponible en este momento.';
    return <UnavailablePanel message={message} />;
  }

  return <PublicPortal profile={resolved.business} />;
}
