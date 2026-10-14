# Quickstart — Foundly Book Public Business Directory

**Feature**: `specs/book/019-business-directory` · Runnable validation scenarios.

## Prerequisites

- The API companion `specs/api/018-business-directory` is implemented (public `searchBusinesses`) and `apps/book/codegen.schema.gql` includes it.
- `apps/book/.env` with `API_URL` pointing at the running API.
- At least two active businesses with a public slug and one active service each (one with configured availability, one without), plus one draft/suspended business to confirm exclusion.

## Run

```bash
npm run codegen -w @foundly/book     # regenerate src/shared/api/generated.ts from the snapshot
npm run dev -w @foundly/book         # http://localhost:3001/directorio
```

## Scenario 1 — Browse the directory

Open `/directorio`.

**Expected**: a responsive grid of cards for the eligible active businesses; the draft/suspended business and any business without an active service are absent.

## Scenario 2 — Search

- Type a term matching a business name → the grid narrows to it; the URL updates to `/directorio?q=<term>`.
- Type a term matching a category or the city → matching businesses are returned.
- Clear the term → the full list returns.
- Type a nonsense term → a "no results" state (never an error), with a way to clear the search.

## Scenario 3 — Card content

Inspect a card.

**Expected**: logo/avatar, cover, name, short description, location and general weekly hours (e.g. "Lun–Vie 09:00–18:00"). A business missing cover/description → placeholders, card intact. A business with no availability → neutral hours placeholder.

## Scenario 4 — Open the profile and start booking

Activate **"Ver perfil"** on a card.

**Expected**: navigation to `/[tenantSlug]`; the public page shows the service catalog and the booking flow (calendar → slots → advance/payment step when the service requires it). A business that became unavailable shows the existing unavailable state.

## Scenario 5 — States

- **Loading**: navigate with a throttled connection → skeleton cards, no layout jump.
- **Empty**: with no eligible businesses → empty-state copy.
- **Error**: stop the API and reload → friendly error with a working retry.

## Automated checks

```bash
npm run typecheck -w @foundly/book
npm run test -w @foundly/book        # module tests (actions/view/search/card)
npm run lint -w @foundly/book
npm run build -w @foundly/book
```

> `pretypecheck`/`prebuild` run `codegen` first, so the snapshot must be in sync (the `api` companion owns `apps/book/codegen.schema.gql`).
