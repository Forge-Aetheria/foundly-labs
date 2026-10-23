'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';

/** `/admin` index: client-side redirect to the default section (Agenda). */
export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/agenda');
  }, [router]);

  return <ModuleSkeleton />;
}
