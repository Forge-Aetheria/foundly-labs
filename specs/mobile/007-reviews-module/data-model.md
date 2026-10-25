# Data Model: Mobile Reviews Module

**Feature**: `specs/mobile/007-reviews-module/spec.md`
**Date**: 2026-10-25

No persistent schema changes. Uses the existing `Review` model.

## Review (view model)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | `string` | Review id. |
| `author` | `string` | Client name. |
| `rating` | `number` | Star rating. |
| `comment` | `string` | Review content. |
| `state` | `pending \| approved \| rejected` | Moderation state. |
| `createdAt` | `string` | ISO date. |

## ReviewState

| Value | Label | Tone |
| ----- | ----- | ---- |
| `pending` | Pendiente | warning |
| `approved` | Aprobada | positive |
| `rejected` | Rechazada | negative |

## Filter

| Value | Meaning |
| ----- | ------- |
| `all` | Todas |
| `pending` | Pendientes |
| `approved` | Aprobadas |
| `rejected` | Rechazadas |

## State transitions

- Load: `myReviews` → list.
- Filter: local state → visible subset.
- Approve: `setReviewState({state:'approved'})` → invalidate reviews.
- Reject: `setReviewState({state:'rejected'})` → invalidate reviews.
- Delete: confirmation → `deleteReview` → invalidate reviews.
- Refresh: pull-to-refresh / invalidation with overlay.

## Validation rules

- Approve disabled when already approved.
- Reject disabled when already rejected.
- Delete always requires confirmation.
- Only approved reviews are published publicly.
