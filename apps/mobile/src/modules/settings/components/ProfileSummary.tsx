import { StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import type { BusinessProfile } from '../services';

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <AppText>{value && value.trim().length > 0 ? value : 'Sin completar'}</AppText>
    </View>
  );
}

export function ProfileSummary({ business }: { business: BusinessProfile }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="heading">{business.name}</AppText>
        <AppText color={colors.textSecondary}>{business.category}</AppText>
      </View>
      <Row
        label="Página pública"
        value={business.profile?.slug ? `/${business.profile.slug}` : null}
      />
      <Row label="Teléfono" value={business.profile?.phone} />
      <Row label="Dirección" value={business.profile?.address} />
      <Row label="Instagram" value={business.profile?.instagram} />
      <Row label="WhatsApp" value={business.profile?.whatsapp} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  header: { gap: 2 },
  row: { gap: 2 },
});
