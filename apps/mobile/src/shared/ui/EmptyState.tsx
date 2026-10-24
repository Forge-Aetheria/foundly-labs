import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '../theme/tokens';

export interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <AppText variant="heading">{title}</AppText>
      <AppText color={colors.textSecondary} style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  message: { textAlign: 'center' },
});
