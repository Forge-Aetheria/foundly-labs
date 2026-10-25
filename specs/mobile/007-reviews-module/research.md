# Research: Mobile Reviews Module

**Feature**: `specs/mobile/007-reviews-module/spec.md`
**Date**: 2026-10-25

## R1 — API surface

**Decision**: Reuse `myReviews`, `setReviewState` and `deleteReview`.

**Rationale**: `apps/api` already exposes the moderation operations and `apps/book` consumes the same contract. No backend changes are required.

**Alternatives considered**: Adding review editing endpoints — rejected; the spec scopes only moderation/deletion.

## R2 — Filtering

**Decision**: Fetch all tenant reviews once and filter client-side by state.

**Rationale**: The list is small, avoids extra network round-trips and keeps filter switches instant. The API also supports `myReviews(state)`, but client filtering preserves a single cache entry.

## R3 — Moderation transitions

**Decision**: Allow approve for pending/rejected and reject for pending/approved; disable the action matching the current state.

**Rationale**: Mirrors the web moderation UX and prevents redundant mutations.

## R4 — State presentation

**Decision**: Map `pending`, `approved`, `rejected` to warning/positive/negative tokens with Spanish labels.

**Rationale**: Keeps parity with the Book admin and the shared design language.

## R5 — Loading and errors

**Decision**: Use `LoadingState` (screen/overlay), `RefreshControl`, mutation pending flags and inline error messages.

**Rationale**: Consistent with Services, Team and Gallery.

## R6 — Review creation

**Decision**: Out of scope for mobile admin; public review creation remains in the existing public flow.

**Rationale**: The admin module is for moderation, and the spec explicitly excludes creation.
