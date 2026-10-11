# Foundly Labs — Code & TypeScript Standards

**Version:** 2.0.0 (Monorepo — Landing Web Domain)
**Scope:** `apps/landing` (Astro 5 + TypeScript + Tailwind CSS v4). Sirve además como **base de los estándares de TypeScript** para los paquetes compartidos (`packages/ui`) y las apps (`apps/book`, `apps/store`).
**Authority:** Inviolable — subordinado a `specs/business-model.md`, `constitution.md` (v4.1.0) y `specs/architecture.md`.
**Design source of truth:** `specs/system-design.md` v3.0.0 y `packages/ui/src/styles/tokens.css`.

## 1. Strict Typing Policy

The use of `any`, `unknown` without type guards, or implicit type casting (`as targetType`) is strictly forbidden. All props, data structures, and helper functions must be explicitly typed.

**Monorepo scope:** estas reglas de tipado aplican a `apps/landing` y son la **base obligatoria** para todo el código TypeScript del monorepo, incluido el paquete compartido (`packages/ui`) y las apps (`apps/book`, `apps/store`).

**Type Location Rules:**

- **Component Props**: Defined inside the Astro component frontmatter or React component file as an `interface Props`.
- **Content & Data Schemas**: Content collection schemas (pricing plans, features, FAQs, testimonials) must be typed and validated using `astro:content` and `zod`.
- **Global / Shared Types**: Tipos compartidos en `packages/*` (p. ej. `packages/ui`) o en `apps/landing/src/shared/types/index.ts` según su alcance.

## 2. Astro 5 Architecture & Island Standards

### 2.1 Static First Philosophy

- Every page and component must be rendered as static HTML (`.astro`) by default.
- Interactive JavaScript is only allowed when strictly necessary (e.g., interactive calculators, mobile menu toggles, contact form submission).

### 2.2 React Islands Strategy (`client:*`)

When client-side UI hydration is required, isolate the component in React and assign the minimum necessary hydration directive:

- `client:load`: Only for above-the-fold critical interactions (e.g., mobile navigation drawer).
- `client:visible`: For interactive elements lower on the page (e.g., interactive pricing toggle, video modal, testimonials carousel).
- `client:idle`: For non-critical low-priority interactions.

## 3. Naming and Location Conventions

### 3.1 Directory Matrix

Rutas relativas a `apps/landing/`, salvo los paquetes compartidos, que viven en `packages/`.

| Element                    | Naming Standard              | Location                             | Example                                            |
| -------------------------- | ---------------------------- | ------------------------------------ | -------------------------------------------------- |
| Pages / Routes             | kebab-case (`.astro`)        | `src/pages/`                         | `src/pages/index.astro`, `src/pages/privacy.astro` |
| Module Views               | PascalCase (`.astro`)        | `src/modules/<modulo>/`              | `src/modules/home/HomeView.astro`                  |
| Astro Sections             | PascalCase (`.astro`)        | `src/modules/<modulo>/components/`   | `Hero.astro`, `AppsGrid.astro`                     |
| React Islands              | PascalCase (`.tsx`)          | `src/modules/<modulo>/islands/`      | `PricingCalculator.tsx`, `MobileMenu.tsx`          |
| Astro UI Primitives        | PascalCase (`.astro`)        | `src/shared/components/ui/`          | `AppCard.astro`, `Badge.astro`, `Button.astro`     |
| SEO / Layout / Chrome      | PascalCase (`.astro`)        | `src/shared/components/`             | `SEO.astro`, `BaseLayout.astro`, `Navbar.astro`    |
| Data / Content Collections | kebab-case (`.json` / `.ts`) | `src/shared/data/` or `src/content/` | `src/shared/data/apps.ts`, `src/content/pricing/`  |
| Types                      | kebab-case (`.ts`)           | `src/shared/types/`                  | `src/shared/types/index.ts`                        |
| Utilities & Constants      | camelCase (`.ts`)            | `src/shared/utils/`                  | `src/shared/utils/analytics.ts`                    |
| Shared Packages            | PascalCase / kebab-case      | `packages/ui`, `packages/config`     | `packages/ui/src/index.ts`                         |

> **Patrón de app (constitution §7)**: todas las apps comparten **rutas delgadas + `modules/` + `shared/`**. En las apps Next.js (`apps/book`, `apps/store`) las rutas viven en `src/app/`, la lógica de dominio en `src/modules/<modulo>/` y lo reutilizable en `src/shared/`.

## 4. UI, Styling & Design System Rules

### 4.1 Tailwind CSS & Brand Tokens

All styling must be driven by Tailwind CSS and the canonical tokens defined in `packages/ui/src/styles/tokens.css` (source of truth, mirroring `specs/system-design.md` v3.0.0).

- **No Inline Magic Colors**: Colors must map strictly to the design system; hex literals inside components are forbidden (enforced by the ESLint guard). No component may declare a brand color outside these tokens.
  - **Primary Accent**: `bg-accent-primary` (#6C5CE7)
  - **Primary Accent Hover**: `--accent-primary-hover` (#5A4AD1)
  - **Primary Accent Soft**: `--accent-primary-soft` (#EEECFE)
  - **App Body**: `bg-app-body` (#FAF8FF)
  - **Surface Elevated / Footer**: `bg-surface-elevated` (#F1F5F9)
  - **Card Light**: `bg-card-light` (#FFFFFF)
  - **Text Primary**: `text-primary` (#0F172A)
  - **Text Secondary**: `text-secondary` (#475569)
  - **Text Muted**: `text-muted` (#94A3B8)
  - **Border Subtle**: `border-subtle` (#E2E8F0)
  - **Domain Accents**: `--brand-book` (#7C3AED), `--brand-store` (#059669), `--brand-pos` (#2563EB)
  - **Signature Top Gradient (extensión de la landing)**: #C8B6FF / #D8B4FE

### 4.2 Card Styling Rule

Cards representing features, testimonials, or pricing tiers must strictly follow the visual system:

```html
<!-- GOOD: Clean Light UI Card Standard -->
<div
  class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
>
  <!-- Content -->
</div>
```

> Nota: el literal `border-[#E2E8F0]` refleja el borde canónico de `specs/system-design.md` v3.0.0. En código de producción se prefiere la utilidad por token `border-border-subtle` (evita valores arbitrarios y satisface el ESLint guard de §4.1).

## 5. Separation of Content and Components

- Declaring static content arrays, pricing lists, FAQ text, or feature descriptions directly inside layout or section components is strictly forbidden.
- **Content Location**: All copy and landing content must reside in `src/shared/data/` or Astro Content Collections (`src/content/`).
- **Component Purpose**: Astro section components (`HeroSection.astro`, `FeaturesSection.astro`) must only import data and render semantic HTML.

## 6. Performance & Web Vitals Execution

- **Images**: All images must use Astro's `<Image/>` component from `astro:assets` to enforce automatic WebP/AVIF generation, sizing, and lazy loading.
- **Fonts**: Fonts must be self-hosted locally or preloaded to eliminate cumulative layout shift (CLS) and FOIT.
- **Icons**: Use `astro-icon` or inline optimized SVGs. Including whole icon library bundles in client JS is strictly forbidden.

## 7. Form Submission & User Feedback

- **Interactive Forms**: Forms (e.g., lead generation, demo request, newsletter) must use client-side React islands or lightweight vanilla JS.
- **Feedback UI**: Success and error notifications must follow the visual identity (floating toast or clean lavender alert box with #6C5CE7 accents).
- **No Page Reloads**: Form submissions must be handled asynchronously (fetch API) with clear visual pending states.
