# Contract: Foundly Pass auth (`apps/api`)

**Feature**: `specs/api/006-foundly-pass-auth/` | **Date**: 2026-10-11

## Endpoint posture (unchanged)

`POST /graphql` (Apollo/NestJS, code-first, `autoSchemaFile`); playground/introspection only when
`NODE_ENV !== 'production'`.

## Session credential

- Header: `Authorization: Bearer <token>`.
- Token: opaque `payload.signature` (HMAC-SHA256 over base64url JSON `{ u, t, r, exp }`).
- Secret: `FOUNDLY_PASS_SECRET` (env). No committed secrets.
- Client-facing error codes: `UNAUTHENTICATED` (missing/malformed/expired/invalid token),
  `FORBIDDEN` (non-`active` tenant, or unmet plan).

## Types

```graphql
type CurrentTenant {
  id: ID!
  status: String!
  plan: String
}
type CurrentUser {
  userId: ID!
  role: String!
  tenant: CurrentTenant!
}
type BookCapability {
  tenantId: ID!
  enabled: Boolean!
}
```

## Queries

| Query            | Guards                 | Returns           | Behaviour                                                                                                            |
| ---------------- | ---------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `me`             | `@UseAuth()`           | `CurrentUser!`    | resolves the session identity + tenant (status, plan); no token → `UNAUTHENTICATED`; non-active tenant → `FORBIDDEN` |
| `currentTenant`  | `@UseAuth()`           | `CurrentTenant!`  | id/status/plan of the session tenant                                                                                 |
| `bookCapability` | `@RequirePlan('book')` | `BookCapability!` | `{ tenantId, enabled: true }` when the tenant plan is `book`; otherwise `FORBIDDEN`                                  |

`@CurrentTenant()`/`@CurrentUser()` param decorators inject the attached `AuthContext` into resolvers;
protected operations MUST derive tenant scope from it (strict isolation — client `tenant*` args ignored).

## Error semantics

| Condition                                                              | Code               |
| ---------------------------------------------------------------------- | ------------------ |
| missing `Authorization` header / bearer                                | `UNAUTHENTICATED`  |
| malformed / tampered / expired / unknown token                         | `UNAUTHENTICATED`  |
| valid token but `tenant.status !== 'active'`                           | `FORBIDDEN`        |
| valid token but `@RequirePlan(p)` unmet (`plan !== p`, including null) | `FORBIDDEN`        |
| missing signing secret when signing/verifying                          | config error (env) |

Errors are GraphQL `errors` entries with stable `extensions.code`.

## Data changes

- `packages/database/prisma/schema.prisma`: `Tenant.plan String?` (additive, nullable).
- `npm run generate -w @foundly/database` regenerates the client.

## Tests (DB-free)

- Unit `auth.service.spec.ts`: sign → verify round-trip; expired token; tampered payload/signature;
  malformed input.
- Unit `auth.guards.spec.ts`: allow with valid token+active tenant; reject missing/invalid token
  (`UNAUTHENTICATED`); reject inactive tenant and unmet `@RequirePlan` (`FORBIDDEN`); attach `AuthContext`.
- E2E `auth.resolver.spec.ts` (`POST /graphql`): `me`/`currentTenant` without token → `UNAUTHENTICATED`;
  valid → payload; inactive tenant → `FORBIDDEN`; `bookCapability` without `book` → `FORBIDDEN`, with
  `book` → enabled.
