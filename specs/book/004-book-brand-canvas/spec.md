# Feature Specification: Foundly Book — Brand Canvas & Visual Coherence

**Feature Branch**: `004-book-brand-canvas`

**Created**: 2026-10-10

**Status**: Implemented

**Input**: User description: "Fix visual de coherencia de marca en `apps/book`: alinear el background y los gradientes con la landing global (foundlylabs.lat). Actualmente la página principal y las vistas de `apps/book` muestran un fondo superior blanco con un corte brusco en el héroe, rompiendo la identidad visual continua lavanda/violeta de Foundly Labs. Aplicar un gradiente suave continuo al Layout raíz / wrapper de `apps/book`; eliminar cualquier borde o corte horizontal duro entre la sección Hero y las tarjetas inferiores; asegurar que el fondo abarque el 100% del viewport; e integrar los tokens del tema compartido de `@foundly/ui` para que las tarjetas blancas resalten sobre el fondo lavanda con sombras suaves. El cambio de identidad entregado en `/onboarding` debe alcanzar también a `/admin`."

**Addendum (canónico)**: La landing de Astro (`apps/landing`, foundlylabs.lat) es el **canónico de diseño**. `apps/book` replica exactamente sus tokens de fondo: gradiente `#C8B6FF → #D8B4FE` sobre `#FAF8FF`, header glass al 70%, tarjetas con translucidez/glassmorphism al 60% y el estilo exacto de pills y botones.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Share the landing's continuous brand canvas across every surface (Priority: P1)

As a visitor or operator, I want all Foundly Book surfaces (product page, onboarding wizard, admin dashboard and public portal) to sit on the same continuous lavender/violet canvas as the global landing so that the module feels part of the same visual ecosystem.

**Why this priority**: Brand coherence is what makes the module recognisable next to `foundlylabs.lat`; without it, views look disconnected (white bands, hard cuts, different purple).

**Independent Test**: Open each surface and confirm the same continuous lavender-to-white canvas (starting `#C8B6FF`) is present behind the content, with no opaque white top or hard horizontal divider.

**Acceptance Scenarios**:

1. **Given** any of the four surfaces (`/`, `/onboarding`, `/admin/*`, `/[tenantSlug]`), **When** I open it, **Then** it renders over the module's continuous brand canvas that covers the full viewport.
2. **Given** the module's root layout, **When** any surface renders, **Then** the canvas is applied once at the layout root so every route inherits it.
3. **Given** a viewport, **When** the page is shorter than one viewport, **Then** the canvas still covers 100% of the viewport (`min-height`, full width).
4. **Given** the canvas, **When** I compare it to the landing's top gradient, **Then** both start at the same lavender (`#C8B6FF`) and fade toward white (`#FFFFFF`).

---

### User Story 2 - Hero and content with no hard visual cut (Priority: P1)

As a visitor of the product page, I want the hero to flow smoothly into the content below so that there is no white band or hard horizontal border breaking the canvas.

**Why this priority**: The hero-to-cards transition is the most visible evidence of the canvas; a hard cut is exactly the defect reported.

**Independent Test**: Open `/`, scroll from the hero to the showcase cards and confirm there is no white band or full-width divider between them.

**Acceptance Scenarios**:

1. **Given** the product page, **When** I open it, **Then** the hero starts directly over the continuous lavender gradient without an opaque white header block over the canvas.
2. **Given** the product page, **When** I scroll between the hero and the cards, **Then** there is no horizontal border or abrupt colour change.
3. **Given** the sticky product header, **When** it stays pinned on scroll, **Then** it remains translucent at 70% white with backdrop blur, exactly like the landing's navbar.

---

### User Story 3 - Cards and pills that replicate the landing (Priority: P2)

As any user, I want the landing page of the module to replicate the landing's glassmorphism and pill/button style so that both apps look like one brand.

**Why this priority**: Visual parity with the Astro landing is the accepted canon; translucent cards and pill buttons are its signature surfaces.

**Independent Test**: Inspect the product page cards, pills and buttons side by side with the landing and confirm the same translucency, radius, border, shadow and accent colors.

**Acceptance Scenarios**:

1. **Given** a product-page card over the canvas, **When** it renders, **Then** its surface is translucent white at 60% with backdrop blur (glassmorphism), the `border.subtle` border, 16px radius and the soft `shadow.card` — mirroring the landing's `AppCard`.
2. **Given** a pill (hero badge / category pill), **When** it renders, **Then** its background is the `badgePill` token with the `primary.main` accent text, exactly like the landing's `Badge`.
3. **Given** a primary button, **When** it renders, **Then** it is `primary.main` with white text, lavender `shadow.card` and a hover at 90% of the accent — exactly like the landing's `Button` primary.
4. **Given** a secondary button, **When** it renders, **Then** it is translucent white at 60% with backdrop blur and a subtle border, hovering to `badgePill` — exactly like the landing's `Button` secondary.

---

### User Story 4 - The dashboard inherits the module's identity (Priority: P2)

As an owner, I want the private dashboard (`/admin/*`) to share the same canvas as the onboarding and the rest of the module so that the workspace feels coherent and not like a different app.

