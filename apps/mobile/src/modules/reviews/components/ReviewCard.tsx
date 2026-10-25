import { StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import {
  REVIEW_STATE_LABELS,
  REVIEW_STATE_TONES,
  canApprove,
  canReject,
  formatReviewDate,
  reviewRatingLabel,
  type Review,
} from '../review-utils';

const TONE_STYLES = {
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
  positive: { backgroundColor: colors.positiveSoft, color: colors.positive },
  negative: { backgroundColor: colors.negativeSoft, color: colors.negative },
} as const;

export function ReviewCard({
  review,
  moderating = false,
  deleting = false,
  disabled = false,
  onApprove,
  onReject,
  onDelete,
}: {
  review: Review;
  moderating?: boolean;
  deleting?: boolean;
  disabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const tone = TONE_STYLES[REVIEW_STATE_TONES[review.state]];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="label" style={styles.author}>
          {review.author}
        </AppText>
        <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
          <AppText variant="caption" color={tone.color}>
            {REVIEW_STATE_LABELS[review.state]}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" color={colors.textMuted}>
        {reviewRatingLabel(review.rating)} · {formatReviewDate(review.createdAt)}
      </AppText>

      <AppText color={colors.textSecondary}>{review.comment}</AppText>

      <View style={styles.actions}>
        {canApprove(review.state) ? (
          <Button label="Aprobar" loading={moderating} disabled={disabled} onPress={onApprove} />
        ) : null}
        {canReject(review.state) ? (
          <Button label="Rechazar" variant="secondary" disabled={disabled} onPress={onReject} />
        ) : null}
        <Button
          label="Eliminar"
          variant="ghost"
          loading={deleting}
          disabled={disabled}
          onPress={onDelete}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  author: { flex: 1 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
