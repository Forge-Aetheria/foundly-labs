import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import brandingLogo from '../../../assets/branding-logo.png';
import { SessionAvatar } from '../ui/SessionAvatar';
import { initialsFrom, type WorkspaceIdentity } from './session-identity';
import { colors, spacing } from '../theme/tokens';

export interface AppHeaderProps {
  identity: WorkspaceIdentity;
  onOpenDrawer: () => void;
  onOpenNotifications: () => void;
}

export function AppHeader({ identity, onOpenDrawer, onOpenNotifications }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const tenantName = identity.tenantName ?? 'Mi negocio';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir menú de ${tenantName}`}
            onPress={onOpenDrawer}
            style={({ pressed }) => [styles.tenantButton, pressed && styles.pressed]}
          >
            <SessionAvatar
              displayName={tenantName}
              avatarUrl={identity.tenantLogoUrl}
              initials={initialsFrom(tenantName)}
              size={36}
            />
          </Pressable>
        </View>

        <View style={styles.brandButton}>
          <Image
            source={brandingLogo}
            style={styles.brand}
            resizeMode="contain"
            accessibilityLabel="Foundly Book"
          />
        </View>

        <View style={[styles.side, styles.right]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
            onPress={onOpenNotifications}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  side: { flex: 1, alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  tenantButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  brandButton: {
    minWidth: 168,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { width: 168, height: 56 },
  action: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  pressed: { opacity: 0.7 },
});
