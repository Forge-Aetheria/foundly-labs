'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModuleSkeleton } from '../../../shared/components/ModuleSkeleton';
import { AgendaView } from '../../../modules/agenda/AgendaView';

function AgendaRoute() {
  const searchParams = useSearchParams();
  return (
    <AgendaView
      from={searchParams.get('from') ?? undefined}
      to={searchParams.get('to') ?? undefined}
    />
  );
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<ModuleSkeleton rows={5} />}>
      <AgendaRoute />
    </Suspense>
  );
}
