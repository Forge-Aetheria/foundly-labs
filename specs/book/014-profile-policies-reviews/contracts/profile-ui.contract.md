# Contract — Profile, Policies & Reviews UI (module data layer + views)

**Feature**: `specs/book/014-profile-policies-reviews`

Repository rule (constitution §5.VI): the UI calls **only** these functions/types; it never imports the transport, codegen documents, or the Server Actions directly.

## Profile module (`src/modules/profile/`)

### `actions.ts` (server-only)

```ts
getProfile(tenantId: string): Promise<ActionResult<Tenant>>;
updateProfile(input: unknown): Promise<ActionResult<Tenant>>;
```

- `getProfile` reads the tenant aggregate (via `apiRequestAdmin`) and maps profile + `policies` into the domain `Tenant`.
- `updateProfile` validates with `updateProfileSchema` (→ `VALIDATION_ERROR` with field errors) and calls the `UpdateMyBusinessProfile` mutation via `apiRequestAdmin`; `CONFLICT` on slug maps to a `slug` field error.

### `hooks.ts` (`'use client'`)

```ts
useFetchProfile(): (tenantId: string) => Promise<ActionResult<Tenant>>;
useUpdateProfile(): (input: unknown) => Promise<ActionResult<Tenant>>;
```

## Reviews module (`src/modules/reviews/`)

### `actions.ts` (server-only)

```ts
submitPublicReview(input: unknown): Promise<ActionResult<Review>>;
```

### `hooks.ts` (`'use client'`)

```ts
useSubmitReview(): (input: unknown) => Promise<ActionResult<Review>>;
```

## Error presentation

| Error | Surface |
|---|---|
| `VALIDATION_ERROR` | inline field errors (`fields`) |
| `CONFLICT` (slug taken) | inline on the slug field |
| `STATE_ERROR` / `NOT_FOUND` | clean alert (`ApiErrorDialog`) |
| `UNAUTHENTICATED` (admin profile) | global session handler (redirect) — never inline |

## Admin view (`/admin/profile`)

- **Route**: `src/app/admin/profile/page.tsx` renders `<ProfileView/>` (unchanged thin route).
- **Server view**: resolves the tenant via `getAdminTenantId()` and calls `getProfile(tenantId)`; passes the profile + error to `ProfileEditor`.
- **`ProfileEditor` props**: `{ profile: Tenant | null; error?: string | null }`.
- **Behaviors**: editable fields (name, category, slug, logo, cover, address, phone, Instagram, WhatsApp, bio); a **policies list** (add/edit/remove entries with title + body); validation inline; `Guardar perfil` persists via `useUpdateProfile`; read-only weekly-hours summary.

## Public portal (`/book/<slug>`)

- `getPublicBusinessRemote(slug)` maps the profile `policies` and the public `Reviews` summary into `PublicBusinessProfile` (`policies`, `reviews`, `rating`, `reviewCount`); failures are non-fatal.
- Sections: **"Acerca de"** (bio), **"Dirección y horarios"** (address + hours), **policies**, and **reviews** (list + aggregate rating) with clean empty states.
- The reviews section renders a **`ReviewForm`** (author, rating, comment) using `useSubmitReview`; on success the review appears with an updated rating.
