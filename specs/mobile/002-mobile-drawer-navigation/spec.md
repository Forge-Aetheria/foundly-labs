# Feature Specification: Mobile Drawer Navigation

**Feature Branch**: `002-mobile-drawer-navigation`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Refactorizar la navegación de `apps/mobile` para implementar un Drawer lateral (Drawer Navigation) que mantenga paridad con los módulos del Admin Web (`@foundly/book`): migrar de Tabs a Drawer, replicar los módulos del sidebar (Agenda, Servicios, Equipo, Galería, Reseñas, Disponibilidad, Notificaciones, Configuración, Ayuda y Soporte, Acerca de Foundly), drawer personalizado con logo, botón 'Ver página pública', tarjeta de perfil y logout, e iconografía vectorial sin cajas vacías. **Addendum de header**: header repetido en todas las vistas del panel con avatar del usuario a la izquierda, `branding-logo.png` centrado (al tocarlo se abre el drawer) y acción de notificaciones a la derecha; sin botón hamburguesa."

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Esta spec pertenece al dominio `mobile` y declara respetar el modelo de módulos SaaS de Foundly Book; no altera pricing, bundles ni límites de plan. Además, hereda el alcance de `specs/mobile/001-tenant-mobile-app/spec.md` en autenticación, tenant y datos, y solo redefine la estructura de navegación del panel móvil.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Navegar entre módulos desde un drawer lateral (Priority: P1)

Un administrador autenticado despliega un menú lateral desde cualquier pantalla del panel y accede a cualquiera de los módulos que ya existen en el panel web (Agenda, Servicios, Equipo, Galería, Reseñas, Disponibilidad, Notificaciones, Configuración, Ayuda y Soporte, Acerca de Foundly), sin depender de una barra inferior de pestañas.

**Why this priority**: La paridad de navegación es el objetivo central del cambio y habilita el acceso a todos los módulos del negocio desde el móvil.

**Independent Test**: Abrir la app autenticado, desplegar el drawer y comprobar que los diez módulos aparecen con su nombre e icono, que cada uno abre su pantalla correspondiente y que la pantalla activa se resalta en el menú.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado en cualquier pantalla del panel, **When** toca el icono del tenant en el header, **Then** el drawer lateral se despliega mostrando la lista completa de módulos.
2. **Given** el drawer desplegado, **When** el administrador selecciona un módulo, **Then** la app navega a esa pantalla y el drawer se cierra.
3. **Given** una pantalla de módulo abierta, **When** el administrador vuelve a abrir el drawer, **Then** el módulo activo aparece visualmente resaltado.
4. **Given** el panel abierto, **When** el administrador recorre la interfaz, **Then** no existe una barra inferior de pestañas ni sus iconos.
5. **Given** un administrador sin sesión válida, **When** intenta acceder a cualquier módulo, **Then** se mantiene el comportamiento de redirección al login ya vigente.

---

### User Story 2 - Usar el header persistente con branding (Priority: P2)

Un administrador autenticado ve en la parte superior de todas las pantallas del panel un header persistente con el logo/avatar del tenant a la izquierda, el `branding-logo` de Foundly Book centrado y una acción de notificaciones a la derecha. Al tocar el icono del tenant se abre el drawer; el header no incluye botón hamburguesa.

**Why this priority**: El header es el punto de acceso al drawer, refuerza la identidad de marca y proporciona accesos rápidos; sin él la navegación lateral no es descubrible.

**Independent Test**: Recorrer todos los módulos y comprobar que el header muestra siempre el avatar a la izquierda, el logo de marca centrado y la acción de notificaciones a la derecha, y que tocar el logo abre el drawer sin cambiar de módulo.

**Acceptance Scenarios**:

1. **Given** cualquier módulo abierto, **When** el administrador observa el header, **Then** ve el logo/avatar del tenant a la izquierda, el logo de marca centrado y la acción de notificaciones a la derecha.
2. **Given** el header, **When** el administrador toca el icono del tenant a la izquierda, **Then** el drawer se abre sin alterar el módulo activo.
3. **Given** el header, **When** el administrador toca la acción derecha, **Then** accede a la sección de notificaciones de su tenant.
4. **Given** cualquier pantalla del panel autenticado, **When** se muestra el header, **Then** el logo de marca aparece centrado y sin botón hamburguesa.
5. **Given** un tenant sin logo, **When** se muestra el icono izquierdo, **Then** se muestran iniciales legibles del nombre del tenant como sustituto.

