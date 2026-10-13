import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { resolveTenantSession } from '../../shared/infra/authServer';
import { getCurrentTenant } from '../../shared/tenancy/queries';
import { AdminShell } from '../../shared/components/AdminShell';
import { LOGIN_ROUTE, REGISTRATION_ROUTE } from '../../shared/infra/authConstants';

/**
 * Private workspace: session/tenant guard (FR-016, feature 009 — US2) + shared
 * Drawer shell. Unauthenticated → `/login`; authenticated but unbound → onboarding.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await resolveTenantSession();
  if (!auth.ok) {
    redirect(auth.error.code === 'FORBIDDEN' ? REGISTRATION_ROUTE : LOGIN_ROUTE);
  }
  const tenant = await getCurrentTenant(auth.data);
  const publicHref = tenant.ok && tenant.data.slug ? `/${tenant.data.slug}` : null;
  return (
    <AdminShell tenantName={tenant.ok ? tenant.data.name : undefined} publicHref={publicHref}>
      {children}
    </AdminShell>
  );
}
