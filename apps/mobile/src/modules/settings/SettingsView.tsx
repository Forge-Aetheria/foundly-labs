import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { colors, spacing } from '@/shared/theme/tokens';
import { useSignOut } from '@/modules/auth/hooks';
import { ProfileSummary } from './components/ProfileSummary';
import { PublicPageToggle } from './components/PublicPageToggle';
import { useMyBusiness, useUpdatePublicPage } from './hooks';

export function SettingsView() {
  const business = useMyBusiness();
  const updatePublicPage = useUpdatePublicPage();
  const signOut = useSignOut();

  if (business.isLoading) {
    return (
      <Screen>
        <LoadingState label="Cargando configuración…" />
      </Screen>
    );
  }

  if (business.isError || !business.data) {
    return (
      <Screen>
        <ErrorState
          message={business.error?.message ?? 'No pudimos cargar tu negocio.'}
          onRetry={() => void business.refetch()}
        />
      </Screen>
    );
  }

  const canPublish = Boolean(business.data.profile?.slug);

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="title">Configuración</AppText>
          <AppText color={colors.textSecondary}>
            Resumen de tu negocio y visibilidad pública
          </AppText>
        </View>
        <ProfileSummary business={business.data} />
        <PublicPageToggle
          value={business.data.isPublic}
          canPublish={canPublish}
          pending={updatePublicPage.isPending}
          error={updatePublicPage.isError ? updatePublicPage.error.message : null}
          onChange={(isPublic) => updatePublicPage.mutate(isPublic)}
        />
        <View style={styles.footer}>
          <AppText variant="caption" color={colors.textMuted}>
            Foundly Tenant v{Constants.expoConfig?.version ?? '0.1.0'}
          </AppText>
          <Button
            label="Cerrar sesión"
            variant="secondary"
            onPress={() => void signOut.mutateAsync()}
            loading={signOut.isPending}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: spacing.lg, paddingVertical: spacing.lg },
  header: { gap: spacing.xs },
  footer: { marginTop: 'auto', gap: spacing.md, paddingTop: spacing.lg },
});
