import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../../auth/session-context';
import { LOGIN_ROUTE } from '../../auth/guards';
import { RouteLoading } from '../RouteStates';

/**
 * Requires any authenticated session. Anonymous visitors are sent to `/login`
 * remembering the intended path; missing-tenant sessions are handled by
 * `<RequireTenant>` for the admin area.
 */
export function RequireAuth() {
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
  return <Outlet />;
}
