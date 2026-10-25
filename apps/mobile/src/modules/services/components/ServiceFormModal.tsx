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
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import type { Service } from '../services';
import {
  EMPTY_SERVICE_DRAFT,
  buildServiceInput,
  draftFromService,
  validateServiceDraft,
  type ServiceAdvanceKind,
  type ServiceDraft,
} from '../service-form';
import { useCreateService, useUpdateService } from '../hooks';

export function ServiceFormModal({
  visible,
  service,
  onClose,
}: {
  visible: boolean;
  service: Service | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const create = useCreateService();
  const update = useUpdateService();
  const [draft, setDraft] = useState<ServiceDraft>(() =>
    service ? draftFromService(service) : EMPTY_SERVICE_DRAFT,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const editing = Boolean(service);
  const pending = create.isPending || update.isPending;

  function patch(value: Partial<ServiceDraft>) {
    setDraft((prev) => ({ ...prev, ...value }));
    setNotice(null);
  }

  async function save() {
    const nextErrors = validateServiceDraft(draft);
    setErrors(nextErrors);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0) return;

    const input = buildServiceInput(draft);
    try {
      if (service) {
        await update.mutateAsync({ id: service.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No pudimos guardar el servicio.');
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
              <AppText variant="heading">{editing ? 'Editar servicio' : 'Nuevo servicio'}</AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <TextField
                label="Nombre"
                value={draft.name}
                onChangeText={(name) => patch({ name })}
                error={errors.name}
                autoCapitalize="sentences"
              />
              <TextField
                label="Categoría (opcional)"
                value={draft.category}
                onChangeText={(category) => patch({ category })}
                autoCapitalize="sentences"
              />
              <View style={styles.row}>
                <View style={styles.half}>
                  <TextField
                    label="Duración (min)"
                    value={draft.duration}
                    onChangeText={(duration) => patch({ duration })}
                    error={errors.duration}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.half}>
                  <TextField
                    label="Precio (EUR)"
                    value={draft.price}
                    onChangeText={(price) => patch({ price })}
                    error={errors.price}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <TextField
                label="Descripción (opcional)"
                value={draft.description}
                onChangeText={(description) => patch({ description })}
                multiline
                numberOfLines={3}
                style={styles.multiline}
              />

              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <AppText variant="label">Solicitar adelanto</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Requiere un pago parcial al reservar.
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel="Solicitar adelanto"
                  value={draft.requiresAdvance}
                  onValueChange={(requiresAdvance) =>
                    patch({
                      requiresAdvance,
                      ...(requiresAdvance ? {} : { advanceKind: '', advanceValue: '' }),
                    })
                  }
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={draft.requiresAdvance ? colors.primary : colors.surface}
                />
              </View>

              {draft.requiresAdvance ? (
                <View style={styles.fieldGroup}>
                  <AppText variant="label">Tipo de adelanto</AppText>
                  <View style={styles.chips}>
                    {(['fixed', 'percent'] as const satisfies readonly ServiceAdvanceKind[]).map(
                      (kind) => {
                        const active = draft.advanceKind === kind;
                        return (
                          <Pressable
                            key={kind}
                            accessibilityRole="button"
                            accessibilityLabel={kind === 'fixed' ? 'Importe fijo' : 'Porcentaje'}
                            onPress={() => patch({ advanceKind: kind })}
                            style={[styles.chip, active && styles.chipActive]}
                          >
                            <AppText
                              variant="caption"
                              color={active ? colors.primary : colors.textSecondary}
                            >
                              {kind === 'fixed' ? 'Importe fijo' : 'Porcentaje'}
                            </AppText>
                          </Pressable>
                        );
                      },
                    )}
                  </View>
                  {errors.advanceKind ? (
                    <AppText variant="caption" color={colors.negative}>
                      {errors.advanceKind}
                    </AppText>
                  ) : null}
                  <TextField
                    label={draft.advanceKind === 'percent' ? 'Porcentaje (%)' : 'Importe (EUR)'}
                    value={draft.advanceValue}
                    onChangeText={(advanceValue) => patch({ advanceValue })}
                    error={errors.advanceValue}
                    keyboardType="decimal-pad"
                  />
                </View>
              ) : null}

              <View style={styles.switchRow}>
                <AppText variant="label">Servicio activo</AppText>
                <Switch
                  accessibilityLabel="Servicio activo"
                  value={draft.active}
                  onValueChange={(active) => patch({ active })}
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={draft.active ? colors.primary : colors.surface}
                />
              </View>

              {notice ? (
                <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
                  {notice}
                </AppText>
              ) : null}

              <Button
                label={pending ? 'Guardando…' : 'Guardar servicio'}
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
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
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
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
