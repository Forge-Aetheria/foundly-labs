import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { useDeleteService, useServices } from './hooks';
import { advanceLabel, formatPrice } from './service-form';
import type { Service } from './services';
import { ServiceFormModal } from './components/ServiceFormModal';

export function ServicesView() {
  const services = useServices();
  const remove = useDeleteService();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es');
    const items = services.data ?? [];
    return needle
      ? items.filter((service) => service.name.toLocaleLowerCase('es').includes(needle))
      : items;
  }, [query, services.data]);

  if (services.isLoading) {
    return (
      <Screen>
        <LoadingState label="Cargando servicios…" />
      </Screen>
    );
  }

  if (services.isError) {
    return (
      <Screen>
        <ErrorState message={services.error.message} onRetry={() => void services.refetch()} />
      </Screen>
    );
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function confirmDelete(service: Service) {
    Alert.alert('Eliminar servicio', `¿Eliminar "${service.name}" del catálogo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => remove.mutate(service.id),
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="title">Servicios</AppText>
            <AppText color={colors.textSecondary}>
              Catálogo, duraciones, tarifas y adelantos de tu negocio.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nuevo servicio"
            onPress={openCreate}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
          </Pressable>
        </View>

        <TextField
          label="Buscar servicio"
          value={query}
          onChangeText={setQuery}
          placeholder="Filtrar por nombre…"
          autoCapitalize="none"
        />

        <View style={styles.listContainer}>
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState
                title="Todavía no hay servicios"
                message="Crea tu primer servicio para que tus clientes puedan reservarlo."
              />
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitle}>
                    <AppText variant="label">{item.name}</AppText>
                    {item.category ? (
                      <AppText variant="caption" color={colors.textMuted}>
                        {item.category}
                      </AppText>
                    ) : null}
                  </View>
                  <View style={[styles.badge, item.active ? styles.badgeActive : null]}>
                    <AppText
                      variant="caption"
                      color={item.active ? colors.positive : colors.textMuted}
                    >
                      {item.active ? 'Activo' : 'Inactivo'}
                    </AppText>
                  </View>
                </View>

                {item.description ? (
                  <AppText variant="caption" color={colors.textSecondary}>
                    {item.description}
                  </AppText>
                ) : null}

                <View style={styles.metrics}>
                  <Metric label="Duración" value={`${item.durationMinutes} min`} />
                  <Metric label="Precio" value={formatPrice(item.priceCents)} />
                  <Metric label="Adelanto" value={advanceLabel(item)} />
                </View>

                <View style={styles.actions}>
                  <Button
                    label="Editar"
                    variant="secondary"
                    disabled={remove.isPending}
                    onPress={() => openEdit(item)}
                  />
                  <Button
                    label="Eliminar"
                    variant="ghost"
                    loading={remove.isPending && remove.variables === item.id}
                    disabled={remove.isPending}
                    onPress={() => confirmDelete(item)}
                  />
                </View>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={services.isRefetching}
                onRefresh={() => void services.refetch()}
                tintColor={colors.primary}
              />
            }
          />
          {services.isFetching ? (
            <LoadingState variant="overlay" label="Actualizando servicios…" />
          ) : null}
        </View>
      </View>

      <ServiceFormModal
        key={editing?.id ?? 'new-service'}
        visible={formOpen}
        service={editing}
        onClose={closeForm}
      />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
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
  listContainer: { flex: 1 },
  list: { gap: spacing.md, paddingVertical: spacing.lg, paddingBottom: spacing.xl },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { flex: 1, gap: 2 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  badgeActive: { backgroundColor: colors.positiveSoft },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  metric: { gap: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
