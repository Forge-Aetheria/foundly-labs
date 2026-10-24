# Feature Specification: Tenant Mobile App

**Feature Branch**: `001-tenant-mobile-app`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Crear e inicializar la aplicación móvil para tenants `apps/mobile` dentro del monorepo utilizando Expo (React Native) y Expo Router: workspace con pnpm/Expo SDK, tsconfig con alias y paquetes locales, registro en Turborepo (dev, build, typecheck, lint); estructura Expo Router con `(auth)/login`, dashboard de administración del tenant (`index`/`agenda`, `notificaciones`, `configuracion`); infraestructura de push notifications (`expo-notifications`, captura del ExpoPushToken y envío a la API NestJS al autenticarse); verificación de typecheck y lint."

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Esta spec se acoge al modelo de negocio de módulos SaaS de Foundly y declara que la app móvil de tenant es una extensión del dominio de agenda/servicios; no altera pricing, bundles ni límites de plan.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Iniciar sesión y acceder al panel del tenant (Priority: P1)

Un administrador de tenant abre la app móvil, introduce sus credenciales de Foundly y accede al panel de administración de su negocio. Puede mostrar u ocultar la contraseña mientras la escribe y recibe mensajes claros si las credenciales son inválidas o si no tiene conexión.

**Why this priority**: Sin autenticación no existe acceso a datos del tenant ni personalización de la app; es el punto de entrada de todo el producto móvil.

**Independent Test**: Se puede probar abriendo la app sin sesión, iniciando sesión con credenciales válidas e inválidas y verificando que el panel de administración solo aparece con una sesión válida.

**Acceptance Scenarios**:

1. **Given** un administrador sin sesión activa, **When** abre la app, **Then** ve la pantalla de inicio de sesión y no puede acceder al panel sin autenticarse.
2. **Given** el formulario de inicio de sesión, **When** el administrador pulsa el control de visibilidad de contraseña, **Then** el texto de la contraseña alterna entre oculto y visible sin perder lo escrito.
3. **Given** credenciales válidas y conectividad, **When** el administrador confirma el inicio de sesión, **Then** accede al panel de administración de su tenant y su sesión permanece activa en aperturas posteriores.
4. **Given** credenciales inválidas, **When** el administrador confirma el inicio de sesión, **Then** permanece en la pantalla de login con un mensaje de error comprensible y sin filtrar detalles internos.
5. **Given** una sesión expirada o revocada, **When** el administrador intenta usar la app, **Then** es redirigido al login con un aviso de que debe volver a autenticarse.

---

### User Story 2 - Consultar la agenda del día (Priority: P2)

Un administrador autenticado abre el panel y ve un resumen de las citas próximas de su negocio, con la información necesaria para preparar el día (fecha, hora, servicio y cliente), y puede actualizar la vista para reflejar cambios recientes.

**Why this priority**: La agenda es el valor operativo principal del tenant; permite gestionar el día sin abrir el panel web.

**Independent Test**: Con una cuenta con citas programadas, abrir el panel y comprobar que se muestran las citas correctas para el tenant y que la actualización refleja cambios hechos desde otro canal.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado con citas próximas, **When** abre el panel, **Then** ve una lista ordenada de las citas de su tenant con fecha, hora, servicio y cliente.
2. **Given** un administrador autenticado sin citas próximas, **When** abre el panel, **Then** ve un estado vacío informativo en lugar de una lista en blanco.
3. **Given** el panel abierto, **When** el administrador actualiza la vista, **Then** se consultan los datos más recientes y la lista refleja altas, cambios o cancelaciones.
4. **Given** un fallo de red al cargar la agenda, **When** la consulta no puede completarse, **Then** se muestra un mensaje de error con opción de reintentar y no se muestran datos de otro tenant.

---

### User Story 3 - Revisar notificaciones del negocio (Priority: P3)

Un administrador autenticado consulta una lista de notificaciones de su tenant, distingue las no leídas de las leídas y puede señalar notificaciones como leídas.

**Why this priority**: Centraliza avisos operativos (nuevas citas, cambios, recordatorios) y reduce la dependencia del correo o del panel web.

**Independent Test**: Con una cuenta que tenga notificaciones, abrir la lista, comprobar el orden cronológico, marcar una como leída y verificar que el estado persiste al volver a abrir la app.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado con notificaciones, **When** abre la sección de notificaciones, **Then** ve la lista en orden cronológico descendente con indicación visual de leídas y no leídas.
2. **Given** una notificación no leída, **When** el administrador la marca como leída, **Then** el estado cambia de inmediato y se conserva al reabrir la app.
3. **Given** un administrador sin notificaciones, **When** abre la sección, **Then** ve un estado vacío informativo.
4. **Given** un fallo al sincronizar notificaciones, **When** la consulta falla, **Then** se conserva la última información disponible y se informa del problema sin bloquear la navegación.

---

### User Story 4 - Consultar perfil y controlar la página pública (Priority: P4)

