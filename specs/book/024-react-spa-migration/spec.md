# Feature Specification: Migración de Foundly Book a una SPA React

**Feature Branch**: `024-react-spa-migration`

**Created**: 2026-11-08

**Status**: Draft

**Input**: Migrar `apps/book` de Next.js a una aplicación React puramente cliente. Eliminar Server Actions y las capas de servidor intermedias, consumir la API GraphQL directamente desde el navegador con documentos tipados por codegen, y reorganizar la capa de datos por módulo en `services.ts` (validación Zod + mapeo DTO → dominio) y `hooks.ts` con TanStack Query (`useQuery`/`useMutation`). El portal público también pasa a SPA. La vinculación de `tenant_id` en onboarding se mueve al backend `apps/api`. Sesión Supabase en `localStorage` (mismo comportamiento que `@foundly/mobile`).

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Dominio: `book`.

> **Gobernanza (resuelta 2026-11-08)**: esta feature cambia el stack ratificado de `apps/book` y `apps/store` (Next.js → React SPA) y elimina principios antes vinculantes (Server Components, Server Actions, §5.II, §5.V y §5.VI de la constitución). Las enmiendas ya se aplicaron y ratificaron:
>
> - `specs/business-model.md` v1.1.0 (§2 y §2.3/§2.4 — arquitectura de Book y Store).
> - `constitution.md` y `.specify/memory/constitution.md` v6.0.0 (MAJOR: §3, §5.II, §5.V, §5.VI, §7).
> - `specs/architecture.md` v2.0.0 (topología, build/salida, variables `VITE_*`, CORS, onboarding en API).
> - `code-rules.md` v3.0.0 (SPA React; retiradas las reglas RSC/Server Actions).
>
> Plan de migración y detalle: `specs/book/024-react-spa-migration/plan.md` (constitución §9).

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Autenticación y sesión en la SPA (Priority: P1)

Un usuario administrador inicia sesión, navega por rutas protegidas, cierra sesión y, si su sesión caduca, es devuelto al inicio de sesión con un mensaje claro. La sesión se conserva al recargar o abrir otra pestaña.

**Why this priority**: Es la puerta de entrada a todo el panel. Sin paridad de autenticación no hay producto utilizable.

**Independent Test**: Abrir la app sin sesión, intentar entrar a `/admin/agenda`, iniciar sesión, recargar, cerrar sesión y forzar una sesión expirada. Todo el flujo debe comportarse igual que antes de la migración.

**Acceptance Scenarios**:

1. **Given** un visitante sin sesión, **When** abre una ruta protegida, **Then** es redirigido a `/login` y no ve datos del panel.
2. **Given** credenciales válidas, **When** inicia sesión, **Then** accede al panel y la sesión persiste al recargar la página.
3. **Given** una sesión activa, **When** recarga una ruta profunda del panel, **Then** permanece autenticado y ve la misma sección.
4. **Given** una sesión activa, **When** cierra sesión, **Then** vuelve a `/login` y no puede acceder a rutas protegidas con el historial del navegador.
5. **Given** una sesión caducada o rechazada por la API, **When** realiza una operación, **Then** se limpia la sesión, se descarta la caché de datos y se le redirige a `/login` con el motivo de expiración.
6. **Given** un usuario autenticado, **When** intenta abrir `/login`, **Then** es redirigido a la vista por defecto del panel.

---

### User Story 2 - Operación completa del panel de administración (Priority: P1)

Un administrador gestiona agenda, disponibilidad, servicios, personal, galería, perfil, configuración, pagos, reseñas, notificaciones, seguridad, ayuda y acerca desde la SPA, con lecturas y escrituras contra la API tan fiables como antes.

**Why this priority**: Es el núcleo funcional del producto; cualquier regresión aquí bloquea el negocio.

**Independent Test**: Recorrer cada módulo del panel realizando al menos una lectura y una escritura, verificando estados de carga, errores y datos actualizados sin recargar la página.

**Acceptance Scenarios**:

