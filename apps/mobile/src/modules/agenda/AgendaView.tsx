import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { useRefetchOnFocus } from '@/shared/hooks/use-refetch-on-focus';
import { Screen } from '@/shared/ui/Screen';
import { colors, spacing } from '@/shared/theme/tokens';
import { AppointmentCard } from './components/AppointmentCard';
import { EmptyAgenda } from './components/EmptyAgenda';
import { formatAppointmentDate, getAgendaRange } from './date-range';
import { useAgenda } from './hooks';

export function AgendaView() {
  const range = useMemo(
    () => getAgendaRange(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone),
    [],
  );
  const { data, error, isLoading, isFetching, refetch, isRefetching, isError } = useAgenda(range);
  const today = formatAppointmentDate(new Date().toISOString());
  useRefetchOnFocus(refetch);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState label="Cargando agenda…" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState
          message={error?.message ?? 'No pudimos cargar la agenda.'}
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
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <AppText variant="title">Agenda</AppText>
              <AppText color={colors.textSecondary} style={styles.capitalize}>
                {today}
              </AppText>
            </View>
          }
          ListEmptyComponent={<EmptyAgenda />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
        />
        {isFetching && !isLoading ? (
          <LoadingState variant="overlay" label="Actualizando agenda…" />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContainer: { flex: 1 },
  list: { gap: spacing.md, paddingVertical: spacing.lg },
  header: { gap: spacing.xs, paddingBottom: spacing.sm },
  capitalize: { textTransform: 'capitalize' },
});
