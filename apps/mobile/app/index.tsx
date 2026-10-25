import { Redirect } from 'expo-router';
import { useSession } from '@/shared/auth/session-context';
import { DRAWER_HOME_ROUTE, LOGIN_ROUTE } from '@/shared/auth/guards';
import { LoadingState } from '@/shared/ui/LoadingState';

export default function IndexRoute() {
  const { status } = useSession();

  if (status === 'loading') return <LoadingState />;
  if (status === 'authenticated') return <Redirect href={DRAWER_HOME_ROUTE} />;
  return <Redirect href={LOGIN_ROUTE} />;
}
