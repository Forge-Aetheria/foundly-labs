import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LOGIN_ROUTE, shouldShowTabs } from '@/shared/auth/guards';
import { useSession } from '@/shared/auth/session-context';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { colors, spacing } from '@/shared/theme/tokens';

export default function TabsLayout() {
  const { status, signOut } = useSession();

  if (status === 'loading') return null;
  if (!shouldShowTabs(status) && status !== 'missing-tenant') {
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

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="notificaciones" options={{ title: 'Notificaciones' }} />
      <Tabs.Screen name="configuracion" options={{ title: 'Configuración' }} />
    </Tabs>
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
});
