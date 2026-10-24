import { PublicPortal } from './components/PublicPortal';
import { UnavailablePanel } from './components/UnavailablePanel';
import { getPublicBusinessRemote } from './actions';

/** Public mini-site view (server): resolves a tenant slug and renders its portal. */
export async function PublicBookingView({ slug }: { slug: string }) {
  const resolved = await getPublicBusinessRemote(slug);

  if (resolved.status !== 'available') {
    if (resolved.reason === 'disabled') {
      return (
        <UnavailablePanel
          title="Página no disponible temporalmente"
          message="Este negocio ha desactivado temporalmente su página pública y no acepta reservas online."
        />
      );
    }
    const message =
      resolved.reason === 'not-found'
        ? 'No encontramos ese negocio.'
        : 'Este negocio no está disponible en este momento.';
    return <UnavailablePanel message={message} />;
  }

  return <PublicPortal profile={resolved.business} />;
}