# Foundly Labs — Code & TypeScript Standards

**Version:** 3.0.0 (Monorepo — Landing Astro + SPA React data access)
**Scope:** `apps/landing` (Astro 5 + TypeScript + Tailwind CSS v4). Sirve además como **base de los estándares de TypeScript** para los paquetes compartidos (`packages/ui`) y las apps (`apps/book`, `apps/store`).
**Authority:** Inviolable — subordinado a `specs/business-model.md`, `constitution.md` (v6.0.0) y `specs/architecture.md`.
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

> **Patrón de app (constitution §7)**: todas las apps comparten **rutas delgadas + `modules/` + `shared/`**. En las SPA (`apps/book`, `apps/store`) las rutas viven en `src/router.tsx`/`src/App.tsx` (React Router), la lógica de dominio en `src/modules/<modulo>/` y lo reutilizable en `src/shared/`.

| Element                   | Naming Standard         | Location (SPA)                             | Example                                              |
| ------------------------- | ----------------------- | ------------------------------------------ | ---------------------------------------------------- |
| Routes / Router           | kebab-case / PascalCase | `src/router.tsx`, `src/App.tsx`            | `src/router.tsx`, `src/App.tsx`                      |
| Module Views              | PascalCase (`.tsx`)     | `src/modules/<modulo>/`                    | `src/modules/agenda/AgendaView.tsx`                  |
| Data Services             | camelCase (`.ts`)       | `src/modules/<modulo>/services.ts`         | `services.ts`                                        |
| Modals / Dialogs          | PascalCase (`.tsx`)     | `src/modules/<modulo>/components/dialogs/` | `CreateServiceDialog.tsx`, `DeleteServiceDialog.tsx` |
| Client Hooks              | `use*` (`.ts`)          | `src/modules/<modulo>/hooks.ts`            | `hooks.ts`                                           |
| GraphQL Operations        | kebab-case (`.graphql`) | `src/modules/<modulo>/`                    | `agenda.graphql`                                     |
| Query Client / Cache Keys | kebab-case (`.ts`)      | `src/shared/api/query-client.ts`           | `query-client.ts`                                    |
| Guards / Session          | kebab-case / PascalCase | `src/shared/auth/`                         | `session-context.tsx`, `guards.ts`                   |
| Tests                     | `*.test.ts(x)`          | `src/**/tests/`                            | `src/modules/agenda/tests/`                          |

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

### 4.3 Public Chrome Reuse Rule

La estructura común de las vistas públicas (`Header`/`Navbar` y `Footer`) es **single source of truth** y no puede reimplementarse ad hoc.

- En `apps/book`, toda vista pública (landing `/`, directorio `/negocios`, onboarding/registro `/onboarding`, legal `/terms` y `/privacy`) DEBE montar `src/shared/components/PublicHeader` y `src/shared/components/PublicFooter`.
- Queda prohibido declarar headers o footers locales por vista o por módulo (p. ej. un header "¿Ya tienes cuenta? Iniciar sesión" o un footer con enlaces de términos/privacidad propio del onboarding).
- Si una vista no necesita el chrome completo, se configura mediante props del componente compartido compatible por convención (por ejemplo `variant="auth"` en `PublicHeader`), **nunca** duplicando el componente.

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

## 8. SPA React (apps/book, apps/store)

**No aplica RSC.** `apps/book` y `apps/store` son SPA de cliente puro (React 19 + Vite). No hay App Router, Server Components, Server Actions ni frontera servidor/cliente que serializar.

- Todo el árbol React se renderiza en el navegador; no existen directivas `'use client'`/`'use server'` con efecto.
- `packages/ui` debe seguir siendo agnóstico de framework y reutilizable en Astro y en las SPA. `FoundlyThemeProvider` aplica el tema MUI en el navegador.
- Los estilos pueden usar `sx` con token o callback libremente (no hay frontera RSC), respetando siempre los tokens del sistema (§4) y el tipado estricto (§1).
- No se permite introducir dependencias de Next.js (`next`, `next/link`, `next/navigation`, `next/image`, `next/server`, `@supabase/ssr`) en `apps/book` ni `apps/store`.

## 9. SPA Data Access & Module Hooks (apps/book, apps/store)

Norma obligatoria (constitución §5.VI). La lógica de datos vive **dentro del módulo**, nunca en la UI ni en `shared/infra`.

### 9.1 Estructura canónica de un módulo con datos