---

### User Story 3 - Consultar identidad, página pública y cerrar sesión desde el drawer (Priority: P3)

Un administrador autenticado ve en la parte superior del drawer el icono del tenant con borde distintivo, el nombre del negocio y el acceso "Ver página pública", y en la parte inferior una tarjeta con su foto de perfil, nombre, correo y un botón para cerrar sesión.

**Why this priority**: Refuerza la identidad de marca y da acceso rápido a la presencia pública y al cierre de sesión, en paridad con el panel web.

**Independent Test**: Abrir el drawer y verificar el logo, el botón de página pública, la tarjeta de perfil con los datos de la sesión y que el logout cierra la sesión y vuelve al login.

**Acceptance Scenarios**:

1. **Given** el drawer desplegado, **When** el administrador observa la parte superior, **Then** ve el icono del tenant con borde distintivo, el nombre del negocio y el botón "Ver página pública".
2. **Given** un tenant con página pública disponible, **When** el administrador pulsa "Ver página pública", **Then** la página pública del negocio se abre en el navegador externo.
3. **Given** un tenant sin página pública publicada o sin slug disponible, **When** abre el drawer, **Then** el botón "Ver página pública" no se muestra o aparece deshabilitado con una explicación.
4. **Given** el drawer desplegado, **When** el administrador observa la parte inferior, **Then** ve su foto de perfil (o iniciales si no hay foto), nombre, correo y botón de logout.
5. **Given** el drawer desplegado, **When** el administrador pulsa logout, **Then** la sesión se cierra, las credenciales del dispositivo se eliminan y se le redirige al login.
6. **Given** un usuario sin foto de perfil, **When** se muestra la tarjeta, **Then** se muestran iniciales legibles como sustituto y no un espacio vacío.

---

### User Story 4 - Ver iconografía consistente sin cajas vacías (Priority: P4)

Un administrador autenticado ve en el drawer y en el header iconos claros y reconocibles para cada módulo y acción, sin rectángulos, cajas vacías ni glifos faltantes.

**Why this priority**: Los iconos son la señal visual principal del menú; si fallan, la navegación pierde legibilidad y confianza.

**Independent Test**: Recorrer todos los datos del drawer y del header en iOS y Android y comprobar que cada icono se renderiza correctamente, incluyendo los estados activo e inactivo.

**Acceptance Scenarios**:

1. **Given** el drawer desplegado, **When** el administrador revisa cada opción, **Then** cada módulo muestra un icono reconocible junto a su etiqueta.
2. **Given** el header, **When** el administrador lo revisa, **Then** el avatar izquierdo y la acción de notificaciones derecha se muestran correctamente, y el logo central carga sin caja vacía.
3. **Given** la app instalada en un dispositivo iOS o Android, **When** se muestra cualquier icono de navegación, **Then** no aparece ninguna caja vacía ni glifo de reemplazo.

---

### Edge Cases

