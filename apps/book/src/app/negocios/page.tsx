import type { Metadata } from 'next';
import { DirectoryView } from '../../modules/directory/DirectoryView';
import { getDirectoryBusinesses } from '../../modules/directory/actions';

export const metadata: Metadata = {
  title: 'Negocios — Foundly Book',
  description: 'Descubre negocios y reserva tu cita en segundos.',
};

export const dynamic = 'force-dynamic';

interface NegociosPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

/** Public business directory (019): thin route that resolves `q` and renders the view. */
export default async function NegociosPage({ searchParams }: NegociosPageProps) {
  const params = await searchParams;
  const raw = params.q;
  const query = typeof raw === 'string' ? raw : Array.isArray(raw) ? (raw[0] ?? '') : '';

  // Load the full catalog once; the client view filters instantly by term/category.
  const result = await getDirectoryBusinesses('');

  return (
    <DirectoryView
      query={query}
      businesses={result.ok ? result.data : []}
      error={!result.ok}
    />
  );
}