**Why this priority**: The onboarding already delivers the split-layout identity; the dashboard must not remain behind an opaque background.

**Independent Test**: Open `/admin/*` and confirm the content area shows the same continuous lavender canvas as `/onboarding`, with the white sidebar as a panel over it.

**Acceptance Scenarios**:

1. **Given** the admin shell, **When** it renders, **Then** the content area does not paint an opaque full-screen background over the module canvas.
2. **Given** the admin shell, **When** it renders, **Then** the white sidebar and the user/profile panel are the only opaque surfaces (panels), letting the canvas show behind the routed screens.

---

### Edge Cases

- A page whose content is taller than one viewport: the canvas MUST NOT introduce a visible seam or band where the gradient ends.
- A viewport smaller/larger than the design target: the canvas MUST cover the full viewport with no horizontal overflow.
- Browsers that do not honour `background-attachment: fixed` (e.g. iOS Safari): the canvas MUST degrade gracefully to the shared `--bg-app-body` surface while keeping the token identity.
- The sticky product header over the canvas: it MUST stay readable (70% glass + blur) and never collapse into an opaque white block.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The module's root layout MUST apply a continuous brand canvas to the four surfaces, covering 100% of the viewport (full width and at least `min-height: 100vh`), using a lavender-to-white gradient derived from the ecosystem palette.
- **FR-002**: The gradient MUST be a **book-local token extension** that replicates the landing's values exactly — `--book-gradient-from: #c8b6ff`, `--book-gradient-to: #d8b4fe` — and MUST be composed like `apps/landing` (`linear-gradient(180deg, from 0%, card-light 60%)`) over the shared `--bg-app-body` surface. No inline hex literals in components.
- **FR-003**: The product page MUST NOT present a hard horizontal cut between the hero and the content below: no opaque white header block over the canvas and no full-width divider between hero and cards.
- **FR-004**: The sticky product header MUST use the book-local glass token `--book-glass` (white at 70%) with backdrop blur, mirroring the landing's `bg-card-light/70` navbar.
- **FR-005**: App-level wrappers (product page, admin shell, public portal) MUST NOT paint an opaque full-screen background that hides the canvas; the admin shell's white sidebar and card surfaces are allowed as panels.
- **FR-006**: Product-page cards MUST use glassmorphism via the book-local `--book-glass-card` token (white at 60% + backdrop blur) mirroring the landing's `AppCard`; the shared solid white card surface remains for data/forms in the workspace.
- **FR-007**: No brand hex literals MAY appear in components; all colors come from `@foundly/ui` tokens or the book-local CSS extension (enforced by the ESLint guard).
- **FR-008**: Pills and buttons on the product page MUST replicate the landing exactly: pills use `badgePill` background with `primary.main` text; primary buttons use `primary.main` with lavender `shadow.card` and a 90% hover; secondary buttons use translucent white at 60% with blur, subtle border and `badgePill` hover.

### Key Entities

None — this feature introduces no data entities or stores; it is a presentation-layer contract for the module's visual identity.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The four surfaces (`/`, `/onboarding`, `/admin/*`, `/[tenantSlug]`) render over the same continuous brand canvas (manual visual check on desktop and a small viewport).
- **SC-002**: The product page hero flows into the showcase cards with no hard border or white band, and its header, pills and cards visually match the landing (manual side-by-side check).
- **SC-003**: `npm run test -w @foundly/book` passes, `npm run test -w @foundly/ui` passes, `npm run build -w @foundly/book` compiles with zero errors, and typecheck + lint are clean for both workspaces.
- **SC-004**: A source scan of `apps/book/src/**` components reports zero literal brand hex values.

## Assumptions

- **Governance**: Governed by `specs/business-model.md` (Foundly Book module definition §2.3), plus `constitution.md`, `specs/architecture.md`, `specs/system-design.md` and `code-rules.md`. This feature lives in the `book` domain (`specs/book/`) per `constitution.md` §2.
- **Design canon**: `apps/landing` (Astro) is the canonical design source; `apps/book` replicates its background, glass and pill/button tokens exactly. `apps/landing` itself is not modified.
- **Local extension**: The gradient and glass tokens are app-specific extensions, per `constitution.md` §6.I; they live in `apps/book/src/app/globals.css` and are NOT added to the shared tokens of `@foundly/ui`.
- **Shared primitives**: `@foundly/ui` `Card`, `Button` and `Modal` expose additive, non-breaking props (`sx` for `Card`/`Button`, `glass` for `Modal`) so surfaces can apply glassmorphism without changing their defaults for the workspace.
- **Shared canon helpers**: `apps/book/src/shared/utils/landingCanon.ts` centralises the landing-canonic `sx` overrides (primary/secondary pill buttons, glass cards, pills) and is reused by the product page (`/`) and the whole public provider landing (`/[tenantSlug]` — sections, sticky sidebar and guided booking checkout), so every surface mirrors the landing.
- **Coverage technique**: The canvas uses a fixed background attachment so the gradient spans the full viewport; where a browser does not honour it, the fallback `--bg-app-body` (`#FAF8FF`) keeps the identity inside token values.
- **Verification**: The implementation follows the exact structure described in `plan.md` and is validated end-to-end by `quickstart.md`.
