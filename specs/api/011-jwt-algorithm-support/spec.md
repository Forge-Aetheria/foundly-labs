# Feature Specification: Foundly API — Supabase JWT Algorithm Support (ES256 + RS256)

**Feature Branch**: `011-jwt-algorithm-support`

**Created**: 2026-10-13

**Status**: Implemented (retro-documented)

**Input**: User description: "El panel entra en sesión pero todas las consultas privadas fallan con `Unauthenticated`. Verificar la verificación de tokens de Supabase: el proyecto firma con una clave asimétrica ECC (ES256) pero el verificador solo aceptaba RS256. Permitir el algoritmo que el proveedor realmente emite (o soportar explícitamente ES256) y blindar los tests para que usen una clave EC/ES256."

_This spec is governed by `constitution.md` v5.2.0, `specs/business-model.md` and `specs/architecture.md`. It lives in the `api` domain because the affected application is `apps/api`. It corrects a defect in `specs/api/008-supabase-jwt-auth`._

**Corrects**: `specs/api/008-supabase-jwt-auth` (the identity layer accepted only one signing algorithm).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Accept the algorithm the provider actually issues (Priority: P1)

As an authenticated owner, I want the API to accept the access credential my identity provider issues, so that protected operations resolve instead of rejecting me.

**Why this priority**: The provider signs with an asymmetric ECC key (ES256). Rejecting that algorithm makes every protected operation fail for every real user — the app is unusable behind login.

**Independent Test**: Present a valid, unexpired credential signed with the provider's EC (P-256) key to a protected operation and confirm it resolves; repeat with the credential removed and confirm it is rejected.

**Acceptance Scenarios**:

1. **Given** a valid, unexpired credential signed with the provider's asymmetric key, **When** a protected operation runs, **Then** it resolves and is attributed to the correct user.
2. **Given** an anonymous request, **When** a protected operation runs, **Then** it is rejected with the stable machine-readable error.

---

### User Story 2 - Reject only untrusted algorithms (Priority: P1)

As a maintainer, I want the verifier to accept a curated set of asymmetric algorithms and reject anything else, so that accepting the provider's algorithm does not open an algorithm-confusion hole.

**Why this priority**: Widening the accepted algorithms must not weaken the security posture (no `none`, no symmetric confusion).

**Independent Test**: Present credentials signed with a supported algorithm (accepted) and with an unsupported algorithm / wrong key (rejected), and confirm the stable error code is returned.

**Acceptance Scenarios**:

1. **Given** a credential signed with a supported asymmetric algorithm, **When** it is verified, **Then** it is accepted.
2. **Given** a credential whose signature does not verify or uses an unsupported algorithm, **When** it is verified, **Then** it is rejected fail-closed.
3. **Given** a credential with the wrong issuer or audience, **When** it is verified, **Then** it is rejected.

---

### User Story 3 - The test suite exercises the production algorithm (Priority: P2)

As a maintainer, I want the authentication tests to sign tokens with a key of the same family the provider uses, so that this class of false positive cannot return unnoticed.

**Why this priority**: The suite previously signed RS256 test tokens, so it passed while production tokens were rejected.

**Independent Test**: Inspect the generated test credential header and confirm it declares the provider's algorithm.

**Acceptance Scenarios**:

1. **Given** the authentication test helpers, **When** they generate keys and tokens, **Then** they use an EC P-256 / ES256 key.
2. **Given** the verifier allow-list is narrowed back to a single algorithm, **When** the suite runs, **Then** it fails.

---

### Edge Cases

- Expired credential (beyond tolerance): rejected.
- Tampered signature / foreign key: rejected.
- Wrong issuer or audience: rejected.
- Unknown key id / provider unreachable: rejected fail-closed without crashing.
- Missing or malformed bearer header: rejected on protected operations; public queries stay open.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The verifier MUST accept the asymmetric algorithm(s) the identity provider issues, including the provider's ECC/ES256 signing key.
- **FR-002**: The verifier MUST restrict acceptance to a curated allow-list of asymmetric algorithms and MUST reject symmetric or `none` algorithms (no algorithm confusion).
- **FR-003**: The verifier MUST continue validating issuer and audience.
- **FR-004**: Any verification failure MUST fail closed with the stable `UNAUTHENTICATED` envelope.
- **FR-005**: Authentication tests MUST generate an EC (P-256) key and sign ES256 tokens so the production algorithm is exercised.
- **FR-006**: A regression test MUST assert the test token algorithm, so narrowing the allow-list again fails the suite.
- **FR-007**: All API gates (`build`, `typecheck`, `test`, lint) MUST pass with no regressions under strict TypeScript.

### Key Entities

- **Access credential verification policy**: the allow-listed signing algorithms plus issuer/audience checks applied to every bearer credential.
- **Verified identity**: the caller resolved from a credential (user id, email, role, validity, tenant claim).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A valid credential signed with the provider's ECC/ES256 key verifies and resolves the identity.
- **SC-002**: Credentials with an unsupported algorithm, bad signature, wrong issuer or wrong audience are rejected with the same stable error.
- **SC-003**: 100% of authentication test tokens are signed with an EC P-256 / ES256 key.
- **SC-004**: Narrowing the allow-list to a single unmatched algorithm makes the suite fail.
- **SC-005**: API gates pass with zero regressions.

## Assumptions

- **Identity provider = Supabase Auth**; the project signs access credentials with an asymmetric ECC (P-256 / ES256) key (confirmed by the project's published JWKS). Legacy asymmetric (RS256) is kept for compatibility.
- **Corrective to `008`**: this feature changes only the accepted-algorithm policy of the existing verifier; issuer/audience/fail-closed behaviour is unchanged.
- **Respect for the governance hierarchy**: follows `specs/business-model.md` (identity gating protects the ecosystem's entitlements) and the authority order of `constitution.md`; introduces no pricing or entitlement behavior.
