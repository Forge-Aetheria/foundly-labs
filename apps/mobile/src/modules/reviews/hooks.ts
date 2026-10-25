import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReviewState, SetReviewStateMutation } from '@/shared/api/generated';
import type { ErrorCode } from '@/shared/api/result';
import { useSession } from '@/shared/auth/session-context';
import { deleteReview, fetchReviews, setReviewState } from './services';
import type { Review } from './review-utils';

export class ReviewsError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ReviewsError';
  }
}

function reviewsKey(tenantId: string | null) {
  return ['reviews', tenantId] as const;
}

export function useReviews() {
  const { tenantId } = useSession();

  return useQuery<Review[], ReviewsError>({
    queryKey: reviewsKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const result = await fetchReviews();
      if (!result.ok) throw new ReviewsError(result.code, result.message);
      return result.data;
    },
  });
}

export function useSetReviewState() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<
    SetReviewStateMutation['setReviewState'],
    ReviewsError,
    { id: string; state: ReviewState }
  >({
    mutationFn: async ({ id, state }) => {
      const result = await setReviewState(id, state);
      if (!result.ok) throw new ReviewsError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewsKey(tenantId) });
    },
  });
}

export function useDeleteReview() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, ReviewsError, string>({
    mutationFn: async (id) => {
      const result = await deleteReview(id);
      if (!result.ok) throw new ReviewsError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewsKey(tenantId) });
    },
  });
}
