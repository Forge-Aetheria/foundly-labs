# Foundly Labs — Code & TypeScript Standards

**Version:** 2.2.0 (Monorepo — Landing Web Domain + Next.js data access)
**Scope:** `apps/landing` (Astro 5 + TypeScript + Tailwind CSS v4). Sirve además como **base de los estándares de TypeScript** para los paquetes compartidos (`packages/ui`) y las apps (`apps/book`, `apps/store`).
**Authority:** Inviolable — subordinado a `specs/business-model.md`, `constitution.md` (v5.1.0) y `specs/architecture.md`.
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

## 8. Next.js Server/Client Boundary (RSC)

Aplica a `apps/book` y `apps/store` (App Router, React 19). Un archivo **sin** `'use client'` es un **Server Component** por defecto. React solo serializa datos simples a través de la frontera Server → Client (`string`, `number`, `boolean`, `null`, `undefined`, `Date`, arrays, objetos planos y `ReactNode`). Una **función** no es serializable y provoca el error:

```text
Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
Or maybe you meant to call this function rather than return it. <... sx={function sx} ...>
```

### 8.1 Rule: no functions from Server Components to Client Components

Un Server Component **NUNCA** debe pasar a un Client Component (MUI, `@foundly/ui`, o cualquier componente `'use client'`):

- `sx` como función: `sx={(theme) => ({ ... })}`, `sx={[(theme) => ({ ... })]}`.
- Handlers: `onClick`, `onChange`, `onClose`, `onDelete`, `onRowClick`, etc.
- Render props / callbacks: `render={(row) => ...}`, `component={(props) => ...}`.
- En general, **cualquier prop cuyo valor sea una función**.

Si se necesita interacción o un `sx` dinámico con callback, el componente que lo declara **DEBE** llevar `'use client'` y consumirse desde otro componente cliente.

### 8.2 Design-system primitives stay server-safe

- Los primitivos de `packages/ui` **NO** llevan `'use client'` a propósito: deben poder renderizarse desde Server Components. Solo `FoundlyThemeProvider` es cliente.
- Por tanto, el JSX interno de `packages/ui` **no** puede contener funciones (`sx`-función, handlers internos incondicionales, etc.); solo props serializables.
- Para estilos dependientes del tema en un Server Component, usa **rutas de token** que MUI resuelve contra `theme.palette` en tiempo de estilo, o valores directos resueltos desde el tema:

```tsx
// ❌ MAL — la función cruza la frontera RSC (Server Component)
<Box component="span" sx={(theme) => ({ backgroundColor: theme.palette.surface.badgePill })} />

// ✅ BIEN — ruta de token resuelta por el tema (serializable)
<Box component="span" sx={{ backgroundColor: 'surface.badgePill' }} />

// ✅ BIEN — valor directo para lo que no tiene ruta de paleta (p. ej. sombras)
boxShadow: elevated ? foundlyTheme.palette.shadow.fab : foundlyTheme.palette.shadow.card,
```

- `'use client'` **no** exime del tipado estricto ni del uso de tokens (§1 y §4).

### 8.3 Verification

- Al renderizar cualquier ruta en `next dev`, la consola y la respuesta HTTP **NO** deben mostrar `Functions cannot be passed directly to Client Components`.
- Todo cambio en un Server Component o en `packages/ui` debe probarse cargando las rutas afectadas, además de pasar `tsc`, ESLint y la suite de tests.

## 9. Next.js Data Access & Module Hooks (apps/book, apps/store)

Norma obligatoria (constitución §5.VI). La lógica de datos vive **dentro del módulo**, nunca en la UI ni en `shared/infra`.

### 9.1 Estructura canónica de un módulo con datos

```text
src/modules/<modulo>/
├── actions.ts     # Funciones de servidor: lecturas (fetches) y Server Actions
├── hooks.ts       # Hooks de cliente que envuelven las interacciones
├── <modulo>.graphql  # Operaciones GraphQL del módulo (input de codegen)
├── components/    # Vistas y componentes de UI
├── dialogs/       # (cuando aplique)
├── utils/         # Helpers puros, schemas, mappers
├── tests/
└── <Modulo>View.tsx
```

