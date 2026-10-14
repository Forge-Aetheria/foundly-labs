# Contract — Foundly Book Super Admin Console

**Feature**: `specs/book/020-super-admin-panel` · **Surface**: console route `GET /super-admin` (top-level, outside `/admin`)

## Route contract

| Aspect | Value |
|---|---|
| Path | `/super-admin` |
| Auth | platform owner (Super Admin) only |
| Query params | `q` (search), `page` (pagination; 1-based) |
| Rendering | server-guarded `layout.tsx` + thin `page.tsx` + `loading.tsx` |
| Anonymous | redirected to `/login` by the layout |
| Authenticated non-admin | **AccessDenied** state, no platform data |
| Result bound | delegated to the API (default 20, max 100) |

## Data contract (GraphQL consumption — from api 019)

The module documents (`super-admin.graphql`) call the platform surface with the session bearer:

```graphql
query PlatformMetrics { platformMetrics { businesses { total active } users { available total active } plans { free pro } proConversion } }
query ManagedBusinesses($query: String, $limit: Int, $offset: Int) { managedBusinesses(query: $query, limit: $limit, offset: $offset) { tenantId slug name plan status expiresAt } }
mutation OverrideTenantSubscription($input: OverrideTenantSubscriptionInput!) { overrideTenantSubscription(input: $input) { tenantId slug name plan status expiresAt } }
```

- **Transport**: `apiRequestAdmin` (injects the Supabase bearer; `UNAUTHENTICATED` → session-expiry redirect).
- **Errors surfaced to the UI**: `FORBIDDEN` → AccessDenied; `VALIDATION_ERROR` → inline dialog guidance; `NOT_FOUND` → inline dialog error.

## UI contract

### Dashboard

1. **MetricsCards**: Total Negocios, Negocios Activos, Total Usuarios (or "unavailable" when `users.available = false`), and the PRO conversion.
2. **PlanDistribution**: the FREE vs PRO split with counts.

### Managed businesses table

| Column | Source |
|---|---|
| Nombre | `name` (+ `slug`) |
| Plan | `plan` (FREE/PRO badge) |
| Estado | `status` (badge) |
| Vencimiento | `expiresAt` (formatted or "—") |
| Acciones | "Editar" opens the override dialog |

Plus: a search input (URL `q`, debounced), page navigation (URL `page`), and empty/loading/error states.

### Override dialog

- Fields: **Plan** (FREE/PRO), **Estado** (active/past_due/expired/canceled), **Vencimiento** (date, clearable).
- Requires at least one change; invalid values are blocked before submitting.
- On confirm → `overrideTenantSubscription`; on success the console refreshes and the row reflects the new state; on failure a typed error is shown inline.

## Boundary rules (constitution §5.VI / §5.V)

1. Components (`components/`, `dialogs/`, `SuperAdminView.tsx`) MUST NOT call `apiRequest`/`useQuery`/Server Actions directly; reads go through `actions.ts`, interactions through `hooks.ts`.
2. All API types MUST come from codegen (`shared/api/generated.ts`); no hand-written GraphQL DTOs.
3. Only serializable props cross the Server → Client boundary; the dialog receives plain row data and emits results through hooks.
4. Authorization is enforced server-side (API `FORBIDDEN` + guard layout); there is no client-only role gate protecting data.

## Accessibility contract

- The search input has a label; the table uses real table semantics with a caption/summary.
- The dialog is keyboard-operable with labelled controls and a focus trap (via the design system's Modal).
- Status/plan use text (badges) in addition to color; contrast derives from the canonical tokens.
