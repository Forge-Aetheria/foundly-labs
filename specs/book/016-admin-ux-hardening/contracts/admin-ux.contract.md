# Contract — Admin UX Hardening (module data layer + views)

**Feature**: `specs/book/016-admin-ux-hardening`

Repository rule (constitution §5.VI): the UI calls **only** these functions/types; it never imports the transport, codegen documents, or the Server Actions directly. All API DTOs are codegen-only.

## 1. Toast system — `shared/components/Toaster.tsx`

```ts
// 'use client'
export type ToastKind = 'success' | 'warning' | 'info' | 'error';

export interface ToastApi {
  success(message: string, opts?: { durationMs?: number }): void;
  warning(message: string, opts?: { durationMs?: number }): void;
  info(message: string, opts?: { durationMs?: number }): void;
  error(message: string, opts?: { durationMs?: number }): void;
  dismiss(id: string): void;
}

export function ToastProvider(props: { children: React.ReactNode }): JSX.Element; // client boundary
export function useToast(): ToastApi; // throws outside the provider
```

- Mounted once (`app/layout.tsx` or the admin/public layout) so toasts are available across the app.
- Accessible: `aria-live` region; each toast has a labelled dismiss control; errors use `role="alert"`.

## 2. Async action helper — `shared/hooks/useAsyncAction.ts`

```ts
// 'use client'
export interface AsyncActionState {
  pending: boolean;
  run<T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T> | undefined>; // undefined when re-entrant
}
export function useAsyncAction(): AsyncActionState;
```

- `run` is a no-op while `pending` (double-submit guard) and returns the action's `ActionResult`.
- Forms disable their submit `Button` with `loading={pending}`.

## 3. Reviews moderation module — `modules/reviews/`

### `actions.ts` (server-only)

```ts
listMyReviews(state?: ReviewState): Promise<ActionResult<Review[]>>;
setReviewState(input: unknown): Promise<ActionResult<Review>>;
deleteReview(input: unknown): Promise<ActionResult<{ id: string }>>;
```

- Reads/writes go through `apiRequestAdmin` (`MyReviews`, `SetReviewState`, `DeleteReview`).
- `setReviewState` validates `state ∈ { approved, rejected }` with `setReviewStateSchema` (→ `VALIDATION_ERROR`).
- `deleteReview` validates the id with `deleteReviewSchema`.
- Session errors are handled globally by `apiRequestAdmin` (redirect to the session-expiry handler); never inline text.

### `hooks.ts` (`'use client'`)

```ts
useFetchMyReviews(): (state?: ReviewState) => Promise<ActionResult<Review[]>>;
useSetReviewState(): (input: unknown) => Promise<ActionResult<Review>>;
useDeleteReview(): (input: unknown) => Promise<ActionResult<{ id: string }>>;
```

### `ModerationView.tsx` (server) + `components/ReviewModerationList.tsx` (client)

- **Server view**: `ModerationView` resolves the tenant and calls `listMyReviews()`; passes `reviews` and any `error` to `ReviewModerationList`.
- **`ReviewModerationList` props**: `{ reviews: Review[]; error?: string | null }`.
- **Behaviors**: lists reviews (newest first) with a `pending` flag; a state filter (Chips: all/pending/approved/rejected); approve/reject actions (idempotent); delete with a confirmation `AlertDialog`; clean empty state; `ApiErrorDialog` for transient failures.

## 4. Services module — `modules/services/` (orphan action)

### `actions.ts` (server-only)

```ts
listServices(tenantId: string): Promise<ActionResult<Service[]>>;      // existing
createService(input: unknown): Promise<ActionResult<Service>>;         // NEW
updateService(input: unknown): Promise<ActionResult<Service>>;         // NEW
deleteService(input: unknown): Promise<ActionResult<{ id: string }>>;  // NEW
```

### `hooks.ts` (`'use client'`)

```ts
useCreateService(): (input: unknown) => Promise<ActionResult<Service>>;
useUpdateService(): (input: unknown) => Promise<ActionResult<Service>>;
useDeleteService(): (input: unknown) => Promise<ActionResult<{ id: string }>>;
```

- `ServiceCatalog` replaces the placeholder modal with a real form (name, duration, price, optional category), a pending submit, auto-close + revalidate on success and a success toast; the delete confirmation calls `useDeleteService`.

## 5. Agenda module — `modules/agenda/` (orphan action fix)

- `createAppointmentSchema.startAt` must be an ISO instant with offset; `Agenda.tsx` composes `new Date(\`${date}T${time}:00\`).toISOString()`.
- The create modal disables its submit while pending, closes + revalidates on success and shows a success toast; inline errors + yellow toast on validation failure.

## 6. Profile image rules — `modules/profile/`

```ts
// utils/image-rules.ts
export interface ImageRule { kind: 'avatar' | 'cover'; label: string; aspect: number; recommendedWidth: number; recommendedHeight: number; maxBytes: number; tolerance: number; }
export const AVATAR_RULE: ImageRule;
export const COVER_RULE: ImageRule;
export function measureImage(url: string): Promise<{ width: number; height: number } | null>;
export function checkImage(url: string, rule: ImageRule): Promise<{ ok: true; measured: boolean } | { ok: false; message: string }>;
```

- `ProfileEditor` shows the recommended dimensions/aspect, calls `checkImage` on save, blocks with an inline error when a measured image violates the aspect rule, and shows guidance when it cannot be measured.

## 7. Error presentation

| Error | Surface |
|---|---|
| `VALIDATION_ERROR` | inline field errors (`fields`) **+ yellow toast** (complementary) |
| `STATE_ERROR` / `NOT_FOUND` | red toast and/or `ApiErrorDialog` |
| `UNAUTHENTICATED` | global session handler (redirect) — never inline |
| success | green toast + modal close + `router.refresh()` |

## 8. RSC boundary

- `ToastProvider`, `ReviewModerationList`, the create modals and `ProfileEditor` are `'use client'`; they receive only serializable props (arrays/objects/strings). No functions cross the Server → Client boundary (`code-rules.md` §8).