- El administrador abre el drawer mientras la app está sin conectividad: el menú y la tarjeta de perfil usan la información de sesión disponible y no bloquean la navegación.
- La sesión expira con el drawer abierto: al seleccionar un módulo o al cerrar el drawer, se redirige al login sin mostrar datos del tenant.
- El usuario no tiene nombre, correo o foto de perfil completos: la tarjeta muestra sustitutos legibles (iniciales y etiqueta genérica) sin romper el layout.
- El tenant no tiene página pública configurada: el acceso público se oculta o deshabilita con un mensaje comprensible.
- El módulo seleccionado todavía no tiene funcionalidad móvil completa: se muestra una pantalla identificada con su título y un estado informativo, sin errores ni pantallas en blanco.
- El drawer se abre en pantallas pequeñas o en horizontal: la cabecera, la lista y el pie siguen siendo visibles y desplazables.
- Un icono no puede cargarse: la opción conserva su etiqueta textual y sigue siendo navegable.
- El administrador toca repetidamente el logo central o una opción: no se abren pantallas duplicadas ni se pierde el estado de sesión.
- El archivo del logo de marca falta o no puede cargarse: el header conserva un espacio de marca con texto alternativo legible y la navegación sigue siendo operativa.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: La app MUST sustituir la navegación inferior de pestañas por un drawer lateral accesible desde todo el panel autenticado.
- **FR-002**: La app MUST eliminar la barra inferior de pestañas y sus iconos de la interfaz del panel.
- **FR-003**: El drawer MUST incluir, en este orden, las opciones Agenda, Servicios, Equipo, Galería, Reseñas, Disponibilidad, Notificaciones, Configuración, Ayuda y Soporte, y Acerca de Foundly.
- **FR-004**: Cada opción del drawer MUST mostrar la etiqueta del módulo y un icono representativo.
- **FR-005**: La app MUST resaltar de forma visible el módulo activo en el drawer.
- **FR-006**: Al seleccionar una opción, la app MUST navegar a la pantalla del módulo y cerrar el drawer.
- **FR-007**: El header MUST repetirse en todas las pantallas del panel autenticado.
- **FR-008**: El header MUST mostrar el logo del tenant a la izquierda, con las iniciales del nombre del tenant como sustituto cuando no haya logo.
- **FR-009**: El header MUST mostrar el `branding-logo` de Foundly Book centrado.
- **FR-010**: Al tocar el icono del tenant, la app MUST abrir el drawer sin perder el estado de la pantalla actual.
- **FR-011**: El header MUST mostrar una acción de notificaciones a la derecha que dé acceso a las notificaciones del tenant.
- **FR-012**: El header MUST NOT mostrar botón hamburguesa.
- **FR-013**: El logo del header MUST usar el asset `branding-logo.png` incorporado a la carpeta de assets de la app.
- **FR-014**: La parte superior del drawer MUST mostrar el icono del tenant con borde distintivo y el nombre del negocio.
- **FR-015**: La parte superior del drawer MUST mostrar el acceso "Ver página pública" cuando el tenant tenga una página pública disponible.
- **FR-016**: Al activar "Ver página pública", la app MUST abrir la página pública del negocio en el navegador externo del dispositivo.
- **FR-017**: Cuando no exista página pública disponible, la app MUST ocultar o deshabilitar el acceso con una explicación comprensible.
- **FR-018**: La parte inferior del drawer MUST mostrar una tarjeta con foto de perfil, nombre del usuario/tenant y correo de la sesión activa.
- **FR-019**: Cuando falte la foto de perfil, la tarjeta MUST mostrar iniciales legibles como sustituto.
- **FR-020**: La tarjeta del drawer MUST incluir un botón de logout que cierre la sesión y redirija al login.
- **FR-021**: Los módulos que aún no tengan funcionalidad móvil MUST mostrar una pantalla informativa con su título, sin errores, pantallas en blanco ni datos de otros tenants.
- **FR-022**: Los módulos existentes de Agenda, Notificaciones y Configuración MUST conservar los flujos y datos ya definidos en la spec fundacional del móvil.
- **FR-023**: Todos los iconos de navegación MUST renderizarse correctamente en iOS y Android sin cajas vacías, glifos de reemplazo ni rectángulos.
- **FR-024**: La app MUST conservar las reglas de sesión, tenant y redirección al login vigentes en el panel móvil.
- **FR-025**: La app MUST mantener una presentación legible y operable en tamaños de teléfono y tableta, en orientación vertical y horizontal.
- **FR-026**: La app MUST superar las verificaciones de tipos y de lint del workspace móvil sin errores.

### Key Entities _(include if data involved)_

