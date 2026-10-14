# Feature Specification: Foundly API — Subscription Plans (Free vs. Pro) & Plan Limits Enforcement

**Feature Branch**: `017-subscription-plans`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "@apps/api @packages/database @apps/book — Necesitamos diseñar e implementar las bases de monetización, el directorio público de descubrimiento y el panel de administración global para Foundly Labs. Vamos a abordar la primera fase enfocada en el modelo de suscripciones y su validación en el backend. Fase 1: Modelo de Suscripción (Free vs. Pro) & Enforcement en la API. Plan FREE: máximo 1 servicio activo y máximo 1 miembro de equipo, funcionalidades básicas de agenda y pagos. Plan PRO: servicios e integrantes ilimitados, métricas/analíticas y reglas avanzadas de adelantos y notificaciones. Crear un enum/modelo de suscripción, asociarlo al Tenant con campo de estado (subscriptionPlan, subscriptionStatus, subscriptionExpiresAt), y aplicar la validación en createService y createStaffMember con un error de dominio claro (PLAN_LIMIT_REACHED)."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the affected application is `apps/api`; it extends the tenant/business surface of `specs/api/003-db-first-graphql-core` and `specs/api/010-domain-mvp-module`, hardens the plan guard already introduced with `specs/api/006-foundly-pass-auth`, and is the backend counterpart of `specs/book/018-subscription-plan-limits`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Model the business subscription (Priority: P1)

As the platform, I need every business to carry a subscription plan (Free or Pro), a subscription status and an optional expiry date, so the rest of the product can reason about what the business is entitled to.

**Why this priority**: The plan state is the foundation of monetization; without it no limit or feature gate can be enforced.

**Independent Test**: Create a business and read it back, confirming it starts on the Free plan with an active status and no expiry; set it to Pro with an expiry and confirm the read reflects all three values.

**Acceptance Scenarios**:

1. **Given** a newly created business, **When** it is read, **Then** its subscription plan is Free, its status is active and its expiry is empty.
2. **Given** a business on Free, **When** it is upgraded to Pro with an expiry date, **Then** the read exposes plan Pro, the status and the expiry.
3. **Given** a business whose subscription has expired, **When** it is read, **Then** its effective entitlement is Free.
4. **Given** a business record with no plan set (legacy), **When** it is read, **Then** it is treated as Free without error.

---

### User Story 2 - Enforce the Free service limit (Priority: P1)

As the platform, I want to reject the creation of a second active service for a Free business with a clear domain error, so the Free plan limit is respected without breaking businesses that already exceed it.

**Why this priority**: The catalog is the first monetizable capability and the clearest Free-vs-Pro boundary.

**Independent Test**: On a Free business with one active service, attempt to create another active service and confirm it is rejected with `PLAN_LIMIT_REACHED` and nothing is created; upgrade to Pro and confirm the same creation succeeds.

**Acceptance Scenarios**:

1. **Given** a Free business with no services, **When** an active service is created, **Then** it succeeds.
2. **Given** a Free business with one active service, **When** another active service is created, **Then** it is rejected with `PLAN_LIMIT_REACHED` and nothing is created.
3. **Given** a Free business with one active service, **When** a second service is created as **inactive**, **Then** it succeeds (it does not consume the active limit).
4. **Given** a Free business with one active and one inactive service, **When** the inactive service is activated, **Then** it is rejected with `PLAN_LIMIT_REACHED`.
5. **Given** a Pro business, **When** many active services are created, **Then** all succeed.
6. **Given** a Free business that had more than one active service before the limit existed, **When** it edits or reads them, **Then** nothing is deleted and only new activations are blocked.

---

### User Story 3 - Enforce the Free team limit (Priority: P1)

As the platform, I want to reject the creation of a second active team member for a Free business with a clear domain error, so the team limit mirrors the service limit.

**Why this priority**: Staff is the second capability that drives the upgrade decision.

**Independent Test**: On a Free business with one active team member, attempt to create another and confirm it is rejected with `PLAN_LIMIT_REACHED`; upgrade to Pro and confirm it succeeds.

**Acceptance Scenarios**:

1. **Given** a Free business with no team members, **When** a team member is created, **Then** it succeeds.
2. **Given** a Free business with one active team member, **When** another is created, **Then** it is rejected with `PLAN_LIMIT_REACHED` and nothing is created.
3. **Given** a Free business with one active and one inactive team member, **When** the inactive one is activated, **Then** it is rejected with `PLAN_LIMIT_REACHED`.
4. **Given** a Pro business, **When** many team members are created, **Then** all succeed.
5. **Given** the team member is deactivated or removed, **When** a new one is created, **Then** the capacity is available again.

