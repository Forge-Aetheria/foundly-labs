import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from '@/shared/compat/useAppRouter';
import { getDirectoryBusinesses } from '../../modules/directory/services';
import { DirectoryView } from '../../modules/directory/DirectoryView';
import { queryKeys } from '../../shared/api/query-client';
import { PageMeta } from '../../shared/components/PageMeta';

/** Public business directory (`/negocios`). Loads the catalog once; filters client-side. */
export default function NegociosPage() {
  const params = useSearchParams();
  const query = params.get('q') ?? '';

  const catalog = useQuery({
    queryKey: queryKeys.directory('', null),
    queryFn: async () => {
      const result = await getDirectoryBusinesses('');
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });

  if (catalog.isLoading) {
    return (
      <>
        <PageMeta title="Negocios" description="Descubre negocios y reserva tu cita." />
        <DirectoryView query={query} businesses={[]} error={false} loading />
      </>
    );
  }

  return (
    <>
      <PageMeta title="Negocios" description="Descubre negocios y reserva tu cita." />
      <DirectoryView query={query} businesses={catalog.data ?? []} error={catalog.isError} />
    </>
  );
}
