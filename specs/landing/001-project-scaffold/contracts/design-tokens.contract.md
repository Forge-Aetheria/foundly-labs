# Contract: Design Tokens (Clean Light UI)

**Feature**: `001-project-scaffold` | **Type**: Public styling interface

The token layer is the single source of truth for all brand colors. Components consume tokens and
MUST NOT contain literal brand hex values. Tokens are defined once in `src/styles/tokens.css` via
Tailwind v4's `@theme` and become both CSS custom properties and Tailwind utilities.

## Contract

| CSS variable                  | Value                      | Guaranteed utility                                                  |
| ----------------------------- | -------------------------- | ------------------------------------------------------------------- |
| `--color-accent-primary`      | `#6C5CE7`                  | `bg-accent-primary`, `text-accent-primary`, `border-accent-primary` |
| `--color-accent-primary-glow` | `rgba(108, 92, 231, 0.35)` | `shadow-accent` (or `--shadow-card`)                                |
| `--color-accent-positive`     | `#10B981`                  | `text-accent-positive`                                              |
| `--color-accent-gold`         | `#F59E0B`                  | `text-accent-gold`                                                  |
| `--color-app-body`            | `#FAFAFC`                  | `bg-app-body`                                                       |
| `--color-surface-elevated`    | `#F4F3F8`                  | `bg-surface-elevated`                                               |
| `--color-card-light`          | `#FFFFFF`                  | `bg-card-light`                                                     |
| `--color-badge-pill`          | `#F0EEF9`                  | `bg-badge-pill`                                                     |
| `--color-border-subtle`       | `#E6E4F0`                  | `border-border-subtle`                                              |
| `--color-gradient-from`       | `#C8B6FF`                  | `from-gradient-from`                                                |
| `--color-gradient-to`         | `#D8B4FE`                  | `to-gradient-to`                                                    |
| `--color-primary`             | `#1E1B2E`                  | `text-primary`                                                      |
| `--color-secondary`           | `#6B7280`                  | `text-secondary`                                                    |
| `--color-muted`               | `#9CA3AF`                  | `text-muted`                                                        |

## Obligations

- Producers (the token file) MUST expose every value above under the listed variable name.
- Consumers (components) MUST reference tokens; adding a new brand color requires a new token.
- The brand gradient MUST be composed as
  `linear-gradient(180deg, var(--color-gradient-from) 0%, var(--color-gradient-to) 100%)`.

## Verification

- A sample component references each token and renders the expected value.
- A source scan of `src/**` reports zero literal brand hex values.
