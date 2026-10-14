# Feature Specification: Foundly API — Super Admin Platform Console (Global Metrics & Subscription Override)

**Feature Branch**: `019-super-admin-panel`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "@apps/api @packages/database @apps/book — Fase 3: Panel Super Admin (Gestión Global). Backend & Seguridad: definir una forma segura de identificar al Super Admin (rol global); crear un SuperAdminGuard/decorator que proteja las consultas y mutaciones exclusivas de la plataforma; crear la query platformMetrics (total de negocios registrados y activos; total de usuarios registrados y activos; distribución de planes FREE/PRO); y la mutación overrideTenantSubscription para cambiar plan, estado o fecha de expiración de cualquier negocio."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the affected application is `apps/api`; it extends the subscription model of `specs/api/017-subscription-plans` and the identity surface of `specs/api/008-supabase-jwt-auth`, and is the backend counterpart of `specs/book/020-super-admin-panel`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See global platform metrics (Priority: P1)

As the platform owner (Super Admin), I want a single view of platform health — how many businesses exist and are active, how many users exist and are active, and how the subscription plans are distributed — so I can understand growth and monetization at a glance.

**Why this priority**: It is the core purpose of the global console and the reason this phase exists.

**Independent Test**: As the Super Admin, request the platform metrics and confirm the business totals, user totals and plan distribution are returned and internally consistent; as a normal business owner, the same request is refused.

**Acceptance Scenarios**:

1. **Given** the Super Admin, **When** they request platform metrics, **Then** they receive the total and active **businesses**, the total and active **users**, and the **subscription plan distribution** (FREE vs PRO).
2. **Given** the Super Admin, **When** the metrics are returned, **Then** the plan distribution counts every registered business and the conversion to PRO is derivable from those counts.
3. **Given** a normal authenticated business owner, **When** they request platform metrics, **Then** the request is refused and no platform data is returned.
4. **Given** an anonymous request, **When** it requests platform metrics, **Then** it is refused as unauthenticated.

---

### User Story 2 - Force a business subscription (Priority: P1)

As the platform owner, I want to manually set any business's plan, status or expiry, so I can grant or revoke Pro access and correct subscription problems without a billing flow.

**Why this priority**: It is the control surface that makes the console operational.

**Independent Test**: As the Super Admin, set a specific business to Pro with a future expiry and confirm its entitlement becomes Pro; set it back to Free and confirm entitlement reverts to Free; confirm a normal owner cannot perform the override.

**Acceptance Scenarios**:

1. **Given** the Super Admin and any business, **When** they set the plan to Pro with an active status and a future expiry, **Then** the business's effective entitlement becomes Pro.
2. **Given** the Super Admin, **When** they set the plan to Free, **Then** the business's effective entitlement reverts to Free.
3. **Given** the Super Admin, **When** they set a status such as canceled/expired or an expiry in the past, **Then** the business is enforced as Free.
4. **Given** the Super Admin, **When** they update only one field (e.g. expiry), **Then** the other fields are left unchanged.
5. **Given** a normal business owner or an anonymous caller, **When** they attempt the override, **Then** it is refused and nothing changes.
6. **Given** an unknown business or an invalid plan/status, **When** the override is attempted, **Then** it is rejected with a stable domain error and nothing changes.

---

### User Story 3 - Keep platform operations exclusive (Priority: P1)

As the platform owner, I want every platform-only operation to be protected by a single, reusable authorization mechanism, so no business account can ever reach global data or act on another business.

**Why this priority**: These operations are cross-tenant and privileged; a leak is a security incident.

**Independent Test**: Enumerate the platform-only operations and confirm each rejects anonymous callers and authenticated non-admins with the stable errors, and that no data is read or written on rejection.

**Acceptance Scenarios**:

1. **Given** any platform-only operation, **When** it is invoked anonymously, **Then** it fails as unauthenticated and does nothing.
2. **Given** any platform-only operation, **When** it is invoked by an authenticated non-admin, **Then** it fails as forbidden and does nothing.
3. **Given** the Super Admin, **When** any platform-only operation is invoked, **Then** it is authorized.
4. **Given** a business is otherwise able to access its own data, **When** it calls the platform-only operations, **Then** that business data access is unaffected but the platform operations remain blocked.

---

### User Story 4 - Review every business (Priority: P2)

As the platform owner, I want a bounded, searchable list of all businesses with their subscription state, so the console can present a management table I can act on.

**Why this priority**: It is the data source for the management table; without it the console cannot locate a business to override.

**Independent Test**: As the Super Admin, request the managed-businesses list and confirm every business is returned with its plan/status/expiry, bounded/paginated and optionally filtered by a text term; a non-admin is refused.

**Acceptance Scenarios**:

1. **Given** the Super Admin, **When** they request the managed-businesses list, **Then** every business is returned with its name, public slug, plan, status and expiry.
2. **Given** many businesses, **When** the list is requested, **Then** it is bounded/paginated with a stable order.
3. **Given** a text term, **When** the list is requested, **Then** it filters by name/slug case-insensitively; a non-matching term returns an empty list.
4. **Given** a non-admin or anonymous caller, **When** the list is requested, **Then** it is refused with the stable error and returns nothing.

### Edge Cases

