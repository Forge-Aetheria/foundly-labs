# Contract — Rutas de la SPA

**Objetivo**: conservar URLs, parámetros, guards y redirecciones equivalentes a la app Next.js actual (spec FR-002/FR-003/FR-004).

## Tabla de rutas

| Ruta | Vista / componente | Guard | Params / query | Notas |
|---|---|---|---|---|
| `/` | `LandingView` | pública | — | Contenido estático de producto |
| `/negocios` | `DirectoryView` | pública | `q?` | Directorio |
| `/businesses` | `DirectoryView` | pública | `q?` | Alias de `/negocios` |
| `/:tenantSlug` | `PublicBookingView` | pública | `tenantSlug` | Portal público del negocio |
| `/login` | `LoginView` | solo-anónimo | `reason?` | Autenticado → `/admin/agenda` |
| `/register` | — | pública | `email?` | Redirect a `/onboarding` (conserva `email`) |
| `/onboarding` | `OnboardingView` | pública | `email?` | Alta de negocio |
| `/privacy` | `PrivacyPage` | pública | — | Estática |
| `/terms` | `TermsPage` | pública | — | Estática |
| `/admin` | — | requiere-auth+tenant | — | Redirect a `/admin/agenda` |
| `/admin/agenda` | `AgendaView` | requiere-auth+tenant | `from?`, `to?` | Panel |
| `/admin/availability` | `AvailabilityView` | requiere-auth+tenant | — | Panel |
| `/admin/services` | `ServicesView` | requiere-auth+tenant | — | Panel |
| `/admin/staff` | `StaffView` | requiere-auth+tenant | — | Panel |
| `/admin/gallery` | `GalleryView` | requiere-auth+tenant | — | Panel |
| `/admin/profile` | — | requiere-auth+tenant | — | Redirect a `/admin/configuracion?tab=perfil` |
| `/admin/configuracion` | `ConfigurationView` | requiere-auth+tenant | `tab?` | Panel |
| `/admin/reviews` | `ModerationView` | requiere-auth+tenant | — | Panel |
| `/admin/notificaciones` | `NotificationsView` | requiere-auth+tenant | — | Panel |
| `/admin/seguridad` | `SecurityView` | requiere-auth+tenant | — | Panel |
| `/admin/soporte` | `SupportView` | requiere-auth+tenant | — | Panel |
| `/admin/acerca` | `AboutView` | requiere-auth+tenant | — | Panel |
| `/super-admin` | `SuperAdminView` | requiere-auth | `q?`, `page?` | Rol de plataforma validado por API |
| `*` | `NotFoundPage` | pública | — | 404 |

## Redirecciones heredadas

| Origen | Destino | Condición |
|---|---|---|
| `/directorio` | `/negocios` | siempre |
| `/register` | `/onboarding` | conserva `?email=` |
| `/admin` | `/admin/agenda` | autenticado con tenant |
| `/admin/profile` | `/admin/configuracion?tab=perfil` | autenticado con tenant |

## Reglas de guard

- **pública**: accesible sin sesión.
- **solo-anónimo**: si hay sesión autenticada → `/admin/agenda`.
- **requiere-auth**: sin sesión → `/login`; durante `loading` mostrar skeleton, nunca contenido protegido.
- **requiere-auth+tenant**: sin sesión → `/login`; autenticado sin `tenantId` → `/onboarding`.
- Durante el estado `loading` de sesión no se renderiza contenido protegido ni se redirige prematuramente.
- El retorno tras login debe respetar la ruta solicitada (deep link) cuando sea una ruta protegida válida; por defecto `/admin/agenda`.

## 404 y errores de ruta

- Ruta desconocida → página 404 con marca y enlace a inicio/login.
- Error de carga de una vista → estado de error recuperable, no pantalla en blanco.

## Metadatos

- Cada ruta define título y descripción vía `PageMeta` (`react-helmet-async`).
- Manifest e iconos servidos desde `public/` y referenciados en `index.html`.
