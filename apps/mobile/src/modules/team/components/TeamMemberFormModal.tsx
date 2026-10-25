import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/shared/auth/session-context';
import { pickAndUploadTenantImage } from '@/shared/media/pick-and-upload-image';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { SessionAvatar } from '@/shared/ui/SessionAvatar';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { initialsFrom } from '@/shared/navigation/session-identity';
import { useServices } from '@/modules/services/hooks';
import type { TeamMember } from '../services';
import { serviceDiff, teamDraftFrom, validateTeamDraft, type TeamDraft } from '../team-form';
import { useCreateTeamMember, useSyncTeamMemberServices, useUpdateTeamMember } from '../hooks';

export function TeamMemberFormModal({
  visible,
  member,
  onClose,
}: {
  visible: boolean;
  member: TeamMember | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { tenantId } = useSession();
  const services = useServices();
  const create = useCreateTeamMember();
  const update = useUpdateTeamMember();
  const syncServices = useSyncTeamMemberServices();
  const [draft, setDraft] = useState<TeamDraft>(() => teamDraftFrom(member));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pending = create.isPending || update.isPending || syncServices.isPending;
  const editing = Boolean(member);

  function patch(value: Partial<TeamDraft>) {
    setDraft((prev) => ({ ...prev, ...value }));
    setNotice(null);
  }

  function toggleService(serviceId: string) {
    setDraft((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  }

  async function changeAvatar() {
    if (!tenantId) return;
    setUploading(true);
    setNotice(null);
    const result = await pickAndUploadTenantImage(tenantId, 'avatar');
    setUploading(false);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    patch({ avatar: result.data.url });
  }

  async function save() {
    const nextErrors = validateTeamDraft(draft);
    setErrors(nextErrors);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0) return;

    const input = {
      name: draft.name.trim(),
      role: draft.role.trim() || null,
      bio: draft.bio.trim() || null,
      avatar: draft.avatar.trim() || null,
      active: draft.active,
    };

    try {
      let specialistId = member?.id ?? null;
      if (member) {
        await update.mutateAsync({ id: member.id, input });
      } else {
        const created = await create.mutateAsync(input);
        specialistId = created.id;
      }

      if (specialistId) {
        const { addServiceIds, removeServiceIds } = serviceDiff(
          member?.services.map((service) => service.id) ?? [],
          draft.serviceIds,
        );
        if (addServiceIds.length > 0 || removeServiceIds.length > 0) {
          await syncServices.mutateAsync({
            specialistId,
            addServiceIds,
            removeServiceIds,
          });
        }
      }

      onClose();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'No pudimos guardar el miembro del equipo.',
      );
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modal}
        >
          <View style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.header}>
              <AppText variant="heading">
                {editing ? 'Editar miembro' : 'Nuevo miembro del equipo'}
              </AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <View style={styles.avatarRow}>
                <SessionAvatar
                  displayName={draft.name || 'Miembro del equipo'}
                  avatarUrl={draft.avatar || null}
                  initials={initialsFrom(draft.name || 'EQ')}
                  size={72}
                />
                <View style={styles.avatarCopy}>
                  <AppText variant="label">Avatar</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Imagen cuadrada, PNG/JPG/WEBP, máximo 5 MB.
                  </AppText>
                  <Button
                    label="Cambiar avatar"
                    variant="secondary"
                    loading={uploading}
                    onPress={() => void changeAvatar()}
                  />
                </View>
              </View>

              <TextField
                label="Nombre"
                value={draft.name}
                onChangeText={(name) => patch({ name })}
                error={errors.name}
                autoCapitalize="words"
              />
              <TextField
                label="Rol o especialidad"
                value={draft.role}
                onChangeText={(role) => patch({ role })}
                placeholder="P. ej. Peluquera Senior"
                autoCapitalize="sentences"
              />
              <TextField
                label="Biografía (opcional)"
                value={draft.bio}
                onChangeText={(bio) => patch({ bio })}
                error={errors.bio}
                multiline
                numberOfLines={3}
                style={styles.multiline}
              />

              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <AppText variant="label">Miembro activo</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Los miembros inactivos no reciben nuevas reservas.
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel="Miembro activo"
                  value={draft.active}
                  onValueChange={(active) => patch({ active })}
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={draft.active ? colors.primary : colors.surface}
                />
              </View>

              <View style={styles.fieldGroup}>
                <AppText variant="label">Servicios asignados</AppText>
                {services.isLoading ? (
                  <AppText variant="caption" color={colors.textMuted}>
                    Cargando servicios…
                  </AppText>
                ) : null}
                {(services.data ?? []).length === 0 && !services.isLoading ? (
                  <AppText variant="caption" color={colors.textMuted}>
                    Todavía no hay servicios en el catálogo.
                  </AppText>
                ) : null}
                <View style={styles.chips}>
                  {(services.data ?? []).map((service) => {
                    const selected = draft.serviceIds.includes(service.id);
                    return (
                      <Pressable
                        key={service.id}
                        accessibilityRole="button"
                        accessibilityLabel={service.name}
                        accessibilityState={{ selected }}
                        onPress={() => toggleService(service.id)}
                        style={[styles.chip, selected && styles.chipActive]}
                      >
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={selected ? colors.primary : colors.textMuted}
                        />
                        <AppText
                          variant="caption"
                          color={selected ? colors.primary : colors.textSecondary}
                        >
                          {service.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {notice ? (
                <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
                  {notice}
                </AppText>
              ) : null}

              <Button
                label={pending ? 'Guardando…' : 'Guardar miembro'}
                onPress={() => void save()}
                loading={pending}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  modal: { maxHeight: '92%' },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scroll: { gap: spacing.md, paddingVertical: spacing.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatarCopy: { flex: 1, gap: spacing.sm },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  switchCopy: { flex: 1, gap: 2 },
  fieldGroup: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