```text
src/modules/<modulo>/
├── services.ts    # Validación Zod + mapeo DTO→dominio + llamada a la API
├── hooks.ts       # Hooks de cliente (TanStack Query: useQuery/useMutation)
├── <modulo>.graphql  # Operaciones GraphQL del módulo (input de codegen)
├── components/    # Vistas y componentes de UI
│   └── dialogs/   # TODO Modal/AlertDialog del módulo
├── utils/         # Helpers puros, schemas, mappers
├── tests/
└── <Modulo>View.tsx
```

- **`<modulo>.graphql`** — las operaciones GraphQL (queries/mutations) del módulo viven **dentro del módulo**. El `codegen` las recolecta (`documents: ['src/modules/**/*.graphql', 'src/shared/**/*.graphql']`) y genera `shared/api/generated.ts`. Las operaciones transversales (p. ej. `tenancy`) viven en su carpeta `shared/<área>/`.

- **`services.ts`** — única puerta de datos del módulo. Contiene validación con Zod, mapeo DTO→dominio y la llamada al transporte GraphQL (`apiRequest`). Debe ser agnóstico de React; nunca importa componentes.
- **`hooks.ts`** — hooks de cliente basados en TanStack Query (`useQuery`/`useMutation`); único punto desde el que la UI dispara lecturas y escrituras. Gestionan claves de caché e invalidación.
- **`components/dialogs/`** — TODO `Modal`/`AlertDialog` del módulo vive aquí. Prohibido declarar modales inline en `components/` o en `<Modulo>View.tsx`, y prohibida la carpeta `dialogs/` suelta en la raíz del módulo.

### 9.2 Prohibiciones en la UI

En `components/`, `components/dialogs/` y `<Modulo>View.tsx` queda **prohibido** llamar directamente a:

- `useQuery` / `useMutation` (TanStack Query u otra librería).
- `apiRequest` o cualquier transporte GraphQL.
- Funciones de `services.ts`.

Toda interacción debe pasar por un hook de `hooks.ts`.

### 9.3 Nomenclatura de hooks

Patrón obligatorio `use<Acción><Entidad|Módulo>`:

```ts
// ✅ BIEN
export function useProfile() {
  /* envuelve fetchProfile de services.ts */
}
export function useCreateService() {
  /* envuelve createService de services.ts */
}
export function useUpdateAvailability() {
  /* ... */
}
export function useCancelAppointment() {
  /* ... */
}

// ❌ MAL
export function serviceCreator() {}
export function useThing() {}
```

### 9.4 Tipado por codegen

`services.ts`/`hooks.ts` DEBEN usar **exclusivamente** los documentos y tipos autogenerados por
`graphql-codegen` (`generated.ts`). Se prohíbe declarar DTOs o tipos manuales del contrato GraphQL.

```ts
// ✅ BIEN — documento + tipos generados
import { MyServicesDocument, type MyServicesQuery } from '../../shared/api/generated';

// ❌ MAL — DTO manual
interface MyServiceDto {
  id: string;
  name: string; /* ... */
}
```

### 9.5 Caché e invalidación

- El `QueryClient` y las claves canónicas viven en `src/shared/api/query-client.ts`.
- Toda clave incluye el `tenantId` (o `slug` público) para evitar fugas entre negocios.
- Toda mutación DEBE invalidar las consultas dependientes (listados, contadores, bandeja) en lugar de revalidar rutas de servidor.
- `signOut` y sesión expirada DEBEN limpiar la caché (`queryClient.clear()`).

### 9.6 `shared/infra` deprecada

`shared/infra/` no puede alojar lógica de dominio ni servicios de datos y DEBE desaparecer. El
contenido transversal se reubica en carpetas de propósito claro: `shared/api/` (transporte + codegen +
query client), `shared/types/` (resultados/contratos de dominio), `shared/auth/` (sesión). Plan de
migración: `specs/book/011-module-data-layer/`.

## 10. Test Location (monorepo)

Todo test DEBE vivir dentro de una carpeta **`tests/`** de la carpeta a la que pertenece su dominio.
Nunca se colocan como hermanos del código fuente.

- **Módulos (SPA)**: `src/modules/<modulo>/tests/*.test.ts(x)` (incluye `services.test.ts`).
- **Código compartido (SPA)**: `src/shared/<área>/tests/*.test.ts(x)` (p. ej. `shared/tenancy/tests/queries.test.ts`).
- **Rutas (SPA)**: `src/tests/*.test.tsx` (p. ej. `src/tests/router.test.tsx`).
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
