import { PublicPortal } from './components/PublicPortal';
import { UnavailablePanel } from './components/UnavailablePanel';
import { getPublicBusinessRemote } from './utils/queries';

/** Public mini-site view (server): resolves a tenant slug and renders its portal. */
export async function PublicBookingView({ slug }: { slug: string }) {
  const resolved = await getPublicBusinessRemote(slug);

  if (resolved.status !== 'available') {
    const message =
      resolved.reason === 'not-found'
        ? 'No encontramos ese negocio.'
        : 'Este negocio no está disponible en este momento.';
    return <UnavailablePanel message={message} />;
  }

  return <PublicPortal profile={resolved.business} />;
}