- **`<modulo>.graphql`** — las operaciones GraphQL (queries/mutations) del módulo viven **dentro del módulo**. El `codegen` las recolecta (`documents: ['src/modules/**/*.graphql', 'src/shared/**/*.graphql']`) y genera `shared/api/generated.ts`. Las operaciones transversales (p. ej. `tenancy`) viven en su carpeta `shared/<área>/`.

- **`actions.ts`** — única puerta a la API para el módulo. Server-only: lecturas y `'use server'` actions. Consumido por Server Components (render inicial) y por `hooks.ts`.
- **`hooks.ts`** — `'use client'`; único punto desde el que la UI interactiva dispara acciones. Envuelve las Server Actions de `actions.ts`.

### 9.2 Prohibiciones en la UI

En `components/`, `dialogs/` y `<Modulo>View.tsx` queda **prohibido** llamar directamente a:

- `useQuery` / `useMutation` (TanStack Query u otra librería).
- `apiRequest` o cualquier transporte GraphQL.
- Server Actions importadas de `actions.ts`.

Toda interacción debe pasar por un hook de `hooks.ts`.

### 9.3 Nomenclatura de hooks

Patrón obligatorio `use<Acción><Entidad|Módulo>`:

```ts
// ✅ BIEN
export function useCreateService() { /* envuelve createService de actions.ts */ }
export function useUpdateAvailability() { /* ... */ }
export function useCancelAppointment() { /* ... */ }

// ❌ MAL
export function serviceCreator() {}
export function useThing() {}
```

### 9.4 Tipado por codegen

`actions.ts`/`hooks.ts` DEBEN usar **exclusivamente** los documentos y tipos autogenerados por
`graphql-codegen` (`generated.ts`). Se prohíbe declarar DTOs o tipos manuales del contrato GraphQL.

```ts
// ✅ BIEN — documento + tipos generados
import { MyServicesDocument, type MyServicesQuery } from '../../shared/api/generated';

// ❌ MAL — DTO manual
interface MyServiceDto { id: string; name: string; /* ... */ }
```

### 9.5 `shared/infra` deprecada

`shared/infra/` no puede alojar lógica de dominio ni acciones de servidor y DEBE desaparecer. El
contenido transversal se reubica en carpetas de propósito claro: `shared/api/` (transporte + codegen),
`shared/types/` (resultados/contratos de dominio), `shared/auth/` (sesión). Plan de migración:
`specs/book/011-module-data-layer/`.

## 10. Test Location (monorepo)

Todo test DEBE vivir dentro de una carpeta **`tests/`** de la carpeta a la que pertenece su dominio.
Nunca se colocan como hermanos del código fuente.

- **Módulos (Next)**: `src/modules/<modulo>/tests/*.test.ts(x)`.
- **Código compartido (Next)**: `src/shared/<área>/tests/*.test.ts(x)` (p. ej. `shared/tenancy/tests/queries.test.ts`).
- **Rutas (Next)**: `src/app/tests/*.test.tsx` y `src/app/<segmento>/tests/*.test.tsx`.
- **Paquetes**: `packages/<pkg>/src/<componente>/tests/*.test.tsx`.

Reglas:

- Un `tests/` agrupa **todos** los tests de su carpeta de dominio.
- Si una carpeta contiene varios asuntos no relacionados, sus tests también van en ese único `tests/`,
  pero **en archivos separados** (uno por asunto/unidad bajo prueba).
- Los imports relativos de un test se resuelven desde su nueva profundidad (`tests/` añade un nivel).

> **TODO(monorepo) — extender la ubicación de tests a `packages/*` y `apps/api`.**
>
> **CUANDO LEAS ESTO, PARA UN MOMENTO TU PROCESO Y CONFIRMA CON EL USUARIO SI DEBEMOS HACERLO AHORA.**
>
> Estado actual: `apps/book` ya cumple §10. Pendientes de migrar (NO migrar sin confirmación explícita del usuario):
>
> - `packages/ui` — `*.test.tsx` colocados junto a cada componente/tema.
> - `packages/database` — `test/schema.test.ts` (carpeta en singular, no `tests/`).
> - `apps/api` — `*.spec.ts` colocados (convención NestJS; confirmar si aplica o es excepción).