1. **Given** el panel cargado, **When** el administrador abre cualquier módulo, **Then** ve los datos actualizados del tenant de su sesión.
2. **Given** un formulario válido, **When** lo envía, **Then** la mutación persiste en la API y la vista refleja el cambio sin recargar.
3. **Given** datos inválidos, **When** envía el formulario, **Then** ve errores de validación por campo y no se llama a la API.
4. **Given** una operación en curso, **When** pulsa de nuevo el botón, **Then** se evita el doble envío.
5. **Given** un error de permisos o de conflicto, **When** ocurre, **Then** ve un mensaje localizado y accionable, no el texto técnico del proveedor.
6. **Given** un cambio en un listado, **When** se completa la mutación, **Then** los listados dependientes y los contadores se actualizan de forma consistente.
7. **Given** el backend inaccesible o lento, **When** se agota el tiempo de espera, **Then** la UI muestra un estado de error recuperable sin bloquear la navegación.

---

### User Story 3 - Portal público, directorio y reserva de citas (Priority: P1)

Un visitante anónimo descubre negocios, abre el portal público de un negocio, consulta servicios y disponibilidad, reserva una cita, adjunta un comprobante de pago y envía una reseña, todo sin autenticarse.

**Why this priority**: Es la cara pública del producto y la fuente de nuevas reservas; una regresión afecta directamente a ingresos.

**Independent Test**: Recorrer `/`, `/negocios`, el portal de un negocio activo y completar una reserva con comprobante y reseña, sin sesión.

**Acceptance Scenarios**:

1. **Given** un visitante, **When** abre el directorio, **Then** ve negocios elegibles y puede filtrar por texto y categoría.
2. **Given** un enlace público válido, **When** abre el portal del negocio, **Then** ve servicios, horarios, profesionales, galería y reseñas del negocio.
3. **Given** un negocio inexistente, en borrador, suspendido o con página desactivada, **When** abre su enlace, **Then** ve el estado de indisponibilidad correspondiente sin errores técnicos.
4. **Given** un negocio activo, **When** completa el flujo de reserva, **Then** la cita se crea y se confirma al visitante.
5. **Given** una reserva que requiere anticipo, **When** adjunta un comprobante válido, **Then** se sube el archivo y la reserva queda registrada con la referencia.
6. **Given** un archivo inválido o demasiado grande, **When** intenta adjuntarlo, **Then** se rechaza con un mensaje claro y no se pierde el resto del formulario.
7. **Given** un visitante, **When** envía una reseña, **Then** queda registrada y visible según las reglas del negocio.

---

### User Story 4 - Alta de negocio con vinculación segura (Priority: P2)

Un nuevo propietario crea su cuenta y su negocio desde la SPA, y el sistema vincula su cuenta al negocio sin que el navegador manipule credenciales administrativas.

**Why this priority**: Habilita el crecimiento; además corrige un riesgo de seguridad que hoy vive en el servidor de Next.js.

**Independent Test**: Completar el asistente de onboarding con un email nuevo y comprobar que la cuenta queda vinculada al negocio creado y puede entrar al panel.

**Acceptance Scenarios**:

1. **Given** un email disponible y un slug disponible, **When** completa el alta, **Then** se crea la cuenta, se crea el negocio y la cuenta queda vinculada a él.
2. **Given** un email ya registrado, **When** intenta registrarse, **Then** ve el error correspondiente sin crear datos parciales.
3. **Given** un slug en uso, **When** lo introduce, **Then** ve la indisponibilidad antes de enviar el alta.
4. **Given** un fallo al vincular la cuenta con el negocio, **When** ocurre, **Then** recibe un error recuperable y no se expone ningún detalle sensible.
5. **Given** el navegador del usuario, **When** se inspecciona el código y el tráfico, **Then** no contiene credenciales administrativas ni secretos.

---

### User Story 5 - Paridad de navegación, enlaces y presentación (Priority: P3)

Un usuario navega entre secciones con URLs equivalentes a las actuales, conserva enlaces compartidos y ve títulos/metadatos coherentes por ruta; los enlaces heredados siguen funcionando.

**Why this priority**: Evita fricción, enlaces roos y pérdida de contexto; importante pero no bloquea el núcleo.

**Independent Test**: Acceder directamente a cada URL existente (incluidas rutas dinámicas, parámetros de consulta y redirecciones heredadas), recargar y comprobar contenido, título y navegación.

**Acceptance Scenarios**:

1. **Given** una URL existente, **When** se abre o recarga directamente, **Then** se muestra la misma vista que antes de la migración.
2. **Given** una ruta dinámica de negocio, **When** se recarga, **Then** se resuelve correctamente el negocio.
3. **Given** un enlace heredado (`/directorio`, `/register`, `/admin`, `/admin/profile`), **When** se abre, **Then** redirige a su destino canónico.
4. **Given** cualquier ruta principal, **When** se muestra, **Then** el título de la pestaña describe la sección y existe un manifiesto de aplicación e iconos.
5. **Given** una ruta inexistente, **When** se abre, **Then** se muestra una página 404 coherente con la marca.
6. **Given** navegación entre secciones, **When** se usa atrás/adelante del navegador, **Then** el estado de ruta y la UI son coherentes.

