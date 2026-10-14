import type { Metadata } from 'next';
import { SuperAdminView, SUPER_ADMIN_PAGE_SIZE } from '../../modules/super-admin/SuperAdminView';
import {
  getManagedBusinesses,
  getPlatformMetrics,
} from '../../modules/super-admin/actions';

export const metadata: Metadata = {
  title: 'Super Admin — Foundly Book',
  description: 'Consola de administración global de Foundly Labs.',
};

export const dynamic = 'force-dynamic';

interface SuperAdminPageProps {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}

function firstParam(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : Array.isArray(value) ? (value[0] ?? '') : '';
}

/** Super Admin console (020): thin route that resolves `q`/`page` and renders the view. */
export default async function SuperAdminPage({ searchParams }: SuperAdminPageProps) {
  const params = await searchParams;
  const query = firstParam(params.q);
  const rawPage = Number.parseInt(firstParam(params.page), 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const metricsResult = await getPlatformMetrics();
  if (!metricsResult.ok) {
    const denied =
      metricsResult.error.code === 'FORBIDDEN' || metricsResult.error.code === 'UNAUTHENTICATED';
    return (
      <SuperAdminView
        query={query}
        page={page}
        metrics={null}
        businesses={[]}
        denied={denied}
        error={!denied}
      />
    );
  }

  const listResult = await getManagedBusinesses({
    query,
    limit: SUPER_ADMIN_PAGE_SIZE,
    offset: (page - 1) * SUPER_ADMIN_PAGE_SIZE,
  });

  return (
    <SuperAdminView
      query={query}
      page={page}
      metrics={metricsResult.data}
      businesses={listResult.ok ? listResult.data : []}
      denied={false}
      error={!listResult.ok}
    />
  );
}
