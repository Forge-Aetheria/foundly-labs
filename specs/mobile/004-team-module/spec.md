# Feature Specification: Mobile Team Module

**Feature Branch**: `004-team-module`

**Created**: 2026-10-25

**Status**: Implemented (retrospective specification)

**Input**: Conectar el módulo Equipo de `apps/mobile` con la API real, sustituyendo el placeholder “Próximamente”: listar especialistas del tenant, crear, editar y eliminar miembros con nombre, rol/especialidad, avatar, biografía, estado activo y servicios asignados, manteniendo loading, refresco, vacío, error y confirmaciones destructivas.

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Esta spec pertenece al dominio `mobile` y se apoya en los contratos GraphQL existentes de `apps/api` y el modelo `Specialist` de `packages/database`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consultar el equipo (Priority: P1)

Un administrador autenticado abre Equipo y ve todos los especialistas de su tenant con nombre, rol, avatar, biografía, estado y servicios asignados.

**Why this priority**: Es la vista base del módulo y reemplaza el placeholder actual.

**Independent Test**: Abrir Equipo con especialistas existentes y comprobar que se listan los datos correctos del tenant.

**Acceptance Scenarios**:

1. **Given** un tenant con especialistas, **When** el administrador abre Equipo, **Then** ve la lista con nombre, rol, estado y servicios asignados.
2. **Given** un tenant sin especialistas, **When** abre Equipo, **Then** ve un estado vacío informativo.
3. **Given** la lista cargada, **When** hace pull-to-refresh, **Then** se consultan los datos más recientes.
4. **Given** un fallo de red, **When** la consulta falla, **Then** ve un error con opción de reintentar.

---

### User Story 2 - Crear un miembro del equipo (Priority: P2)

Un administrador crea un especialista con nombre, rol, avatar, biografía, estado y servicios asignados.

**Why this priority**: Permite incorporar personal y habilitar reservas por especialista.

**Independent Test**: Crear un miembro, asignarle servicios y comprobar que aparece en la lista y persiste.

**Acceptance Scenarios**:

1. **Given** el formulario de creación, **When** completa el nombre y guarda, **Then** el miembro aparece en la lista.
2. **Given** el formulario, **When** selecciona servicios y guarda, **Then** las asignaciones se reflejan en el miembro.
3. **Given** una subida de avatar válida, **When** termina la subida, **Then** el avatar se previsualiza y se guarda.
4. **Given** un fallo de API, **When** guarda, **Then** se muestra el error sin perder el formulario.

---

### User Story 3 - Editar, activar y eliminar miembros (Priority: P3)

Un administrador actualiza los datos y servicios de un miembro, cambia su estado activo o lo elimina con confirmación.

**Why this priority**: Completa el ciclo de gestión del equipo.

**Independent Test**: Editar un miembro, cambiar su estado, verificar persistencia y eliminarlo con confirmación.

**Acceptance Scenarios**:

1. **Given** un miembro existente, **When** el administrador lo edita y guarda, **Then** la lista refleja los cambios y las asignaciones de servicios.
2. **Given** un miembro activo, **When** el administrador desactiva el switch, **Then** el estado se actualiza y persiste.
3. **Given** un miembro existente, **When** pulsa eliminar, **Then** se solicita confirmación.
4. **Given** una mutación en curso, **When** el administrador intenta otra acción, **Then** los controles se bloquean y se muestra el progreso.

---

### Edge Cases

- Miembro sin rol, avatar o biografía: se muestra con sustitutos legibles.
- Servicios no cargados al abrir el formulario: se muestra un mensaje de carga y se pueden seleccionar al terminar.
- Catálogo de servicios vacío: se informa que no hay servicios para asignar.
- Asignación duplicada o eliminada externamente: la sincronización se invalida y la lista se recarga.
- Error al guardar el miembro pero fallar la sincronización de servicios: se informa del error sin ocultar el formulario.
- Sesión expirada: la app redirige al login según el flujo existente.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El módulo MUST listar los especialistas del tenant autenticado.
- **FR-002**: Cada miembro MUST mostrar nombre, rol, avatar/iniciales, estado y servicios asignados.
- **FR-003**: El módulo MUST mostrar loading inicial, overlay de refresco, estado vacío y error con reintento.
- **FR-004**: El módulo MUST permitir crear miembros con nombre, rol, avatar, biografía, estado y servicios.
- **FR-005**: El módulo MUST validar nombre obligatorio y longitud máxima de biografía.
- **FR-006**: El módulo MUST permitir editar miembros y sincronizar altas/bajas de servicios asignados.
- **FR-007**: El módulo MUST permitir activar y desactivar miembros.
- **FR-008**: El módulo MUST permitir eliminar miembros con confirmación explícita.
- **FR-009**: Las mutaciones MUST mostrar estado de progreso y bloquear acciones duplicadas.
- **FR-010**: Los errores de API MUST mostrarse sin exponer detalles internos.
- **FR-011**: La UI MUST usar exclusivamente tipos y documentos generados por `graphql-codegen`.
- **FR-012**: La pantalla `/equipo` MUST dejar de renderizar el placeholder “Próximamente”.

### Key Entities

- **Miembro del equipo / Especialista**: entidad del tenant con nombre, rol, avatar, biografía y estado activo.
- **Asignación especialista-servicio**: relación entre un especialista y los servicios que puede realizar.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 100% de los especialistas del tenant aparecen en la lista con sus datos principales.
- **SC-002**: Crear o editar un miembro se refleja en la lista en menos de 2 segundos en condiciones normales.
- **SC-003**: Las asignaciones de servicios se reflejan en el miembro tras guardar.
- **SC-004**: El 100% de las acciones destructivas solicita confirmación.
- **SC-005**: Las verificaciones de tipos, lint y tests del workspace móvil finalizan sin errores.

## Assumptions

- La API ya expone `mySpecialists`, `createMySpecialist`, `updateMySpecialist`, `deleteMySpecialist`, `specialists`, `assignServiceToSpecialist` y `unassignServiceFromSpecialist`.
- `MySpecialist` no incluye servicios; la lista usa `specialists(tenantId)`, que sí devuelve la relación.
- No se requieren endpoints ni cambios de esquema nuevos.
- El avatar se sube a Supabase Storage usando el helper compartido de medios.
- La spec se crea de forma retroactiva tras la implementación, para restaurar la trazabilidad SDD.

## Dependencies

- Sesión autenticada con tenant.
- API GraphQL de especialistas y asignaciones.
- Catálogo de servicios disponible para asignar.
- Tipos generados por `graphql-codegen`.
- Bucket `tenant-media` con permisos de subida para el avatar.