---

### User Story 4 - Gate Pro-only capabilities (Priority: P2)

As the platform, I want operations reserved to Pro (metrics/analytics and advanced advance/notification rules) to be rejected when the business is not Pro, with a clear domain error, so the plan boundary is enforced uniformly.

**Why this priority**: It generalizes the enforcement beyond counts and prevents Pro features from leaking into Free.

**Independent Test**: Invoke a Pro-gated operation as a Free business and confirm it is rejected with a stable plan error; as a Pro business, confirm it runs.

**Acceptance Scenarios**:

1. **Given** a Free business, **When** a Pro-gated operation is invoked, **Then** it is rejected with a stable plan error and no side effect occurs.
2. **Given** a Pro business, **When** a Pro-gated operation is invoked, **Then** it runs normally.
3. **Given** an anonymous or foreign request, **When** a Pro-gated operation is invoked, **Then** it is rejected as unauthenticated/forbidden before any plan evaluation changes data.

---

### User Story 5 - Read the effective plan and usage (Priority: P2)

As the admin panel, I want to read a business's effective plan, its status/expiry and its current usage against each limit, so the UI can show the plan and the remaining capacity.

**Why this priority**: The UI needs a single, consistent source of truth to show limits and upgrade prompts.

**Independent Test**: Read the subscription summary for a Free business with one service and one team member and confirm it reports the limits, the derived usage and that both are at capacity; upgrade to Pro and confirm the limits become unlimited.

**Acceptance Scenarios**:

1. **Given** an authenticated owner, **When** they read the subscription summary, **Then** it exposes the effective plan, status, expiry (optional), active service usage/limit and active team usage/limit.
2. **Given** an expired Pro subscription, **When** the summary is read, **Then** the effective plan reported is Free and the limits are those of Free.
3. **Given** an anonymous or foreign request, **When** the summary is read, **Then** it is rejected with the stable authentication error and exposes nothing.

---

### Edge Cases

