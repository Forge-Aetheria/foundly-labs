import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { colors, radii, shadows, spacing } from '@/shared/theme/tokens';
import { formatAppointmentTime } from '../date-range';
import type { AgendaEntry } from '../services';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: colors.warning,
  CONFIRMED: colors.positive,
  CANCELLED: colors.negative,
  COMPLETED: colors.info,
};

export const AppointmentCard = memo(function AppointmentCard({
  appointment,
}: {
  appointment: AgendaEntry;
}) {
  return (
    <View style={styles.card} accessibilityLabel={`Cita de ${appointment.clientName}`}>
      <View style={styles.timeColumn}>
        <AppText variant="heading">{formatAppointmentTime(appointment.startAt)}</AppText>
        <AppText variant="caption" color={STATUS_COLORS[appointment.status] ?? colors.textMuted}>
          {STATUS_LABELS[appointment.status] ?? appointment.status}
        </AppText>
      </View>
      <View style={styles.details}>
        <AppText variant="label">{appointment.clientName}</AppText>
        <AppText color={colors.textSecondary}>{appointment.service.name}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {appointment.specialist.name}
        </AppText>
        {appointment.notes ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {appointment.notes}
          </AppText>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  timeColumn: { width: 72, gap: spacing.xs },
  details: { flex: 1, gap: 2 },
});
