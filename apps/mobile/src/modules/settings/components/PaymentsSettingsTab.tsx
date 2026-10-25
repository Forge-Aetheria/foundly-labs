import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
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
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import {
  PAYMENT_DETAIL_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ORDER,
  PAYMENT_TYPE_FIELDS,
  PaymentMethodType,
  paymentDetailSummary,
  parsePaymentDetails,
  serializePaymentDetails,
  type PaymentDetailKey,
  type PaymentMethodDetails,
} from '../payments';
import {
  useDeletePaymentMethod,
  usePaymentMethods,
  useUpsertPaymentMethod,
} from '../hooks';
import type { PaymentMethod } from '../services';

interface Draft {
  type: PaymentMethodType;
  title: string;
  details: Record<PaymentDetailKey, string>;
  instructions: string;
  active: boolean;
}

const EMPTY_DETAILS: Record<PaymentDetailKey, string> = {
  holder: '',
  cedula: '',
  phone: '',
  bank: '',
  payId: '',
  email: '',
  account: '',
};

function emptyDraft(type: PaymentMethodType): Draft {
  return { type, title: '', details: { ...EMPTY_DETAILS }, instructions: '', active: true };
}

function draftFrom(method: PaymentMethod): Draft {
  const details = parsePaymentDetails(method.details);
  return {
    type: method.type,
    title: method.title ?? '',
    details: {
      ...EMPTY_DETAILS,
      ...(Object.fromEntries(
        Object.entries(details ?? {}).map(([key, value]) => [key, value ?? '']),
      ) as Record<PaymentDetailKey, string>),
    },
    instructions: method.instructions ?? '',
    active: method.active,
  };
}

