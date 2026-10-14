# Feature Specification: Foundly Book — Subscription Plan Visibility, Plan Limits & Upgrade Path

**Feature Branch**: `018-subscription-plan-limits`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "@apps/api @packages/database @apps/book — Necesitamos diseñar e implementar las bases de monetización, el directorio público de descubrimiento y el panel de administración global para Foundly Labs. Vamos a abordar la primera fase enfocada en el modelo de suscripciones y su validación en el backend. Plan FREE: máximo 1 servicio activo y máximo 1 miembro de equipo, funcionalidades básicas de agenda y pagos. Plan PRO: servicios e integrantes ilimitados, métricas/analíticas y reglas avanzadas de adelantos y notificaciones."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `book` domain because the affected application is `apps/book`; it extends `specs/book/005-staff-management`, `specs/book/008-api-integration-catalog-sync` and `specs/book/012-centralized-api-errors`. The subscription persistence and the limit enforcement it depends on are the backend counterpart specified under `specs/api/017-subscription-plans`._

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See the current plan and usage (Priority: P1)

As a business owner, I want to see which plan my business is on and how much of my limits I am using, so I understand what I am entitled to before I hit a wall.

**Why this priority**: Without visibility the limits feel arbitrary and drive support requests instead of upgrades.

**Independent Test**: Open the admin panel and confirm the current plan is shown with the active service and team usage versus the plan limits; upgrade the business and confirm the panel reflects the new plan and limits on reload.

**Acceptance Scenarios**:

1. **Given** an authenticated owner on Free, **When** the plan area loads, **Then** it shows the plan (Free), its status and the active service usage/limit and active team usage/limit.
2. **Given** an owner on Pro, **When** the plan area loads, **Then** it shows the plan (Pro) and communicates unlimited services and team members.
3. **Given** a subscription with an expiry, **When** the plan area loads, **Then** the expiry is shown.
4. **Given** an expired subscription, **When** the plan area loads, **Then** Free limits are shown and an expiry/expired notice is visible.
5. **Given** an unauthenticated request, **When** the plan area is opened, **Then** the user is redirected to authentication and no plan data is shown.

---

### User Story 2 - Understand why a creation is blocked (Priority: P1)

As a business owner on Free, I want a clear, actionable message when I reach my service or team limit, so I know the limit exists and how to lift it, instead of seeing a generic error.

**Why this priority**: The limit is only useful if the owner understands it and can act on it.

**Independent Test**: On a Free business with one active service, attempt to add a second active service and confirm a clear limit message with an upgrade call-to-action appears and nothing is added; repeat for team members; on Pro, confirm the creation works with no limit message.

**Acceptance Scenarios**:

1. **Given** a Free business at the service limit, **When** the owner submits a new active service, **Then** a clear limit message with an upgrade action is shown and no service is created.
2. **Given** a Free business at the team limit, **When** the owner submits a new active team member, **Then** a clear limit message with an upgrade action is shown and no team member is created.
3. **Given** a Free business, **When** the owner creates a service or team member as **inactive**, **Then** it is saved without a limit message.
4. **Given** a Pro business, **When** the owner creates services or team members, **Then** no limit message appears.
5. **Given** any other failure, **When** a creation fails, **Then** the standard centralized error feedback is shown instead of the limit message.

---

### User Story 3 - Discover the upgrade path (Priority: P2)

As a business owner, I want to see what Pro unlocks and how to move to it, so I can decide to upgrade when I outgrow Free.

**Why this priority**: It converts the limit into a growth decision instead of friction.

**Independent Test**: Open the plan area on Free and confirm the Pro benefits (unlimited services/team, metrics, advanced rules) and an upgrade call-to-action are shown; confirm the action starts the upgrade flow or clearly states how to proceed.

**Acceptance Scenarios**:

1. **Given** a Free business, **When** the plan area is shown, **Then** the Pro benefits are listed (unlimited services and team, metrics/analytics, advanced advance and notification rules).
2. **Given** a Free business, **When** the owner chooses to upgrade, **Then** the upgrade path is initiated or clearly explained, and the owner is not left in a dead end.
3. **Given** a Pro business, **When** the plan area is shown, **Then** the upgrade action is not offered.

---

### User Story 4 - Recognize Pro-only features (Priority: P3)

As a business owner on Free, I want Pro-only features to be visibly marked and not silently broken, so I understand they exist and require Pro.

**Why this priority**: It protects the plan boundary in the UI and reduces confusion when a Pro feature is encountered.

**Independent Test**: As a Free business, navigate to a Pro-only area (e.g., metrics/analytics or advanced advance/notification rules) and confirm it is marked as Pro and explains the requirement instead of failing or showing empty broken UI.

**Acceptance Scenarios**:

1. **Given** a Free business, **When** a Pro-only feature is viewed, **Then** it is visibly marked as Pro and explains the requirement with an upgrade action.
2. **Given** a Pro business, **When** a Pro-only feature is viewed, **Then** it is available with no Pro lock.
3. **Given** the API rejects a Pro-only operation, **When** the UI receives the plan error, **Then** it shows the Pro requirement message rather than a generic failure.

