import { Redirect, Stack } from 'expo-router';
import { shouldRedirectAwayFromLogin, TABS_ROUTE } from '@/shared/auth/guards';
import { useSession } from '@/shared/auth/session-context';

export default function AuthLayout() {
  const { status } = useSession();

  if (shouldRedirectAwayFromLogin(status)) {
    return <Redirect href={TABS_ROUTE} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
