# Phase 1 — Data Model: Foundly Book — Admin UX Hardening

**Feature**: `specs/book/016-admin-ux-hardening` · **Date**: 2026-10-13

The client does not own persistence; it models UI state, the API's moderation surface and the domain types already used by the panel.

## Toast model — `shared/components/Toaster.tsx`

### `ToastKind`

| Value | Semantic color | Auto-dismiss | Live region |
|---|---|---|---|
| `success` | `accent-positive` (green) | ~4 s | `polite` |
| `warning` | `accent-warning` (yellow) | ~4 s | `polite` |
| `info` | `accent-info` (blue) | ~4 s | `polite` |
| `error` | `accent-negative` (red) | ~8 s | `assertive` (`role="alert"`) |

### `Toast`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Generated on push |
| `kind` | `ToastKind` | Semantic kind |
| `message` | `string` | Localized, user-facing text (never raw provider text) |
| `durationMs` | `number` | Optional override of the default |

`useToast()` exposes `{ success, warning, info, error, dismiss }`. The provider holds an in-memory queue (no persistence).

## Domain type — `shared/types/tenancy.ts` (EXTENDED)

### `ReviewState`

```ts
export type ReviewState = 'pending' | 'approved' | 'rejected';
```

### `Review` (existing type, +1 field)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | — |
| `tenantId` | `string` | — |
| `author` | `string` | — |
| `rating` | `number` | 1–5 |
| `comment` | `string` | — |
| `date` | `string` | ISO-8601 (mapped from API `createdAt`) |
| `state` | `ReviewState` | **NEW** — moderation state |

## Mapping (API → domain) — moderation

| API `ReviewObject` | Domain `Review` | Rule |
|---|---|---|
| `id` | `id` | — |
| `author` | `author` | — |
| `rating` | `rating` | — |
| `comment` | `comment` | — |
| `createdAt` | `date` | kept as ISO string |
| `state` | `state` | `pending \| approved \| rejected` (1:1) |
| — | `tenantId` | `''` for public submissions; the session tenant for admin reads |

## Service (catalog) input — `modules/services/utils/schemas.ts`

`serviceSchema`:

| Field | Rule |
|---|---|
| `name` | required, ≤ 120 |
| `durationMinutes` | required integer > 0 |
| `priceCents` | required integer ≥ 0 |
| `category` | optional, ≤ 60 |
| `description` | optional, ≤ 2000 |

Maps to the API `CreateMyServiceInput` (existing `CreateMyService` document).

## Appointment (agenda) input — `modules/agenda/utils/schemas.ts` (FIX)

`createAppointmentSchema.startAt` requires an ISO-8601 instant **with offset**. The form must compose:

```ts
const startAt = new Date(`${form.date}T${form.time}:00`).toISOString(); // UTC 'Z' offset
```

| Field | Rule |
|---|---|
| `serviceId` | required |
| `specialistId` | optional |
| `startAt` | required, `datetime({ offset: true })` — composed as an absolute instant |
| `endAt` | derived server-side from the service `durationMinutes` (unchanged) |

## Image rule model — `modules/profile/utils/image-rules.ts`

### `ImageRule`

| Field | Type | Notes |
|---|---|---|
| `kind` | `'avatar' \| 'cover'` | — |
| `label` | `string` | e.g. "cuadrada (1:1)" / "banner (3:1)" |
| `aspect` | `number` | 1 (avatar) · 3 (cover) |
| `recommendedWidth` / `recommendedHeight` | `number` | 512×512 · 1200×400 |
| `maxBytes` | `number` | guidance only (URL-only today) |
| `tolerance` | `number` | ±0.02 on the aspect ratio |

### Measurement

`measureImage(url): Promise<{ width: number; height: number } | null>` — resolves the natural dimensions or `null` on error/timeout (CORS, unreachable). Validation outcome:

| Measured? | Aspect within tolerance? | Result |
|---|---|---|
| yes | yes | allowed |
| yes | no | **blocked** with an inline error |
| no | — | allowed with a non-blocking guidance notice |

## State

- **Moderation list**: seeded from the server render; state filter is client state; after approve/reject/delete the action result updates the row and the surface is revalidated (`router.refresh()`).
- **Forms**: pending/in-flight is client state; success closes the modal + revalidates; no optimistic fake data.
- **Toasts**: in-memory queue only.
