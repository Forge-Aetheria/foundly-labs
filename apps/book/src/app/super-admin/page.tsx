import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from '@/shared/compat/useAppRouter';
import { SUPER_ADMIN_PAGE_SIZE, SuperAdminView } from '../../modules/super-admin/SuperAdminView';
import { getManagedBusinesses, getPlatformMetrics } from '../../modules/super-admin/services';
import { queryKeys } from '../../shared/api/query-client';
import { PageMeta } from '../../shared/components/PageMeta';
import { RouteLoading } from '../../shared/components/RouteStates';
import type { ActionResult } from '../../shared/types/result';

declare class CodedError extends Error {
  code?: string;
}

function asError<T>(result: ActionResult<T>): T {
  if (!result.ok) {
    const error = new Error(result.error.message) as CodedError;
    error.code = result.error.code;
    throw error;
  }
  return result.data;
}

/** Super Admin console (020; SPA feature 024). */
export default function SuperAdminPage() {
  const params = useSearchParams();
  const query = params.get('q') ?? '';
  const rawPage = Number.parseInt(params.get('page') ?? '', 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const metrics = useQuery({
    queryKey: queryKeys.platformMetrics(),
    queryFn: async () => asError(await getPlatformMetrics()),
    retry: 0,
  });

  const businesses = useQuery({
    queryKey: queryKeys.managedBusinesses(query, page),
    enabled: metrics.isSuccess,
    queryFn: async () =>
      asError(
        await getManagedBusinesses({
          query,
          limit: SUPER_ADMIN_PAGE_SIZE,
          offset: (page - 1) * SUPER_ADMIN_PAGE_SIZE,
        }),
      ),
  });

  if (metrics.isLoading || (metrics.isSuccess && businesses.isLoading)) {
    return (
      <>
        <PageMeta title="Super Admin" />
        <RouteLoading />
      </>
    );
  }

  if (metrics.isError) {
    const code = (metrics.error as CodedError).code;
    const denied = code === 'FORBIDDEN' || code === 'UNAUTHENTICATED';
    return (
      <>
        <PageMeta title="Super Admin" />
        <SuperAdminView
          query={query}
          page={page}
          metrics={null}
          businesses={[]}
          denied={denied}
          error={!denied}
        />
      </>
    );
  }

  return (
    <>
      <PageMeta title="Super Admin" description="Consola de administración global de Foundly Labs." />
      <SuperAdminView
        query={query}
        page={page}
        metrics={metrics.data ?? null}
        businesses={businesses.data ?? []}
        denied={false}
        error={businesses.isError}
      />
    </>
  );
}
