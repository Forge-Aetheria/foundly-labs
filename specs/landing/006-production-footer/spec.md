# Feature Specification: Production Footer

**Feature Branch**: `006-production-footer`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "Create a clean, elegant, zero-JS site footer in `src/shared/components/Footer.astro`, integrated into the base layout, with brand attribution to FORGE Labs (forgelab.lat) and secondary navigation/SEO links."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Brand attribution on every page (Priority: P1)

As a visitor, I reach the bottom of any page and see the Foundly Labs brand, a short description,
and a clear credit to FORGE Labs, so I understand who makes the ecosystem and trust the source.

**Why this priority**: Brand attribution is the core purpose of the footer and accompanies every
page; the navigation and legal bar are refinements.

**Independent Test**: Open any page and confirm a semantically marked footer with the logo, the
short brand copy, and a working FORGE Labs credit link.

**Acceptance Scenarios**:

1. **Given** any page, **When** I scroll to the bottom, **Then** a semantic `<footer>` shows the Foundly Labs logo/isotipo and the short brand copy.
2. **Given** the footer, **When** I read the attribution, **Then** it credits FORGE Labs with a link to `https://www.forgelab.lat` opening in a new tab safely.
3. **Given** the footer, **When** I move focus over the credit link, **Then** a subtle hover/focus state is shown.

---

### User Story 2 - Secondary navigation to the ecosystem and resources (Priority: P2)

As a visitor, I can jump from the footer to the four applications and to philosophy/resource pages,
so I can keep exploring without scrolling back up.

**Why this priority**: Secondary navigation adds SEO value and discovery, but depends on the footer
existing.

**Independent Test**: From any page, use the footer links to reach the applications section and the
manifesto; confirm all four applications and the resource links are present.

**Acceptance Scenarios**:

1. **Given** the footer, **When** I read the "Ecosistema" column, **Then** it links to Foundly Mobile, Foundly POS, LRC-Maker, and Mixbit (to the applications section or their landing pages).
2. **Given** the footer, **When** I read the "Filosofía & Recursos" column, **Then** it links to the Local-First Manifesto, Documentation, and Local Privacy.
3. **Given** the footer, **When** I read the "Contacto/Redes" column, **Then** it links to the available social channels and/or support contact.

---

### User Story 3 - Legal bar and accessible links (Priority: P3)

As a visitor, including one using assistive technology, I can read the copyright and use every
footer link reliably, with external links behaving safely.

**Why this priority**: The legal bar and accessibility are required for a production footer but
depend on the footer structure being in place.

**Independent Test**: Inspect the bottom bar for the copyright text and run a keyboard/screen-reader
pass over the footer links; confirm external links are safe and labelled.

**Acceptance Scenarios**:

1. **Given** the footer, **When** I reach the bottom bar, **Then** it shows the copyright line for Foundly Labs and the FORGE Labs credit.
2. **Given** any external link in the footer, **When** inspected, **Then** it opens in a new tab with `rel="noopener noreferrer"` and has a descriptive accessible label.
3. **Given** keyboard navigation, **When** I tab through the footer, **Then** every link is focusable with a visible focus state.

### Edge Cases

- When an application has no dedicated landing page, its footer link points to the applications section anchor.
- When a resource page does not exist yet, the link points to a stable anchor or documented placeholder without breaking the build.
- When the full logo asset is unavailable, the footer falls back to the isotipo plus the brand name.
- When the viewport is very narrow, the columns stack and long link lists wrap without horizontal overflow.
- When JavaScript is disabled, all footer links and hover/focus states still work.
- When social links are not configured, the footer omits those entries gracefully.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Every page MUST render a semantic HTML5 `<footer>` provided by the shared site layout.
- **FR-002**: The footer MUST display the Foundly Labs logo or isotipo.
- **FR-003**: The footer MUST include the short brand copy: "Ecosistema de aplicaciones local-first diseñadas para finanzas, comercio y creación sin dependencia de la nube."
- **FR-004**: The footer MUST prominently credit FORGE Labs with "Un producto desarrollado e impulsado por FORGE Labs.", linking to `https://www.forgelab.lat` with `target="_blank"` and `rel="noopener noreferrer"`, styled with subtle hover/focus states.
- **FR-005**: The footer MUST include an ecosystem column linking the four applications: Foundly Mobile, Foundly POS, LRC-Maker, and Mixbit (to the applications section or their landing pages).
- **FR-006**: The footer MUST include a philosophy/resources column linking to the Local-First Manifesto (the manifesto section), Documentation, and Local Privacy.
- **FR-007**: The footer MUST include a contact/social column linking the available social channels (GitHub, X/Twitter, Discord) and/or a support contact.
- **FR-008**: The footer MUST include a bottom bar, separated by a top divider, with "© 2026 Foundly Labs. Todos los derechos reservados. Powered by FORGE Labs."
- **FR-009**: The footer layout MUST be responsive: a single column on small screens and three to four columns on desktop.
- **FR-010**: The footer MUST follow the project's Clean Light UI (harmonized surface and border, using design tokens) and remain legible.
- **FR-011**: Every external link MUST open in a new tab with `rel="noopener noreferrer"`, and social/icon links MUST have descriptive accessible labels.
- **FR-012**: The footer MUST NOT add any client-side JavaScript (zero-JS).

### Key Entities _(include if feature involves data)_

- **Footer Column**: A labelled group of links (e.g. Ecosystem, Philosophy & Resources, Contact/Social).
- **Footer Link**: A label with a destination, an external/internal flag, and an optional accessible label.
- **Brand Attribution**: The FORGE Labs credit (name + URL).
- **Copyright Line**: The legal text shown in the bottom bar.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of built pages include a semantic `<footer>`.
- **SC-002**: The built HTML contains a link to `https://www.forgelab.lat` with `rel="noopener noreferrer"`.
- **SC-003**: All four applications appear as footer links.
- **SC-004**: At 320px width the footer shows a single stacked column without horizontal scroll; at desktop width it shows 3–4 columns.
- **SC-005**: All external links open safely and every icon/social link has a descriptive accessible label; all links are keyboard reachable with visible focus.
- **SC-006**: The footer adds zero client-side JavaScript, and `check`/`lint`/`build` complete with 0 errors/warnings.
- **SC-007**: The copyright text and FORGE Labs credit render exactly as specified.

## Assumptions

- The footer is added to the shared base layout so it appears on every page.
- FORGE Labs is the parent organization (`https://www.forgelab.lat`), already available in the site configuration.
- "Foundly Mobile" in the requested list corresponds to the "Foundly" application in the existing app data.
- The resource links (Documentation, Local Privacy) may not have dedicated pages yet; they point to stable anchors/placeholders and do not break the build.
- Social links come from the existing site configuration (GitHub, X); Discord/support email are included only if a destination is available.
- The footer uses the light, token-based Clean Light UI surface with a clean top border (not the dark variant), to match the current light theme.
- Footer copy and copyright are static Spanish text, displayed verbatim.
