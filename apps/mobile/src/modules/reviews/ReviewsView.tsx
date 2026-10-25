import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ReviewState } from '@/shared/api/generated';
import { AppText } from '@/shared/ui/AppText';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Screen } from '@/shared/ui/Screen';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { useRefetchOnFocus } from '@/shared/hooks/use-refetch-on-focus';
import { ReviewCard } from './components/ReviewCard';
import { useDeleteReview, useReviews, useSetReviewState } from './hooks';
import { REVIEW_FILTERS, filterReviews, type Review, type ReviewFilter } from './review-utils';

export function ReviewsView() {
  const reviews = useReviews();
  const setState = useSetReviewState();
  const remove = useDeleteReview();
  const [filter, setFilter] = useState<ReviewFilter>('all');
  useRefetchOnFocus(reviews.refetch);

  const visible = useMemo(() => filterReviews(reviews.data ?? [], filter), [filter, reviews.data]);

  if (reviews.isLoading) {
    return (
      <Screen>
        <LoadingState label="Cargando reseñas…" />
      </Screen>
    );
  }

  if (reviews.isError) {
    return (
      <Screen>
        <ErrorState message={reviews.error.message} onRetry={() => void reviews.refetch()} />
      </Screen>
    );
  }

  const actionError = setState.error?.message ?? remove.error?.message ?? null;
  const hasReviews = (reviews.data ?? []).length > 0;

  function confirmDelete(review: Review) {
    Alert.alert(
      'Eliminar reseña',
      '¿Seguro que quieres eliminar esta reseña? No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => remove.mutate(review.id),
        },
      ],
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="title">Reseñas</AppText>
          <AppText color={colors.textSecondary}>
            Aprueba, rechaza o elimina las reseñas de tu negocio. Solo las aprobadas se publican.
          </AppText>
        </View>

        <View style={styles.filters}>
          {REVIEW_FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(item.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <AppText variant="caption" color={active ? colors.primary : colors.textSecondary}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {actionError ? (
          <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
            {actionError}
          </AppText>
        ) : null}

        <View style={styles.listContainer}>
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, visible.length === 0 && styles.emptyList]}
            ListEmptyComponent={
              <EmptyState
                title={hasReviews ? 'No hay reseñas con este filtro' : 'Todavía no hay reseñas'}
                message={
                  hasReviews
                    ? 'Prueba con otro estado de moderación.'
                    : 'Cuando tus clientes dejen reseñas, aparecerán aquí para moderarlas.'
                }
              />
            }
            renderItem={({ item }) => {
              const moderating = setState.isPending && setState.variables?.id === item.id;
              const deleting = remove.isPending && remove.variables === item.id;
              return (
                <ReviewCard
                  review={item}
                  moderating={moderating}
                  deleting={deleting}
                  disabled={setState.isPending || remove.isPending}
                  onApprove={() => setState.mutate({ id: item.id, state: ReviewState.Approved })}
                  onReject={() => setState.mutate({ id: item.id, state: ReviewState.Rejected })}
                  onDelete={() => confirmDelete(item)}
                />
              );
            }}
            refreshControl={
              <RefreshControl
                refreshing={reviews.isRefetching}
                onRefresh={() => void reviews.refetch()}
                tintColor={colors.primary}
              />
            }
          />
          {reviews.isFetching ? (
            <LoadingState variant="overlay" label="Actualizando reseñas…" />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.md, paddingTop: spacing.lg },
  header: { gap: spacing.xs },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  listContainer: { flex: 1 },
  list: { gap: spacing.md, paddingVertical: spacing.lg, paddingBottom: spacing.xl },
  emptyList: { flexGrow: 1 },
});
