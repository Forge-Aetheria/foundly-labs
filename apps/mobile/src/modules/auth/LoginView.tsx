import { StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Screen } from '@/shared/ui/Screen';
import { colors, spacing } from '@/shared/theme/tokens';
import { LoginForm } from './components/LoginForm';
import { useSignIn } from './hooks';

export function LoginView() {
  const signIn = useSignIn();

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} padded>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="title">Foundly Tenant</AppText>
          <AppText color={colors.textSecondary}>
            Administra tu agenda, notificaciones y página pública desde el móvil.
          </AppText>
        </View>
        <LoginForm
          onSubmit={async (values) => {
            const result = await signIn.mutateAsync(values);
            return result.ok ? null : result.message;
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: spacing.xxl },
  header: { gap: spacing.sm },
});