- **Módulo de navegación**: opción del drawer con etiqueta, icono, ruta y estado activo/inactivo; agrupada en módulos operativos y módulos secundarios.
- **Sesión activa**: identidad del administrador y tenant asociados, usados para la tarjeta de perfil y el control de acceso.
- **Perfil público del tenant**: página pública del negocio y su disponibilidad, que determina si se ofrece el acceso "Ver página pública".
- **Encabezado persistente**: barra superior repetida en todas las vistas con avatar del usuario a la izquierda, logo de marca centrado que abre el drawer y acción de notificaciones a la derecha.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 100% de los módulos del panel web listados están disponibles como opciones del drawer móvil.
- **SC-002**: Un administrador puede abrir el drawer y llegar a cualquier módulo en menos de 3 segundos.
- **SC-003**: El 95% de los administradores identifica correctamente el módulo activo en el drawer en su primer intento.
- **SC-004**: El 100% de los iconos de navegación se muestran correctamente en iOS y Android, sin incidencias de cajas vacías.
- **SC-005**: El 100% de las pantallas del panel muestran el header persistente con avatar, logo de marca centrado y acción de notificaciones.
- **SC-006**: Un administrador completa el cierre de sesión desde el drawer en menos de 5 segundos y llega al login.
- **SC-007**: Cero incidencias de barras de pestañas residuales o de navegación duplicada tras el cambio.
- **SC-008**: Las verificaciones automáticas de tipos y lint del workspace móvil finalizan sin errores.
- **SC-009**: El logo de marca se renderiza correctamente en el 100% de las pantallas del panel, sin imágenes rotas ni cajas vacías.

## Assumptions

- El dominio de esta spec es `mobile`; se asume que la app ya cuenta con autenticación, tenant y sesión persistente según `specs/mobile/001-tenant-mobile-app/spec.md`.
- Los módulos Servicios, Equipo, Galería, Reseñas, Disponibilidad, Ayuda y Soporte, y Acerca de Foundly no tienen todavía implementación móvil funcional; en esta iteración se incorporan como rutas navegables con una pantalla informativa o de próximo desarrollo, sin definir aquí sus funcionalidades de negocio.
- Agenda, Notificaciones y Configuración reutilizan las vistas y comportamientos existentes; esta spec solo cambia cómo se llega a ellas.
- El nombre y el correo mostrados en la tarjeta del drawer provienen de la sesión activa; el nombre del negocio puede mostrarse como contexto adicional si la sesión lo expone.
- La foto de perfil se toma de los datos de la sesión cuando exista; en su defecto se usan iniciales.
- "Ver página pública" abre la página pública en el navegador externo del dispositivo; si el tenant no tiene página publicada o slug disponible, el acceso se oculta o deshabilita.
- La acción derecha del header se interpreta como acceso a Notificaciones, manteniendo paridad con el panel web y con la sección ya existente en móvil.
- El header no incluye hamburguesa: el drawer se abre tocando el icono del tenant a la izquierda. A la izquierda se muestra el logo del tenant (o iniciales del negocio) y a la derecha la acción de notificaciones; el branding-logo de Foundly Book permanece centrado y estático.
- El archivo de logo entregado está en `apps/mobile/assets/brading-logo.png` (nombre con typo). Se asume su renombrado a `apps/mobile/assets/branding-logo.png` como parte del alcance, sin modificar la imagen.
- El `branding-logo.png` se usa en el header persistente; la cabecera del drawer reutiliza `SessionAvatar` con el logo/nombre del tenant.
- Se mantiene el idioma español y la identidad visual de Foundly Book ya usados en el resto del ecosistema.
- La verificación se realiza mediante los comandos de tipos y lint del workspace móvil; las pruebas en tiendas y la publicación quedan fuera del alcance.
- No se modifican los contratos del backend, los límites de plan ni las reglas de negocio de Foundly.

## Dependencies

- App móvil autenticada con sesión y tenant disponibles (spec fundacional `001-tenant-mobile-app`).
- Datos de perfil del usuario y del negocio expuestos por la sesión o el backend existente.
- Página pública del tenant y su slug para el acceso "Ver página pública".
- Identidad gráfica de Foundly Book disponible en `apps/mobile/assets/branding-logo.png` (renombrado desde `brading-logo.png`).
- Conjunto de iconos vectoriales soportado por el entorno móvil del proyecto.