---

### Edge Cases

- Sesión ausente o token caducado en el arranque: la app no debe mostrar datos ni bucles de redirección.
- Expiración durante una mutación: la operación falla de forma segura, se limpia la caché y se redirige al login.
- Logout en una pestaña mientras otra mantiene sesión: la sesión y la caché deben converger.
- Recarga en ruta dinámica `/:tenantSlug` o en rutas con parámetros de consulta.
- Slug inexistente, negocio en borrador, suspendido, no público o sin servicios.
- Email duplicado, slug en uso y fallo de vinculación durante el onboarding.
- Archivo de imagen o comprobante con formato no admitido, tamaño excesivo o subida fallida.
- API caída, lenta o con error de autorización; timeout de petición.
- Doble envío de formularios y mutaciones concurrentes.
- Datos cacheados tras cambiar de sesión o de tenant deben descartarse.
- Origen no autorizado (CORS) al llamar a la API desde un nuevo dominio.
- Acceso directo a `/super-admin` sin sesión o sin rol de plataforma.
- Navegación con el backend temporalmente inaccesible (la app no debe quedar en blanco).

## Requirements _(mandatory)_

### Functional Requirements

**Arquitectura y ejecución**

- **FR-001**: `apps/book` DEBE ejecutarse como aplicación web de cliente (SPA) sin render en servidor, sin runtime de servidor y sin Server Actions.
- **FR-002**: La app DEBE conservar todas las rutas y URLs actuales: públicas (`/`, `/negocios`, `/businesses`, `/:tenantSlug`, `/login`, `/register`, `/onboarding`, `/privacy`, `/terms`), protegidas (`/admin/*`) y de plataforma (`/super-admin`), incluida la ruta dinámica de negocio.
- **FR-003**: La app DEBE respetar las redirecciones heredadas: `/directorio` → `/negocios`, `/register` → `/onboarding`, `/admin` → `/admin/agenda`, `/admin/profile` → `/admin/configuracion?tab=perfil`, y rutas desconocidas → 404.
- **FR-004**: Los parámetros de consulta existentes (`tab`, `from`, `to`, `q`, `page`, `reason`, `email`) DEBEN seguir funcionando al abrir o compartir una URL.

**Autenticación y sesión**

- **FR-005**: La autenticación DEBE realizarse desde el navegador contra el proveedor de identidad, con la sesión persistida de forma segura y restaurada en recargas y nuevas pestañas.
- **FR-006**: Las rutas protegidas DEBEN impedir el acceso anónimo y redirigir a `/login`; un usuario autenticado que abra `/login` DEBE ser redirigido al panel.
- **FR-007**: La app DEBE manejar de forma global la sesión expirada o rechazada: limpiar sesión, descartar datos cacheados y llegar a `/login` con el motivo.
- **FR-008**: El cierre de sesión DEBE eliminar la sesión y los datos en caché del tenant.
- **FR-009**: La app DEBE mostrar la identidad y el negocio del usuario autenticado (nombre, email, avatar, negocio y enlace público) sin depender de render en servidor.
- **FR-010**: El cambio de contraseña DEBE validar la contraseña actual y actualizar la nueva contra el proveedor de identidad.

**Acceso a datos**

- **FR-011**: Toda comunicación con la API DEBE hacerse directamente desde el cliente mediante documentos GraphQL tipados generados por codegen; se prohíben DTOs manuales del contrato GraphQL.
- **FR-012**: Cada petición autenticada DEBE adjuntar el token de la sesión vigente; ninguna petición del panel puede salir sin autorización.
- **FR-013**: Las peticiones DEBEN tener un tiempo máximo de espera y mapear los errores de la API a códigos de error de producto, con mensajes localizados en español y sin filtrar texto técnico del proveedor.
- **FR-014**: La lógica de datos de cada módulo DEBE vivir en su módulo como `services.ts` (validación Zod + mapeo DTO → dominio + llamada a la API) y `hooks.ts` (hooks de consulta/mutación); los componentes y vistas NO DEBEN llamar directamente al transporte ni a la API.
- **FR-015**: Las lecturas DEBEN exponerse mediante hooks de consulta con estados de carga, error y reintento; las escrituras mediante hooks de mutación con estado pendiente y prevención de doble envío.
- **FR-016**: Tras una mutación, la app DEBE invalidar o actualizar las consultas dependientes para reflejar los cambios sin recargar (incluidos listados, contadores y bandeja de notificaciones).
- **FR-017**: La bandeja de notificaciones DEBE compartir estado entre la cabecera y la página de notificaciones y reflejar lecturas y borrados al instante.
- **FR-018**: La app DEBE conservar el comportamiento actual de reintento/recuperación ante fallos transitorios y no dejar la navegación bloqueada por una petición fallida.

