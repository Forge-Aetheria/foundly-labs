# Feature Specification: Mobile Availability Module

**Feature Branch**: `008-availability-module`

**Created**: 2026-10-25

**Status**: Draft

**Input**: Activar el módulo Disponibilidad en `apps/mobile`, sustituyendo el placeholder “Próximamente”: configurar el horario semanal de atención por día (abierto/cerrado, hora inicio y fin), gestionar bloqueos puntuales de fecha/hora o día completo con motivo, y eliminarlos con confirmación, manteniendo loading, refresco, vacío y error.

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Esta spec pertenece al dominio `mobile` y se apoya en los contratos GraphQL existentes de `apps/api` y los modelos `Availability` y `TimeBlock` de `packages/database`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configurar el horario semanal (Priority: P1)

Un administrador autenticado abre Disponibilidad, ve los siete días de la semana con su estado abierto/cerrado y horario, y puede modificar los días y horas de atención para guardar el horario semanal.

**Why this priority**: Es la configuración base que determina cuándo se pueden reservar citas.

**Independent Test**: Abrir Disponibilidad, cambiar el horario de un día, guardar y reabrir para confirmar la persistencia.

**Acceptance Scenarios**:

1. **Given** un tenant con horario configurado, **When** el administrador abre Disponibilidad, **Then** ve los siete días con su estado y horas de inicio/fin.
2. **Given** un día cerrado, **When** el administrador lo abre y define horas, **Then** el día queda editable como abierto.
3. **Given** un día abierto, **When** el administrador lo cierra, **Then** el día deja de tener horario activo.
4. **Given** cambios pendientes, **When** guarda el horario, **Then** los cambios persisten y se confirma el guardado.
5. **Given** una hora de fin anterior o igual a la de inicio, **When** guarda, **Then** se muestra un error de validación.
6. **Given** un fallo de API, **When** guarda, **Then** se muestra el error sin perder los cambios del formulario.

---

### User Story 2 - Consultar bloqueos puntuales (Priority: P2)

Un administrador ve los bloqueos de agenda existentes con su fecha, rango horario o día completo y motivo.

**Why this priority**: Permite entender qué franjas están bloqueadas sin usar el panel web.

**Independent Test**: Abrir Disponibilidad con bloqueos existentes y comprobar su listado; sin bloqueos, comprobar el estado vacío.

**Acceptance Scenarios**:

1. **Given** un tenant con bloqueos, **When** abre Disponibilidad, **Then** ve cada bloqueo con fecha, horario y motivo.
2. **Given** un bloqueo de día completo, **When** se muestra, **Then** se identifica como día completo.
3. **Given** un tenant sin bloqueos, **When** abre Disponibilidad, **Then** ve un estado vacío informativo.
4. **Given** un fallo al cargar bloqueos, **When** la consulta falla, **Then** se muestra un error con reintento.

---

### User Story 3 - Añadir y eliminar bloqueos (Priority: P3)

Un administrador crea un bloqueo puntual indicando fecha, rango horario o día completo y motivo, y elimina bloqueos existentes con confirmación.

**Why this priority**: Completa la gestión operativa de excepciones de agenda.

**Independent Test**: Crear un bloqueo, comprobar que aparece y eliminarlo con confirmación.

**Acceptance Scenarios**:

1. **Given** el formulario de bloqueo, **When** el administrador elige fecha, horas y motivo, **Then** el bloqueo se crea y aparece en la lista.
2. **Given** el modo día completo, **When** guarda, **Then** el bloqueo cubre el día completo.
3. **Given** una fecha u horas inválidas, **When** guarda, **Then** se muestra un error y no se crea.
4. **Given** un bloqueo existente, **When** el administrador pulsa eliminar, **Then** se solicita confirmación.
5. **Given** la confirmación, **When** la eliminación termina, **Then** el bloqueo desaparece de la lista.
6. **Given** una mutación en curso, **When** el administrador intenta otra acción, **Then** los controles se bloquean y se muestra progreso.

---

### Edge Cases

- Día abierto sin horas completas: se valida antes de guardar.
- Bloqueo con fin anterior o igual al inicio: se rechaza.
- Bloqueo sin motivo: se permite; se muestra como sin motivo.
- Múltiples bloqueos en la misma fecha: se listan todos sin colisión visual.
- Error al refrescar con datos previos: se conservan los datos y se informa del problema.
- Sesión expirada: la app redirige al login según el flujo existente.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El módulo MUST mostrar los siete días de la semana con estado abierto/cerrado y horas de inicio/fin.
- **FR-002**: El módulo MUST permitir abrir/cerrar cada día y editar sus horas.
- **FR-003**: El módulo MUST validar que la hora de fin sea posterior a la de inicio en días abiertos.
- **FR-004**: El módulo MUST guardar el horario semanal y confirmar el resultado.
- **FR-005**: El módulo MUST listar los bloqueos puntuales con fecha, horario/día completo y motivo.
- **FR-006**: El módulo MUST permitir crear bloqueos por rango horario o día completo.
- **FR-007**: El módulo MUST validar fecha y horas antes de crear un bloqueo.
- **FR-008**: El módulo MUST permitir eliminar bloqueos con confirmación explícita.
- **FR-009**: El módulo MUST mostrar loading inicial, overlay de refresco, vacío y error con reintento.
- **FR-010**: Las mutaciones MUST mostrar estado de progreso y bloquear acciones duplicadas.
- **FR-011**: Los errores de API MUST mostrarse sin exponer detalles internos.
- **FR-012**: La UI MUST usar exclusivamente tipos y documentos generados por `graphql-codegen`.
- **FR-013**: La pantalla `/disponibilidad` MUST dejar de renderizar el placeholder “Próximamente”.

### Key Entities

- **Regla de disponibilidad**: día de la semana con horario de inicio/fin, granularidad, lead time, horizonte y descansos.
- **Bloqueo de tiempo**: excepción con fecha/hora de inicio y fin, motivo y posible especialista.
- **Horario semanal**: conjunto de siete días con estado abierto/cerrado y horas.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 100% de los días de la semana aparecen con su estado y horario.
- **SC-002**: Guardar el horario se refleja al reabrir la vista en menos de 2 segundos en condiciones normales.
- **SC-003**: Crear o eliminar un bloqueo se refleja en la lista en menos de 2 segundos.
- **SC-004**: El 100% de las acciones destructivas solicita confirmación.
- **SC-005**: Las verificaciones de tipos, lint y tests del workspace móvil finalizan sin errores.

## Assumptions

- La API ya expone `availability`, `createAvailability`, `updateAvailability`, `removeAvailability`, `timeBlocks`, `addTimeBlock` y `removeTimeBlock`; no se requieren endpoints nuevos.
- Los modelos `Availability` y `TimeBlock` de `packages/database` cubren los campos usados.
- La primera versión móvil replica el alcance del editor web: horario semanal y bloqueos; no expone edición de descansos, granularidad, lead time ni horizonte.
- No se incluye selector de especialista; se gestiona la disponibilidad general del tenant.
- Las horas se manejan como cadenas `HH:mm` y las fechas como `YYYY-MM-DD`, coherentes con la API.
- La spec se redacta antes de implementar, siguiendo el flujo SDD.

## Dependencies

- Sesión autenticada con tenant.
- API GraphQL de disponibilidad y bloqueos.
- Tipos generados por `graphql-codegen`.
- Datos existentes para validar edición y eliminación.
