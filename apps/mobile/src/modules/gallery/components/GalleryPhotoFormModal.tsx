import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/shared/auth/session-context';
import { pickAndUploadTenantImage } from '@/shared/media/pick-and-upload-image';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS } from '../categories';
import {
  EMPTY_GALLERY_DRAFT,
  buildGalleryInput,
  validateGalleryDraft,
  type GalleryDraft,
} from '../gallery-form';
import { useAddGalleryItem } from '../hooks';

export function GalleryPhotoFormModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { tenantId } = useSession();
  const add = useAddGalleryItem();
  const [draft, setDraft] = useState<GalleryDraft>(EMPTY_GALLERY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pending = add.isPending || uploading;

  function patch(value: Partial<GalleryDraft>) {
    setDraft((prev) => ({ ...prev, ...value }));
    setNotice(null);
  }

  async function upload() {
    if (!tenantId) return;
    setUploading(true);
    setNotice(null);
    const result = await pickAndUploadTenantImage(tenantId, 'gallery');
    setUploading(false);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    patch({ url: result.data.url });
  }

  async function save() {
    const nextErrors = validateGalleryDraft(draft);
    setErrors(nextErrors);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await add.mutateAsync(buildGalleryInput(draft));
      onClose();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No pudimos añadir la foto.');
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
              <AppText variant="heading">Añadir imagen</AppText>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              {draft.url ? (
                <Image
                  source={{ uri: draft.url }}
                  style={styles.preview}
                  resizeMode="cover"
                  accessibilityLabel="Vista previa de la imagen"
                />
              ) : (
                <View style={[styles.preview, styles.previewEmpty]}>
                  <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                  <AppText variant="caption" color={colors.textMuted}>
                    Sin imagen seleccionada
                  </AppText>
                </View>
              )}

              <Button
                label={uploading ? 'Subiendo…' : 'Subir imagen'}
                variant="secondary"
                loading={uploading}
                onPress={() => void upload()}
              />
              <AppText variant="caption" color={colors.textMuted}>
                PNG, JPG o WEBP. Máximo 5 MB.
              </AppText>

              <TextField
                label="Imagen (URL)"
                value={draft.url}
                onChangeText={(url) => patch({ url })}
                error={errors.url}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="https://…"
              />
              <TextField
                label="Título (opcional)"
                value={draft.title}
                onChangeText={(title) => patch({ title })}
                autoCapitalize="sentences"
              />
              <TextField
                label="Descripción (opcional)"
                value={draft.description}
                onChangeText={(description) => patch({ description })}
                multiline
                numberOfLines={3}
                style={styles.multiline}
              />

              <View style={styles.fieldGroup}>
                <AppText variant="label">Categoría (opcional)</AppText>
                <View style={styles.chips}>
                  {GALLERY_CATEGORIES.map((category) => {
                    const active = draft.category === category;
                    return (
                      <Pressable
                        key={category}
                        accessibilityRole="button"
                        accessibilityLabel={GALLERY_CATEGORY_LABELS[category]}
                        accessibilityState={{ selected: active }}
                        onPress={() => patch({ category: active ? '' : category })}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <AppText
                          variant="caption"
                          color={active ? colors.primary : colors.textSecondary}
                        >
                          {GALLERY_CATEGORY_LABELS[category]}
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
                label={pending ? 'Guardando…' : 'Añadir foto'}
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
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
  },
  previewEmpty: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
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
});
