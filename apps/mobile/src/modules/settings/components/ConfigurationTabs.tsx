import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { colors, radii, spacing } from '@/shared/theme/tokens';

export type ConfigurationTab = 'perfil' | 'pagos' | 'seguridad';

const TABS: { id: ConfigurationTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'perfil', label: 'Perfil', icon: 'storefront-outline' },
  { id: 'pagos', label: 'Pagos', icon: 'card-outline' },
  { id: 'seguridad', label: 'Seguridad', icon: 'lock-closed-outline' },
];

export function ConfigurationTabs({
  active,
  onChange,
}: {
  active: ConfigurationTab;
  onChange: (tab: ConfigurationTab) => void;
}) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, selected && styles.tabActive]}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={selected ? colors.primary : colors.textSecondary}
            />
            <AppText
              variant="label"
              color={selected ? colors.primary : colors.textSecondary}
              numberOfLines={1}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tabActive: { backgroundColor: colors.surface },
});
