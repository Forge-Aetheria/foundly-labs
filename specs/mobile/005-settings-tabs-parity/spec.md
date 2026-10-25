# Feature Specification: Mobile Settings Tabs Parity

**Feature Branch**: `005-settings-tabs-parity`

**Created**: 2026-10-25

**Status**: Implemented (retrospective specification)

**Input**: Reestructurar Configuración móvil con pestañas equivalentes al panel web: Perfil del Negocio (nombre, categoría, etiquetas, slug, visibilidad pública, logo y guardado), Métodos de Pago (listado y configuración) y Seguridad (cambio de contraseña), con UX móvil y estados de carga.

**Referencias de gobernanza**: `specs/business-model.md`, `constitution.md`, `specs/architecture.md` y `code-rules.md`. Dominio `mobile`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Gestionar el perfil del negocio (Priority: P1)

Un administrador edita nombre, categoría, etiquetas, slug y visibilidad pública, y gestiona el logo 1:1 con guardado explícito.

**Independent Test**: Abrir Configuración → Perfil, editar campos, guardar y comprobar persistencia.

**Acceptance Scenarios**:

1. **Given** el perfil cargado, **When** el administrador edita y guarda, **Then** los cambios persisten.
2. **Given** un tenant sin logo, **When** sube una imagen o pega una URL, **Then** la previsualización se actualiza.
3. **Given** el slug vacío, **When** guarda, **Then** se muestran errores de validación.
4. **Given** una mutación en curso, **When** guarda, **Then** se muestra progreso y se bloquea el envío duplicado.

### User Story 2 - Configurar métodos de pago (Priority: P2)

Un administrador lista, crea, edita, activa/desactiva y elimina métodos de cobro.

**Independent Test**: Crear un método, editarlo, desactivarlo y eliminarlo con confirmación.

**Acceptance Scenarios**:

1. **Given** la pestaña Pagos, **When** abre el formulario, **Then** puede elegir tipo y campos específicos.
2. **Given** un método existente, **When** lo desactiva, **Then** el estado persiste.
3. **Given** un método existente, **When** pulsa eliminar, **Then** se solicita confirmación.
4. **Given** una consulta en curso, **When** abre la pestaña, **Then** ve loading en el contenedor.

### User Story 3 - Cambiar la contraseña (Priority: P3)

Un administrador actualiza sus credenciales con contraseña actual, nueva y confirmación.

**Independent Test**: Cambiar la contraseña con datos válidos e inválidos.

**Acceptance Scenarios**:

1. **Given** los tres campos válidos, **When** guarda, **Then** la contraseña se actualiza y se confirma.
2. **Given** contraseña actual incorrecta, **When** guarda, **Then** se muestra error.
3. **Given** contraseñas nuevas distintas o débiles, **When** guarda, **Then** se rechaza la operación.

### Edge Cases

- Tenant sin slug: la página pública no puede publicarse.
- Logo con formato/tamaño inválido: se rechaza.
- Métodos de pago sin configurar: estado vacío informativo.
- Fallo de red: error visible con reintento donde aplique.
- Teclado abierto: formularios y footer permanecen operables.

## Requirements _(mandatory)_

- **FR-001**: Configuración MUST mostrar tres pestañas: Perfil, Pagos y Seguridad.
- **FR-002**: Perfil MUST permitir editar nombre, categoría, etiquetas, slug y visibilidad pública.
- **FR-003**: Perfil MUST permitir gestionar un logo 1:1 mediante selector de imagen o URL.
- **FR-004**: Perfil MUST validar campos obligatorios y mostrar feedback de guardado.
- **FR-005**: Pagos MUST listar los métodos del tenant y mostrar su estado.
- **FR-006**: Pagos MUST permitir crear, editar, activar/desactivar y eliminar métodos con confirmación.
- **FR-007**: Pagos MUST adaptar los campos al tipo de método seleccionado.
- **FR-008**: Seguridad MUST permitir cambiar la contraseña con validación y feedback.
- **FR-009**: Todas las consultas MUST mostrar loading dentro de la vista o contenedor.
- **FR-010**: Las mutaciones MUST mostrar progreso y bloquear acciones duplicadas.
- **FR-011**: La UI MUST usar tipos/documentos generados y reutilizar componentes existentes.

## Success Criteria _(mandatory)_

- **SC-001**: El 100% de los campos de perfil solicitados son editables y persistentes.
- **SC-002**: Crear/editar un método de pago se refleja en la lista en menos de 2 segundos.
- **SC-003**: El 100% de las acciones destructivas solicita confirmación.
- **SC-004**: Las verificaciones de tipos, lint y tests finalizan sin errores.

## Assumptions

- La API ya expone `updateMyBusinessProfile`, `myPaymentMethods`, `upsertPaymentMethod`, `deletePaymentMethod`.
- El cambio de contraseña se realiza contra Supabase Auth con reautenticación.
- El bucket `tenant-media` permite subir el logo.
- Spec retrospectiva creada tras la implementación.
