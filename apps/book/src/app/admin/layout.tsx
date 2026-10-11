import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentSession, requireTenant } from '../../shared/infra/auth';
import { getCurrentTenant } from '../../shared/tenancy/queries';
import { AdminShell } from '../../shared/components/AdminShell';

/** Private workspace: session/tenant guard (FR-016) + shared Drawer shell. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const auth = requireTenant(getCurrentSession());
  if (!auth.ok) {
    redirect('/onboarding');
  }
  const tenant = getCurrentTenant(auth.data);
  return <AdminShell tenantName={tenant.ok ? tenant.data.name : undefined}>{children}</AdminShell>;
}
