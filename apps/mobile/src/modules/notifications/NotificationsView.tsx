import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { colors, spacing } from '@/shared/theme/tokens';
import { NotificationRow } from './components/NotificationRow';
import { NotificationsEmpty } from './components/NotificationsEmpty';
import { useMarkNotificationRead, useNotifications } from './hooks';

export function NotificationsView() {
  const { data, error, isLoading, isFetching, isError, refetch, isRefetching } = useNotifications();
  const markRead = useMarkNotificationRead();

  if (isLoading) {
    return (
      <Screen>
        <LoadingState label="Cargando notificaciones…" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState
          message={error?.message ?? 'No pudimos cargar las notificaciones.'}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.listContainer}>
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <AppText variant="title">Notificaciones</AppText>
              <AppText color={colors.textSecondary}>Novedades de tu negocio</AppText>
            </View>
          }
          ListEmptyComponent={<NotificationsEmpty />}
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={() => {
                if (!item.read) markRead.mutate(item.id);
              }}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
        />
        {isFetching && !isLoading ? (
          <LoadingState variant="overlay" label="Actualizando notificaciones…" />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContainer: { flex: 1 },
  list: { gap: spacing.md, paddingVertical: spacing.lg },
  header: { gap: spacing.xs, paddingBottom: spacing.sm },
});
