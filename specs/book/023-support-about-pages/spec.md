# Feature Specification: Book Support and About Pages

**Feature Branch**: `023-support-about-pages`

**Created**: 2026-10-25

**Status**: Draft

**Input**: Activar los módulos Ayuda y Soporte y Acerca de Foundly en `apps/book`, sustituyendo sus placeholders por páginas informativas: FAQ y canales de contacto en Soporte; identidad de Foundly, versión del panel, descripción y enlaces institucionales/legales en Acerca.

**Referencias de gobernanza**: `specs/business-model.md` (máxima autoridad), `constitution.md`, `specs/architecture.md` y `code-rules.md`. Dominio `book`. Ambos módulos son contenido estático: no requieren API ni cambios de base de datos.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consultar ayuda y contactar con soporte (Priority: P1)

Un administrador autenticado abre Ayuda y Soporte en el panel web, consulta preguntas frecuentes y dispone de canales claros para contactar con Foundly.

**Why this priority**: Reduce el soporte manual y ofrece una salida clara desde el panel.

**Independent Test**: Abrir `/admin/soporte` y comprobar intro, FAQ, respuestas y canales de contacto.

**Acceptance Scenarios**:

1. **Given** el administrador autenticado, **When** abre Ayuda y Soporte, **Then** ve una introducción y preguntas frecuentes.
2. **Given** una pregunta, **When** la expande, **Then** ve su respuesta.
3. **Given** la sección de contacto, **When** pulsa un canal, **Then** se abre el correo o la web correspondiente.
4. **Given** la navegación del panel, **When** cambia de módulo, **Then** la sesión y el layout se mantienen.

---

### User Story 2 - Consultar información de Foundly (Priority: P2)

Un administrador autenticado abre Acerca de Foundly y ve la marca, la versión del panel, una descripción del producto y enlaces legales/institucionales.

**Why this priority**: Proporciona contexto de marca, versión y acceso a información legal desde el panel.

**Independent Test**: Abrir `/admin/acerca` y comprobar marca, versión, descripción y enlaces.

**Acceptance Scenarios**:

1. **Given** el administrador autenticado, **When** abre Acerca de Foundly, **Then** ve el logo/nombre de Foundly y la versión del panel.
2. **Given** la descripción, **When** la lee, **Then** entiende qué es Foundly y el rol del panel Book.
3. **Given** los enlaces institucionales, **When** pulsa uno, **Then** se abre el recurso público correspondiente.
4. **Given** la navegación del panel, **When** cambia de módulo, **Then** la sesión y el layout se mantienen.

---

### Edge Cases

- Textos largos: se muestran con scroll y sin cortes.
- Enlaces externos no disponibles: se informa sin romper la página.
- Versión no disponible: se muestra un valor de reserva.
- FAQ sin respuesta: no se muestra o se omite.
- El layout del panel y el drawer deben seguir funcionando con contenido largo.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `/admin/soporte` MUST dejar de renderizar el placeholder.
- **FR-002**: Soporte MUST mostrar introducción y FAQ con respuestas.
- **FR-003**: Soporte MUST ofrecer al menos un canal de contacto externo.
- **FR-004**: `/admin/acerca` MUST dejar de renderizar el placeholder.
- **FR-005**: Acerca MUST mostrar la identidad de Foundly y la versión del panel.
- **FR-006**: Acerca MUST mostrar una descripción del producto/ecosistema.
- **FR-007**: Acerca MUST incluir enlaces institucionales/legales.
- **FR-008**: Ambas páginas MUST ser legibles y desplazables en escritorio y móvil.
- **FR-009**: Los enlaces externos MUST abrirse de forma segura.
- **FR-010**: Ambas páginas MUST reutilizar el design system y componentes existentes.
- **FR-011**: No se requieren consultas, mutaciones ni estados de carga de datos.

### Key Entities

- **Pregunta frecuente**: par pregunta/respuesta.
- **Canal de contacto**: correo o web de soporte.
- **Información de producto**: nombre, descripción, versión y enlaces legales/institucionales.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El 100% de los placeholders de Soporte y Acerca desaparecen.
- **SC-002**: Un administrador encuentra una vía de contacto en menos de 30 segundos.
- **SC-003**: La versión y los enlaces institucionales son visibles sin pasos adicionales.
- **SC-004**: Ambas páginas renderizan correctamente con el layout del panel.
- **SC-005**: Verificaciones de tipos, lint, tests y build del dominio book finalizan sin errores.

## Assumptions

- Son páginas estáticas; no requieren API ni persistencia.
- El correo de soporte y los enlaces legales se definen como contenido de producto.
- La versión del panel se muestra desde una constante/configuración con valor de reserva.
- Se reutilizan `Card`, `Stack`, `Typography`, `Button` de `@foundly/ui` y el layout existente.
- La spec se redacta antes de implementar.

## Dependencies

- Layout autenticado de `apps/book`.
- Recursos públicos de Foundly (site, privacidad, términos).
- Design system `@foundly/ui`.
