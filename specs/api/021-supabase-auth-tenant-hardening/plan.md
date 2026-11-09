# Implementation Plan: Cierre de Migración a Supabase Auth y Seguridad de Tenant

**Branch**: `021-supabase-auth-tenant-hardening` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/api/021-supabase-auth-tenant-hardening/spec.md`

## Summary

Cerrar la convivencia de dos sistemas de identidad en la API: se retira por completo el auth legado HMAC de Foundly Pass (`AuthService`, `GqlAuthGuard`, `PlanGuard`, `@UseAuth`, `@CurrentUser`, `@CurrentTenant`, `@RequirePlan`, `me`, `currentTenant`, `bookCapability` y `FOUNDLY_PASS_SECRET`) y se deja `SupabaseJwtGuard` + `@RequireAuth()` / `@AuthUser()` como único mecanismo protegido. En paralelo se elimina el consumo de la colección pública `tenants` desde `apps/book`: el workspace y el perfil se resuelven con la consulta autenticada `myBusiness`, cuyo alcance sale exclusivamente del `tenantId` verificado del JWT y que exige un negocio existente y operable. No hay cambios de esquema de base de datos ni nuevas dependencias.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict, sin `any`) sobre Node.js 20+; React 19 + Vite para `apps/book`; Expo/React Native para `apps/mobile`

**Primary Dependencies**: NestJS 11 + `@nestjs/graphql` (code-first SDL) + Apollo, `jose` (JWKS/ES256/RS256), Prisma 6 (`@foundly/database`), `graphql-request` + `graphql-codegen` (`typed-document-node`), TanStack Query 5

**Storage**: PostgreSQL vía Prisma; sin nuevas tablas, columnas ni migraciones. `Tenant.plan` se conserva como dato, pero deja de tener un consumidor de gating al retirarse `bookCapability`/`PlanGuard`.

**Testing**: Vitest en API (unitarios y e2e DB-free con `PrismaService`/`JWT_JWKS` sustituidos); Vitest + React Testing Library en Book; Jest en Mobile. Gates por workspace (`build`, `typecheck`, `lint`, `test`).

**Target Platform**: Servidor Node.js (API) y navegadores modernos (SPA Book); la app móvil solo se ve afectada por la regeneración de su snapshot GraphQL y la retirada de la operación `me` no usada.

**Project Type**: Monorepo — backend web service (`apps/api`) + SPA (`apps/book`) + app móvil (`apps/mobile`) + paquete de persistencia (`packages/database`).

**Performance Goals**: el workspace se resuelve en una sola operación autenticada por carga (`myBusiness`), sin listar ni transferir la colección completa de negocios; la comprobación de estado del negocio reutiliza la misma fila ya consultada.

**Constraints**: sin secretos en el repositorio; sin cambios de esquema; sin nuevas dependencias; errores de identidad estables (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`); el cliente nunca decide el negocio; no se rompen portal público, directorio ni reserva.

**Scale/Scope**: una retirada de módulo de auth, una limpieza de configuración, una consulta autenticada de workspace, dos consumidores (Book/Mobile) y sus snapshots codegen; sin impacto en el modelo de datos persistido.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
| --- | --- | --- |
| §1 Authority hierarchy / §2.III | La spec vive en `specs/api/021-…`, referencia `specs/business-model.md` y se subordina a los documentos globales | PASS |
| §2.III Single domain | La spec es del dominio `api`; los cambios de Book se documentan como contrato de consumidor y criterio de aceptación, sin crear una spec duplicada en `book` | PASS (note) |
| §5.I SDD | La implementación parte de esta spec y su plan aprobados | PASS |
| §5.IV Strict typing | Se eliminan tipos/guards legados sin introducir `any`; los nuevos mapeos usan codegen; los errores se tipan con `GraphQLError` | PASS |
| §5.VI Module data layer | Book mantiene `services.ts`/`hooks.ts`/`tenancy.graphql`; el cambio de consulta no lleva lógica a componentes ni crea DTOs manuales | PASS |
| §5.VII Reuse | Se reutilizan `myBusiness`, `TenantObject`, `mapTenant`, `SupabaseJwtGuard`, `AuthUser` y el transporte autenticado existentes; no se duplican consultas ni tipos | PASS |
| §3 Monorepo boundaries | No se añaden imports entre apps; `packages/*` no cambia; los snapshots SDL se actualizan desde la fuente de la API | PASS |
| §6 Design tokens | No hay cambios visuales; no aplica | PASS (N/A) |
| §7 Routes/naming | No se añaden rutas; los archivos retirados y los nuevos helpers siguen las convenciones existentes | PASS |
| code-rules §10 tests | API conserva `*.spec.ts` colocalizados; Book mantiene `tests/`; la migración global de tests de API sigue siendo un TODO separado y explícitamente fuera de alcance | PASS (note) |

