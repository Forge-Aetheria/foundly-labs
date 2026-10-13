# Phase 1 — Data Model: Admin Authentication, Session Protection & Account Security

**Feature**: `specs/book/009-admin-auth` | **Date**: 2026-10-12

This feature introduces no new persisted entity of its own; it activates the **identity/session** lifecycle over the existing `User`/`Tenant` seam and the Supabase Auth session. Types are reused verbatim where they already exist (`shared/types/tenancy.ts`, `shared/infra/auth.ts`).

---

## Entities

### Owner account (identity) — existing `User`

| Field        | Type                        | Notes                                                 |
| ------------ | --------------------------- | ----------------------------------------------------- |
| `id`         | `string`                    | Internal identifier; also the session `userId`.       |
| `fullName`   | `string`                    | Display name.                                         |
| `email`      | `string`                    | Unique; used to sign in (case-insensitive).           |
| `credential` | `string`                    | Local-seam password only (never sent to the browser). |
| `role`       | `'owner' \| 'professional'` | Only `owner` reaches the admin area.                  |
| `tenantId`   | `string`                    | Business binding; the source of tenant scoping.       |
| `status`     | `'active' \| 'disabled'`    | Disabled accounts cannot sign in.                     |
| `createdAt`  | `string`                    | ISO-8601.                                             |

**Validation / rules**

- Sign-in matches `email` (lowercased) and `credential` in local mode; in live mode the identity provider verifies the password.
- A disabled account is rejected as unauthenticated.
- The `tenantId` comes from the account, never from the URL.

### Session — existing `Session`

| Field      | Type                        | Source (live)                    | Source (local)           |
| ---------- | --------------------------- | -------------------------------- | ------------------------ |
| `userId`   | `string`                    | JWT `sub`                        | cookie `userId`          |
| `role`     | `'admin' \| 'professional'` | `admin` when `tenant_id` present | derived from `User.role` |
| `tenantId` | `string?`                   | `app_metadata.tenant_id`         | `User.tenantId`          |

**Rules**

- Authorization uses **verified** data: live → verified claims (`getClaims()`); local → re-resolution from the store by `userId`.
- No session, expired or invalid → `null` → `requireTenant` yields `UNAUTHENTICATED`.
- `tenantId` present ⇒ admin guard passes; absent ⇒ routed to onboarding.

### Local session cookie (new)

| Attribute | Value                                                     |
| --------- | --------------------------------------------------------- |
| name      | `foundly_book_session`                                    |
| payload   | opaque `userId` (no role/tenant/claims)                   |
| flags     | `httpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in prod    |
| lifetime  | cleared on sign-out; presence is a coarse middleware hint |

**Rules**

- Only used when no live identity provider is configured.
- Never trusted as authority: every server read re-resolves the user from the store.
- Cannot be forged into another tenant (the store lookup decides `tenantId`).

### LoginCredentials (input, new)

| Field      | Type     | Validation                    |
| ---------- | -------- | ----------------------------- |
| `email`    | `string` | non-empty, valid email format |
| `password` | `string` | non-empty                     |

### PasswordChangeInput (input, new)

| Field             | Type     | Validation                                               |
| ----------------- | -------- | -------------------------------------------------------- |
| `currentPassword` | `string` | non-empty                                                |
| `newPassword`     | `string` | ≥ 8 chars, contains letters and numbers (account policy) |
| `confirmPassword` | `string` | must equal `newPassword`                                 |

### Business (Tenant) — existing `Tenant` (reference)

- Exposes `slug` (unique public URL key) used to build the admin quick link (`/{slug}`).
- Owned by the owner account; the session's `tenantId` resolves it.

---

## State transitions

```text
                 sign-in (valid)                 sign-out / expiry
Unauthenticated ─────────────────────► Authenticated ─────────────► Unauthenticated
      │                                      │
      │ /admin/* requested                   │ /login requested
      ▼                                      ▼
  redirect /login                    redirect /admin/agenda

Authenticated (unbound account) ──► registration/onboarding entry point
```

**Password change**

```text
Authenticated ──(wrong current password)──► unchanged (error shown)
Authenticated ──(valid current + policy-valid new)──► password updated (success)
```

---

## Validation ownership

| Rule                                 | Where enforced             |
| ------------------------------------ | -------------------------- |
| Email format / required fields       | `loginSchema` (Zod)        |
| Password policy + confirmation match | `passwordChangeSchema`     |
| Current-password correctness         | identity provider / store  |
| Tenant scoping from session          | `requireTenant` + layout   |
| Route access                         | middleware + server guards |
