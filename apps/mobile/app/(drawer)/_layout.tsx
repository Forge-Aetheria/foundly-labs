import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet, View } from 'react-native';
import { useSignOut } from '@/modules/auth/hooks';
import { useMyBusiness } from '@/modules/settings/hooks';
import { LOGIN_ROUTE, shouldShowDrawer } from '@/shared/auth/guards';
import { useSession } from '@/shared/auth/session-context';
import { env } from '@/shared/config/env';
import { AppDrawerContent } from '@/shared/navigation/AppDrawerContent';
import { AppHeader } from '@/shared/navigation/AppHeader';
import { NAVIGATION_MODULES } from '@/shared/navigation/modules';
import { buildPublicPageUrl } from '@/shared/navigation/public-page';
import { deriveWorkspaceIdentity } from '@/shared/navigation/session-identity';
import { colors, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';

export const unstable_settings = { initialRouteName: 'agenda' };

export default function DrawerLayout() {
  const { status, session, signOut } = useSession();
  const business = useMyBusiness();
  const signOutMutation = useSignOut();

  if (status === 'loading') return null;
  if (!shouldShowDrawer(status) && status !== 'missing-tenant') {
    return <Redirect href={LOGIN_ROUTE} />;
  }

  if (status === 'missing-tenant') {
    return (
      <View style={styles.centered}>
        <AppText variant="heading">Sin negocio asociado</AppText>
        <AppText color={colors.textSecondary} style={styles.message}>
          Tu cuenta no está vinculada a un tenant de Foundly. Contacta con soporte o vuelve a
          iniciar sesión.
        </AppText>
        <Button label="Cerrar sesión" onPress={() => void signOut()} />
      </View>
    );
  }

  const identity = {
    ...deriveWorkspaceIdentity(session),
    tenantName: business.data?.name ?? null,
    tenantLogoUrl: business.data?.profile?.logo ?? null,
  };
  const publicPageHref = buildPublicPageUrl(env.bookUrl, business.data?.profile?.slug);

  const handleLogout = () => {
    void signOutMutation.mutateAsync();
  };

  return (
    <Drawer
      backBehavior="initialRoute"
      screenOptions={{
        header: ({ navigation }) => (
          <AppHeader
            identity={identity}
            onOpenDrawer={() => navigation.openDrawer()}
            onOpenNotifications={() => navigation.navigate('notificaciones' as never)}
          />
        ),
        drawerType: 'front',
        drawerStyle: styles.drawer,
        sceneStyle: styles.scene,
      }}
      drawerContent={(props) => (
        <AppDrawerContent
          {...props}
          identity={identity}
          publicPageHref={publicPageHref}
          onLogout={handleLogout}
          isLoggingOut={signOutMutation.isPending}
        />
      )}
    >
      {NAVIGATION_MODULES.map((module) => (
        <Drawer.Screen key={module.id} name={module.id} options={{ title: module.label }} />
      ))}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  message: { textAlign: 'center' },
  drawer: { width: 310, backgroundColor: colors.surface },
  scene: { backgroundColor: colors.background },
});
