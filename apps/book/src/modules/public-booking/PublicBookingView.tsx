import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../shared/api/query-client';
import { PageMeta } from '../../shared/components/PageMeta';
import { RouteLoading } from '../../shared/components/RouteStates';
import { PublicPortal } from './components/PublicPortal';
import { UnavailablePanel } from './components/UnavailablePanel';
import { getPublicBusinessRemote } from './services';

/** Public mini-site view (SPA): resolves a tenant slug and renders its portal. */
export function PublicBookingView({ slug }: { slug: string }) {
  const resolved = useQuery({
    queryKey: queryKeys.publicBusiness(slug),
    queryFn: () => getPublicBusinessRemote(slug),
    enabled: Boolean(slug),
  });

  if (resolved.isLoading) {
    return <RouteLoading />;
  }

  const data = resolved.data ?? { status: 'unavailable' as const, reason: 'not-found' as const };

  if (data.status !== 'available') {
    if (data.reason === 'disabled') {
      return (
        <>
          <PageMeta title="Página no disponible" />
          <UnavailablePanel
            title="Página no disponible temporalmente"
            message="Este negocio ha desactivado temporalmente su página pública y no acepta reservas online."
          />
        </>
      );
    }
    const message =
      data.reason === 'not-found'
        ? 'No encontramos ese negocio.'
        : 'Este negocio no está disponible en este momento.';
    return (
      <>
        <PageMeta title="Negocio no disponible" />
        <UnavailablePanel message={message} />
      </>
    );
  }

  return (
    <>
      <PageMeta title={data.business.name} description={data.business.bio ?? undefined} />
      <PublicPortal profile={data.business} />
    </>
  );
}
