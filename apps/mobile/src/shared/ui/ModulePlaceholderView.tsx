import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Screen } from './Screen';
import type { NavigationIconName } from '../navigation/modules';
import { colors, radii, spacing } from '../theme/tokens';

export interface ModulePlaceholderViewProps {
  title: string;
  description?: string;
  icon: NavigationIconName;
}

export function ModulePlaceholderView({ title, description, icon }: ModulePlaceholderViewProps) {
  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={28} color={colors.primary} />
        </View>
        <AppText variant="title">{title}</AppText>
        <AppText color={colors.textSecondary} style={styles.description}>
          {description ?? 'Este módulo estará disponible próximamente en la app móvil.'}
        </AppText>
        <View style={styles.badge}>
          <AppText variant="caption" color={colors.primary}>
            Próximamente en móvil
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  description: { textAlign: 'center' },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
});
