# Contract: Onboarding Flow (wizard inputs & provisioning actions)

**Feature**: `specs/book/002-onboarding-and-tenant-flow/` | **Date**: 2026-10-08

Defines the public surface of the onboarding feature: the three step inputs (Zod-validated), the local draft seam and the server actions that create the business. Validation rules derive from `spec.md` (FR-007…FR-014) and `data-model.md`.

## Step 1 — Account (`AccountFields`)

| Field      | Rule                                                      |
| ---------- | --------------------------------------------------------- |
| `fullName` | required, 1–120 chars                                     |
| `email`    | required, valid email format, unique across users         |
| `password` | required, minimum strength (≥ 8 chars, letters + numbers) |

On invalid email or weak password the step blocks progress with inline errors (FR-007).

## Step 2 — Business (`BusinessFields`)

| Field      | Rule                                                       |
| ---------- | ---------------------------------------------------------- |
| `name`     | required, 1–120 chars (commercial name)                    |
| `slug`     | required, valid format + not reserved + not taken (FR-008) |
| `category` | required, from the predefined list or a free-form value    |

The wizard proposes `suggestSlug(name)` and re-validates the slug on change (FR-009).

## Step 3 — Setup (`SetupFields`)

| Field                               | Rule                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| `defaultAppointmentDurationMinutes` | required, `> 0`                                        |
| `businessHours`                     | required; `endTime > startTime` for open days (FR-010) |

## Local draft seam (`draft.ts`)

- `loadDraft(draftId): BookingDraft | null`
- `saveDraft(draft: BookingDraft): void`
- `clearDraft(draftId): void`

Draft survives step navigation, reload and connectivity loss (FR-013, local-first). On submit the draft is consumed once (idempotency token) so a retry cannot create a second business.

## Server actions (`actions.ts`)

| Action           | Input                                   | Success output             | Failure conditions                                                  |
| ---------------- | --------------------------------------- | -------------------------- | ------------------------------------------------------------------- |
| `validateSlug`   | `slug: string`                          | `{ available: true }`      | `{ available: false, reason }`                                      |
| `createBusiness` | `{ account, business, setup, draftId }` | `{ tenantId, redirectTo }` | `EMAIL_TAKEN`, `SLUG_TAKEN`, `INVALID_INPUT`, `ALREADY_PROVISIONED` |

**Rules (FR-011, FR-012, FR-014)**:

- `createBusiness` MUST be idempotent per `draftId`: a repeated submission returns the same `tenantId` and does not create a second tenant.
- On success it provisions: `Tenant` (status `active`), owner `User` (role `owner`), the default availability rules and a default service derived from the setup (R7).
- The redirect target is the tenant's private dashboard (`/admin/agenda`) with the session established.

## Verification

- Unit: Zod schemas reject invalid step values; slug rules reject format/reserved/taken; idempotency test proves no duplicate tenants.
- Component: each step blocks progression with inline errors; a partial wizard reloads its draft.
