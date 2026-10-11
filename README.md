# Foundly Labs — Landing Page

Static-first landing page for the Foundly Labs ecosystem. Built with Astro 5, Tailwind CSS v4
design tokens (Clean Light UI), React islands, and strict TypeScript.

## Stack

- Astro 5 (SSG / server-first islands architecture)
- Tailwind CSS v4 via `@tailwindcss/vite`
- React (`@astrojs/react`) for interactive islands only
- TypeScript in `strict` mode with the `@/*` path alias
- Zod-validated content collections

## Requirements

- Node.js ≥ 20 (tested with v24)
- npm

## Setup

```bash
npm install
```

## Scripts

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Start the dev server at `http://localhost:4321` |
| `npm run build`        | Build the static site to `dist/`                |
| `npm run preview`      | Preview the production build                    |
| `npm run check`        | Type-check with `astro check`                   |
| `npm run lint`         | Lint with ESLint                                |
| `npm run format`       | Format with Prettier                            |
| `npm run format:check` | Verify formatting                               |

## Project structure

```text
src/
├── assets/          # Local branding assets (full logo)
├── components/
│   ├── ui/          # Static UI primitives (AppCard, Badge, Button)
│   ├── sections/    # Landing sections (Navbar, Hero, AppsGrid, Manifesto)
│   └── islands/     # Interactive, hydratable islands (.tsx)
├── content/         # Content collection entries (pricing, faqs, features)
├── data/            # Static constants (siteConfig, navigation, apps)
├── layouts/         # BaseLayout.astro (SEO, fonts, backgrounds, navbar)
├── pages/           # Routes (index, privacy, terms)
├── styles/          # global.css + tokens.css
├── types/           # Shared TypeScript types
└── utils/           # Formatters and analytics helpers
```

The home page composes the Hero, the applications grid (`#apps`), and the local-first manifesto
(`#manifesto`). The navbar links to those anchors as `/#apps` and `/#manifesto`, and the Hero CTAs
link to `#apps` and `#manifesto`.

## Design tokens

The Clean Light UI palette is defined once in `src/styles/tokens.css` with Tailwind v4's `@theme`
directive and is the only permitted source of brand colors. Components must not contain literal
brand hex values (enforced by an ESLint guard in `eslint.config.js`).

## Shared UI library

The reusable design system lives in `packages/ui` (`@foundly/ui`). MUI-based components are used
only inside React islands (`client:only="react"`); the static landing output stays JS-free and keeps
consuming the shared tokens through Tailwind.

## Governance & validation

This project follows Spec-Driven Development. See:

- `constitution.md` and `code-rules.md` for the non-negotiable rules
- `specs/landing/001-project-scaffold/` for the feature spec, plan, and tasks
- `specs/landing/001-project-scaffold/quickstart.md` for the full validation guide

Quick validation:

```bash
npm run check && npm run lint && npm run build
```

Then run Lighthouse against `dist/` and confirm 100/100 Desktop and ≥ 98 Mobile for Performance,
Accessibility, and SEO.

## Monorepo workspace

The repo is a **npm workspaces monorepo** (`apps/*`, `packages/*`):

| App/package   | Stack                 | Rol                                    | Specs                            |
| ------------- | --------------------- | -------------------------------------- | -------------------------------- |
| `apps/landing`| Astro 5 (SSG)         | Vitrina pública (raíz `/`)             | `/specs/landing/`                |
| `apps/book`   | Next.js / React 19    | Módulo SaaS interactivo (`/book`)      | `/specs/book/`                   |
| `apps/store`  | Next.js / React 19    | Comercio/licencias (`/store`)          | `/specs/store/`                  |
| `apps/api`    | NestJS (Node.js)      | Backend / API del ecosistema           | `/specs/api/`                    |
| `packages/ui` | MUI v6 (design system)| `@foundly/ui`                          | `/specs/shared-ui/`              |
| `packages/database` | Prisma + PostgreSQL | `@foundly/database` (persistencia DB-First) | `/specs/api/`              |

Comandos de la API (`@foundly/api`) y la base de datos (`@foundly/database`):

```bash
npm run build -w @foundly/api   # build gate
npm run test -w @foundly/api    # test gate
npm run dev -w @foundly/api     # dev server (puerto 3002 / PORT; GraphQL en /graphql)
npm run generate -w @foundly/database  # prisma generate (cliente DB-First)
```
