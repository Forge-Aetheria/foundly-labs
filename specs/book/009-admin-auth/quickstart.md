# Quickstart — Validate Admin Authentication, Session Protection & Account Security

**Feature**: `specs/book/009-admin-auth` | **Date**: 2026-10-12

Runnable validation guide. It proves the feature end-to-end; implementation details live in `tasks.md`. Behaviour references: [contracts/auth-session.contract.md](./contracts/auth-session.contract.md), [contracts/route-guard.contract.md](./contracts/route-guard.contract.md), [contracts/admin-account.contract.md](./contracts/admin-account.contract.md), [data-model.md](./data-model.md).

## Prerequisites

- Node.js ≥ 20, dependencies installed (`npm install`).
- **Local mode** (default): no `NEXT_PUBLIC_SUPABASE_*` env set — the local auth seam is used. A seeded dev owner exists: `ana@foundly.dev` / `mock-credential`.
- **Live mode** (optional): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for onboarding) configured.

## Run

```bash
npm run dev:book        # http://localhost:3001
```

## Quality gates

```bash
npm run typecheck -w @foundly/book
npm run test -w @foundly/book
npm run build -w @foundly/book
npm run lint
```

Expected: all pass with zero regressions.

## Scenario 1 — Sign in and stay signed in

1. Open `http://localhost:3001/admin/agenda` with no session → expect redirect to `/login`.
2. Submit valid credentials (local: `ana@foundly.dev` / `mock-credential`).
3. Expect landing on `/admin/agenda`; reload → still signed in.
4. Submit invalid credentials → expect an inline error and no session.

**Pass**: owner reaches the panel; invalid credentials never create a session.

## Scenario 2 — Route protection & auth-page guarding

1. Signed out, open `/admin/services` → redirect to `/login`.
2. Signed in, open `/login` → redirect to `/admin/agenda`.
3. Signed in, open `/admin/agenda` → renders scoped to the session tenant.

**Pass**: no admin content is served without a session; `/login` is hidden once signed in.

## Scenario 3 — Sign out safely

1. Signed in, trigger sign-out → expect redirect to `/login`.
2. Open `/admin/agenda` → redirect to `/login`.
3. Use the browser Back button → protected content is not served.

**Pass**: the session is cleared and admin routes are inaccessible.

## Scenario 4 — Public slug quick link

1. Signed in, locate the "Ver página pública" link in the admin shell.
2. Confirm it shows the owner's public URL and points to `/{slug}`.
3. Activate it → the public booking page for that slug opens.

**Pass**: the link reflects the current slug; with no slug it is hidden/non-actionable.

## Scenario 5 — Change password

1. Signed in, open `/admin/seguridad`.
2. Submit a wrong current password → rejected, password unchanged.
3. Submit a weak or mismatched new password → inline validation blocks it.
4. Submit the correct current password + a valid confirmed new password → success.
5. Sign out and sign in with the new password → works; the old password does not.

**Pass**: only a valid current + policy-compliant new password changes the credential.

## Scenario 6 — Live mode (optional)

1. Configure the Supabase env vars and restart.
2. Register via `/onboarding`, then sign out and sign in at `/login`.
3. Repeat Scenarios 1–5; confirm the same outcomes against the live identity provider.

## Accessibility

- The sign-in form and the password form are keyboard-operable and labelled.
- `vitest-axe` (used across `apps/book` tests) reports zero critical violations on the new surfaces.
