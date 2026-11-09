import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../../auth/session-context';
import { POST_LOGIN_ROUTE } from '../../auth/guards';
import { RouteLoading } from '../RouteStates';

/** Keeps authenticated users away from `/login` (redirect to the panel). */
export function RequireAnonymous() {
  const { status } = useSession();

  if (status === 'loading') {
    return <RouteLoading />;
  }
  if (status === 'authenticated' || status === 'missing-tenant') {
    return <Navigate to={POST_LOGIN_ROUTE} replace />;
  }
  return <Outlet />;
}
