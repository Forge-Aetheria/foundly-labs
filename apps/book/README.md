# apps/book — Foundly Book

Aplicación SaaS de **gestión de agendas, servicios, profesionales y citas** (React 19 + Vite, SPA cliente puro).

## Rutas

La app es una SPA con fallback de rutas y se expone bajo el prefijo público `/book` (rewrite de `vercel.json`); en local las rutas son las internas:

| Público            | Interna         | Superficie                                                        |
| ------------------ | --------------- | ----------------------------------------------------------------- |
| `/book`            | `/`             | Landing informativa del producto (features + CTA a registro)      |
| `/book/onboarding` | `/onboarding`   | Wizard de registro de negocio en 3 pasos (cuenta · negocio · setup) |
| `/book/login`      | `/login`        | Inicio de sesión del propietario (email + contraseña)             |
| `/book/admin/*`    | `/admin/*`      | Dashboard privado (Drawer shell, agenda / servicios / disponibilidad · equipo / galería / perfil / reseñas · seguridad) |
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

| Comando                                | Descripción                    |
| -------------------------------------- | ------------------------------ |
| `pnpm --filter @foundly/book dev`      | Dev server Vite (puerto 3001)  |
| `pnpm --filter @foundly/book build`    | Build de producción            |
| `pnpm --filter @foundly/book typecheck`| `tsc --noEmit`                 |
| `pnpm --filter @foundly/book test`     | Vitest + RTL + vitest-axe      |
| `pnpm --filter @foundly/book codegen`  | Regenerar el cliente GraphQL   |
| `pnpm lint`                            | ESLint (raíz)                  |

## Conexión con la API (feature `024-react-spa-migration`)

La SPA consume `apps/api` (GraphQL en `POST {VITE_API_URL}/graphql`) para el **Admin Catalog** (servicios y
equipo), la **tenancy** y la sesión. Configuración:

1. Copia `apps/book/.env.example` → `apps/book/.env` y `apps/api/.env.example` → `apps/api/.env`
   (valores por entorno, nunca versionados; ver `specs/architecture.md` §3.1).
2. API: levanta Postgres/Supabase (`DATABASE_URL`), migra (`pnpm db:migrate`) y arranca con
   `pnpm --filter @foundly/api dev` (puerto 3002). `CORS_ORIGINS` incluye `http://localhost:3001`.
