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

- Tenancy: `src/domain/tenancy` (tipos `Tenant`/`User`, reglas de slug, provisioning). Lógica pura, sin framework.
- Agendas/servicios/disponibilidad: `src/domain/appointments` y `src/domain/availability` (motor puro).
- **Persistencia NO definida**: todo vive en el store en memoria (`src/server/store.ts`), el único
  seam que debe reemplazarse cuando `specs/architecture.md` ratifique almacenamiento.

## Specs

- `specs/book/001-book-admin-panel/` — panel de administración base (agenda, servicios, disponibilidad + storefront: equipo, galería, perfil).
- `specs/book/002-onboarding-and-tenant-flow/` — onboarding, tenancy y rutas.
- `specs/book/003-public-portal-minisite/` — mini-sitio público (perfil, galería, reseñas, reserva guiada).
- `specs/book/004-book-brand-canvas/` — identidad visual y canvas de marca del módulo.

> Pendiente: paginación/windowing de la agenda (T039 de `001`) y suite Playwright E2E (`e2e/`).