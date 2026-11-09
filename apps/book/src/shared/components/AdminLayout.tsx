import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { LOGIN_ROUTE, REGISTRATION_ROUTE } from '../auth/guards';
import { useSession } from '../auth/session-context';
import { AdminWorkspaceProvider } from '../admin/AdminWorkspaceContext';
import { useAdminWorkspaceData } from '../tenancy/adminWorkspace';
import { NotificationsProvider } from '../../modules/notifications/NotificationsProvider';
import { NotificationBell } from '../../modules/notifications/components/NotificationBell';
import { AdminShell } from './AdminShell';
import { RouteError, RouteLoading } from './RouteStates';

/**
 * Admin shell layout (feature 024): resolves the session-scoped workspace with a
 * query and keeps the client shell responsive while it loads.
 */
export function AdminLayout({ children }: { children?: ReactNode }) {
  const { status } = useSession();
  const workspace = useAdminWorkspaceData();

  if (status === 'loading' || workspace.isLoading) {
    return <RouteLoading />;
  }
  if (status === 'anonymous') {
    return <Navigate to={LOGIN_ROUTE} replace />;
  }
  if (status === 'missing-tenant') {
    return <Navigate to={REGISTRATION_ROUTE} replace />;
  }
  if (workspace.isError) {
    return <RouteError message={workspace.error.message} onRetry={() => void workspace.refetch()} />;
  }

  const data = workspace.data ?? null;

  return (
    <AdminWorkspaceProvider value={data}>
      <NotificationsProvider>
        <AdminShell
          tenantName={data?.tenantName}
          publicHref={data?.publicHref}
          isPublic={data?.isPublic}
          userName={data?.userName}
          userEmail={data?.userEmail}
          userAvatar={data?.userAvatar}
          headerActions={<NotificationBell />}
        >
          {children ?? <Outlet />}
        </AdminShell>
      </NotificationsProvider>
    </AdminWorkspaceProvider>
  );
}
