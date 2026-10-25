import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import {
  EMPTY_TIME_BLOCK_DRAFT,
  buildTimeBlockInput,
  validateTimeBlockDraft,
  type TimeBlockDraft,
  type TimeBlockMode,
} from '../availability-utils';
import { useAddTimeBlock } from '../hooks';

export function TimeBlockFormModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const add = useAddTimeBlock();
  const [draft, setDraft] = useState<TimeBlockDraft>(EMPTY_TIME_BLOCK_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  function patch(value: Partial<TimeBlockDraft>) {
    setDraft((prev) => ({ ...prev, ...value }));
    setNotice(null);
  }

  async function save() {
    const nextErrors = validateTimeBlockDraft(draft);
    setErrors(nextErrors);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await add.mutateAsync(buildTimeBlockInput(draft));
      onClose();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No pudimos crear el bloqueo.');
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
              <AppText variant="heading">Nuevo bloqueo</AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldGroup}>
                <AppText variant="label">Tipo de bloqueo</AppText>
                <View style={styles.chips}>
                  {(['range', 'fullday'] as TimeBlockMode[]).map((mode) => {
                    const active = draft.mode === mode;
                    return (
                      <Pressable
                        key={mode}
                        accessibilityRole="button"
                        accessibilityLabel={mode === 'range' ? 'Rango horario' : 'Día completo'}
                        onPress={() => patch({ mode })}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <AppText
                          variant="caption"
                          color={active ? colors.primary : colors.textSecondary}
                        >
                          {mode === 'range' ? 'Rango horario' : 'Día completo'}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <TextField
                label="Fecha (YYYY-MM-DD)"
                value={draft.date}
                onChangeText={(date) => patch({ date })}
                error={errors.date}
                autoCapitalize="none"
                placeholder="2026-10-25"
              />

              {draft.mode === 'range' ? (
                <View style={styles.row}>
                  <View style={styles.half}>
                    <TextField
                      label="Inicio"
                      value={draft.startTime}
                      onChangeText={(startTime) => patch({ startTime })}
                      keyboardType="numbers-and-punctuation"
                      placeholder="09:00"
                    />
                  </View>
                  <View style={styles.half}>
                    <TextField
                      label="Fin"
                      value={draft.endTime}
                      onChangeText={(endTime) => patch({ endTime })}
                      keyboardType="numbers-and-punctuation"
                      placeholder="13:00"
                    />
                  </View>
                </View>
              ) : null}

              {errors.time ? (
                <AppText variant="caption" color={colors.negative}>
                  {errors.time}
                </AppText>
              ) : null}

              <TextField
                label="Motivo (opcional)"
                value={draft.reason}
                onChangeText={(reason) => patch({ reason })}
                placeholder="Vacaciones, formación, cita médica…"
              />

              {notice ? (
                <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
                  {notice}
                </AppText>
              ) : null}

              <Button
                label={add.isPending ? 'Guardando…' : 'Crear bloqueo'}
                onPress={() => void save()}
                loading={add.isPending}
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
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
});
