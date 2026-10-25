import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '../theme/tokens';

export type LoadingVariant = 'screen' | 'container' | 'overlay';

export interface LoadingStateProps {
  label?: string;
  variant?: LoadingVariant;
}

export function LoadingState({ label = 'Cargando…', variant = 'screen' }: LoadingStateProps) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      style={[styles.base, variants[variant]]}
    >
      <ActivityIndicator color={colors.primary} size={variant === 'screen' ? 'large' : 'small'} />
      <AppText color={colors.textSecondary}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  screen: { flex: 1 },
  container: { paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
    zIndex: 10,
  },
});

const variants: Record<LoadingVariant, object> = {
  screen: styles.screen,
  container: styles.container,
  overlay: styles.overlay,
};
