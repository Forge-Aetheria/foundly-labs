import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../../auth/session-context';
import { LOGIN_ROUTE, REGISTRATION_ROUTE } from '../../auth/guards';
import { RouteLoading } from '../RouteStates';

/**
 * Requires an authenticated, tenant-bound session for the admin workspace.
 * Anonymous → `/login`; authenticated without a business → onboarding.
 */
export function RequireTenant() {
  const { status } = useSession();
  const location = useLocation();

  if (status === 'loading') {
    return <RouteLoading />;
  }
  if (status === 'anonymous') {
    return (
      <Navigate
        to={LOGIN_ROUTE}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  if (status === 'missing-tenant') {
    return <Navigate to={REGISTRATION_ROUTE} replace />;
  }
  return <Outlet />;
}