- **Identity source unavailable for user metrics**: if the platform cannot resolve user counts, the metrics still return business and plan data, and the user metrics are reported as unavailable rather than failing the whole query.
- **Overriding a business that no longer exists**: the managed list is a point-in-time read; an override against a deleted business fails as not-found.
- **Overriding an already-matching subscription**: setting the same plan/status is idempotent and succeeds without error.
- **Clearing expiry**: an override may clear the expiry so the plan has no end date.
- **Revoking Pro**: a Super Admin move to Free/expired/expiry-in-past enforces Free immediately without deleting the business's services or team.
- **Unknown business id**: the override fails as not-found and changes nothing.
- **Invalid plan/status value**: the override fails as a validation error and changes nothing.
- **Anonymous or non-admin caller**: refused before any read or write.
- **Self-lockout safety**: the platform admin role is not something a business account can grant itself through these operations.
- **Concurrent overrides**: two overrides on the same business leave it in the last-applied valid state.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The platform MUST identify a **Super Admin** from the verified identity via a **global platform role/entitlement** that a normal business account cannot obtain or grant itself.
- **FR-002**: The platform MUST provide a **reusable authorization mechanism (guard/decorator)** that protects every platform-only operation and returns a stable **unauthenticated** error for anonymous callers and a stable **forbidden** error for authenticated non-admins, reading or writing nothing on rejection.
- **FR-003**: The platform MUST expose a **global metrics** query, available only to the Super Admin, returning: total and active **businesses**, total and active **users**, and the **subscription plan distribution** (counts per plan).
- **FR-004**: The metrics MUST be internally consistent: the plan distribution covers every registered business, and the conversion to Pro is derivable from the returned counts.
- **FR-005**: **User** totals MUST come from the platform's identity source; when that source is unavailable, the metrics MUST still return the business and plan data and report the user metrics as unavailable, without failing the whole query.
- **FR-006**: The platform MUST expose a **subscription override** mutation, available only to the Super Admin, that sets the plan, the status and/or the expiry of **any** business, regardless of ownership.
- **FR-007**: The override MUST accept a plan from the closed set (FREE, PRO), a status from the closed set (active, past due, expired, canceled) and an optional expiry (including clearing it); invalid values MUST be rejected with a stable validation error and change nothing.
- **FR-008**: The override MUST be **partial**: only the provided fields change; omitted fields keep their current values.
- **FR-009**: The override MUST take effect immediately for entitlement: a Pro/active/not-expired business is treated as Pro, and any Free/expired/past-due/canceled state is enforced as Free.
- **FR-010**: The override MUST NOT delete or deactivate the business's existing services or team members.
- **FR-011**: An override targeting an unknown business MUST fail with a stable not-found error and change nothing.
- **FR-012**: The metrics and override operations MUST be usable **across all businesses** by the Super Admin, while remaining blocked for everyone else.
- **FR-013**: The platform MUST expose a **managed businesses** query, available only to the Super Admin, listing **all** businesses with their identity (name, public slug) and current subscription state (plan, status, expiry), returned in a stable order, bounded/paginated, and optionally filtered by a case-insensitive text term over name/slug.
- **FR-014**: Automated tests MUST cover: the metrics shape and consistency; the user-metric degradation when the identity source is unavailable; the override (partial update, clear expiry, Pro grant, Free revocation); not-found and validation rejections; the managed list (rows, paging, search, empty); and the authorization matrix (anonymous → unauthenticated, non-admin → forbidden, admin → allowed, no side effects on rejection).
- **FR-015**: All API gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Platform admin (Super Admin)**: a globally privileged identity, distinct from a business role, authorized to use the platform-only operations.
- **Platform metrics**: the global counts of businesses (total/active), users (total/active) and subscription plan distribution.
- **Subscription override**: an administrative change to a business's plan, status and/or expiry.
- **Managed business row**: a business as listed in the console — name, public slug, plan, status and expiry.
- **Business subscription**: the plan, status and expiry held by a business (`specs/api/017-subscription-plans`).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The Super Admin can read the full set of global metrics (businesses, users, plan distribution) in a single request.
- **SC-002**: 100% of platform-only operations are refused for anonymous and non-admin callers with the stable errors and cause zero data change.
- **SC-003**: 100% of subscription overrides by the Super Admin take effect on the business's entitlement immediately.
- **SC-004**: A partial override changes only the provided fields in 100% of cases.
- **SC-005**: Free revocation never removes the business's existing services or team members.
- **SC-006**: When the user-metric source is unavailable, the metrics still return business and plan data (0 hard failures).
- **SC-007**: The Super Admin can retrieve any business with its current subscription state from the managed list, and no non-admin can.
- **SC-008**: All API gates pass with zero regressions.

## Assumptions

- **Global role carried by the verified identity**: the Super Admin is identified by a global platform role/entitlement in the verified identity (a claim or an equivalent platform-level flag); the exact mechanism is an implementation decision. It is independent of the business module license (`plan`) and the subscription tier (`subscriptionPlan`).
- **Users sourced from the identity provider**: the platform's users live in the identity provider (not a business-owned table); user metrics are resolved from it. When the identity source is not configured or reachable, user metrics degrade gracefully (FR-005).
- **Closed plan/status sets**: plan ∈ {FREE, PRO} and status ∈ {active, past_due, expired, canceled}, mirroring `specs/api/017-subscription-plans`.
- **No self-service billing**: the override is a manual administrative control; a full payment/renewal flow is out of scope.
- **Cross-tenant by design**: platform-only operations intentionally act across businesses; they are never usable by a business account.
- **Companion front-end spec**: the protected route, dashboard and management table are the `book` counterpart `specs/book/020-super-admin-panel`; this spec defines the API contract and authorization only.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (platform operation of the Foundly ecosystem) and the authority order of `constitution.md`.
