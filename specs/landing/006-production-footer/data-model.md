# Phase 1 Data Model: Production Footer

**Feature**: `006-production-footer` | **Date**: 2026-10-05

## Entity: FooterLink

A single link rendered in a footer column. Defined in `src/shared/types/index.ts`, used by
`src/shared/data/footer.ts`.

| Field       | Type    | Required | Validation                    | Notes                                                             |
| ----------- | ------- | -------- | ----------------------------- | ----------------------------------------------------------------- |
| `label`     | string  | yes      | non-empty                     | Visible text                                                      |
| `href`      | string  | yes      | site-relative or absolute URL | Destination                                                       |
| `external`  | boolean | no       | default `false`               | When true, render `target="_blank"` + `rel="noopener noreferrer"` |
| `ariaLabel` | string  | no       | non-empty if provided         | Accessible name for icon/glyph links                              |

## Entity: FooterColumn

A labelled group of links.

| Field   | Type         | Required | Validation   | Notes              |
| ------- | ------------ | -------- | ------------ | ------------------ |
| `title` | string       | yes      | non-empty    | Column heading     |
| `links` | FooterLink[] | yes      | may be empty | Rendered as a list |

**Canonical columns** (from `src/shared/data/footer.ts`):

### Ecosystem

| label          | href     | source                        |
| -------------- | -------- | ----------------------------- |
| Foundly Mobile | `/#apps` | `apps` (`Foundly`), relabeled |
| Foundly POS    | `/#apps` | `apps`                        |
| LRC-Maker      | `/#apps` | `apps`                        |
| Mixbit         | `/#apps` | `apps`                        |

### Philosophy & Resources

| label                 | href                                        | external |
| --------------------- | ------------------------------------------- | -------- |
| Local-First Manifesto | `/#manifesto`                               | no       |
| Documentación         | `https://github.com/Ragomez33/foundly-labs` | yes      |
| Privacidad Local      | `/privacy`                                  | no       |

### Contact & Social

| label  | href                             | external | ariaLabel                     |
| ------ | -------------------------------- | -------- | ----------------------------- |
| GitHub | `siteConfig.social[github].href` | yes      | "GitHub de Foundly Labs"      |
| X      | `siteConfig.social[x].href`      | yes      | "X (Twitter) de Foundly Labs" |

## Entity: BrandAttribution

The parent-organization credit, sourced from `siteConfig.parentOrganization`.

| Field    | Value                                                  |
| -------- | ------------------------------------------------------ |
| `name`   | `"FORGE Labs"`                                         |
| `url`    | `"https://www.forgelab.lat"`                           |
| sentence | "Un producto desarrollado e impulsado por FORGE Labs." |

## Entity: CopyrightLine

Static string rendered in the bottom bar:

```text
© 2026 Foundly Labs. Todos los derechos reservados. Powered by FORGE Labs.
```

## Validation Rules

- Every `href` MUST be a valid site-relative path, an in-page anchor, or an absolute URL.
- External links MUST set `target="_blank"` and `rel="noopener noreferrer"`.
- Icon/glyph-only links MUST provide `ariaLabel`.
- No literal brand hex values may appear in the footer component.

## State Transitions

None. All data is static and build-time.
