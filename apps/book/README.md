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
  `/admin/gallery` ("Galería") gestiona el portfolio visual: grid de tarjetas glass con título, descripción
  y categoría (Local/Trabajos/Equipo), alta validando URL, lightbox de previsualización y borrado con
  confirmación; cualquier cambio se refleja al instante en `#galeria` del mini-sitio (`006-gallery-management`).
  `/admin/profile` ("Perfil y Acerca de") edita la identidad del comercio (nombre, categoría, URL pública con
  validación, logo/portada con preview), contacto y redes, la bio, las políticas de reserva/cancelación y un
  resumen del horario sincronizado con disponibilidad; todo se refleja en el header, la tarjeta sticky,
  «Acerca de», «Dirección y horarios» y el footer público (`007-business-profile`).
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
proveedor; no hay seam local). Las secciones aún no migradas al backend (galería, reseñas, políticas,
agenda/disponibilidad) siguen leyendo del store en memoria de forma transitoria; se migran en las fases
del feature `010-remove-local-store`. Escenarios de validación en el `quickstart.md` de la spec del feature.

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

> Pendiente: paginación/windowing de la agenda (T039 de `001`) y suite Playwright E2E (`e2e/`).