---

### Edge Cases

- **At exactly the limit**: the limit message appears only when the operation would exceed the plan, never when the owner is merely at capacity with room by deactivating.
- **Inactive records**: creating or holding inactive services/team members never triggers the limit and never blocks the owner.
- **Downgrade / expiry**: existing services and team members are never hidden or removed when the plan reverts to Free; the owner keeps them and only new activations are blocked, with a clear notice.
- **Stale usage**: after creating/deactivating a service or team member, the usage shown refreshes in the same interaction (no manual reload).
- **Concurrent edits**: a creation blocked due to a stale count is reported with the limit message once the server re-evaluates, and the panel refreshes the usage.
- **Expired subscription**: the panel communicates the expiry and shows Free limits; no Pro-only feature is offered.
- **Missing tenant scope / unauthenticated**: the user is redirected to authentication and no plan or usage is leaked.
- **Unknown plan value from the backend**: the panel fails closed and displays Free.
- **Limit error during a bulk/other action**: the limit message is scoped to the specific action and does not break unrelated panel state.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The admin panel MUST display the business's effective plan (Free or Pro), its status and, when present, its expiry.
- **FR-002**: The admin panel MUST display the active service usage against the plan limit and the active team usage against the plan limit; for Pro it MUST communicate that both are unlimited.
- **FR-003**: The usage shown MUST refresh in the same interaction after a service or team member is created, activated, deactivated or removed (no manual reload).
- **FR-004**: When a service creation would exceed the Free service limit, the panel MUST show a clear, actionable limit message with an upgrade action and MUST NOT present the service as created.
- **FR-005**: When a team-member creation would exceed the Free team limit, the panel MUST show a clear, actionable limit message with an upgrade action and MUST NOT present the team member as created.
- **FR-006**: Inactive service/team-member operations MUST NOT be blocked or flagged by the limit in the UI.
- **FR-007**: The panel MUST distinguish the plan-limit condition from other errors and MUST NOT show the limit message for unrelated failures.
- **FR-008**: The panel MUST present the Pro benefits (unlimited services and team, metrics/analytics, advanced advance and notification rules) and an upgrade call-to-action for Free businesses.
- **FR-009**: Pro-only features in the panel MUST be visibly marked as Pro for Free businesses, explaining the requirement with an upgrade action, and available without a lock for Pro businesses.
- **FR-010**: When a subscription has expired or reverted to Free, the panel MUST communicate the change, show Free limits and keep existing services and team members visible and intact.
- **FR-011**: All plan/usage reads and limit feedback MUST be scoped to the authenticated owner's business; unauthenticated users MUST be redirected and foreign data MUST NOT be shown.
- **FR-012**: Automated tests MUST cover: plan/usage rendering for Free and Pro; usage refresh after create/deactivate; the limit message on blocked service and team creation (including inactive allowed and Pro unlimited); Pro-only marking; and the expired/downgraded state.
- **FR-013**: All book gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities _(include if feature involves data)_

- **Subscription plan**: the entitlement tier shown in the panel (Free or Pro).
- **Subscription summary**: the effective plan, status, expiry and per-limit usage read by the panel.
- **Plan limit**: the maximum active services and active team members for the plan, presented as usage/limit.
- **Plan error**: the limit or Pro-gate error surfaced by the API that the panel translates into the limit/upgrade message.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of owners can see their plan, status and current usage against limits from the admin panel.
- **SC-002**: 100% of blocked Free creations show a clear limit message with an upgrade action and create nothing.
- **SC-003**: 0 Free businesses are shown a generic error where a limit message is appropriate.
- **SC-004**: Usage reflects create/deactivate actions immediately, with no manual reload.
- **SC-005**: Existing services and team members remain visible for 100% of expired/downgraded businesses, with Free limits communicated.
- **SC-006**: 100% of Pro-only features are visibly marked for Free businesses and available for Pro businesses.
- **SC-007**: All book gates pass with zero regressions.

## Assumptions

- **Companion backend feature**: the subscription persistence (plan/status/expiry), the limit enforcement and the subscription summary read are the `api` counterpart of this spec, specified under `/specs/api/017-subscription-plans`; this spec defines the user-facing behavior only.
- **Plan changes are provisioned out of band in this phase**: the upgrade call-to-action initiates or explains the upgrade path but a full self-serve billing flow is a later phase.
- **Pro-only features may not be fully built yet**: metrics/analytics and advanced advance/notification rules are marked as Pro in this phase; their full screens are later features. The panel must at least mark and explain them.
- **Limits count active records**: inactive services/team members do not count against the Free limits and remain editable.
- **Fail-closed display**: an unknown or missing plan value is displayed as Free.
- **The global discovery directory and global admin panel are out of scope**: they are later phases referenced by the originating request.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (Free/Pro progression and Foundly Pass licensing) and the authority order of `constitution.md`.
