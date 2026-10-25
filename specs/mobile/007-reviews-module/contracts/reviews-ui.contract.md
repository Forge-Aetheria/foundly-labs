# UI Contract: Reviews Module

**Feature**: `specs/mobile/007-reviews-module`

## Module surface

```ts
export function useReviews(): UseQueryResult<Review[], ReviewsError>;
export function useSetReviewState(): UseMutationResult<Review, ReviewsError, { id: string; state: ReviewState }>;
export function useDeleteReview(): UseMutationResult<true, ReviewsError, string>;
```

## Screen contract

- `app/(drawer)/resenas.tsx` renders `ReviewsView` only.
- `ReviewsView` provides:
  - Title “Reseñas” and moderation subtitle.
  - Filter chips: Todas, Pendientes, Aprobadas, Rechazadas.
  - Initial loading, empty, error/retry states.
  - Pull-to-refresh and refresh overlay.
  - Review cards with author, stars/rating, date, comment and state badge.
  - Approve, reject and delete actions.
- Approve is disabled for approved reviews; reject is disabled for rejected reviews.
- Delete requires `Alert` confirmation.
- Mutation pending states disable actions and show loading.
- Mutation errors are visible without losing the list.

## Card contract

- `ReviewCard` receives `review`, `moderating`, `deleting`, `onApprove`, `onReject`, `onDelete`.
- Rating is displayed clearly (e.g. `4★`).
- Date is formatted in Spanish.
- Long comments remain readable and wrapped.

## Data guarantees

- UI never calls `apiRequest`/`useQuery` directly.
- Query key is `['reviews', tenantId]`.
- Moderation invalidates the reviews query.
- No review creation UI is exposed in this module.
