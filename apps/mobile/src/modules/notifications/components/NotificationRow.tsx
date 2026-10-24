import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import type { InboxNotification } from '../services';

const TYPE_LABELS: Record<string, string> = {
  NEW_BOOKING: 'Nueva reserva',
  RESCHEDULE_REQUEST: 'Reprogramación',
  SUBSCRIPTION_EXPIRING: 'Suscripción',
  SUBSCRIPTION_EXPIRED: 'Suscripción',
  SYSTEM_INFO: 'Sistema',
};

export const NotificationRow = memo(function NotificationRow({
  notification,
  onPress,
}: {
  notification: InboxNotification;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.read ? 'Leída' : 'No leída'}: ${notification.title}`}
      onPress={onPress}
      style={[styles.row, !notification.read && styles.unread]}
    >
      <View style={styles.header}>
        <AppText variant="caption" color={colors.primary}>
          {TYPE_LABELS[notification.type] ?? notification.type}
        </AppText>
        {!notification.read ? <View style={styles.dot} /> : null}
      </View>
      <AppText variant="label">{notification.title}</AppText>
      <AppText color={colors.textSecondary}>{notification.message}</AppText>
      <AppText variant="caption" color={colors.textMuted}>
        {new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(notification.createdAt),
        )}
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  unread: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
