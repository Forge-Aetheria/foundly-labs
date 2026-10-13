# Feature Specification: Foundly API — Business Profile, Policies & Reviews

**Feature Branch**: `013-profile-policies-reviews`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Ampliar el modelo de datos en Prisma y exponer en GraphQL las propiedades faltantes de contacto/redes (dirección, teléfono, Instagram, WhatsApp, descripción 'Acerca de'), políticas de reserva/cancelación y el sistema de reseñas/rating de clientes, junto con las mutaciones de actualización del perfil del negocio, con aislamiento por tenant."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the affected application is `apps/api`. It is the backend counterpart of `specs/book/014-profile-policies-reviews`. It builds on the tenancy surface of `specs/api/003-db-first-graphql-core` and the identity layer of `specs/api/008-supabase-jwt-auth` (algorithm support: `specs/api/011-jwt-algorithm-support`)._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Update my business profile (Priority: P1)

As an authenticated business owner, I want to update my business identity, contact/social details, "About" text and reservation/cancellation policies, so that my public page reflects accurate, current information.

**Why this priority**: The profile is the heart of the public page; today the API exposes profile reads but has no update path, so the admin editor cannot persist anything.

**Independent Test**: With a valid tenant credential, submit a profile update (name, category, address, phone, Instagram, WhatsApp, bio, policies) and confirm the values are persisted and returned; confirm an anonymous attempt is rejected and another business cannot change my profile.

**Acceptance Scenarios**:

1. **Given** an authenticated, tenant-bound owner, **When** they update the profile with valid values, **Then** the changes are persisted for their own business and returned.
2. **Given** an anonymous request, **When** a profile update is attempted, **Then** it is rejected with the stable authentication error and nothing changes.
3. **Given** an invalid Instagram/WhatsApp/logo/cover URL, **When** the update is submitted, **Then** it is rejected with a validation error and nothing changes.
4. **Given** a public URL (slug) already used by another business or reserved/invalid, **When** the update is submitted, **Then** it is rejected with a conflict/validation error and nothing changes.
5. **Given** a token bound to another business, **When** a profile update is attempted, **Then** it only affects the caller's own business (no cross-tenant writes).
6. **Given** a partial update (only some fields), **When** it is submitted, **Then** only the provided fields change and the rest are preserved.

---

### User Story 2 - Read the full public business profile (Priority: P1)

As a visitor, I want the business's public page to show its real identity, contact, address, "About" description and reservation/cancellation policies, so I know who they are and how they operate.

**Independent Test**: Query a business by its public slug and confirm identity, contact/social fields, description and policies are returned; disable a business and confirm it is not exposed.

**Acceptance Scenarios**:

1. **Given** an active business, **When** its profile is read by public reference, **Then** identity, contact/social fields, "About" and policies are returned.
2. **Given** optional fields left empty, **When** the profile is read, **Then** empty values are returned as absent/empty without error.
3. **Given** a business with no policies, **When** the profile is read, **Then** an empty policies collection is returned (not an error).

---

### User Story 3 - Read customer reviews and rating (Priority: P2)

As a visitor, I want to see the business's customer reviews and its aggregate rating, so I can judge its reputation.

**Independent Test**: Query a business's reviews and confirm the list and the aggregate rating (average + count); a business with no reviews returns an empty list and a null/zero rating.

**Acceptance Scenarios**:

1. **Given** a business with reviews, **When** reviews are read, **Then** each review (author, rating, comment, date) and the aggregate rating (average, count) are returned.
2. **Given** a business with no reviews, **When** reviews are read, **Then** an empty list and a null/zero rating are returned (not an error).
3. **Given** an unknown business reference, **When** reviews are read, **Then** an empty list is returned.

---

### User Story 4 - Record a customer review (Priority: P2)

As a customer, I want to leave a rating and a comment for a business, so that other customers benefit from my experience.

**Why this priority**: Reviews only appear once they can be created; it is the second half of the reviews system.

**Independent Test**: Submit a review with a valid rating and comment and confirm it appears in the business's reviews and in the aggregate rating; an invalid rating is rejected.

**Acceptance Scenarios**:

1. **Given** a visitor (no account required), **When** they submit a valid review (author, rating, comment), **Then** it appears in the business's reviews and updates the aggregate rating.
2. **Given** an invalid rating (out of range), an empty author/comment or an over-long comment, **When** it is submitted, **Then** it is rejected with a validation error and nothing is recorded.
3. **Given** a review submitted for a business reference, **When** it is stored, **Then** it is attributed only to that business.

