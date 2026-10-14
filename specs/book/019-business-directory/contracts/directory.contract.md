# Contract — Foundly Book Public Business Directory

**Feature**: `specs/book/019-business-directory` · **Surface**: public route `GET /directorio` (public zone `/book/directorio`)

## Route contract

| Aspect | Value |
|---|---|
| Path | `/directorio` |
| Auth | none (public) |
| Query param | `q` — optional search term (trimmed; empty = all) |
| Rendering | Server Component (`DirectoryView`); the search input is a client island |
| Result bound | delegated to the API (default/max limit) |

## Data contract (GraphQL consumption)

The module document `directory.graphql` calls the public query (owned by `specs/api/018-business-directory`):

```graphql
query SearchBusinesses($query: String, $limit: Int, $offset: Int) {
  searchBusinesses(query: $query, limit: $limit, offset: $offset) {
    tenantId slug name category description address phone logo cover
    schedule { weekday startTime endTime }
  }
}
```

- **Auth**: none.
- **Errors**: a failed read is mapped by the existing `apiRequest` error surface to an `ActionResult` failure; the view shows the error state (no raw provider message leaks — `shared/api/client`).

## UI contract (card)

Each `BusinessCard` renders:

1. **Cover** (image or neutral fallback).
2. **Avatar/logo** (image or initial-letter fallback).
3. **Name** (heading) and **category** (badge/pill).
4. **Short description** (or placeholder).
5. **Location/address** (or placeholder).
6. **General weekly hours** (formatted; neutral placeholder when empty).
7. **Primary action**: a link labelled **"Ver perfil"** (or **"Reservar"**) to `/[tenantSlug]`.

## States contract

| State | Condition | Expected UI |
|---|---|---|
| Loading | navigation/data pending | skeleton cards |
| Ready | ≥1 business | responsive card grid (1/2/3 columns) |
| Empty | 0 businesses and empty `q` | empty-state copy |
| No results | 0 businesses and non-empty `q` | "no results" copy + clear-search action |
| Error | read failed | friendly error + retry |

## Boundary rules (constitution §5.VI / §5.V)

1. Components (`components/`, `DirectoryView.tsx`) MUST NOT call `apiRequest`, `useQuery`/`useMutation` or Server Actions directly; all reads go through `actions.ts`, all interactions through `hooks.ts`.
2. All API types MUST come from codegen (`shared/api/generated.ts`); no hand-written GraphQL DTOs.
3. Only serializable props cross the Server → Client boundary; the search island receives `value`/`basePath` primitives, not callbacks from the server.
4. The CTA uses Next.js link semantics to `/[tenantSlug]`; the existing public page and booking flow are reused unchanged.

## Accessibility contract

- The search input has an associated label and is keyboard-operable.
- Each card exposes a single primary link with an accessible name that includes the business name.
- Color/contrast derives from the canonical tokens.
