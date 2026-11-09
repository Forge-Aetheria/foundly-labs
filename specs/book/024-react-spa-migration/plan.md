# Implementation Plan: Migración de Foundly Book a una SPA React

**Branch**: `024-react-spa-migration` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/book/024-react-spa-migration/spec.md`

## Summary

Sustituir la aplicación Next.js `apps/book` por una SPA React (Vite) que conserva la paridad funcional de las features 001–023. Se eliminan Server Actions, Server Components, middleware y la autenticación SSR con cookies; la app pasa a ejecutarse íntegramente en el navegador. El acceso a datos se hará con `graphql-request` + documentos tipados por `graphql-codegen`, organizado por módulo en `services.ts` (Zod + mapeo DTO→dominio) y `hooks.ts` (TanStack Query `useQuery`/`useMutation`), replicando el patrón ya validado en `@foundly/mobile`. La sesión Supabase se persiste en `localStorage`. La vinculación segura de `tenant_id` en onboarding se traslada a `apps/api` con credenciales administrativas del servidor. El portal público, el directorio y la reserva también pasan a SPA.

**Condición de arranque**: la enmienda de gobernanza descrita en `spec.md` §Impacto de gobernanza ya fue aplicada y ratificada el 2026-11-08 (business-model 1.1.0, constitution 6.0.0, architecture 2.0.0, code-rules 3.0.0). La implementación puede comenzar.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19.3, ESM, ES2022; Node.js 24 solo para tooling/build.

**Primary Dependencies**: Vite (build/dev), React Router v7 en modo declarativo (componentes), `@tanstack/react-query` v5, `graphql-request` v7, `graphql`, `@graphql-codegen/*`, `@supabase/supabase-js` v2, MUI 6 + Emotion, `@foundly/ui`, `@foundly/database/categories`, `zod` v4, `react-helmet-async`.

**Storage**: Sesión de identidad en `localStorage` (Supabase). Medios/imágenes en Supabase Storage. Datos de dominio en API GraphQL / PostgreSQL. Caché de consultas en memoria (TanStack Query).

**Testing**: Vitest 3 + Testing Library (React, jest-dom, user-event) + `vitest-axe`; Playwright para E2E de flujos críticos.

**Target Platform**: Navegadores web modernos (desktop y móvil), servidos como estáticos.

**Project Type**: Aplicación web frontend dentro de un monorepo (pnpm workspaces + Turborepo); cambio acotado a `apps/book` y una extensión de `apps/api`.

**Performance Goals**: Login → panel < 3 s en banda ancha típica; restauración de sesión → panel < 2 s; contenido útil del portal público < 2,5 s y interactivo < 5 s en móvil razonable (SC-003/SC-004).

**Constraints**: Sin SSR ni runtime de servidor; sin secretos en el bundle; sesión en `localStorage`; hosting estático con fallback SPA; conservar todas las rutas/redirecciones; paridad funcional estricta; codegen obligatorio (sin DTOs manuales); allowlist CORS actualizada; enmienda de gobernanza ratificada antes de implementar.

**Scale/Scope**: 19 módulos de dominio, ~23 rutas, ~50 operaciones GraphQL, ~100 componentes, ~19k LOC no-test a migrar; 14 suites de pruebas de acciones y 17 mocks de `next/*` a reescribir.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio / sección              | Estado                   | Justificación                                                                                                                                                            |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| §1 Jerarquía de autoridad        | ⚠️ CONDICIONAL           | La feature cambia la arquitectura de Book ratificada en `specs/business-model.md` §2.3. Requiere enmienda aprobada en el nivel de máxima autoridad antes de implementar. |
| §2 Specs por dominio             | ✅ PASS                  | Spec creada en `specs/book/024-react-spa-migration`.                                                                                                                     |
| §3 Stack por app                 | ❌ VIOLACIÓN INTENCIONAL | `apps/book` deja de ser Next.js/React 19 SaaS con RSC y pasa a SPA React. Requiere enmienda MAJOR de la constitución (§3) y de `architecture.md`.                        |
| §5.I SDD obligatorio             | ✅ PASS                  | Existe spec y este plan; no se implementará sin tareas aprobadas.                                                                                                        |
| §5.II Server-First / Zero-JS     | ❌ VIOLACIÓN INTENCIONAL | Book pasa a cliente puro; justificado por decisión de producto (velocidad, consistencia y eliminación de deuda de Next.js).                                              |
| §5.IV Tipado estricto            | ✅ PASS                  | Se mantiene `strict`, sin `any`, Zod y tipos codegen.                                                                                                                    |
| §5.V Frontera RSC                | ❌ N/A / VIOLACIÓN       | Deja de existir la frontera servidor/cliente al eliminarse RSC. Regla obsoleta tras la enmienda.                                                                         |
| §5.VI Capa de datos por módulo   | ❌ VIOLACIÓN INTENCIONAL | Se reemplaza `actions.ts` (servidor) por `services.ts` (cliente) + hooks TanStack. Requiere enmienda de §5.VI.                                                           |
| §5.VII Reutilización obligatoria | ✅ PASS                  | Se reutilizan `@foundly/ui`, `@foundly/database/categories`, tipos/schemas y el patrón ya validado en `apps/mobile`.                                                     |
| §7 Rutas y nombres               | ⚠️ CONDICIONAL           | Las rutas de `src/app/` se sustituyen por router SPA; requiere actualizar la tabla de convenciones.                                                                      |
| §8 Validación pre-commit         | ✅ PASS                  | Se mantienen lint, typecheck, test y build como gates.                                                                                                                   |
| §9 Gobernanza y enmiendas        | ⚠️ CONDICIONAL           | La enmienda debe documentarse, aprobarse e incluir plan de migración (este plan).                                                                                        |

**Resultado del gate**: **PASS (enmiendas aplicadas 2026-11-08)**. Las violaciones fueron justificadas como decisión de arquitectura aprobada por el propietario y las enmiendas ya se aplicaron en `specs/business-model.md` (1.1.0), `constitution.md` y su espejo (6.0.0), `specs/architecture.md` (2.0.0) y `code-rules.md` (3.0.0). Se registran en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/book/024-react-spa-migration/
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones y alternativas
├── data-model.md        # Fase 1: modelo de datos de cliente y caché
├── quickstart.md        # Fase 1: guía de validación ejecutable
├── contracts/           # Fase 1: contratos de interfaz
│   ├── routes.contract.md
│   ├── auth-session.contract.md
│   ├── module-data-layer.contract.md
│   └── register-business.contract.md
├── checklists/
│   └── requirements.md
├── spec.md
└── tasks.md             # Fase 2 (no lo crea /speckit.plan)
```

### Source Code (repository root)

Estructura objetivo de `apps/book`:

```text
apps/book/
├── index.html                       # Shell único de la SPA
├── vite.config.ts                   # Vite + React + dedupe monorepo
├── tsconfig.json                    # Sin plugin de Next; paths @/*
├── vitest.config.ts                 # jsdom + setup
├── e2e/                             # Playwright
├── public/                          # favicons, manifest.webmanifest, assets
└── src/
    ├── main.tsx                     # QueryClient + Auth + Theme + Router
    ├── App.tsx                      # Definición de rutas
    ├── router.tsx                   # Rutas declarativas + guards
    ├── env.ts                       # import.meta.env tipado (VITE_*)
    ├── shared/
    │   ├── api/
    │   │   ├── client.ts            # graphql-request + token + timeout + errores
    │   │   ├── error-surface.ts
    │   │   ├── notify-unauthenticated.ts
    │   │   ├── generated.ts         # codegen (no versionado)
    │   │   └── query-client.ts      # QueryClient + claves + limpieza
    │   ├── auth/
    │   │   ├── supabase.ts          # createClient browser (localStorage)
    │   │   ├── session-context.tsx  # SessionProvider/useSession
    │   │   ├── guards.ts            # decisión de redirección (reutiliza authGuard)
    │   │   └── authConstants.ts
    │   ├── components/              # shell, header, footer, estados, etc.
    │   ├── hooks/                   # hooks transversales (paginación, media, etc.)
    │   ├── tenancy/                 # resolución de tenant en cliente
    │   ├── types/                   # dominio (se conserva)
    │   └── utils/                   # mappers puros, formato, slug, etc.
    └── modules/<modulo>/
        ├── services.ts              # Zod + mapeo DTO→dominio + llamada API
        ├── hooks.ts                 # useQuery/useMutation + invalidación
        ├── <modulo>.graphql         # codegen input (se conserva)
        ├── components/
        ├── dialogs/
        ├── utils/                   # schemas, helpers
        ├── tests/
        └── <Modulo>View.tsx
```

Estructura objetivo de `apps/api` (extensión acotada):

```text
apps/api/src/
├── modules/
│   └── onboarding/                # NUEVO módulo
│       ├── onboarding.module.ts
│       ├── onboarding.resolver.ts # registerBusiness mutation
│       ├── onboarding.service.ts  # Supabase Admin + createTenant + binding
│       ├── onboarding.types.ts
│       └── *.spec.ts
├── shared/supabase/
│   └── admin-client.ts            # createClient con service role (server-only)
└── app.module.ts                  # registrar OnboardingModule
```

**Structure Decision**: Se mantiene el patrón del monorepo (rutas delgadas + `modules/` + `shared/`), pero las rutas dejan de ser `src/app/` (App Router) y pasan a un router SPA declarativo en `src/App.tsx`/`src/router.tsx`. La capa de dominio de cada módulo cambia conceptualmente de `actions.ts` (servidor) a `services.ts` (cliente) y `hooks.ts` (TanStack Query). El único cambio de backend es el nuevo módulo `onboarding` en `apps/api`.

## Complexity Tracking

| Violación                                                              | Por qué es necesaria                                                                                                     | Alternativa más simple rechazada                                                                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Stack de `apps/book` no Next.js (§3)                                   | Decisión del propietario para eliminar SSR/Server Actions, unificar el stack con la app móvil y simplificar el frontend. | Mantener Next.js: rechazada por la deuda de Server Actions, middleware y cookies SSR, y por la inconsistencia con `@foundly/mobile`. |
| Eliminación de RSC/Server-First (§5.II, §5.V)                          | El modelo SPA no tiene frontera servidor/cliente; todo el render y la sesión son del navegador.                          | Híbrido Next (público) + React (admin): rechazado por el propietario para no mantener dos arquitecturas.                             |
| Sustitución de `actions.ts` por `services.ts` + hooks TanStack (§5.VI) | Centraliza validación/mapeo en cliente y usa caché de consultas; mismo patrón que móvil.                                 | Mantener `actions.ts` como wrappers: rechazada por ser una capa intermedia sin valor una vez no hay servidor.                        |
| `tenant_id` vinculado en `apps/api`                                    | El `service role` no puede exponerse al navegador; la vinculación debe ser server-side.                                  | Cliente con service role: rechazada por riesgo crítico de seguridad.                                                                 |
| Metadatos/SEO solo en cliente                                          | Consecuencia de SPA total aprobada por el propietario; se mitiga con Helmet y se deja evolución a prerender.             | Mantener SSR público: rechazada para preservar una sola arquitectura.                                                                |

## Phase 0 — Research

Ver [`research.md`](./research.md). Resuelve: build tool, router, caché, sesión, transporte, capa de datos, onboarding server-side, despliegue, metadatos, imágenes, integración con paquetes del monorepo, pruebas y plan de enmienda de gobernanza. Sin ambigüedades pendientes.

## Phase 1 — Design & Contracts

- **Modelo de datos de cliente y caché**: [`data-model.md`](./data-model.md).
- **Contratos**: [`contracts/routes.contract.md`](./contracts/routes.contract.md), [`contracts/auth-session.contract.md`](./contracts/auth-session.contract.md), [`contracts/module-data-layer.contract.md`](./contracts/module-data-layer.contract.md), [`contracts/register-business.contract.md`](./contracts/register-business.contract.md).
- **Validación**: [`quickstart.md`](./quickstart.md).

## Post-Design Constitution Check

Tras el diseño, se confirma:

- Las violaciones siguen siendo las mismas y todas están cubiertas por la enmienda propuesta; no aparecen violaciones nuevas.
- La reutilización (§5.VII) se respeta: `@foundly/ui`, `@foundly/database/categories`, tipos/schemas existentes y patrón de `apps/mobile`.
- El tipado estricto (§5.IV) se mantiene.
- El único riesgo de gobernanza es la ratificación pendiente; el plan la trata como bloqueante de implementación.
