import { ReviewState } from '@/shared/api/generated';
import type { ReviewObject } from '@/shared/api/generated';

export type Review = ReviewObject;
export type ReviewFilter = 'all' | ReviewState;

export const REVIEW_FILTERS: { id: ReviewFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: ReviewState.Pending, label: 'Pendientes' },
  { id: ReviewState.Approved, label: 'Aprobadas' },
  { id: ReviewState.Rejected, label: 'Rechazadas' },
];

export const REVIEW_STATE_LABELS: Record<ReviewState, string> = {
  [ReviewState.Pending]: 'Pendiente',
  [ReviewState.Approved]: 'Aprobada',
  [ReviewState.Rejected]: 'Rechazada',
};

export const REVIEW_STATE_TONES: Record<ReviewState, 'warning' | 'positive' | 'negative'> = {
  [ReviewState.Pending]: 'warning',
  [ReviewState.Approved]: 'positive',
  [ReviewState.Rejected]: 'negative',
};

export function filterReviews(reviews: Review[], filter: ReviewFilter): Review[] {
  return filter === 'all' ? reviews : reviews.filter((review) => review.state === filter);
}

export function canApprove(state: ReviewState): boolean {
  return state !== ReviewState.Approved;
}

export function canReject(state: ReviewState): boolean {
  return state !== ReviewState.Rejected;
}

export function formatReviewDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
}

export function reviewRatingLabel(rating: number): string {
  return `${rating}★`;
}
