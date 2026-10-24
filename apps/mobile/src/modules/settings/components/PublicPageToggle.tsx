import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { colors, radii, spacing } from '@/shared/theme/tokens';

export interface PublicPageToggleProps {
  value: boolean;
  disabled?: boolean;
  pending?: boolean;
  canPublish: boolean;
  error?: string | null;
  onChange: (value: boolean) => void;
}

export function PublicPageToggle({
  value,
  disabled,
  pending,
  canPublish,
  error,
  onChange,
}: PublicPageToggleProps) {
  const blocked = disabled || pending || !canPublish;
  return (
    <View style={styles.card}>
      <View style={styles.text}>
        <AppText variant="label">Página pública</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {canPublish
            ? 'Permite que tus clientes encuentren tu negocio y reserven online.'
            : 'Completa el enlace público del negocio antes de publicar la página.'}
        </AppText>
      </View>
      <Switch
        accessibilityLabel="Publicar página pública"
        value={value}
        disabled={blocked}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.surface}
      />
      {pending ? (
        <AppText variant="caption" color={colors.textMuted}>
          Guardando…
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  text: { gap: 2 },
});
