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
- pnpm 10 via Corepack

## Setup

```bash
corepack enable
pnpm install
```

## Monorepo workspaces

The repository is a pnpm workspace with Turborepo. Additional applications:

| Workspace           | Path                | Description                    |
| ------------------- | ------------------- | ------------------------------ |
| `@foundly/landing`  | `apps/landing`      | Astro landing (root scripts)   |
| `@foundly/book`     | `apps/book`         | Next.js tenant admin           |
| `@foundly/store`    | `apps/store`        | Next.js commerce               |
| `@foundly/api`      | `apps/api`          | NestJS GraphQL API             |
| `@foundly/mobile`   | `apps/mobile`       | Expo / React Native tenant app |
| `@foundly/database` | `packages/database` | Prisma schema and client       |
| `@foundly/ui`       | `packages/ui`       | Clean Light UI web components  |

Mobile-specific setup, environment variables and development-build instructions live in
[`apps/mobile/README.md`](apps/mobile/README.md).

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
├── pages/           # Thin routes (index, privacy, terms) — only render a <Modulo>View
├── modules/         # Domain modules: home/, legal/ (components/ + <Modulo>View.astro)
├── shared/          # Reusable code
│   ├── components/  # Navbar, Footer, SEO, BaseLayout, ui/ primitives (AppCard, Badge, Button)
│   ├── data/        # Static constants (siteConfig, navigation, apps, footer)
│   ├── types/       # Shared TypeScript types
│   └── utils/       # Formatters and analytics helpers
├── content/         # Content collection entries (pricing, faqs, features)
├── styles/          # global.css + tokens.css
└── assets/          # Local branding assets (full logo)
```

The home page (`pages/index.astro`) renders `modules/home/HomeView.astro`, which composes the Hero,
the applications grid (`#apps`), and the local-first manifesto (`#manifesto`). The navbar links to
those anchors as `/#apps` and `/#manifesto`, and the Hero CTAs link to `#apps` and `#manifesto`.

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

| App/package         | Stack                  | Rol                                         | Specs               |
| ------------------- | ---------------------- | ------------------------------------------- | ------------------- |
| `apps/landing`      | Astro 5 (SSG)          | Vitrina pública (raíz `/`)                  | `/specs/landing/`   |
| `apps/book`         | Next.js / React 19     | Módulo SaaS interactivo (`/book`)           | `/specs/book/`      |
| `apps/store`        | Next.js / React 19     | Comercio/licencias (`/store`)               | `/specs/store/`     |
| `apps/api`          | NestJS (Node.js)       | Backend / API del ecosistema                | `/specs/api/`       |
| `packages/ui`       | MUI v6 (design system) | `@foundly/ui`                               | `/specs/shared-ui/` |
| `packages/database` | Prisma + PostgreSQL    | `@foundly/database` (persistencia DB-First) | `/specs/api/`       |

### Atajos por proyecto (desde la raíz)

| Comando           | Projecto | Delega en                                       |
| ----------------- | -------- | ----------------------------------------------- |
| `dev:landing`     | landing  | `npm run dev -w @foundly/landing` (puerto 4321) |
| `build:landing`   | landing  | `npm run build -w @foundly/landing`             |
| `preview:landing` | landing  | `npm run preview -w @foundly/landing`           |
| `check:landing`   | landing  | `npm run check -w @foundly/landing`             |
| `dev:book`        | book     | `npm run dev -w @foundly/book` (puerto 3001)    |
| `build:book`      | book     | `npm run build -w @foundly/book`                |
| `start:book`      | book     | `npm run start -w @foundly/book`                |
| `typecheck:book`  | book     | `npm run typecheck -w @foundly/book`            |
| `test:book`       | book     | `npm run test -w @foundly/book`                 |
| `lint:book`       | book     | `npm run lint -w @foundly/book`                 |
| `codegen:book`    | book     | `npm run codegen -w @foundly/book`              |
| `dev:api`         | api      | `npm run dev -w @foundly/api` (puerto 3002)     |
| `build:api`       | api      | `npm run build -w @foundly/api`                 |
| `start:api`       | api      | `npm run start -w @foundly/api`                 |
| `typecheck:api`   | api      | `npm run typecheck -w @foundly/api`             |
| `test:api`        | api      | `npm run test -w @foundly/api`                  |
| `lint:api`        | api      | `npm run lint -w @foundly/api`                  |

> Los alias cortos de la raíz (`dev`, `build`, `start`, `preview`, `check`, `astro`) siguen apuntando a la
> landing (compatibilidad con la tabla Scripts de arriba). Database ya se expone vía `db:*`.

Comandos de la API (`@foundly/api`) y la base de datos (`@foundly/database`):

```bash
npm run build -w @foundly/api   # build gate
npm run test -w @foundly/api    # test gate
npm run dev -w @foundly/api     # dev server (puerto 3002 / PORT; GraphQL en /graphql)
npm run generate -w @foundly/database  # prisma generate (cliente DB-First)
```

## Database Operations

The database layer (`@foundly/database`) is Prisma + PostgreSQL (Supabase). From the repo root,
use the delegated workspaces scripts — no need to `cd` into the package or pass `--schema`:

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `npm run db:generate` | Regenerate the Prisma Client from the schema     |
| `npm run db:migrate`  | Create and apply a migration (dev)               |
| `npm run db:push`     | Push the schema to the DB (no migration history) |
| `npm run db:studio`   | Open Prisma Studio to browse/explore the DB      |

### Examples

Run a new migration:

```bash
npm run db:migrate -- --name <migration_name>
```

Generate the Prisma Client:

```bash
npm run db:generate
```

Open Prisma Studio:

```bash
npm run db:studio
```

### Connection string

The Prisma CLI reads `DATABASE_URL`. It is resolved from `packages/database/.env` (gitignored),
which must match the `DATABASE_URL` in `apps/api/.env` used by the running API. In non-local
environments (e.g. Vercel), set `DATABASE_URL` as a project environment variable; `db:migrate`
forwards extra args (e.g. `--name`, `--create-only`, `--skip-generate`) to Prisma.
