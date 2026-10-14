import { AgendaView } from '../../../modules/agenda/AgendaView';

export const dynamic = 'force-dynamic';

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  return <AgendaView from={from} to={to} />;
}
