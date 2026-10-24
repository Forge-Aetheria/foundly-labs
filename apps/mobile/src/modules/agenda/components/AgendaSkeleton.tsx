import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '@/shared/theme/tokens';

export function AgendaSkeleton() {
  return (
    <View style={styles.list} accessibilityLabel="Cargando agenda">
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.row} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: {
    height: 96,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
  },
});
