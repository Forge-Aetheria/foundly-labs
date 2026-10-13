# apps/book — Foundly Book

Aplicación SaaS de **gestión de agendas, servicios, profesionales y citas** (Next.js / React 19).

## Rutas

La app se expone bajo el prefijo público `/book` (multi-zone de `vercel.json`); en local las rutas son las internas:

| Público            | Interna         | Superficie                                                        |
| ------------------ | --------------- | ----------------------------------------------------------------- |
| `/book`            | `/`             | Landing informativa del producto (features + CTA a registro)      |
| `/book/onboarding` | `/onboarding`   | Wizard de registro de negocio en 3 pasos (cuenta · negocio · setup) |
| `/book/login`      | `/login`        | Inicio de sesión del propietario (email + contraseña)             |
| `/book/admin/*`    | `/admin/*`      | Dashboard privado (Drawer shell, agenda / servicios / disponibilidad · equipo / galería / perfil · seguridad) |
| `/book/<slug>`     | `/<slug>`       | Portal público de reservas de cada negocio (guest booking)        |

## Superficies y flujos

- **Onboarding**: el wizard crea un negocio (`Tenant`) + su cuenta (`User`) y provisiona los defaults
  (duración por defecto, horario general, recurso, reglas de disponibilidad y servicio principal).
  El borrador del wizard es local-first (sobrevive recarga/sin conexión) y `createBusiness` es
  idempotente por `draftId`.
- **Portal público (mini-sitio)**: `getPublicBusiness(slug)` solo expone negocios `active` con su perfil
  completo (identidad, bio, contacto y redes, servicios con tarifa vigente, especialistas y políticas); el contenido
  se organiza en pestañas (Servicios · Equipo · Información) y el flujo de reserva guiado
  (especialista → fecha/franjas → datos → confirmación) reutiliza el motor de disponibilidad
  (`domain/availability`) y crea citas `origin: 'online'`.
- **Storefront admin (equipo / galería / perfil)**: el panel gestiona exactamente el contenido que
  muestran las secciones públicas del mini-sitio — profesionales (`Resource`), fotos (`Tenant.gallery`) y
  el perfil (bio, logo, teléfono, redes y dirección). Las vistas usan `@foundly/ui` y mutan el mismo seam
  de datos que lee `getPublicBusiness`, por lo que cualquier cambio queda reflejado en `/book/<slug>`.
  `/admin/staff` ("Equipo y Especialistas") muestra el roster como un grid de tarjetas glassmorphism con
  badges de servicios y estado, y su modal valida nombre/cargo (requeridos), avisa si no hay servicios
  asignados y deja activar/desactivar cada profesional (`005-staff-management`).
  `/admin/gallery` ("Galería") gestiona el portfolio real: grid de tarjetas glass con título, descripción
  y categoría (Local/Trabajos/Equipo), alta validando URL, lightbox de previsualización y borrado con
  confirmación; todo se persiste en el backend y se refleja en `#galeria` del mini-sitio (`013-gallery-integration`).
  `/admin/profile` ("Perfil y Acerca de") edita y **persiste** la identidad del comercio (nombre, categoría,
  URL pública con validación, logo/portada con preview), contacto y redes, la bio y las políticas de
  reserva/cancelación, más un resumen del horario; todo se refleja en el header, la tarjeta sticky,
  «Acerca de», «Dirección y horarios» y el footer público (`014-profile-policies-reviews`). El mini-sitio
  muestra además las reseñas y el rating reales, con formulario público para dejar una reseña.
- **Dashboard privado**: todas las lecturas se aislan por tenant (el `tenantId` viene de la sesión,
  nunca de la URL); sin sesión válida `/admin/*` redirige a `/login` (una cuenta autenticada pero sin
  negocio vinculado se envía a `/onboarding`).

## Comandos

| Comando                            | Descripción                    |
| ---------------------------------- | ------------------------------ |
| `npm run dev -w @foundly/book`     | Dev server (puerto 3001)       |
| `npm run build -w @foundly/book`   | Build de producción            |
| `npm run typecheck -w @foundly/book` | `tsc --noEmit`               |
| `npm run test -w @foundly/book`    | Vitest + RTL + vitest-axe      |
| `npm run codegen -w @foundly/book` | Regenerar el cliente GraphQL   |
| `npm run lint`                     | ESLint (raíz)                  |

## Conexión con la API (feature `008-api-integration-catalog-sync`)

La app consume `apps/api` (GraphQL en `POST {API_URL}/graphql`) para el **Admin Catalog** (servicios y
equipo) y la **tenancy** (onboarding → creación de negocio + vinculación `tenant_id`). Configuración:

1. Copia `.env.example` → `.env` en `apps/api`, `packages/database` y `apps/book` (valores por entorno,
   nunca versionados; ver `specs/architecture.md` §3.1).
2. API: levanta Postgres/Supabase (`DATABASE_URL`), migra (`npm run db:migrate`), y arranca con
   `npm run dev -w @foundly/api` (puerto 3002). `CORS_ORIGINS` incluye `http://localhost:3001`.
3. Book: `API_URL` apunta a la API y las variables `NEXT_PUBLIC_SUPABASE_*` + `SUPABASE_SERVICE_ROLE_KEY`
   habilitan la sesión Supabase y el binding de negocio.
4. Sesión: `src/middleware.ts` refresca las cookies de Supabase; `getEffectiveSession()` (server-only)
   resuelve la identidad (claims `sub` + `app_metadata.tenant_id`).

