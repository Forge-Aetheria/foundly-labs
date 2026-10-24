'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '../../shared/components/AdminShell';
import { AdminWorkspaceProvider } from '../../shared/admin/AdminWorkspaceContext';
import { LOGIN_ROUTE } from '../../shared/auth/authConstants';
import { loadAdminWorkspace, type AdminWorkspaceData } from '../../shared/tenancy/adminWorkspace';

/**
 * Admin shell layout (Client Component): renders the navigation instantly and
 * resolves the workspace (tenant + public slug) asynchronously. Route protection
 * lives in `middleware.ts`, so child navigations never wait on server rendering.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<AdminWorkspaceData | null>(null);

  useEffect(() => {
    let active = true;

    loadAdminWorkspace()
      .then((result) => {
        if (!active) {
          return;
        }
        if (!result.ok) {
          router.replace(result.redirectTo);
          return;
        }
        setWorkspace(result.data);
      })
      .catch(() => {
        if (active) {
          router.replace(LOGIN_ROUTE);
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <AdminWorkspaceProvider value={workspace}>
      <AdminShell
        tenantName={workspace?.tenantName}
        publicHref={workspace?.publicHref}
        isPublic={workspace?.isPublic}
      >
        {children}
      </AdminShell>
    </AdminWorkspaceProvider>
  );
}
