import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { SessionAvatar } from '@/shared/ui/SessionAvatar';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { initialsFrom } from '@/shared/navigation/session-identity';
import { useDeleteTeamMember, useTeam, useUpdateTeamMember } from './hooks';
import type { TeamMember } from './services';
import { TeamMemberFormModal } from './components/TeamMemberFormModal';

export function TeamView() {
  const team = useTeam();
  const remove = useDeleteTeamMember();
  const update = useUpdateTeamMember();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const actionError = remove.error?.message ?? update.error?.message ?? null;

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es');
    const items = team.data ?? [];
    return needle
      ? items.filter(
          (member) =>
            member.name.toLocaleLowerCase('es').includes(needle) ||
            (member.role ?? '').toLocaleLowerCase('es').includes(needle),
        )
      : items;
  }, [query, team.data]);

  if (team.isLoading) {
    return (
      <Screen>
        <LoadingState label="Cargando equipo…" />
      </Screen>
    );
  }

  if (team.isError) {
    return (
      <Screen>
        <ErrorState message={team.error.message} onRetry={() => void team.refetch()} />
      </Screen>
    );
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(member: TeamMember) {
    setEditing(member);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function confirmDelete(member: TeamMember) {
    Alert.alert('Eliminar miembro', `¿Eliminar a "${member.name}" del equipo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => remove.mutate(member.id),
      },
    ]);
  }

  function toggleActive(member: TeamMember, active: boolean) {
    update.mutate({ id: member.id, input: { active } });
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="title">Equipo</AppText>
            <AppText color={colors.textSecondary}>
              Especialistas, roles y servicios asignados.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nuevo miembro del equipo"
            onPress={openCreate}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
          </Pressable>
        </View>

        <TextField
          label="Buscar miembro"
          value={query}
          onChangeText={setQuery}
          placeholder="Filtrar por nombre o rol…"
          autoCapitalize="none"
        />

        {actionError ? (
          <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
            {actionError}
          </AppText>
        ) : null}

        <View style={styles.listContainer}>
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState
                title="Todavía no hay equipo"
                message="Añade a tu primer especialista para asignarle servicios y reservas."
              />
            }
            renderItem={({ item }) => {
              const toggling = update.isPending && update.variables?.id === item.id;
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <SessionAvatar
                      displayName={item.name}
                      avatarUrl={item.avatar}
                      initials={initialsFrom(item.name)}
                      size={52}
                    />
                    <View style={styles.cardTitle}>
                      <AppText variant="label">{item.name}</AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        {item.role || 'Sin rol definido'}
                      </AppText>
                    </View>
                    <View style={styles.status}>
                      {toggling ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Switch
                          accessibilityLabel={`Estado de ${item.name}`}
                          value={item.active}
                          disabled={update.isPending}
                          onValueChange={(active) => toggleActive(item, active)}
                          trackColor={{ false: colors.border, true: colors.primarySoft }}
                          thumbColor={item.active ? colors.primary : colors.surface}
                        />
                      )}
                    </View>
                  </View>

                  {item.bio ? (
                    <AppText variant="caption" color={colors.textSecondary}>
                      {item.bio}
                    </AppText>
                  ) : null}

                  <View style={styles.services}>
                    {item.services.length > 0 ? (
                      item.services.map((service) => (
                        <View key={service.id} style={styles.serviceChip}>
                          <AppText variant="caption" color={colors.textSecondary}>
                            {service.name}
                          </AppText>
                        </View>
                      ))
                    ) : (
                      <AppText variant="caption" color={colors.textMuted}>
                        Sin servicios asignados.
                      </AppText>
                    )}
                  </View>

                  <View style={styles.actions}>
                    <Button
                      label="Editar"
                      variant="secondary"
                      disabled={remove.isPending || update.isPending}
                      onPress={() => openEdit(item)}
                    />
                    <Button
                      label="Eliminar"
                      variant="ghost"
                      loading={remove.isPending && remove.variables === item.id}
                      disabled={remove.isPending || update.isPending}
                      onPress={() => confirmDelete(item)}
                    />
                  </View>
                </View>
              );
            }}
            refreshControl={
              <RefreshControl
                refreshing={team.isRefetching}
                onRefresh={() => void team.refetch()}
                tintColor={colors.primary}
              />
            }
          />
          {team.isFetching ? <LoadingState variant="overlay" label="Actualizando equipo…" /> : null}
        </View>
      </View>

      <TeamMemberFormModal
        key={editing?.id ?? 'new-member'}
        visible={formOpen}
        member={editing}
        onClose={closeForm}
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardTitle: { flex: 1, gap: 2 },
  status: { width: 64, alignItems: 'flex-end' },
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  serviceChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
