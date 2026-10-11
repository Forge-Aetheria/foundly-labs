# Phase 0 Research: Production Footer

**Feature**: `006-production-footer` | **Date**: 2026-10-05

This document records the decisions taken to remove all `NEEDS CLARIFICATION` items from the plan's
Technical Context.

## R1. Footer placement

- **Decision**: Render `<Footer />` in `src/shared/components/BaseLayout.astro`, immediately after the page
  content `<slot />` inside `<body>`.
- **Rationale**: The footer must appear on every page (FR-001); the base layout is the single shared
  shell, so placing it there avoids repeating it per page.
- **Alternatives considered**: Adding the footer to each page (rejected — duplication and drift) and
  placing it inside `<footer>` on `.astro` pages (rejected — same duplication problem).

## R2. Surface style (Clean Light UI)

- **Decision**: Use a light, token-based surface: `bg-surface-elevated/60` with
  `border-t border-border-subtle`, and `text-secondary`/`text-muted` for copy, matching the site's
  light theme.
- **Rationale**: Satisfies FR-010 and the constitution's Clean Light UI principle; tokens keep the
  footer consistent with the rest of the site. The request offered a dark or light variant; the light
  one harmonizes with the existing light theme (documented in Assumptions).
- **Alternatives considered**: The dark `slate-900` variant (rejected — clashes with the current
  light theme and would use non-token colors), and a fully custom CSS block (rejected — utilities are
  the project convention).

## R3. Where the link content lives

- **Decision**: Define the footer columns in `src/shared/data/footer.ts` as a typed `FooterColumn[]`; the
  component only imports data and renders it.
- **Rationale**: `code-rules.md` forbids declaring static content lists inside section components and
  requires content in `src/shared/data/`. Centralizing the links also aids future edits and SEO review.
- **Alternatives considered**: Inlining the links in `Footer.astro` (rejected — violates code rules)
  and a content collection (rejected — overkill for a fixed, code-owned list).

## R4. Logo rendering

- **Decision**: Render the official logo with Astro's `<Image />` (`src/assets/branding-logo-fl.png`),
  with a text fallback (isotipo + brand name) if the logo cannot render.
- **Rationale**: Satisfies FR-002 and the project's image rule (`<Image />`); the asset is already
  used by the navbar.
- **Alternatives considered**: A plain `<img>` (rejected — bypasses the image convention) and the
  favicon SVG (rejected — too small/low-fidelity for a footer mark).

## R5. External link hygiene and accessibility

- **Decision**: Every external link uses `target="_blank"` and `rel="noopener noreferrer"`; social
  and icon links get descriptive `aria-label`s; all links are native `<a>` elements with visible
  focus styles.
- **Rationale**: Satisfies FR-011 and SC-005; anchors are zero-JS and keyboard-native.
- **Alternatives considered**: JS-based new-tab handling (rejected — violates zero-JS).

## R6. Ecosystem links

- **Decision**: Derive the ecosystem links from `src/shared/data/apps.ts`, linking each application to the
  applications section (`/#apps`), and label "Foundly" as "Foundly Mobile" as requested.
- **Rationale**: Avoids duplicating app names and keeps the footer in sync with the app grid; no
  standalone landing pages exist yet, so the `#apps` anchor is the correct target.
- **Alternatives considered**: Hardcoding the four names (rejected — drift risk) and linking to
  non-existent landing pages (rejected — broken links).

## R7. Resource links

- **Decision**: Link "Local-First Manifesto" to `/#manifesto` and "Privacidad Local" to `/privacy`
  (both exist). Link "Documentación" to the project repository (external) until a dedicated docs
  page exists.
- **Rationale**: Satisfies FR-006 without introducing broken anchors (spec edge case). Using the
  repository is a real, useful destination rather than a dead placeholder.
- **Alternatives considered**: A `/#docs` placeholder anchor (rejected — no target exists) and
  omitting Documentation (rejected — the request lists it).

## R8. Contact/social links

- **Decision**: Render the social links from the existing `siteConfig.social` (GitHub, X), each with
  an `aria-label`. Discord/support email are omitted unless a destination is configured.
- **Rationale**: Satisfies FR-007 with the channels that actually exist, avoiding invented or broken
  links (spec edge case about unconfigured social links).
- **Alternatives considered**: Hardcoding Discord/email (rejected — no known destinations).

## R9. Copyright line

- **Decision**: Render the static line
  "© 2026 Foundly Labs. Todos los derechos reservados. Powered by FORGE Labs." in the bottom bar.
- **Rationale**: FR-008 asks for this exact text; a static string avoids runtime date logic and stays
  zero-JS.
- **Alternatives considered**: Computing the year at build time (rejected — the request specifies
  2026 verbatim).

## Open items

None. All Technical Context unknowns are resolved.