**Seguridad del onboarding**

- **FR-019**: La vinculación de la cuenta con el negocio creado DEBE ejecutarse en el backend `apps/api` con credenciales administrativas del servidor.
- **FR-020**: El navegador NO DEBE contener, recibir ni transmitir credenciales administrativas ni secretos de servicio en ningún flujo.

**Contenido público**

- **FR-021**: El directorio público, el portal del negocio, la consulta de disponibilidad, la reserva, la subida de comprobante de pago y el envío de reseñas DEBEN funcionar sin autenticación.
- **FR-022**: Los estados de negocio no disponible (inexistente, borrador, suspendido, página desactivada) DEBEN informarse sin errores técnicos.
- **FR-023**: La subida de imágenes y comprobantes DEBE validar formato y tamaño antes de enviarse y conservar los datos del formulario ante un fallo.

**Presentación y navegación**

- **FR-024**: Los títulos y metadatos por ruta DEBEN gestionarse en el cliente; el manifiesto de aplicación, iconos y favicons DEBEN servirse como recursos estáticos.
- **FR-025**: La navegación DEBE usar enlaces de la SPA y conservar el historial del navegador, incluidos atrás/adelante.
- **FR-026**: La app DEBE reutilizar el design system `@foundly/ui` y los componentes existentes; no se permite rediseño visual ni duplicación de componentes.
- **FR-027**: Las rutas DEBEN cargarse de forma diferida cuando aplique, mostrando estados de carga coherentes en lugar de pantallas en blanco.

**Configuración, pruebas y entrega**

- **FR-028**: La configuración de entorno DEBE exponer solo valores públicos necesarios en el cliente; ningún secreto puede formar parte del bundle.
- **FR-029**: La allowlist de orígenes de la API DEBE incluir los dominios de la SPA (desarrollo, preview y producción).
- **FR-030**: La migración DEBE mantener la paridad funcional de las features 001–023 y actualizar las pruebas existentes a la nueva arquitectura.
- **FR-031**: El pipeline DEBE ejecutar con éxito verificación de tipos, lint, pruebas y build del dominio `book`.
- **FR-032**: El despliegue DEBE servir la app como estáticos con fallback de rutas de la SPA.

**Gobernanza**

- **FR-033**: Antes o junto con la implementación DEBEN enmendarse y aprobarse `specs/business-model.md`, `constitution.md`, `specs/architecture.md` y `code-rules.md` conforme a la jerarquía y al procedimiento de enmienda.

### Key Entities

- **Sesión**: identidad del usuario autenticado, rol, negocio vinculado y token de acceso; determina el alcance de todos los datos.
- **Negocio (tenant)**: unidad propietaria de agenda, servicios, personal, galería, pagos, reseñas y portal público.
- **Cita**: reserva con servicio, profesional, franja, estado, notas y datos de pago/anticipo.
- **Servicio**: prestación ofertada con duración, precio, categoría y reglas de anticipo.
- **Profesional/Recurso**: miembro del equipo asignable a citas y disponibilidad.
- **Disponibilidad y bloqueo temporal**: reglas semanales y excepciones que determinan franjas reservables.
- **Método de pago**: configuración de cobro del negocio y comprobantes de anticipo.
- **Reseña**: opinión pública con estado de moderación.
- **Notificación**: aviso del panel con estado leído/no leído.
- **Consulta de UI**: resultado cacheado de una operación, identificado por módulo y negocio, invalidable tras mutaciones.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 100% de los recorridos de usuario existentes (autenticación, panel, portal público, reserva, onboarding) se completan en la SPA sin pérdida de funcionalidad verificable.
- **SC-002**: El 100% de las URLs y redirecciones documentadas resuelven a la vista correcta, sin enlaces roos ni rutas 404 inesperadas.
- **SC-003**: Un usuario puede iniciar sesión y llegar al panel en menos de 3 segundos en una conexión de banda ancha típica, y una sesión ya iniciada restaura el panel en menos de 2 segundos.
- **SC-004**: El portal público muestra contenido útil en menos de 2,5 segundos y es interactivo en menos de 5 segundos en una conexión móvil razonable.
- **SC-005**: El 0% de peticiones del panel sale sin token y el 0% de operaciones permite acceder a datos de otro negocio.
- **SC-006**: El 0% de credenciales administrativas o secretos aparece en el código o en el tráfico del navegador.
- **SC-007**: La sesión expirada o rechazada se detecta y resuelve (limpieza + redirección) en el mismo ciclo de la operación, en el 100% de los casos probados.
- **SC-008**: Todas las mutaciones que afectan a listados o contadores actualizan la UI sin recargar la página en el 100% de los casos probados.
- **SC-009**: Verificación de tipos, lint, pruebas y build del dominio `book` finalizan sin errores.
- **SC-010**: La app puede servirse sin proceso de servidor de aplicación, usando únicamente alojamiento de estáticos con fallback de rutas.