3. Book: `VITE_API_URL`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` son las únicas variables del
   cliente. No hay `SUPABASE_SERVICE_ROLE_KEY` en el bundle: el alta de negocio se ejecuta en la API.
4. Sesión: `@supabase/supabase-js` persiste la sesión en `localStorage`; `SessionProvider`
   (`shared/auth/session-context.tsx`) restaura la sesión y deriva `tenant_id` de `app_metadata`.

Sin entorno remoto configurado, `signIn`/`signOut` fallan **visiblemente** (la autenticación es solo del
proveedor; no hay seam local). Todas las secciones del panel (servicios, equipo, disponibilidad, bloqueos,
agenda, galería, perfil, políticas y reseñas) se sirven desde la API. La disponibilidad semanal y sus bloqueos
se aplican también al cálculo de franjas del booking público. Escenarios de validación en el `quickstart.md`
de cada spec.

## Autenticación (features `009-admin-auth` y `024-react-spa-migration`)

Ciclo de acceso completo del propietario:

- **Login**: `/login` autentica con email + contraseña (`signIn`) vía **Supabase Auth** únicamente
  (`signInWithPassword`); sin `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` no hay sesión posible.
- **Logout**: `signOut` cierra la sesión de Supabase, limpia la caché de TanStack Query y redirige a `/login`.
- **Protección de rutas**: guards de React Router (`RequireAuth`, `RequireTenant`, `RequireAnonymous`) y
  `SessionProvider`; no hay middleware ni cookies de servidor. El panel resuelve el workspace con
  `myBusiness` y el `tenantId` de la sesión es solo una comprobación de UX.
- **Enlace público**: el panel muestra un botón "Ver página pública" con la URL del `slug` del negocio.
- **Cambio de contraseña**: `/admin/seguridad` actualiza la contraseña exigiendo la actual (re-auth).

La sesión vive en `localStorage` y se restaura con `getSession`/`onAuthStateChange`; un `UNAUTHENTICATED`
de la API dispara limpieza de sesión y redirección global. Detalles: `specs/book/009-admin-auth/`,
`specs/book/024-react-spa-migration/` y `specs/api/021-supabase-auth-tenant-hardening/`.

## Errores y sesión (feature `012-centralized-api-errors`)

Los errores de la API ya no se pintan crudos en las vistas. Un clasificador central
(`shared/api/error-surface.ts`) decide el tratamiento por código: **sesión** (`UNAUTHENTICATED`) → limpieza
de sesión y redirección global a `/login` con motivo de expiración; **transitorio** (conexión/recurso ausente)
→ modal limpio (`ApiErrorDialog`); **inline** (validación/conflicto) → feedback en el formulario. Los mensajes
se localizan en español; nunca se muestra el texto del proveedor. El transporte autenticado
(`shared/api/authed-request.ts`, `apiRequestAuthed`) obtiene el token vigente de Supabase y lo inyecta por
petición. Al iniciar sesión se valida además que la API acepta el token (query `Viewer`), por lo que un
desajuste de autenticación se ve en `/login`, no repartido por el panel. Todas las llamadas salientes aplican
un **timeout acotado** (`VITE_API_REQUEST_TIMEOUT_MS`, por defecto 10 s) para que un API o proveedor lento no
cuelgue la UI. Detalle: `specs/book/012-centralized-api-errors/` y `specs/api/011-jwt-algorithm-support/`.

## Notificaciones, moderación y UX del panel (feature `016-admin-ux-hardening`)

- **Toasts globales**: `shared/components/Toaster.tsx` (`ToastProvider` + `useToast`) ofrece avisos flotantes con
  colores semánticos (verde éxito, amarillo validación, azul info, rojo error), auto-ocultado, descartables y
  accesibles (`aria-live`); montado en el layout raíz. Sin dependencias nuevas.
- **Sin doble envío**: `shared/hooks/useAsyncAction` estandariza el estado pendiente; los modales de galería,
  equipo, servicios y agenda deshabilitan el submit mientras hay una petición en vuelo, cierran al éxito y
  revalidan la lista (`router.refresh()`).
- **Moderación de reseñas** (`/admin/reviews`): lista las reseñas del negocio (cualquier estado), marca las
  pendientes y permite aprobar/rechazar (idempotente) o eliminar con confirmación; solo las aprobadas se publican.
  Backend: `specs/api/015-review-moderation`.
- **Reglas de imagen del perfil**: el logo se recomienda cuadrado (1:1, 512×512) y la portada banner (3:1, 1200×400);
  cuando la imagen es medible se bloquea el guardado si no cumple el aspecto, y si no es medible se muestra la guía.
  El logo y la portada se editan en **tarjetas verticales** (previsualización arriba, zona de carga + campo URL
  debajo) con **subida directa de archivo** (`shared/components/ImageUploadField`, features `021`/`022`); el resumen
  de "Horario de atención" se retiró de este formulario (se gestiona en `/admin/availability`).
- **Favicons y manifest**: `apps/book/public/` incluye `favicon.ico` (16/32/48), `favicon-16x16.png`,
  `favicon-32x32.png`, `apple-touch-icon.png` (180) e `icon-192/512.png`; `public/manifest.webmanifest` publica
  el Web App Manifest (`theme_color #6c5ce7`, `background_color #faf8ff`) y `index.html` lo enlaza.
  La landing (`apps/landing`) añade `favicon.ico` + `apple-touch-icon.png` junto a su `favicon.svg`.
- **Acciones antes huérfanas**: `/admin/services` crea/edita/elimina servicios de verdad (antes era un placeholder)
  y `/admin/agenda` "Nueva cita" compone un instante ISO con offset (antes fallaba la validación y no persistía).

## Reserva con adelanto, calendario y control de agenda (feature `017-advance-payments-booking`)

- **Configuración de pagos** (`/admin/configuracion`): el módulo `configuration` muestra una **tarjeta por método**
  con un **modal estructurado** (feature `022`). El conjunto de tipos es cerrado: **Pago Móvil, Binance Pay,
  Zelle, Transferencia y Efectivo**; cada tipo expone sus campos (Cédula/RIF, Teléfono, Banco, Titular, Pay ID,
  Email, Cuenta) y los guarda como `details` estructurado + `title` + `instructions` + activo. Solo los métodos
  activos se ofrecen en la reserva pública. Backend: `specs/api/016-advance-payments` (ampliado).