Un administrador autenticado revisa el resumen de su perfil de negocio y activa o desactiva la publicación de su página pública, recibiendo confirmación del estado resultante.

**Why this priority**: Da control inmediato sobre la presencia pública del negocio desde el móvil, sin depender del panel web.

**Independent Test**: Abrir la configuración, alternar la publicación de la página pública y verificar que el estado mostrado coincide con el del negocio y que el cambio se refleja en el canal público.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre configuración, **Then** ve un resumen de su perfil (nombre del negocio, datos de contacto y estado de la página pública).
2. **Given** la página pública activa, **When** el administrador la desactiva, **Then** el control refleja el nuevo estado y la página deja de estar disponible públicamente.
3. **Given** la página pública inactiva, **When** el administrador la activa, **Then** el control refleja el nuevo estado y la página vuelve a estar disponible.
4. **Given** un fallo al guardar el cambio, **When** la actualización no se completa, **Then** el control vuelve a su estado anterior y se informa del error.

---

### User Story 5 - Recibir avisos push en el dispositivo (Priority: P5)

Un administrador autenticado recibe notificaciones push en su dispositivo cuando ocurren eventos relevantes de su tenant, y puede desactivarlas desde la configuración del sistema operativo.

**Why this priority**: Los avisos push aportan valor recurrente y retención, pero la app sigue siendo útil sin ellos; por eso se prioriza después de los flujos operativos.

**Independent Test**: Instalar la app en un dispositivo, iniciar sesión, aceptar el permiso de notificaciones y verificar que un evento del tenant genera un aviso recibido; repetir rechazando el permiso y comprobar que la app sigue funcionando sin avisos.

**Acceptance Scenarios**:

1. **Given** un administrador que inicia sesión por primera vez en un dispositivo, **When** la app solicita permiso de notificaciones y el administrador lo acepta, **Then** el dispositivo queda registrado para recibir avisos de su tenant.
2. **Given** un administrador que rechaza el permiso de notificaciones, **When** usa la app, **Then** todas las funciones operativas siguen disponibles y la app explica cómo habilitar los avisos más adelante.
3. **Given** un administrador autenticado en varios dispositivos, **When** ocurre un evento relevante, **Then** cada dispositivo registrado recibe el aviso correspondiente a su tenant.
4. **Given** un administrador que cierra sesión, **When** otro usuario inicia sesión en el mismo dispositivo, **Then** los avisos se asocian al tenant del usuario activo y no se filtran avisos del usuario anterior.

---

### Edge Cases

- El dispositivo pierde conectividad durante el login, la carga de agenda, la sincronización de notificaciones o el cambio de página pública: la app informa y permite reintentar sin perder el estado ya cargado.
- El token de sesión expira mientras la app está en segundo plano: al volver, se solicita reautenticación antes de mostrar datos.
- El tenant no tiene perfil completo (sin nombre público o contacto): la configuración muestra qué falta y no permite publicar una página incompleta.
- El permiso de notificaciones se concede después de haber sido rechazado: la app puede registrar el dispositivo sin requerir reinstalación.
- El usuario cambia de tenant o de rol: la app actualiza la sesión, los datos visibles y el registro push del dispositivo.
- Se reciben avisos duplicados o fuera de orden: la lista de notificaciones no muestra duplicados y conserva un orden cronológico coherente.
- La app se abre sin conexión con una sesión previa: se muestra la última información disponible y se indica que los datos pueden estar desactualizados.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: La app MUST permitir iniciar sesión con las credenciales de Foundly del administrador de tenant y establecer una sesión persistente hasta el cierre de sesión o la expiración.
- **FR-002**: La pantalla de login MUST incluir un control para mostrar u ocultar la contraseña sin alterar el valor introducido.
- **FR-003**: El sistema MUST mostrar mensajes de error comprensibles ante credenciales inválidas, cuenta sin acceso o fallo de conectividad, sin exponer detalles internos.
- **FR-004**: La app MUST impedir el acceso a cualquier vista del panel sin una sesión válida y redirigir al login cuando la sesión expire.
- **FR-005**: El panel MUST mostrar una vista de agenda con las citas del tenant, ordenadas cronológicamente, incluyendo fecha, hora, servicio y cliente.
- **FR-006**: La agenda MUST permitir actualizar manualmente los datos y mostrar estados de carga, vacío y error con opción de reintento.
- **FR-007**: La app MUST mostrar una lista de notificaciones del tenant en orden cronológico descendente, diferenciando leídas y no leídas.
- **FR-008**: El sistema MUST permitir marcar notificaciones como leídas y conservar ese estado entre sesiones y dispositivos.
- **FR-009**: La app MUST mostrar un estado vacío cuando el tenant no tenga notificaciones o citas próximas.
- **FR-010**: La configuración MUST mostrar un resumen del perfil del negocio (nombre, datos de contacto y estado de la página pública).
- **FR-011**: La configuración MUST permitir activar y desactivar la página pública del tenant, reflejando el estado confirmado por el servidor.
- **FR-012**: El sistema MUST rechazar la publicación de la página pública cuando falten datos obligatorios del perfil e indicar qué datos faltan.
- **FR-013**: La app MUST solicitar permiso para enviar notificaciones push y registrar el dispositivo para el tenant del usuario autenticado.
- **FR-014**: La app MUST funcionar con normalidad si el administrador rechaza o revoca el permiso de notificaciones, ofreciendo información para habilitarlo.
- **FR-015**: El sistema MUST desasociar el dispositivo del tenant anterior al cerrar sesión o cambiar de usuario, y asociarlo al tenant activo tras un nuevo inicio de sesión.
- **FR-016**: La app MUST garantizar que todos los datos mostrados pertenezcan exclusivamente al tenant de la sesión activa.
- **FR-017**: La app MUST ofrecer estados de carga y mensajes de error con reintento en todas las consultas y mutaciones de datos.
- **FR-018**: La app MUST permitir cerrar sesión desde el panel y eliminar del dispositivo las credenciales de la sesión.
- **FR-019**: La app MUST conservar una presentación legible y operable en tamaños de pantalla de teléfono y tableta, en orientación vertical y horizontal.
- **FR-020**: La app MUST ser ejecutable y verificable dentro del monorepo mediante los comandos de desarrollo, compilación, verificación de tipos y lint del workspace móvil.

