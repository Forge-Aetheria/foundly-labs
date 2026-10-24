import { StyleSheet, View } from 'react-native';
import { Button } from './Button';
import { AppText } from './AppText';
import { colors, spacing } from '../theme/tokens';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Algo salió mal', message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <AppText variant="heading" color={colors.negative}>
        {title}
      </AppText>
      <AppText color={colors.textSecondary} style={styles.message}>
        {message}
      </AppText>
      {onRetry ? <Button label="Reintentar" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  message: { textAlign: 'center' },
});
