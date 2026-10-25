import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { useRefetchOnFocus } from '@/shared/hooks/use-refetch-on-focus';
import { defaultDays, daysFromRules, validateDays, type DayDraft } from './availability-utils';
import { useAvailability, useRemoveTimeBlock, useSaveAvailability, useTimeBlocks } from './hooks';
import { TimeBlockCard } from './components/TimeBlockCard';
import { TimeBlockFormModal } from './components/TimeBlockFormModal';
import { WeeklyScheduleCard } from './components/WeeklyScheduleCard';

export function AvailabilityView() {
  const availability = useAvailability();
  const blocks = useTimeBlocks();
  const save = useSaveAvailability();
  const removeBlock = useRemoveTimeBlock();
  const [days, setDays] = useState<DayDraft[]>(defaultDays);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const refetchAll = useCallback(() => {
    void availability.refetch();
    void blocks.refetch();
  }, [availability.refetch, blocks.refetch]);
  useRefetchOnFocus(refetchAll);

  useEffect(() => {
    if (availability.data && !dirty) {
      setDays(daysFromRules(availability.data));
    }
  }, [availability.data, dirty]);

  if (availability.isLoading || blocks.isLoading) {
    return (
      <Screen>
        <LoadingState label="Cargando disponibilidad…" />
      </Screen>
    );
  }

  if (availability.isError || blocks.isError) {
    return (
      <Screen>
        <ErrorState
          message={
            availability.error?.message ??
            blocks.error?.message ??
            'No pudimos cargar la disponibilidad.'
          }
          onRetry={() => {
            void availability.refetch();
            void blocks.refetch();
          }}
        />
      </Screen>
    );
  }

  function updateDay(weekday: number, patch: Partial<DayDraft>) {
    setDirty(true);
    setNotice(null);
    setDays((prev) => prev.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)));
  }

  async function saveSchedule() {
    const nextErrors = validateDays(days);
    setErrors(nextErrors);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await save.mutateAsync(days);
      setDirty(false);
      setNotice('Horario semanal guardado.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No pudimos guardar el horario.');
    }
  }

  function confirmDeleteBlock(id: string) {
    Alert.alert('Eliminar bloqueo', '¿Seguro que quieres eliminar este bloqueo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeBlock.mutate(id),
      },
    ]);
  }

  const blockItems = blocks.data ?? [];
  const actionError = removeBlock.error?.message ?? null;
  const refreshing = availability.isRefetching || blocks.isRefetching;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="title">Disponibilidad</AppText>
            <AppText color={colors.textSecondary}>
              Configura tu horario semanal y los bloqueos puntuales de agenda.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nuevo bloqueo"
            onPress={() => setBlockFormOpen(true)}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
          </Pressable>
        </View>

        <View style={styles.scrollContainer}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void availability.refetch();
                  void blocks.refetch();
                }}
                tintColor={colors.primary}
              />
            }
          >
            <WeeklyScheduleCard
              days={days}
              errors={errors}
              disabled={save.isPending}
              onChange={updateDay}
            />

            {notice ? (
              <AppText
                variant="caption"
                color={notice.includes('guardado') ? colors.positive : colors.negative}
                accessibilityRole="alert"
              >
                {notice}
              </AppText>
            ) : null}

            <Button
              label={save.isPending ? 'Guardando…' : 'Guardar horario semanal'}
              loading={save.isPending}
              onPress={() => void saveSchedule()}
            />

            <View style={styles.blocksSection}>
              <View style={styles.blocksHeader}>
                <View style={styles.headerCopy}>
                  <AppText variant="heading">Bloqueos puntuales</AppText>
                  <AppText color={colors.textSecondary}>
                    Excepciones de fecha y hora para tu agenda.
                  </AppText>
                </View>
              </View>

              {actionError ? (
                <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
                  {actionError}
                </AppText>
              ) : null}

              {blockItems.length === 0 ? (
                <View style={styles.emptyBlocks}>
                  <Ionicons name="calendar-clear-outline" size={26} color={colors.textMuted} />
                  <AppText variant="label">No hay bloqueos configurados</AppText>
                  <AppText variant="caption" color={colors.textSecondary} style={styles.center}>
                    Añade un bloqueo para cerrar una fecha o franja concreta.
                  </AppText>
                </View>
              ) : (
                blockItems.map((block) => (
                  <TimeBlockCard
                    key={block.id}
                    block={block}
                    deleting={removeBlock.isPending && removeBlock.variables === block.id}
                    disabled={removeBlock.isPending}
                    onDelete={() => confirmDeleteBlock(block.id)}
                  />
                ))
              )}
            </View>
          </ScrollView>

          {(availability.isFetching || blocks.isFetching) && !refreshing ? (
            <LoadingState variant="overlay" label="Actualizando disponibilidad…" />
          ) : null}
        </View>
      </View>

      <TimeBlockFormModal
        key={blockFormOpen ? 'open' : 'closed'}
        visible={blockFormOpen}
        onClose={() => setBlockFormOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.md, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  pressed: { opacity: 0.7 },
  scrollContainer: { flex: 1 },
  scroll: { gap: spacing.lg, paddingVertical: spacing.lg, paddingBottom: spacing.xl },
  blocksSection: { gap: spacing.sm },
  blocksHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  emptyBlocks: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  center: { textAlign: 'center' },
});
