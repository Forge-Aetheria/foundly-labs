# Contract: Footer

**Feature**: `006-production-footer` | **Type**: Section UI contract

## Component: `src/shared/components/Footer.astro`

**DOM obligations**

- Root element MUST be the semantic `<footer>` (FR-001).
- MUST render the Foundly Labs logo via `<Image />` (with a brand-name fallback), the short brand
  copy, and the FORGE Labs attribution sentence.
- MUST render a responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (or equivalent), so it
  is a single column on small screens and up to four on desktop.
- MUST render one column per entry in `src/shared/data/footer.ts` (Ecosystem, Philosophy & Resources,
  Contact & Social).
- MUST render a bottom bar separated by a top divider, containing the copyright line.

**Link obligations**

- External links MUST use `target="_blank"` and `rel="noopener noreferrer"`.
- Icon/glyph and social links MUST have a descriptive `aria-label`.
- All links MUST be native `<a>` elements with a visible focus state.
- The FORGE Labs attribution MUST link to `https://www.forgelab.lat`.

**Style obligations**

- MUST use design tokens only: surface (`bg-surface-elevated`), borders (`border-border-subtle`),
  text (`text-primary`/`text-secondary`/`text-muted`), and the accent token for hover.
- MUST NOT contain literal brand hex values.
- Hover/focus transitions MUST be subtle and pure CSS.

**Performance / structure obligations**

- MUST NOT add any client-side JavaScript or `client:*` directive.
- Link content MUST come from `src/shared/data/footer.ts`; the component MUST NOT declare content lists
  inline (code-rules §5).

## Layout integration

- `src/shared/components/BaseLayout.astro` MUST render `<Footer />` after the page `<slot />` so every page
  includes it.

## Verification

- Built HTML for every route contains a `<footer>` and the `https://www.forgelab.lat` link with
  `rel="noopener noreferrer"`.
- All four applications appear as footer links.
- No executable `<script>` is introduced by the footer.
- Keyboard tab order reaches every footer link with a visible focus indicator.