export function PaymentsSettingsTab() {
  const methods = usePaymentMethods();
  const upsert = useUpsertPaymentMethod();
  const remove = useDeletePaymentMethod();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (methods.isLoading) return <LoadingState label="Cargando métodos de pago…" />;
  if (methods.isError) {
    return (
      <ErrorState
        message={methods.error.message}
        onRetry={() => void methods.refetch()}
      />
    );
  }

  const items = methods.data ?? [];
  const configured = new Set(items.map((item) => item.type));
  const availableTypes = PAYMENT_METHOD_ORDER.filter(
    (type) => !configured.has(type) || editing?.type === type,
  );

  function openCreate() {
    const type = availableTypes[0] ?? PaymentMethodType.PagoMovil;
    setEditing(null);
    setDraft(emptyDraft(type));
    setNotice(null);
  }

  function openEdit(method: PaymentMethod) {
    setEditing(method);
    setDraft(draftFrom(method));
    setNotice(null);
  }

  function patch(value: Partial<Draft>) {
    setDraft((prev) => (prev ? { ...prev, ...value } : prev));
  }

  function patchDetail(key: PaymentDetailKey, value: string) {
    setDraft((prev) =>
      prev ? { ...prev, details: { ...prev.details, [key]: value } } : prev,
    );
  }

  async function save() {
    if (!draft) return;
    setNotice(null);
    const details: PaymentMethodDetails = {};
    for (const key of PAYMENT_TYPE_FIELDS[draft.type]) {
      if (draft.details[key].trim()) details[key] = draft.details[key].trim();
    }
    try {
      await upsert.mutateAsync({
        type: draft.type,
        title: draft.title.trim() || null,
        details: serializePaymentDetails(details),
        instructions: draft.instructions.trim() || null,
        active: draft.active,
      });
      setDraft(null);
      setEditing(null);
      setNotice('Método de pago guardado.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No pudimos guardar el método.');
    }
  }

  async function toggleActive(method: PaymentMethod) {
    setNotice(null);
    try {
      await upsert.mutateAsync({
        type: method.type,
        title: method.title,
        details: method.details,
        instructions: method.instructions,
        active: !method.active,
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No pudimos actualizar el método.');
    }
  }

  function confirmDelete(method: PaymentMethod) {
    Alert.alert('Eliminar método de pago', `¿Eliminar ${PAYMENT_METHOD_LABELS[method.type]}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          remove.mutate(method.id, {
            onError: (error) => setNotice(error.message),
          });
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <AppText variant="heading">Métodos de Pago</AppText>
            <AppText color={colors.textSecondary}>
              Configura cómo tus clientes pueden abonar un adelanto.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nuevo método de pago"
            accessibilityState={{ disabled: availableTypes.length === 0 }}
            disabled={availableTypes.length === 0}
            onPress={openCreate}
            style={[styles.addButton, availableTypes.length === 0 && styles.addButtonDisabled]}
          >
            <Ionicons name="add" size={20} color={colors.surface} />
          </Pressable>
        </View>

        {notice ? (
          <AppText variant="caption" color={colors.textSecondary} accessibilityRole="alert">
            {notice}
          </AppText>
        ) : null}

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={30} color={colors.primary} />
            <AppText variant="label">Todavía no hay métodos de pago</AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.center}>
              Añade uno para que tus clientes puedan pagar adelantos.
            </AppText>
          </View>
        ) : (
          items.map((method) => {
            const type = method.type;
            const summary = paymentDetailSummary(parsePaymentDetails(method.details));
            return (
              <View key={method.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitle}>
                    <AppText variant="label">{method.title || PAYMENT_METHOD_LABELS[type]}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {PAYMENT_METHOD_LABELS[type]}
                    </AppText>
                  </View>
                  <View style={[styles.badge, method.active ? styles.badgeActive : null]}>
                    <AppText
                      variant="caption"
                      color={method.active ? colors.positive : colors.textMuted}
                    >
                      {method.active ? 'Activo' : 'Inactivo'}
                    </AppText>
                  </View>
                </View>
                <AppText variant="caption" color={colors.textSecondary}>
                  {summary || 'Sin datos configurados.'}
                </AppText>
                <View style={styles.actions}>
                  <Button label="Editar" variant="secondary" onPress={() => openEdit(method)} />
                  <Button
                    label={method.active ? 'Desactivar' : 'Activar'}
                    variant="ghost"
                    onPress={() => void toggleActive(method)}
                  />
                  <Button
                    label="Eliminar"
                    variant="ghost"
                    onPress={() => confirmDelete(method)}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={draft !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setDraft(null)}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modal}
          >
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}>
              <View style={styles.modalHeader}>
                <AppText variant="heading">
                  {editing ? 'Editar método de pago' : 'Nuevo método de pago'}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  onPress={() => setDraft(null)}
                >
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              {draft ? (
                <ScrollView
                  contentContainerStyle={styles.modalScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.fieldGroup}>
                    <AppText variant="label">Tipo</AppText>
                    <View style={styles.chips}>
                      {availableTypes.map((type) => {
                        const active = draft.type === type;
                        return (
                          <Pressable
                            key={type}
                            accessibilityRole="button"
                            accessibilityLabel={PAYMENT_METHOD_LABELS[type]}
                            onPress={() =>
                              patch({ type, details: { ...EMPTY_DETAILS, ...draft.details } })
                            }
                            style={[styles.chip, active && styles.chipActive]}
                          >
                            <AppText
                              variant="caption"
                              color={active ? colors.primary : colors.textSecondary}
                            >
                              {PAYMENT_METHOD_LABELS[type]}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <TextField
                    label="Título (opcional)"
                    value={draft.title}
                    onChangeText={(title) => patch({ title })}
                  />

                  {PAYMENT_TYPE_FIELDS[draft.type].map((key) => (
                    <TextField
                      key={key}
                      label={PAYMENT_DETAIL_LABELS[key]}
                      value={draft.details[key]}
                      onChangeText={(value) => patchDetail(key, value)}
                      autoCapitalize="none"
                    />
                  ))}

                  <TextField
                    label="Instrucciones (opcional)"
                    value={draft.instructions}
                    onChangeText={(instructions) => patch({ instructions })}
                    multiline
                    numberOfLines={3}
                    style={styles.multiline}
                  />

                  <View style={styles.switchRow}>
                    <AppText variant="label">Método activo</AppText>
                    <Switch
                      accessibilityLabel="Método activo"
                      value={draft.active}
                      onValueChange={(active) => patch({ active })}
                      trackColor={{ false: colors.border, true: colors.primarySoft }}
                      thumbColor={draft.active ? colors.primary : colors.surface}
                    />
                  </View>

                  <Button
                    label={upsert.isPending ? 'Guardando…' : 'Guardar método'}
                    onPress={() => void save()}
                    loading={upsert.isPending}
                  />
                </ScrollView>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { gap: spacing.md, paddingVertical: spacing.lg, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
  addButtonDisabled: { opacity: 0.4 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  center: { textAlign: 'center' },
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  modal: { maxHeight: '92%' },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  modalScroll: { gap: spacing.md, paddingVertical: spacing.lg },
  fieldGroup: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
