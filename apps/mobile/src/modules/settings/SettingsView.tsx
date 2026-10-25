import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { colors, spacing } from '@/shared/theme/tokens';
import { useRefetchOnFocus } from '@/shared/hooks/use-refetch-on-focus';
import { ConfigurationTabs, type ConfigurationTab } from './components/ConfigurationTabs';
import { PaymentsSettingsTab } from './components/PaymentsSettingsTab';
import { ProfileSettingsTab } from './components/ProfileSettingsTab';
import { SecuritySettingsTab } from './components/SecuritySettingsTab';
import { useMyBusiness } from './hooks';

export function SettingsView() {
  const business = useMyBusiness();
  const [tab, setTab] = useState<ConfigurationTab>('perfil');
  useRefetchOnFocus(business.refetch);

  if (business.isLoading) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <LoadingState label="Cargando configuración…" />
      </Screen>
    );
  }

  if (business.isError || !business.data) {
    return (
      <Screen edges={['left', 'right', 'bottom']}>
        <ErrorState
          message={business.error?.message ?? 'No pudimos cargar tu negocio.'}
          onRetry={() => void business.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="title">Configuración</AppText>
          <AppText color={colors.textSecondary}>
            Administra el perfil de tu negocio, tus métodos de pago y tus credenciales.
          </AppText>
        </View>
        <ConfigurationTabs active={tab} onChange={setTab} />
        <View style={styles.panel}>
          {tab === 'perfil' ? <ProfileSettingsTab business={business.data} /> : null}
          {tab === 'pagos' ? <PaymentsSettingsTab /> : null}
          {tab === 'seguridad' ? <SecuritySettingsTab /> : null}
        </View>
        {business.isFetching ? (
          <LoadingState variant="overlay" label="Actualizando configuración…" />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: spacing.lg, paddingTop: spacing.lg },
  header: { gap: spacing.xs },
  panel: { flex: 1 },
});
