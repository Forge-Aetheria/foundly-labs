'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleSkeleton } from '../../../shared/components/ModuleSkeleton';

/** Legacy route: security settings now live inside Configuración. */
export default function SeguridadPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/configuracion?tab=seguridad');
  }, [router]);

  return <ModuleSkeleton rows={3} />;
}
