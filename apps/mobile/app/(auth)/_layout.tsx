import { Redirect, Stack } from 'expo-router';
import { DRAWER_HOME_ROUTE, shouldRedirectAwayFromLogin } from '@/shared/auth/guards';
import { useSession } from '@/shared/auth/session-context';

export default function AuthLayout() {
  const { status } = useSession();

  if (shouldRedirectAwayFromLogin(status)) {
    return <Redirect href={DRAWER_HOME_ROUTE} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
