# apps/book — Foundly Book

Aplicación SaaS de **gestión de agendas, servicios, profesionales y citas** (Next.js / React 19).

## Rutas

La app se expone bajo el prefijo público `/book` (multi-zone de `vercel.json`); en local las rutas son las internas:

| Público            | Interna         | Superficie                                                        |
| ------------------ | --------------- | ----------------------------------------------------------------- |
| `/book`            | `/`             | Landing informativa del producto (features + CTA a registro)      |
| `/book/onboarding` | `/onboarding`   | Wizard de registro de negocio en 3 pasos (cuenta · negocio · setup) |
| `/book/admin/*`    | `/admin/*`      | Dashboard privado (Drawer shell, agenda / servicios / disponibilidad · equipo / galería / perfil) |
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
  nunca de la URL); sin sesión válida `/admin/*` redirige a `/onboarding`.

## Comandos

| Comando                            | Descripción                    |
| ---------------------------------- | ------------------------------ |
| `npm run dev -w @foundly/book`     | Dev server (puerto 3001)       |
| `npm run build -w @foundly/book`   | Build de producción            |
| `npm run typecheck -w @foundly/book` | `tsc --noEmit`               |
| `npm run test -w @foundly/book`    | Vitest + RTL + vitest-axe      |
| `npm run lint`                     | ESLint (raíz)                  |

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

> Pendiente: paginación/windowing de la agenda (T039 de `001`) y suite Playwright E2E (`e2e/`).