No hay violaciones que justifiquen `Complexity Tracking`.

**Post-design re-check (Phase 1)**: PASS — el diseño no crea entidades persistidas, reutiliza la consulta autenticada existente, retira el mecanismo legado sin sustituto dual y mantiene el portal público intacto. La única nota de alcance es que el gating por licencia de módulo (`PlanGuard`) se retira junto con su único consumidor; no se reintroduce de forma implícita.

## Project Structure

### Documentation (this feature)

```text
specs/api/021-supabase-auth-tenant-hardening/
├── plan.md              # Este archivo
├── research.md          # Fase 0 — decisiones y alternativas
├── data-model.md        # Fase 1 — identidades, workspace y reglas de estado
├── contracts/
│   ├── auth-surface.contract.md       # Superficie GraphQL y errores de la API
│   └── book-workspace.contract.md     # Consumo del workspace autenticado en Book
├── quickstart.md        # Fase 1 — validación end-to-end
├── checklists/requirements.md
└── spec.md
```

### Source Code (repository root)

```text
apps/api/src/
├── schema.gql                                  # SDL regenerado sin me/currentTenant/bookCapability
├── modules/auth/
│   ├── auth.module.ts                          # solo SupabaseJwtGuard, JwtResolver, JWT_JWKS, SupabaseJwtService
│   ├── auth.errors.ts                          # NUEVO: unauthError/forbiddenError compartidos
│   ├── jwt.service.ts                          # sin cambios de contrato
│   ├── jwt.guard.ts                            # importa errores desde auth.errors
│   ├── jwt.decorators.ts                       # @RequireAuth/@AuthUser (sin cambios)
│   ├── jwt.resolver.ts                         # viewer (sin cambios)
│   ├── jwt.types.ts                            # AuthUser/ViewerObject (sin cambios)
│   ├── auth.context.ts                         # ELIMINAR (legado)
│   ├── auth.service.ts                         # ELIMINAR (HMAC)
│   ├── auth.guards.ts                          # ELIMINAR (GqlAuthGuard/PlanGuard)
│   ├── auth.decorators.ts                      # ELIMINAR (UseAuth/CurrentUser/CurrentTenant/RequirePlan)
│   ├── auth.resolver.ts                        # ELIMINAR (me/currentTenant/bookCapability)
│   ├── auth.types.ts                           # ELIMINAR (CurrentUser/CurrentTenant/BookCapability)
│   ├── auth.service.spec.ts                    # ELIMINAR
│   ├── auth.guards.spec.ts                     # ELIMINAR
│   └── auth.resolver.spec.ts                   # ELIMINAR
├── modules/subscription/subscription.guard.ts  # importa unauthError desde auth.errors
├── modules/platform/platform.service.ts        # importa unauthError/forbiddenError desde auth.errors
└── modules/tenants/
    ├── tenants.service.ts                      # findForOwner/updateProfile exigen negocio activo
    ├── tenants.resolver.ts                     # myBusiness se mantiene (@RequireAuth)
    └── *.spec.ts                               # cobertura de negocio activo/inactivo/inexistente

apps/book/src/
├── shared/tenancy/
│   ├── tenancy.graphql                         # -Tenants, +MyBusiness (y TenantBySlug público)
│   ├── queries.ts                              # getCurrentTenant() usa MyBusinessDocument
│   ├── adminWorkspace.ts                       # consume el workspace autenticado
│   └── tests/queries.test.ts                   # actualizado al contrato myBusiness
├── modules/profile/
│   ├── services.ts                             # getProfile() usa MyBusinessDocument (sin argumento de negocio)
│   ├── ProfileView.tsx                         # sin cambios funcionales; el tenantId solo actúa como clave de caché
│   └── tests/services.test.ts                  # actualizado
├── shared/api/generated.ts                     # regenerado por codegen (sin Tenants/me/...)
└── codegen.schema.gql                          # snapshot del SDL de la API actualizado

apps/mobile/src/modules/auth/auth.graphql       # ELIMINAR (declaraba `me`, sin uso)
apps/mobile/codegen.schema.gql                  # snapshot actualizado
apps/mobile/src/shared/api/generated.ts         # regenerado por codegen
apps/api/.env.example                           # sin FOUNDLY_PASS_SECRET
apps/api/.env                                   # sin FOUNDLY_PASS_SECRET (archivo local versionado)
render.yaml                                     # confirmar que no contiene el secreto
```

**Structure Decision**: La autoridad de identidad queda en `apps/api/src/modules/auth` (solo Supabase JWT). La resolución del workspace se centraliza en la consulta autenticada `myBusiness` del módulo `tenants`; Book la consume desde `shared/tenancy` y `modules/profile` con sus capas de datos existentes. No se crean módulos, paquetes ni rutas nuevas.

## Complexity Tracking

> No hay violaciones de la constitución que justificar.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
