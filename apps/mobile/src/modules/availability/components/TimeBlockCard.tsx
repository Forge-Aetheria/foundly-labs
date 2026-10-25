import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { formatBlockRange, type TimeBlock } from '../availability-utils';

export function TimeBlockCard({
  block,
  deleting = false,
  disabled = false,
  onDelete,
}: {
  block: TimeBlock;
  deleting?: boolean;
  disabled?: boolean;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="calendar-clear-outline" size={20} color={colors.primary} />
        <AppText variant="label" style={styles.range}>
          {formatBlockRange(block)}
        </AppText>
      </View>
      <AppText variant="caption" color={colors.textSecondary}>
        {block.reason?.trim() || 'Sin motivo indicado'}
      </AppText>
      <Button
        label="Eliminar bloqueo"
        variant="ghost"
        loading={deleting}
        disabled={disabled}
        onPress={onDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  range: { flex: 1 },
});