**Resolved**: Any visitor may create a review from the public mini-site (no account required), with basic validation (author name, rating 1–5, non-empty bounded comment) and no moderation workflow in v1. This is the only public write in the feature; profile updates remain authenticated and tenant-scoped (see FR-010/FR-011).

---

### Edge Cases

- Profile fields left empty: stored/returned as absent without breaking the public page.
- Instagram/WhatsApp/logo/cover malformed URLs: rejected; invalid values not persisted.
- Slug collision / reserved slug: rejected; the previous slug is preserved.
- Policies: zero, one or many entries (title + body); malformed policy payloads rejected.
- Reviews: rating outside 1–5, empty/over-long comment, or missing author rejected.
- Cross-tenant by-id/business access: not-found / no effect (no existence oracle).
- Business not active: not exposed publicly.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST persist, per business, the profile identity (name, category, public URL/slug), contact/social fields (address, phone, Instagram, WhatsApp), images (logo, cover), the "About" description and reservation/cancellation policies.
- **FR-002**: The system MUST expose a public read of a business's profile (identity, contact/social, "About", policies) by public reference.
- **FR-003**: The system MUST expose an update operation for the business profile that requires a valid identity and applies only to the caller's own business.
- **FR-004**: Profile updates MUST NOT accept a client-supplied business identifier for authorization (the business comes from the identity).
- **FR-005**: The public URL/slug MUST be validated for format, reserved words and uniqueness; a conflicting/invalid slug MUST be rejected and MUST NOT overwrite the existing one.
- **FR-006**: Image and social links (logo, cover, Instagram, WhatsApp) MUST be validated as absolute URLs when present; malformed values MUST be rejected.
- **FR-007**: Reservation/cancellation policies MUST be modeled as a list of entries (title + body) and MUST support empty, one or many.
- **FR-008**: The system MUST persist customer reviews per business (author, rating 1–5, comment, creation date) and expose them publicly with an aggregate rating (average + count).
- **FR-009**: A business with no reviews MUST return an empty list and a null/zero aggregate without error.
- **FR-010**: Review creation MUST be available to any visitor (no account required), validate the author (non-empty), the rating (1–5) and a non-empty bounded comment, and MUST attribute the review to the target business.
- **FR-011**: Profile updates MUST require a valid, tenant-bound identity and MUST be rejected with the stable authentication error when anonymous/non-tenant-bound; review creation is the only public write and MUST still validate all inputs.
- **FR-012**: Cross-business access MUST NOT read, modify or reveal another business's records (no existence oracle).
- **FR-013**: Automated tests MUST cover: profile update (valid, anonymous, invalid URL, slug conflict, partial update), public profile read (full/empty), reviews read (list/empty/unknown) and rating aggregation, and cross-tenant isolation.
- **FR-014**: All API gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Business (Tenant)**: identity (name, category, public URL), status, timezone, currency; owns a profile, policies and reviews.
- **Business profile**: contact/social (address, phone, Instagram, WhatsApp), images (logo, cover), "About" description and the reservation/cancellation policies.
- **Policy**: a reservation/cancellation entry (title + body); a business has zero or more.
- **Review**: a customer rating (1–5) with an optional/required comment, author and creation date, belonging to one business.
- **Aggregate rating**: derived average score and review count for a business.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An owner can update any editable profile field and read it back unchanged.
- **SC-002**: 100% of anonymous/foreign write attempts and invalid URLs/slugs are rejected with the stable errors and persist nothing.
- **SC-003**: 100% of valid profile updates are reflected in the public profile read.
- **SC-004**: A business's reviews and aggregate rating are returned correctly for the populated, empty and unknown cases; the aggregate matches the stored reviews.
- **SC-005**: All API gates pass with zero regressions.

## Assumptions

- **Contact/social fields already exist in persistence**: the profile entity already stores address, phone, Instagram, WhatsApp, logo, cover, "About" and a policies payload. This feature adds the **update surface** and, where needed, structured policies; it reuses the existing entity rather than duplicating it.
- **Reviews require persistence**: there is no review entity today, so a new reviewed entity (author, rating, comment, date, business) with its migration is in scope.
- **Public reads are unauthenticated; profile writes are authenticated and tenant-scoped** (consistent with the existing public reads and the tenant-scoped catalog/gallery writes). **Review creation is a public write by any visitor** (no account) with basic validation and no moderation workflow in v1; stronger anti-abuse/moderation is a follow-up.
- **Images are URL-based** (no upload), consistent with the existing profile/gallery features.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (the public business page and its reputation are part of the Foundly Book value proposition) and the authority order of `constitution.md`.
