'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleSkeleton } from '../../../shared/components/ModuleSkeleton';

/** Legacy route: the business profile now lives inside Configuración. */
export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/configuracion?tab=perfil');
  }, [router]);

  return <ModuleSkeleton rows={3} />;
}
