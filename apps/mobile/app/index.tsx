import { Redirect } from 'expo-router';
import { useSession } from '@/shared/auth/session-context';
import { LOGIN_ROUTE, TABS_ROUTE } from '@/shared/auth/guards';
import { LoadingState } from '@/shared/ui/LoadingState';

export default function IndexRoute() {
  const { status } = useSession();

  if (status === 'loading') return <LoadingState />;
  if (status === 'authenticated') return <Redirect href={TABS_ROUTE} />;
  return <Redirect href={LOGIN_ROUTE} />;
}
