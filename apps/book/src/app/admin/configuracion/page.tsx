'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ConfigurationView,
  parseConfigurationTab,
} from '../../../modules/configuration/ConfigurationView';
import { ModuleSkeleton } from '../../../shared/components/ModuleSkeleton';

function ConfiguracionRoute() {
  const searchParams = useSearchParams();
  return <ConfigurationView initialTab={parseConfigurationTab(searchParams.get('tab'))} />;
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<ModuleSkeleton rows={3} />}>
      <ConfiguracionRoute />
    </Suspense>
  );
}