### Key Entities _(include if data involved)_

- **Administrador de tenant**: persona autenticada que administra un negocio; tiene credenciales, rol y pertenencia a un tenant.
- **Tenant / negocio**: unidad de negocio propietaria de citas, notificaciones, perfil y página pública.
- **Sesión**: estado autenticado del administrador en un dispositivo, con vigencia y tenant asociado.
- **Cita**: evento de agenda con fecha, hora, servicio, cliente y estado; pertenece a un tenant.
- **Notificación**: aviso del tenant con título, contenido, fecha, estado de lectura y evento de origen.
- **Dispositivo registrado**: dispositivo del administrador asociado a un tenant para recibir avisos push; incluye un identificador de entrega emitido por el servicio de notificaciones.
- **Perfil público**: datos del negocio visibles en la página pública y su estado de publicación.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 95% de los administradores completa el inicio de sesión en menos de 30 segundos desde la apertura de la app.
- **SC-002**: Tras iniciar sesión, el panel muestra la agenda del día en menos de 3 segundos en condiciones normales de conectividad.
- **SC-003**: El 90% de los administradores localiza y marca una notificación como leída en su primer intento.
- **SC-004**: El cambio de estado de la página pública se confirma al usuario en menos de 2 segundos y se refleja en el canal público en menos de 1 minuto.
- **SC-005**: El 95% de los dispositivos que aceptan permisos de notificaciones recibe correctamente un aviso de prueba del tenant en menos de 1 minuto.
- **SC-006**: Cero incidencias de datos de un tenant mostrados a otro tenant en pruebas de cambio de usuario y sesión.
- **SC-007**: Un administrador puede completar la revisión diaria (agenda + notificaciones) en menos de 2 minutos.
- **SC-008**: Las verificaciones automáticas de calidad del workspace móvil finalizan sin errores.

## Assumptions

- La app móvil es una extensión para administradores de tenant del dominio de agenda/servicios de Foundly Book; no sustituye la experiencia pública ni el panel web.
- Los administradores ya disponen de una cuenta Foundly válida creada desde el panel web; el registro de nuevas cuentas queda fuera del alcance de esta versión.
- La app consume los servicios existentes del backend Foundly, que ya exponen autenticación, agenda, notificaciones, perfil y publicación de página; no se define aquí un backend nuevo.
- Se reutilizan las reglas de negocio, límites de plan y permisos vigentes en `specs/business-model.md`; la app solo refleja lo que el backend autorice.
- El idioma inicial de la app es español, coherente con el resto del ecosistema.
- Se asume conectividad intermitente; la app prioriza mensajes claros y reintentos sobre el funcionamiento totalmente offline.
- Se asume que la normalización del monorepo a pnpm/Turborepo y la creación del workspace `apps/mobile` son parte del alcance, aunque el repositorio actualmente use npm workspaces y no tenga `turbo.json`.
- Se asume que la app se valida en dispositivos iOS y Android mediante un entorno de desarrollo de Expo; la publicación en tiendas queda fuera del alcance.
- Se asume que el envío de avisos push se realiza mediante el servicio de notificaciones de Expo y que el backend acepta el identificador de entrega del dispositivo.
- La incorporación del dominio `mobile` a la gobernanza (`constitution.md` §2 y `specs/architecture.md`) es un requisito previo de planificación, aprobado por el usuario en esta sesión.

## Dependencies

- Backend Foundly con endpoints de autenticación, agenda, notificaciones, perfil y publicación de página pública.
- Servicio de notificaciones push de Expo y credenciales de proyecto Expo asociadas.
- Paquete compartido `@foundly/database` y demás paquetes locales para tipos/utilidades, si el backend expone contratos reutilizables.
- Acceso a un tenant de prueba con citas y notificaciones para validar los flujos.
