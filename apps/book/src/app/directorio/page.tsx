import type { Metadata } from 'next';
import { DirectoryView } from '../../modules/directory/DirectoryView';
import { getDirectoryBusinesses } from '../../modules/directory/actions';

export const metadata: Metadata = {
  title: 'Directorio de negocios — Foundly Book',
  description: 'Descubre negocios y reserva tu cita en segundos.',
};

export const dynamic = 'force-dynamic';

interface DirectoryPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

/** Public discovery directory (019): thin route that resolves `q` and renders the view. */
export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const params = await searchParams;
  const raw = params.q;
  const query = typeof raw === 'string' ? raw : Array.isArray(raw) ? (raw[0] ?? '') : '';

  const result = await getDirectoryBusinesses(query);

  return (
    <DirectoryView
      query={query}
      businesses={result.ok ? result.data : []}
      error={!result.ok}
    />
  );
}