- **Grandfathering on downgrade**: a Pro → Free move never deletes or deactivates existing services/team members; only new creations or activations beyond the limit are blocked.
- **Expiry rollover**: once the expiry passes, the business is enforced as Free without a manual job; an expired subscription never yields Pro entitlements.
- **Legacy/unknown plan value**: a business with an absent or unrecognized plan value is treated as Free (fail-closed), never as Pro.
- **Concurrency**: two simultaneous create/activate requests for the same business cannot both pass the limit check; at most the allowed number is persisted.
- **Deactivation frees capacity**: deactivating a service or team member immediately frees a slot for a new active one.
- **Deleting vs deactivating**: removing a service/team member also frees capacity.
- **Inactive creations**: creating an inactive service or team member never consumes an active slot and is allowed on Free.
- **Anonymous/foreign request**: rejected with the stable authentication/authorization errors and no data change.
- **Plan-limit error is stable**: the domain error code (`PLAN_LIMIT_REACHED`) is not masked to a generic internal error by the error normalizer.
- **Owner without tenant scope**: a plan-limit rejection never occurs without an authenticated tenant; if scope is missing the request fails as invalid scope.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST model a subscription plan as a closed set of exactly two values: **Free** and **Pro**.
- **FR-002**: Every business MUST carry a subscription plan (defaulting to Free), a subscription status (defaulting to active) and an optional subscription expiry date.
- **FR-003**: The system MUST compute an **effective plan** at read/enforcement time: a business is Pro only when its plan is Pro, its status is active and (when an expiry exists) the expiry is in the future; otherwise it is Free.
- **FR-004**: The plan limits MUST be: Free → at most **1 active service** and **1 active team member**; Pro → unlimited services and unlimited team members.
- **FR-005**: Creating a service on a Free business MUST be rejected with a stable `PLAN_LIMIT_REACHED` domain error when it would result in more than one **active** service; the operation MUST create nothing on rejection.
- **FR-006**: Activating a service on a Free business MUST be rejected with the stable `PLAN_LIMIT_REACHED` error when it would result in more than one active service.
- **FR-007**: Creating a team member on a Free business MUST be rejected with the stable `PLAN_LIMIT_REACHED` domain error when it would result in more than one **active** team member; the operation MUST create nothing on rejection.
- **FR-008**: Activating a team member on a Free business MUST be rejected with the stable `PLAN_LIMIT_REACHED` error when it would result in more than one active team member.
- **FR-009**: Creating a service or team member as **inactive** on a Free business MUST NOT be blocked by the limit.
- **FR-010**: A Pro business MUST be able to create and activate services and team members without a count limit.
- **FR-011**: The system MUST provide a reusable mechanism to require a plan for an operation (Pro-gated capabilities), rejecting non-qualifying businesses with a stable plan error and no side effects.
- **FR-012**: The limit checks MUST be scoped to the caller's authenticated tenant and MUST NOT be bypassable via client-supplied tenant identifiers.
- **FR-013**: The system MUST expose an authenticated, tenant-scoped read of the business subscription summary: effective plan, status, expiry (optional), and active usage/limit for services and team members.
- **FR-014**: The stable domain error code `PLAN_LIMIT_REACHED` MUST be preserved by the error normalizer (not masked to a generic internal error).
- **FR-015**: Downgrading or expiring a subscription MUST NOT delete or deactivate existing services or team members; enforcement applies only to new creations and activations.
- **FR-016**: All write operations MUST derive the tenant from the authenticated identity; anonymous or foreign requests MUST be rejected with the stable errors and MUST NOT change data.
- **FR-017**: Automated tests MUST cover: default/upgraded/expired plan reads; the effective-plan computation; Free service create/activate limit (allowed at 1, rejected at 2, inactive allowed, Pro unlimited); Free team create/activate limit (same shape); the Pro-only gate (rejected for Free, allowed for Pro); the subscription summary read and its tenant isolation; and error-code stability.
- **FR-018**: All API gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Subscription plan**: the entitlement tier of a business, a closed set of Free and Pro.
- **Subscription state**: the status and optional expiry attached to a business that, together with the plan, determine the effective entitlement.
- **Business subscription**: the plan + status + expiry held by a business (the tenant).
- **Plan limit**: the maximum number of active services and active team members allowed by a plan.
- **Subscription summary**: the effective plan, status, expiry and per-limit usage exposed for the admin panel.
- **Plan error**: the stable domain error (`PLAN_LIMIT_REACHED`) returned when a plan boundary is exceeded.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of new businesses start on Free with an active status and no expiry, without manual steps.
- **SC-002**: 0 Free businesses can hold more than one active service or more than one active team member after the feature ships.
- **SC-003**: 100% of attempts to exceed a Free limit are rejected with `PLAN_LIMIT_REACHED` and leave data unchanged.
- **SC-004**: 100% of Pro businesses can create unlimited active services and team members.
- **SC-005**: An expired subscription yields Free entitlements in 100% of cases, with no data loss for existing assets.
- **SC-006**: The effective plan read by the admin panel matches what enforcement applies in 100% of cases.
- **SC-007**: All API gates pass with zero regressions.

## Assumptions

- **Staff = existing team member model**: the "team member" limited by the Free plan is the business's existing staff/specialist entity; no new staff model is introduced.
- **Active-only counting**: limits count **active** services and **active** team members; inactive records are allowed on Free and do not consume capacity.
- **New tier fields alongside the existing module license**: the subscription tier (`subscriptionPlan` / `subscriptionStatus` / `subscriptionExpiresAt`) is added as new fields on the business; the existing module-entitlement field used by the Foundly Pass module guard is left untouched and is a separate axis. The tier defaults to Free, and any missing or unrecognized value is treated as Free (fail-closed).
- **Baseline guard is completed, not created**: a minimal plan guard/decorator already exists; this feature formalizes the subscription state and adds count-based limit enforcement on top of it.
- **Plan changes are provisioned out of band in this phase**: setting a business to Pro (and its expiry) is performed by platform provisioning or a future global-admin feature; the global discovery directory and the global admin panel are later phases and are out of scope here.
- **No billing gateway**: this phase models entitlements only; payment collection/renewal is a future phase.
- **Pro-gated features are declared, not implemented**: metrics/analytics and advanced advance/notification rules are gated by the plan mechanism, but their full implementation is a later feature.
- **Companion front-end spec**: the admin-panel presentation of the plan, limits and upgrade prompts is the `book` counterpart `specs/book/018-subscription-plan-limits`; this spec defines the backend contract and enforcement only.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (licensing via Foundly Pass and the Free/Pro progression) and the authority order of `constitution.md`.
