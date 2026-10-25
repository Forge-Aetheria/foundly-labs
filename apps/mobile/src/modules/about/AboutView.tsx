import Constants from 'expo-constants';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import brandingLogo from '../../../assets/branding-logo.png';
import { AppText } from '@/shared/ui/AppText';
import { ExternalLinkRow } from '@/shared/ui/ExternalLinkRow';
import { Screen } from '@/shared/ui/Screen';
import { useState } from 'react';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { ABOUT_DESCRIPTION, ABOUT_LEGAL_LINKS, ABOUT_TAGLINE } from './about-content';

export function AboutView() {
  const [linkError, setLinkError] = useState<string | null>(null);
  const version = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <Image
            source={brandingLogo}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Foundly Book"
          />
          <AppText variant="title">Foundly</AppText>
          <AppText color={colors.textSecondary} style={styles.center}>
            {ABOUT_TAGLINE}
          </AppText>
          <View style={styles.version}>
            <AppText variant="caption" color={colors.textSecondary}>
              Foundly Tenant v{version}
            </AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText variant="heading">Sobre la app</AppText>
          <AppText color={colors.textSecondary}>{ABOUT_DESCRIPTION}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="heading">Enlaces</AppText>
          {ABOUT_LEGAL_LINKS.map((link) => (
            <ExternalLinkRow
              key={link.id}
              icon={link.icon}
              label={link.label}
              description={link.description}
              url={link.url}
              onError={setLinkError}
            />
          ))}
          {linkError ? (
            <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
              {linkError}
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.xl, paddingVertical: spacing.lg, paddingBottom: spacing.xxl },
  brand: { alignItems: 'center', gap: spacing.sm },
  logo: { width: 168, height: 96, marginBottom: spacing.xs },
  center: { textAlign: 'center' },
  version: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  section: { gap: spacing.md },
});
