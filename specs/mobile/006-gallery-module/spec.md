# Feature Specification: Mobile Gallery Module

**Feature Branch**: `006-gallery-module`

**Created**: 2026-10-25

**Status**: Draft

**Input**: Activar el módulo Galería en `apps/mobile`, sustituyendo el placeholder “Próximamente”: listar las fotos del tenant, añadir imágenes con URL, título, descripción y categoría, y eliminar fotos con confirmación, manteniendo estados de carga, refresco, vacío y error, y reutilizando la subida de imágenes compartida.

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Esta spec pertenece al dominio `mobile` y se apoya en los contratos GraphQL existentes de `apps/api` y el modelo `GalleryPhoto` de `packages/database`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consultar la galería (Priority: P1)

Un administrador autenticado abre Galería y ve las fotos de su negocio con su título, descripción y categoría, en el orden definido por el negocio.

**Why this priority**: Es la vista base del módulo y reemplaza el placeholder actual.

**Independent Test**: Abrir Galería con fotos existentes y comprobar que se muestran las fotos correctas del tenant y su información.

**Acceptance Scenarios**:

1. **Given** un tenant con fotos, **When** el administrador abre Galería, **Then** ve las fotos con su información asociada.
2. **Given** un tenant sin fotos, **When** abre Galería, **Then** ve un estado vacío informativo con una acción para añadir la primera foto.
3. **Given** la galería cargada, **When** hace pull-to-refresh, **Then** se consultan los datos más recientes y se muestra el progreso.
4. **Given** un fallo de red, **When** la consulta falla, **Then** ve un error comprensible con opción de reintentar.
5. **Given** una galería cargada, **When** cambia de módulo y vuelve, **Then** la galería conserva su información o se recarga mostrando loading.

---

### User Story 2 - Añadir una foto (Priority: P2)

Un administrador añade una foto a la galería eligiendo una imagen de su dispositivo o indicando una URL, y completando título, descripción y categoría opcionales.

**Why this priority**: Permite mantener actualizada la galería sin depender del panel web.

**Independent Test**: Añadir una foto válida y comprobar que aparece en la galería y persiste al reabrir.

**Acceptance Scenarios**:

1. **Given** el formulario de alta, **When** el administrador selecciona una imagen válida y guarda, **Then** la foto se añade a la galería.
2. **Given** una URL de imagen válida, **When** guarda sin subir archivo, **Then** la foto se añade con esa URL.
3. **Given** una imagen que supera el tamaño permitido o un formato no admitido, **When** intenta subirla, **Then** se muestra un error y no se añade.
4. **Given** un fallo de la API, **When** guarda, **Then** se muestra el error sin perder los datos del formulario.
5. **Given** una mutación en curso, **When** el administrador intenta guardar de nuevo, **Then** el botón queda bloqueado y muestra progreso.

---

### User Story 3 - Eliminar una foto (Priority: P3)

Un administrador elimina una foto de la galería con confirmación previa.

**Why this priority**: Completa el ciclo de gestión y evita contenido obsoleto.

**Independent Test**: Eliminar una foto, confirmar el diálogo y comprobar que desaparece de la galería.

**Acceptance Scenarios**:

1. **Given** una foto existente, **When** el administrador pulsa eliminar, **Then** se solicita confirmación explícita.
2. **Given** la confirmación, **When** la eliminación termina, **Then** la foto desaparece de la lista.
3. **Given** un fallo al eliminar, **When** la mutación falla, **Then** la foto permanece y se informa del error.
4. **Given** una eliminación en curso, **When** el administrador intenta otra acción, **Then** los controles se bloquean y se muestra el progreso.

---

### Edge Cases

- Galería sin fotos: estado vacío con llamada a la acción.
- Foto sin título, descripción o categoría: se muestra sin esos campos, sin romper la tarjeta.
- URL de imagen inválida o rota: se muestra un sustituto visual y no se bloquea la galería.
- Imagen con formato no admitido o superior a 5 MB: se rechaza antes de subir.
- Error al refrescar con datos previos: se conserva la galería y se informa del problema.
- Sesión expirada: la app redirige al login según el flujo existente.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El módulo MUST listar las fotos de la galería del tenant autenticado.
- **FR-002**: Cada foto MUST mostrar su imagen y, cuando existan, título, descripción y categoría.
- **FR-003**: El módulo MUST mostrar loading inicial, overlay de refresco, estado vacío y error con reintento.
- **FR-004**: El módulo MUST permitir añadir fotos mediante selección de imagen del dispositivo o URL manual.
- **FR-005**: El formulario de alta MUST permitir título, descripción y categoría opcionales.
- **FR-006**: El sistema MUST validar formato y tamaño máximo de imagen antes de subirla.
- **FR-007**: El módulo MUST permitir eliminar fotos con confirmación explícita.
- **FR-008**: Las mutaciones MUST mostrar estado de progreso y bloquear acciones duplicadas.
- **FR-009**: Los errores de API MUST mostrarse sin exponer detalles internos.
- **FR-010**: La UI MUST usar exclusivamente tipos y documentos generados por `graphql-codegen`.
- **FR-011**: La pantalla `/galeria` MUST dejar de renderizar el placeholder “Próximamente”.
- **FR-012**: La subida de imágenes MUST reutilizar el helper compartido de medios y el bucket de medios del tenant.

### Key Entities

- **Foto de galería**: imagen del tenant con URL, título, descripción, categoría, orden y posible especialista asociado.
- **Formulario de foto**: datos temporales para elegir imagen o URL y completar metadatos antes de guardar.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 100% de las fotos del tenant aparecen en la galería con su información disponible.
- **SC-002**: Añadir una foto se refleja en la galería en menos de 2 segundos en condiciones normales.
- **SC-003**: El 100% de las acciones destructivas solicita confirmación.
- **SC-004**: El 95% de los administradores completa el alta de una foto en su primer intento.
- **SC-005**: Las verificaciones de tipos, lint y tests del workspace móvil finalizan sin errores.

## Assumptions

- La API ya expone `gallery`, `addGalleryItem` y `removeGalleryItem`; no se requieren endpoints nuevos.
- El modelo `GalleryPhoto` de `packages/database` cubre los campos usados.
- La edición de metadatos y la reordenación de fotos quedan fuera de esta primera versión porque la API actual no expone mutaciones para ello.
- La subida de imágenes reutiliza el helper compartido y el bucket `tenant-media`.
- La galería móvil no gestiona la relación con especialistas en esta versión; se limita a imagen y metadatos.
- La spec se redacta antes de implementar, siguiendo el flujo SDD.

## Dependencies

- Sesión autenticada con tenant.
- API GraphQL de galería.
- Bucket `tenant-media` con permisos de subida.
- Tipos generados por `graphql-codegen`.
- Fotos existentes o permisos para añadirlas.
