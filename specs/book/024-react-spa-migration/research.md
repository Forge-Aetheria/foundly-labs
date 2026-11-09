# Phase 0 — Research: Migración de Foundly Book a una SPA React

Todas las decisiones de contexto técnico quedan resueltas. No hay ambigüedades pendientes.

## R1. Build tool: Vite

- **Decision**: Vite + `@vitejs/plugin-react`, salida estática (`dist/`).
- **Rationale**: Estándar de facto para SPA React, arranque rápido, HMR, soporte nativo de TS/ESM y de fuentes de workspace. Sustituye `next dev`/`next build` sin servidor de aplicación.
- **Alternatives considered**: CRA (obsoleto), Rsbuild (menos adoptado en el repo), React Router framework mode/Vite plugin (acopla loaders de servidor, descartado por el usuario).

## R2. Routing: React Router v7 en modo declarativo (componentes)

- **Decision**: `react-router-dom` con `<BrowserRouter>`, `<Routes>`, `<Route>`, `<Navigate>`, `useNavigate`, `useLocation`, `useSearchParams`. Guards con componentes de ruta.
- **Rationale**: El usuario pidió modo componentes (sin data loaders). Cubre rutas anidadas, layouts, rutas dinámicas (`/:tenantSlug`), parámetros de consulta y redirecciones heredadas.
- **Alternatives considered**: Data Router con `loader`/`action` (rechazado: acopla datos al router y reintroduce una capa tipo servidor); TanStack Router (menos familiar para el equipo).

## R3. Caché y estado de datos: TanStack Query v5

- **Decision**: `QueryClientProvider` global con `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`, mutaciones sin reintento; invalidación por claves de módulo/tenant tras mutaciones.
- **Rationale**: Reemplaza la revalidación de servidor (`revalidatePath`) y `useAdminResource`; es el patrón ya validado en `apps/mobile/src/shared/api/query-client.ts`.
- **Alternatives considered**: SWR (válido pero el repo ya usa TanStack en móvil); estado manual con `useEffect` (descartado, era el patrón a eliminar).

## R4. Autenticación y sesión en el navegador

- **Decision**: `createClient` de `@supabase/supabase-js` con `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`, storage por defecto (`localStorage`). `SessionProvider` con `onAuthStateChange`, `getSession`, `signOut`, y derivación de `tenantId` desde `app_metadata.tenant_id`. Guards de redirección reutilizando la lógica pura de `authGuard.ts`.
- **Rationale**: Mismo comportamiento validado en `@foundly/mobile/src/shared/auth/session-context.tsx` y `supabase.ts`. Elimina `@supabase/ssr`, cookies y middleware.
- **Alternatives considered**: Cookies `httpOnly` vía BFF (rechazado: reintroduce servidor); storage seguro propio (innecesario en web; móvil usa SecureStore por plataforma).

## R5. Transporte GraphQL

- **Decision**: Reutilizar `graphql-request` y la forma de `shared/api/client.ts`: `apiRequest(document, variables, { token })`, `API_REQUEST_TIMEOUT_MS` (10 s) con `AbortSignal.timeout`, `ActionResult<T>`, `mapErrorCode` y `error-surface`. Añadir `emitUnauthenticated()` al detectar `UNAUTHENTICATED` para disparar el flujo global de sesión expirada. El token se obtiene de la sesión Supabase vigente, nunca de cookies de servidor.
- **Rationale**: Minimiza cambios, conserva tipado codegen y el mapeo de errores ya probado. El endpoint pasa a `import.meta.env.VITE_API_URL` + `/graphql`.
- **Alternatives considered**: Apollo Client (pesado, no usado en el repo); `fetch` manual (pierde tipado y manejo de errores de `graphql-request`).

## R6. Capa de datos por módulo: `services.ts` + `hooks.ts`

- **Decision**: Cada módulo expone `services.ts` (validación Zod + mapeo DTO→dominio + llamada a `apiRequest`) y `hooks.ts` (`useQuery`/`useMutation`, claves e invalidación). Los componentes no llaman al transporte; usan hooks. Este es el patrón de `apps/mobile/src/modules/team/`.
- **Rationale**: Centraliza validación y mapeo (decisión del usuario), evita duplicación en componentes y sustituye `actions.ts` sin introducir una capa de servidor.
- **Alternatives considered**: Hooks llamando documentos codegen directamente (rechazado por repetir mapeos); mantener `actions.ts` como wrapper (capa sin valor en cliente).
- **Nota de reutilización (§5.VII)**: los mappers y schemas existentes se trasladan/mueven, no se reescriben desde cero. Las claves de caché se definen canónicamente en `shared/api/query-client.ts` para evitar duplicación entre módulos.

## R7. Onboarding seguro: nueva mutación en `apps/api`

- **Decision**: Nueva mutación GraphQL `registerBusiness(input)` en un módulo `onboarding` de `apps/api`. El backend:
  1. Crea el usuario con Supabase **Admin** (`service role`, `email_confirm: true`).
  2. Crea el tenant (reutilizando `TenantsService.create`).
  3. Vincula `tenant_id` en `app_metadata` vía `auth.admin.updateUserById` (merge, sin sobrescribir metadatos existentes).
  4. Devuelve `{ tenantId }`.
  El cliente, tras el éxito, inicia sesión con email/contraseña (`signInWithPassword`).
- **Rationale**: Mantiene el `service role` fuera del navegador (FR-019/FR-020), hace la operación atómica y evita depender de que la confirmación de email esté desactivada. Reutiliza la lógica de creación de tenant existente.
- **Alternatives considered**: Cliente hace `signUp` y luego una mutación autenticada de vinculación (rechazado: falla si hay confirmación de email y separa pasos no atómicos); Edge Function (rechazado: añade otra plataforma; el API ya es el backend canónico).
- **Config nueva en API**: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server-only).

