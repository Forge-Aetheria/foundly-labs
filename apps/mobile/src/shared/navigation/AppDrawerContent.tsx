import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/AppText';
import { SessionAvatar } from '../ui/SessionAvatar';
import {
  PRIMARY_MODULES,
  SECONDARY_MODULES,
  getModuleById,
  isModuleActive,
  type NavigationModule,
} from './modules';
import { initialsFrom, type WorkspaceIdentity } from './session-identity';
import { colors, radii, spacing } from '../theme/tokens';

export interface AppDrawerContentProps extends DrawerContentComponentProps {
  identity: WorkspaceIdentity;
  publicPageHref: string | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export function AppDrawerContent({
  identity,
  publicPageHref,
  onLogout,
  isLoggingOut = false,
  navigation,
}: AppDrawerContentProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const navigate = (module: NavigationModule) => {
    navigation.closeDrawer();
    navigation.navigate(module.id as never);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.brandSection}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${identity.tenantName ?? 'Mi negocio'} — ir a Agenda`}
          onPress={() => navigate(getModuleById('agenda'))}
          style={({ pressed }) => [styles.tenantButton, pressed && styles.pressed]}
        >
          <SessionAvatar
            displayName={identity.tenantName ?? 'Mi negocio'}
            avatarUrl={identity.tenantLogoUrl}
            initials={initialsFrom(identity.tenantName ?? 'Mi negocio')}
            size={52}
          />
          <AppText variant="heading" numberOfLines={1} style={styles.tenantName}>
            {identity.tenantName ?? 'Mi negocio'}
          </AppText>
        </Pressable>
        {publicPageHref ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver página pública de reservas"
            onPress={() => void Linking.openURL(publicPageHref)}
            style={({ pressed }) => [styles.publicLink, pressed && styles.pressed]}
          >
            <Ionicons name="open-outline" size={16} color={colors.primary} />
            <AppText variant="label" color={colors.primary}>
              Ver página pública
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ModuleGroup modules={PRIMARY_MODULES} pathname={pathname} onNavigate={navigate} />
        <View style={styles.divider} />
        <ModuleGroup modules={SECONDARY_MODULES} pathname={pathname} onNavigate={navigate} />
      </ScrollView>

      <View style={styles.divider} />
      <View style={styles.footer}>
        <SessionAvatar
          displayName={identity.displayName}
          avatarUrl={identity.avatarUrl}
          initials={identity.initials}
          size={40}
        />
        <View style={styles.footerText}>
          <AppText variant="label" numberOfLines={1}>
            {identity.displayName}
          </AppText>
          {identity.email ? (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {identity.email}
            </AppText>
          ) : null}
          {identity.tenantName ? (
            <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
              {identity.tenantName}
            </AppText>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          accessibilityState={{ busy: isLoggingOut, disabled: isLoggingOut }}
          disabled={isLoggingOut}
          onPress={onLogout}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={colors.negative} size="small" />
          ) : (
            <Ionicons name="log-out-outline" size={22} color={colors.negative} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function ModuleGroup({
  modules,
  pathname,
  onNavigate,
}: {
  modules: readonly NavigationModule[];
  pathname: string;
  onNavigate: (module: NavigationModule) => void;
}) {
  return (
    <View style={styles.group}>
      {modules.map((module) => {
        const active = isModuleActive(pathname, module.route);
        return (
          <Pressable
            key={module.id}
            accessibilityRole="button"
            accessibilityLabel={module.label}
            accessibilityState={{ selected: active }}
            onPress={() => onNavigate(module)}
            style={({ pressed }) => [
              styles.item,
              active && styles.itemActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={module.icon}
              size={21}
              color={active ? colors.primary : colors.textSecondary}
            />
            <AppText
              variant="label"
              color={active ? colors.primary : colors.textPrimary}
              style={styles.itemLabel}
            >
              {module.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  brandSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  tenantButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    maxWidth: '100%',
  },
  tenantName: { textAlign: 'center' },
  publicLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  group: { gap: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  itemActive: { backgroundColor: colors.primarySoft },
  itemLabel: { flexShrink: 1 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  footerText: { flex: 1, minWidth: 0, gap: 2 },
  logout: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.negativeSoft,
  },
  pressed: { opacity: 0.7 },
});