- **Horario y bloqueos** (`/admin/availability`): el horario semanal se edita en **una tarjeta por día**
  (toggle + inputs de hora compactos) y los bloqueos en una **tarjeta de formulario** con selector
  "Rango de horas"/"Días completos", campos etiquetados y lista de bloqueos como tarjetas (feature `022`).
  Spec: `specs/book/022-admin-payments-schedules-refactor`.
- **Calendario real**: el paso "Fecha y hora" del booking público (`dialogs/CalendarStep.tsx`) sustituye las
  píldoras de fecha por un calendario mensual real; al elegir un día se muestran sus huecos debajo y la
  disponibilidad se consulta por todo el mes visible.
- **Paso de adelanto obligatorio**: si el servicio tiene `requiresAdvance`, el flujo inserta un paso
  (`dialogs/PaymentStep.tsx`) donde el cliente elige método, importe, referencia y **sube el comprobante**.
  El importe se precarga según la regla (importe fijo o porcentaje) y el servidor vuelve a validarlo.
- **Subida del comprobante (Supabase Storage)**: `public-booking/utils/uploadProof.ts` sube la captura al
  bucket **`payment-proofs`** (PNG/JPG/WEBP, máx. 5 MB) y devuelve su URL pública. **Prerrequisito de operación**:
  crear el bucket `payment-proofs` (lectura pública) con una policy de `INSERT` para el booking. El API solo
  persiste y valida la URL.
- **Agenda por rango**: `/admin/agenda` usa dos inputs `desde`/`hasta` (por defecto hoy → último día del mes
  actual) y consulta la agenda autenticada por rango. El detalle permite **Aceptar** (→ Confirmada),
  **Rechazar** (→ Cancelada) y **Reagendar**, y muestra el **adelanto** recibido (método, importe, referencia y
  previsualización del comprobante con enlace de respaldo). Cada acción registra una notificación al cliente
  (canal simulado).
- **Regla de adelanto por servicio**: `/admin/services` permite marcar un servicio como "Requiere adelanto"
  (importe fijo o porcentaje) y muestra el adelanto en la tabla.

## Dominio y datos

- **Estructura modular**: `src/router.tsx` es la capa delgada de rutas React Router (solo renderiza `<Modulo>View`); la lógica vive en `src/modules/<modulo>/` (`components/`, `components/dialogs/`, `hooks.ts`, `services.ts`, `utils/`, `tests/`, `<Modulo>View.tsx`) y lo reutilizable en `src/shared/` (`api/`, `auth/`, `tenancy/`, types, utils, componentes).
- **Tenancy y agendas**: los tipos y reglas puras son `shared/types/` (tenancy, appointments, availability) y `shared/utils/` (slug, provisioning, motor de disponibilidad). Lógica pura, sin framework.
- **Persistencia**: PostgreSQL vía `apps/api` + Prisma (`packages/database`); la SPA no tiene store en memoria. Las lecturas/escrituras pasan por `services.ts` + `hooks.ts` y TanStack Query.

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
- `specs/book/016-admin-ux-hardening/` — toasts, estados de carga/anti-doble-envío, moderación de reseñas, reglas de imagen del perfil y activación de acciones huérfanas (servicios + nueva cita).
- `specs/book/017-advance-payments-booking/` — métodos de pago configurables, calendario real, paso de adelanto con subida de comprobante (Supabase Storage) y control de agenda por rango con accept/reject/reschedule.
- `specs/api/012-gallery-management/` — superficie GraphQL de la galería (lectura pública + add/remove autenticados y por tenant).
- `specs/api/013-profile-policies-reviews/` — superficie GraphQL del perfil (update autenticado) y de reseñas (lectura + alta públicas).
- `specs/api/014-availability-time-blocks/` — superficie GraphQL de bloqueos de disponibilidad (lectura pública + add/remove autenticados y por tenant).
- `specs/api/015-review-moderation/` — superficie GraphQL de moderación de reseñas (estado pending/approved/rejected, lectura admin y aprobar/rechazar/eliminar autenticados).
- `specs/api/016-advance-payments/` — métodos de pago por negocio, regla de adelanto por servicio, adelanto embebido en la cita y control de agenda autenticado (rango, accept/reject/reschedule + notificaciones).

> Pendiente: paginación/windowing de la agenda (T039 de `001`) y suite Playwright E2E (`e2e/`).