## Impacto de gobernanza

Esta feature requería enmienda de la documentación vinculante. **Estado: aplicada y ratificada el 2026-11-08.**

| Documento                 | Sección afectada                                                  | Cambio realizado                                                                                                                                                   |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `specs/business-model.md` | §2 y §2.3 (arquitectura de Foundly Book)                          | Reemplazar "Next.js / React 19 — SaaS interactivo" por SPA React; mantener módulo y capacidades.                                                                   |
| `constitution.md`         | §3 (stack por app), §5.II, §5.V, §5.VI, §7                        | Enmienda MAJOR: stack de `book`, eliminación de RSC/Server Actions, nueva estructura de capa de datos (`services.ts` + hooks TanStack), convenciones de rutas SPA. |
| `specs/architecture.md`   | topología, despliegue, variables de entorno, integración book→API | Actualizar build/salida, variables `VITE_*`, CORS y flujo de vinculación de tenant.                                                                                |
| `code-rules.md`           | reglas de Next.js/RSC, ubicación de `actions.ts`                  | Retirar reglas obsoletas y documentar las nuevas (`services.ts`, hooks, TanStack Query).                                                                           |

La spec se subordina a `specs/business-model.md`; el cambio de arquitectura de Book fue aprobado en ese nivel y propagado a la constitución, arquitectura y reglas de código (constitución §1 y §9).

## Assumptions

- El objetivo es **paridad funcional**, no rediseño ni nuevas capacidades; la apariencia y los flujos se mantienen.
- El contrato GraphQL actual se conserva; el único cambio de backend previsto es la operación segura de vinculación de `tenant_id` en onboarding.
- El proveedor de identidad permite sesión desde navegador con persistencia local, como ya valida `@foundly/mobile`.
- `localStorage` es aceptable como almacenamiento de sesión; se mitiga el riesgo con las prácticas de seguridad del ecosistema.
- El codegen de GraphQL y los documentos `.graphql` por módulo se mantienen.
- El design system `@foundly/ui` y los componentes existentes se reutilizan sin cambios de contrato.
- Los dominios de despliegue de la SPA se añadirán a la allowlist CORS de la API.
- La migración es de una sola vez y no convive con Next.js en `apps/book`.
- `apps/landing`, `apps/store` y `apps/mobile` quedan fuera de alcance.

## Dependencies

- Enmienda ratificada de `specs/business-model.md`, `constitution.md`, `specs/architecture.md` y `code-rules.md`.
- Nueva operación/endpoint en `apps/api` para la vinculación segura de la cuenta con el negocio (service role en backend).
- Configuración CORS de la API con los orígenes de la SPA.
- Configuración del proyecto de identidad (URLs de redirección y persistencia de sesión).
- Alojamiento de estáticos con fallback de rutas de la SPA y reescrituras de zona `/book`.
- Proyecto Supabase (auth y storage) accesible desde el navegador.

## Out of Scope

- Rediseño visual, nuevos módulos o nuevas reglas de negocio.
- Cambios en el dominio del API distintos del alta/vinculación de negocio.
- Migración de `apps/landing`, `apps/store` o `apps/mobile`.
- Prerenderizado o indexación estática avanzada para SEO masivo (posible evolución futura).
- Optimización avanzada de imágenes más allá de un componente de imagen reutilizable.
