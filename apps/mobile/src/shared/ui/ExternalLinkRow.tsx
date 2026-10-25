import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { openExternalLink } from '../utils/open-external-link';
import { colors, radii, spacing } from '../theme/tokens';

export function ExternalLinkRow({
  icon,
  label,
  description,
  url,
  onError,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  url: string;
  onError?: (message: string) => void;
}) {
  async function handlePress() {
    const result = await openExternalLink(url);
    if (!result.ok && result.message) onError?.(result.message);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => void handlePress()}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText variant="label">{label}</AppText>
        {description ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="open-outline" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  copy: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
});
