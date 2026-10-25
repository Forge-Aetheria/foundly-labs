import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { TextField } from '@/shared/ui/TextField';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { WEEKDAY_LABELS, WEEKDAY_ORDER, type DayDraft } from '../availability-utils';

export function WeeklyScheduleCard({
  days,
  errors,
  disabled = false,
  onChange,
}: {
  days: DayDraft[];
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (weekday: number, patch: Partial<DayDraft>) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="heading">Horario semanal</AppText>
        <AppText color={colors.textSecondary}>
          Define los días y horas en que tu negocio acepta reservas.
        </AppText>
      </View>

      {WEEKDAY_ORDER.map((weekday) => {
        const day = days.find((item) => item.weekday === weekday);
        if (!day) return null;
        const error = errors[`day-${weekday}`];
        return (
          <View key={weekday} style={styles.dayRow}>
            <View style={styles.dayHeader}>
              <AppText variant="label" style={styles.dayName}>
                {WEEKDAY_LABELS[weekday]}
              </AppText>
              <Switch
                accessibilityLabel={`Abrir ${WEEKDAY_LABELS[weekday]}`}
                value={day.isOpen}
                disabled={disabled}
                onValueChange={(isOpen) => onChange(weekday, { isOpen })}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={day.isOpen ? colors.primary : colors.surface}
              />
            </View>

            {day.isOpen ? (
              <View style={styles.times}>
                <View style={styles.timeField}>
                  <TextField
                    label="Inicio"
                    value={day.startTime}
                    onChangeText={(startTime) => onChange(weekday, { startTime })}
                    editable={!disabled}
                    keyboardType="numbers-and-punctuation"
                    placeholder="09:00"
                  />
                </View>
                <View style={styles.timeField}>
                  <TextField
                    label="Fin"
                    value={day.endTime}
                    onChangeText={(endTime) => onChange(weekday, { endTime })}
                    editable={!disabled}
                    keyboardType="numbers-and-punctuation"
                    placeholder="18:00"
                  />
                </View>
              </View>
            ) : (
              <AppText variant="caption" color={colors.textMuted}>
                Cerrado
              </AppText>
            )}

            {error ? (
              <AppText variant="caption" color={colors.negative}>
                {error}
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: { gap: spacing.xs },
  dayRow: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayName: { flex: 1 },
  times: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1 },
});