Sin entorno remoto configurado, `signIn`/`signOut` fallan **visiblemente** (la autenticación es solo del
proveedor; no hay seam local). Todas las secciones del panel (servicios, equipo, disponibilidad, bloqueos,
agenda, galería, perfil, políticas y reseñas) se sirven desde la API. La disponibilidad semanal y sus bloqueos
se aplican también al cálculo de franjas del booking público. Escenarios de validación en el `quickstart.md`
de cada spec.

## Autenticación (feature `009-admin-auth`)

Ciclo de acceso completo del propietario:

- **Login**: `/login` autentica con email + contraseña (`signIn`) vía **Supabase Auth** únicamente
  (`signInWithPassword`); sin `NEXT_PUBLIC_SUPABASE_*` no hay sesión posible (feature `010` eliminó el
  modo local/cookie).
- **Logout**: la acción `signOut` (botón en el footer del panel) cierra la sesión y redirige a `/login`.
- **Protección de rutas**: `src/middleware.ts` redirige `/admin/*` sin sesión a `/login` y `/login` con
  sesión a `/admin/agenda`; las guardas de servidor (layout admin, `getAdminTenantId`) re-verifican.
- **Enlace público**: el panel muestra un botón "Ver página pública" con la URL del `slug` del negocio.
- **Cambio de contraseña**: `/admin/seguridad` actualiza la contraseña exigiendo la actual (re-auth en live).

`getEffectiveSession()` (server-only) resuelve la sesión **solo** desde los claims live de Supabase
(`sub` + `app_metadata.tenant_id`); el store en memoria **no** autentica por sí solo y la cookie local
fue eliminada. Detalles: `specs/book/009-admin-auth/` y `specs/book/010-remove-local-store/`.

## Errores y sesión (feature `012-centralized-api-errors`)

Los errores de la API ya no se pintan crudos en las vistas. Un clasificador central
(`shared/api/error-surface.ts`) decide el tratamiento por código: **sesión** (`UNAUTHENTICATED`) → limpieza
de sesión y redirección global a `/login?reason=session-expired` (ruta `app/auth/session-expired`); **transitorio**
(conexión/recurso ausente) → modal limpio (`ApiErrorDialog`); **inline** (validación/conflicto) → feedback en el
formulario. Los mensajes se localizan en español; nunca se muestra el texto del proveedor. El transporte
autenticado (`shared/api/admin-request.ts`, `apiRequestAdmin`) inyecta el bearer y trata un token ausente o
rechazado como problema de sesión. Al iniciar sesión se valida además que la API acepta el token (query
`Viewer`), por lo que un desajuste de autenticación se ve en `/login`, no repartido por el panel. Detalle:
`specs/book/012-centralized-api-errors/` y `specs/api/011-jwt-algorithm-support/`.

## Dominio y datos

- **Estructura modular**: `src/app/` es la capa delgada de rutas App Router (solo renderiza `<Modulo>View`); la lógica vive en `src/modules/<modulo>/` (`components/`, `dialogs/`, `hooks/`, `utils/`, `tests/`, `<Modulo>View.tsx`) y lo reutilizable en `src/shared/` (types, utils, componentes, `infra/` con el seam de sesión/results, `tenancy/`).
- **Tenancy y agendas**: los tipos y reglas puras son `shared/types/` (tenancy, appointments, availability) y `shared/utils/` (slug, provisioning, motor de disponibilidad). Lógica pura, sin framework.
- **Persistencia NO definida**: todo vive en el store en memoria (`src/shared/infra/store.ts`), el único
  seam que debe reemplazarse cuando `specs/architecture.md` ratifique almacenamiento.

## Specs

- `specs/book/001-book-admin-panel/` — panel de administración base (agenda, servicios, disponibilidad + storefront: equipo, galería, perfil).
- `specs/book/002-onboarding-and-tenant-flow/` — onboarding, tenancy y rutas.
- `specs/book/003-public-portal-minisite/` — mini-sitio público (perfil, galería, reseñas, reserva guiada).
- `specs/book/004-book-brand-canvas/` — identidad visual y canvas de marca del módulo.
- `specs/book/005-staff-management/` — equipo y especialistas.
- `specs/book/006-gallery-management/` — galería del negocio.
- `specs/book/007-business-profile/` — perfil público, contacto y políticas.
- `specs/book/008-api-integration-catalog-sync/` — integración front-to-back con la API y catálogo admin.
- `specs/book/009-admin-auth/` — autenticación admin, protección de rutas, enlace público y cambio de contraseña.
- `specs/book/010-remove-local-store/` — eliminación del store en memoria; todo servido desde la API/DB (o estado vacío limpio).
- `specs/book/011-module-data-layer/` — capa de datos por módulo (`actions.ts`/`hooks.ts`), codegen y disolución de `shared/infra`.
- `specs/book/012-centralized-api-errors/` — manejo centralizado de errores de API, expiración de sesión global y consistencia login↔API.
- `specs/book/013-gallery-integration/` — galería conectada al backend (admin `/admin/gallery` + `#galeria` del mini-sitio).
- `specs/book/014-profile-policies-reviews/` — perfil editable + políticas y reseñas reales (admin `/admin/profile` + mini-sitio).
- `specs/book/015-availability-time-blocks/` — bloqueos de disponibilidad reales (admin `/admin/availability`) y su exclusión del booking público.
- `specs/api/012-gallery-management/` — superficie GraphQL de la galería (lectura pública + add/remove autenticados y por tenant).
- `specs/api/013-profile-policies-reviews/` — superficie GraphQL del perfil (update autenticado) y de reseñas (lectura + alta públicas).
- `specs/api/014-availability-time-blocks/` — superficie GraphQL de bloqueos de disponibilidad (lectura pública + add/remove autenticados y por tenant).

> Pendiente: paginación/windowing de la agenda (T039 de `001`) y suite Playwright E2E (`e2e/`).