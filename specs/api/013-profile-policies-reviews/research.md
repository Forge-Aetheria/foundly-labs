# Phase 0 — Research: Foundly API — Business Profile, Policies & Reviews

**Feature**: `specs/api/013-profile-policies-reviews` · **Date**: 2026-10-13

## R0 — Review submission scope (resolved)

- **Decision**: Any visitor may create a review from the public mini-site (**option A**), with basic validation (author, rating 1–5, non-empty bounded comment) and **no moderation workflow in v1**.
- **Rationale**: It is the minimal surface that makes the reviews section a real "system" end-to-end, and matches how public storefronts work. Profile writes remain authenticated/tenant-scoped.
- **Alternatives considered**: (B) authenticated customers — rejected (no customer auth exists). (C) appointment-gated — rejected (larger scope: review↔appointment linkage). (D) read-only — rejected (does not deliver the requested system).
- **Follow-up (not in scope)**: rate limiting, moderation, verified-purchase badges.

## R1 — Contact/social/about persistence: reuse `BusinessProfile`

- **Decision**: Reuse the existing `BusinessProfile` columns (`slug, bio, address, phone, instagram, whatsapp, logo, cover, policies Json`). No new columns for these fields.
- **Rationale**: They already exist and are migrated; the missing piece is the **update surface**. Avoids duplication.
- **Alternatives considered**: New profile table — rejected (duplicate source of truth).

## R2 — Policies representation: structured list over the existing JSON column

- **Decision**: Model policies as a list of `{ title, body }`. Persist in the existing `BusinessProfile.policies Json`; expose in GraphQL as `[PortalPolicyObject!]!` (replacing the previous opaque `String`) and accept them in the update input as `[BusinessPolicyInput!]`.
- **Rationale**: Enables first-class admin editing and public rendering without a new table. No consumer selects the old `policies: String` field, so the type change is safe.
- **Alternatives considered**: Dedicated `Policy` table — rejected (extra table/migration for a small, bounded list).

## R3 — Profile update operation

- **Decision**: A single `updateMyBusinessProfile(input)` mutation guarded by `@RequireAuth`, scoped to `ctx.user.tenantId`, performing a **partial** update (only provided fields change). Name/category live on `Tenant`; the rest on `BusinessProfile`.
- **Rationale**: One operation for the editor screen; identity carries the tenant (never the client). Matches the gallery/catalog write posture.
- **Alternatives considered**: Per-field mutations — rejected (chatty, no benefit).

## R4 — Slug update & uniqueness

- **Decision**: Validate the slug against the existing `SLUG_PATTERN` + `RESERVED_SLUGS`; a duplicate raises `CONFLICT` (via Prisma `P2002`, `isUniqueViolation`), preserving the previous value. Empty/omitted slug leaves it unchanged.
- **Rationale**: Reuses ratified validation; keeps public URLs stable and unique.
- **Alternatives considered**: Slug immutable — rejected (the profile editor exposes it; uniqueness is already enforced at create).

## R5 — Reviews persistence: new `Review` model

- **Decision**: Add a `Review` Prisma model (`id`, `tenantId`, `author`, `rating Int`, `comment`, `createdAt`) with a relation to `Tenant`, plus a migration. Rating range is enforced in the service (Prisma has no portable check constraints in this schema style).
- **Rationale**: There is no review entity today; ratings need a first-class row for aggregation and ordering.
- **Alternatives considered**: Store reviews as JSON on the profile — rejected (no aggregation/ordering, poor integrity).

## R6 — Reviews read: list + aggregate in one operation

- **Decision**: Public `reviews(tenantId?, tenantSlug?)` returning a summary: `items` (review list, newest first) + `average` (Float, null when empty) + `count`.
- **Rationale**: The public section needs both the list and the rating in one round trip; matches the public read style (services/specialists/availability/gallery).
- **Alternatives considered**: Separate aggregate query — rejected (extra round trip).

## R7 — Review creation

- **Decision**: Public `addReview(input: AddReviewInput!)` with `tenantId` **or** `tenantSlug`, `author`, `rating`, `comment`. Validates inputs, resolves the business, persists; unknown business → `NOT_FOUND`.
- **Rationale**: Implements the resolved option A; keeps a single public write with strict validation.
- **Alternatives considered**: Authenticated write — rejected per R0.

## R8 — Testability & errors

- **Decision**: Narrow `REVIEWS_STORE` seam with a Prisma implementation + in-memory test store (mirrors `GALLERY_STORE`/`CATALOG_STORE`); reuse `validationError`/`notFoundError`/`conflictError` and the `UNAUTHENTICATED` scope error.
- **Rationale**: DB-free specs and a single stable error contract.
- **Alternatives considered**: Direct Prisma in the service — rejected (harder to test, diverges from the ratified pattern).
