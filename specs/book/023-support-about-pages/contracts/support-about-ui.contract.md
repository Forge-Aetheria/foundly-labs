# UI Contract: Book Support and About Pages

**Feature**: `specs/book/023-support-about-pages`

## Routes

- `apps/book/src/app/admin/soporte/page.tsx` renders `SupportView`.
- `apps/book/src/app/admin/acerca/page.tsx` renders `AboutView`.
- Both are inside the existing authenticated AdminShell.

## SupportView

- Title “Ayuda y soporte” + intro.
- FAQ list using accessible expand/collapse.
- Contact channels with `mailto:`/`https:` links.
- Responsive layout; no data fetching.

## AboutView

- Foundly logo/name.
- Panel version.
- Product/ecosystem description.
- Legal/institutional links (site, privacy, terms).
- Responsive layout; no data fetching.

## Reuse guarantees

- `Card`, `Stack`, `Typography`, `Button` from `@foundly/ui`.
- MUI icons and existing theme tokens.
- Thin route pages rendering module views only.