## R8. Despliegue estático y CORS

- **Decision**: Build estático servido con fallback SPA (todas las rutas → `index.html`), manteniendo la zona `/book` en `vercel.json`. Añadir los orígenes de la SPA a `CORS_ORIGINS` en `apps/api`.
- **Rationale**: Requisito FR-032 y FR-029. La API ya valida orígenes por allowlist (`apps/api/src/main.ts`).
- **Alternatives considered**: Node server para servir estáticos (innecesario); hash routing (rechazado: rompe URLs actuales y SEO básico).

## R9. Metadatos y manifiesto

- **Decision**: `react-helmet-async` (`HelmetProvider`) con un componente `PageMeta` por ruta; `manifest.webmanifest` estático en `public/`; favicons existentes.
- **Rationale**: Cubre títulos/metadatos por ruta en SPA (decisión del usuario). Sin SSR no hay `Metadata` de Next.
- **Alternatives considered**: Hook manual de `document.title` (más limitado para OG/meta); prerender (fuera de alcance).

## R10. Imágenes

- **Decision**: Sustituir `next/image` por `<img>` (o un componente `AppImage` ligero con `loading="lazy"` y dimensiones) en los 4 puntos de uso.
- **Rationale**: Elimina la dependencia de Next sin introducir infraestructura nueva. No hay optimización server-side en SPA.
- **Alternatives considered**: `vite-imagetools`/servicio de imágenes (evolución futura); mantener Next solo por imagen (descartado).

## R11. Integración con paquetes del monorepo (Vite + pnpm)

- **Decision**: Consumir `@foundly/ui` (fuente TS) y `@foundly/database/categories` directamente. En `vite.config.ts`: `resolve.dedupe` para `react`, `react-dom`, `@emotion/react`, `@emotion/styled`, `@mui/material`, `@mui/icons-material`, y `optimizeDeps`/`ssr.noExternal` no aplica. Importar solo el subpath `@foundly/database/categories` (nunca el índice raíz que instancia Prisma).
- **Rationale**: Evita duplicados de React/Emotion y errores de contexto MUI; evita empaquetar Prisma en el navegador.
- **Alternatives considered**: Pre-bundle de paquetes (complejidad extra); copiar componentes del design system (prohibido por §5.VII).

## R12. Estrategia de pruebas

- **Decision**:
  - Unitarias: servicios (validación/mappers), utils y schemas (Vitest).
  - Componentes: RTL con harness de providers (QueryClient + Session mock + Theme + Router).
  - Integración de hooks: `QueryClientProvider` con transporte mockeado.
  - E2E: Playwright para login, panel, portal/reserva y onboarding; accesibilidad con `vitest-axe`.
  - Reescribir los 14 `actions.test.ts` como `services.test.ts` y los 17 mocks de `next/*` como mocks de React Router/`react-helmet`.
- **Rationale**: Conserva la cobertura y los gates existentes adaptándolos a la nueva arquitectura.
- **Alternatives considered**: Eliminar tests de acciones (rechazado: pérdida de cobertura); snapshot tests masivos (bajo valor).

## R13. Enmienda de gobernanza

- **Decision**: Incluir en la fase de implementación (previa al código) una enmienda documentada:
  - `specs/business-model.md`: arquitectura de Book → SPA React.
  - `constitution.md`: MAJOR (stack §3; retirar §5.II/§5.V; reescribir §5.VI; actualizar §7).
  - `specs/architecture.md`: topología, build/salida, env `VITE_*`, CORS, flujo de onboarding.
  - `code-rules.md`: reglas de Next/RSC/actions → reglas SPA/services/hooks.
- **Rationale**: Constitución §1 y §9 exigen aprobación y plan de migración para cambios incompatibles. Sin esto, el gate queda bloqueado.
- **Alternatives considered**: Implementar y documentar después (rechazado: viola la jerarquía de autoridad).

## R14. Mapeo de variables de entorno

| Antes (Next) | Después (SPA) | Ámbito |
|---|---|---|
| `API_URL` | `VITE_API_URL` | Público (URL base del API) |
| `NEXT_PUBLIC_SUPABASE_URL` | `VITE_SUPABASE_URL` | Público |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` | Público |
| `SUPABASE_SERVICE_ROLE_KEY` (book) | `SUPABASE_SERVICE_ROLE_KEY` en `apps/api` | Secreto de servidor |
| `NEXT_PUBLIC_API_URL` (diagnóstico) | `VITE_API_URL` (mismo valor) | Público |
| `API_REQUEST_TIMEOUT_MS` | `VITE_API_REQUEST_TIMEOUT_MS` (opcional) | Público |

## R15. Rutas y redirecciones heredadas

- **Decision**: Tabla canónica en `contracts/routes.contract.md`. `/directorio → /negocios`, `/register → /onboarding`, `/admin → /admin/agenda`, `/admin/profile → /admin/configuracion?tab=perfil`, `* → 404`.
- **Rationale**: FR-002/FR-003; conserva enlaces compartidos y hábitos de navegación.

## R16. Riesgos residuales y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pérdida de SEO por SPA | Helmet + manifiesto; evolución futura a prerender (fuera de alcance). |
| Token en `localStorage` (XSS) | CSP, sanitización, sin `dangerouslySetInnerHTML`; revisión de seguridad en quickstart. |
| Caché tras logout/cambio de sesión | `queryClient.clear()` en `signOut` y evento de no autenticado. |
| Deduplicación de React/Emotion en monorepo | `resolve.dedupe` en Vite. |
| Import accidental de Prisma en cliente | Regla de lint/import permitido solo `@foundly/database/categories`. |
| CORS mal configurado | Checklist de despliegue con orígenes por entorno. |
