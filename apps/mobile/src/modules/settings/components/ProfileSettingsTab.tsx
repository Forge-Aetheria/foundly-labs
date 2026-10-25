import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSession } from '@/shared/auth/session-context';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { TENANT_CATEGORIES, TENANT_CATEGORY_LABELS } from '../categories';
import { useUpdateBusinessProfile } from '../hooks';
import { pickAndUploadTenantImage } from '@/shared/media/pick-and-upload-image';
import type { BusinessProfile } from '../services';

interface Draft {
  name: string;
  category: string;
  tags: string;
  slug: string;
  logo: string;
  isPublic: boolean;
}

function toDraft(business: BusinessProfile): Draft {
  return {
    name: business.name,
    category: business.category,
    tags: (business.tags ?? []).join(', '),
    slug: business.profile?.slug ?? '',
    logo: business.profile?.logo ?? '',
    isPublic: business.isPublic,
  };
}

export function ProfileSettingsTab({ business }: { business: BusinessProfile }) {
  const { tenantId } = useSession();
  const update = useUpdateBusinessProfile();
  const [draft, setDraft] = useState<Draft>(() => toDraft(business));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function patch(value: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...value }));
    setNotice(null);
  }

  function tagsFrom(value: string): string[] {
    return Array.from(
      new Set(
        value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );
  }

  async function changeLogo() {
    if (!tenantId) return;
    setErrors({});
    setNotice(null);
    setUploading(true);
    const result = await pickAndUploadTenantImage(tenantId, 'logo');
    setUploading(false);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    patch({ logo: result.data.url });
  }

  async function save() {
    const nextErrors: Record<string, string> = {};
    if (!draft.name.trim()) nextErrors.name = 'El nombre del negocio es obligatorio.';
    if (!draft.category) nextErrors.category = 'Selecciona una categoría.';
    if (!draft.slug.trim()) nextErrors.slug = 'El enlace público es obligatorio.';
    setErrors(nextErrors);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await update.mutateAsync({
        name: draft.name.trim(),
        category: draft.category,
        tags: tagsFrom(draft.tags),
        slug: draft.slug.trim(),
        logo: draft.logo.trim() || null,
        isPublic: draft.isPublic,
      });
      setNotice('Cambios guardados correctamente.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No pudimos guardar los cambios.');
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <AppText variant="heading">Perfil del Negocio</AppText>
          <AppText color={colors.textSecondary}>
            Identidad y presencia pública de tu negocio.
          </AppText>
        </View>

        <TextField
          label="Nombre del negocio"
          value={draft.name}
          onChangeText={(name) => patch({ name })}
          error={errors.name}
          autoCapitalize="words"
        />

        <View style={styles.fieldGroup}>
          <AppText variant="label">Categoría</AppText>
          <View style={styles.chips}>
            {TENANT_CATEGORIES.map((category) => {
              const active = draft.category === category;
              return (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  accessibilityLabel={TENANT_CATEGORY_LABELS[category]}
                  accessibilityState={{ selected: active }}
                  onPress={() => patch({ category })}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <AppText variant="caption" color={active ? colors.primary : colors.textSecondary}>
                    {TENANT_CATEGORY_LABELS[category]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {errors.category ? (
            <AppText variant="caption" color={colors.negative}>
              {errors.category}
            </AppText>
          ) : null}
        </View>

        <TextField
          label="Etiquetas"
          value={draft.tags}
          onChangeText={(tags) => patch({ tags })}
          placeholder="corte, color, barba"
          autoCapitalize="none"
        />
        <AppText variant="caption" color={colors.textMuted}>
          Separa las etiquetas con comas.
        </AppText>

        <TextField
          label="URL pública (slug)"
          value={draft.slug}
          onChangeText={(slug) => patch({ slug })}
          error={errors.slug}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="mi-negocio"
        />

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <AppText variant="label">Página pública</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Permite que tus clientes vean tu página y reserven online.
            </AppText>
          </View>
          <Switch
            accessibilityLabel="Publicar página pública"
            value={draft.isPublic}
            onValueChange={(isPublic) => patch({ isPublic })}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={draft.isPublic ? colors.primary : colors.surface}
          />
        </View>

        <View style={styles.logoCard}>
          <View style={styles.logoRow}>
            {draft.logo ? (
              <Image source={{ uri: draft.logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoEmpty]}>
                <Ionicons name="storefront-outline" size={26} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.logoCopy}>
              <AppText variant="label">Logo del negocio</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Imagen cuadrada (1:1), PNG, JPG o WEBP. Máximo 5 MB.
              </AppText>
              <Button
                label="Cambiar logo"
                variant="secondary"
                onPress={() => void changeLogo()}
                loading={uploading}
              />
            </View>
          </View>
          <TextField
            label="Logo (URL)"
            value={draft.logo}
            onChangeText={(logo) => patch({ logo })}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="https://…"
          />
        </View>

        {notice ? (
          <AppText
            variant="caption"
            color={notice.includes('guardados') ? colors.positive : colors.negative}
            accessibilityRole="alert"
          >
            {notice}
          </AppText>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={update.isPending ? 'Guardando…' : 'Guardar cambios'}
          onPress={() => void save()}
          loading={update.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { gap: spacing.lg, paddingVertical: spacing.lg, paddingBottom: spacing.xl },
  section: { gap: spacing.xs },
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
  logoCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  logoRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  logo: { width: 88, height: 88, borderRadius: radii.lg, backgroundColor: colors.surfaceMuted },
  logoEmpty: { alignItems: 'center', justifyContent: 'center' },
  logoCopy: { flex: 1, gap: spacing.sm },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
