# Foundly Labs — Modelo de Negocio & Visión Estratégica

**Versión:** 1.1.0
**Estado:** Binding
**Ámbito:** Ecosistema Foundly Labs (visión, módulos, licenciamiento y bundles)
**Autoridad:** Máxima. Según la jerarquía de `constitution.md`, este documento es la fuente de verdad superior del ecosistema; ningún principio, spec o regla de código puede contradecirlo.

---

## 1. Visión General

**Foundly Labs** es un ecosistema modular de soluciones SaaS **independientes pero interconectables**, construidas bajo una filosofía **Local-First + Cloud**.

- **Modulares por diseño**: cada producto resuelve un dominio concreto (finanzas, punto de venta, agendas, comercio) y puede adquirirse y usarse de forma autónoma.
- **Interconectables**: los módulos comparten identidad (SSO), datos y flujos cuando el cliente los combina, sin convertirse en un monolito.
- **Local-First**: los datos operativos viven en el dispositivo del usuario; el cloud actúa como extensión para sincronización, colaboración, delivery y respaldo, nunca como dependencia obligatoria.
- **Propuesta de valor**: software rápido, privado y sin dependencia de internet para operar, con la potencia de la nube cuando se necesita.

### Principios estratégicos

1. **Softerware que funciona offline primero** — la operación diaria nunca se bloquea por conectividad.
2. **Los datos son del usuario** — portabilidad y control total; sin encierro propietario.
3. **Un módulo, una decisión de compra** — sin obligar al cliente a pagar por lo que no usa.
4. **Ecosistema, no suite monolítica** — el valor crece al combinar módulos.
5. **FORGE Labs** es la organización matriz que desarrolla e impulsa el ecosistema.

### Segmentos objetivo

- **Comercios y pequeños negocios** (POS, Store, Finance).
- **Profesionales y estudios de servicios** (Book, Finance).
- **Creadores y equipos técnicos** (Maker, Mixbit).
- **Usuarios finales local-first** (Finance personal, herramientas locales).

---

## 2. Definición de Módulos

El ecosistema se compone de módulos SaaS. Cada módulo es una aplicación desplegable con specs locales propias (`apps/[app]/specs`), subordinadas a esta visión y a `constitution.md`.

| Módulo              | Dominio                       | Arquitectura técnica              | Estado        |
| ------------------- | ----------------------------- | --------------------------------- | ------------- |
| **Foundly Finance** | Contabilidad / finanzas base  | Mobile (Expo) — local-first       | En desarrollo |
| **Foundly POS**     | Punto de venta                | Local-first — Drizzle + SQLite    | Beta activa   |
| **Foundly Book**    | Agendas, servicios y citas    | React 19 + Vite — SPA interactiva | En desarrollo |
| **Foundly Store**   | E-commerce e inventario cloud | React 19 + Vite — SPA interactiva | En desarrollo |

### 2.1 Foundly Finance

**Rol en el ecosistema:** capa contable y financiera base del negocio y del usuario.

- **Problema**: la mayoría de las apps muestran un saldo que ignora lo que ya está comprometido; el usuario no conoce su liquidez real.
- **Propuesta**: calcula el **Saldo Disponible real** (ingresos, gastos, ahorros, deudas y dinero bloqueado) en una sola cifra.
- **Capacidades clave**:
  - Calculadora de Saldo Disponible real.
  - Simulador What-If.
  - Gestión de flujo de caja, metas y deudas.
  - Funcionamiento 100% local, privado, sin conectar el banco.
- **Interconexiones**: base contable consumible por POS, Book y Store para consolidar resultados del negocio.

### 2.2 Foundly POS

**Rol en el ecosistema:** operación de venta presencial y control del comercio.

- **Problema**: los negocios pequeños no saben al minuto qué vendieron, qué les deben y cuánto ganaron de verdad, y dependen de internet.
- **Propuesta**: punto de venta **local-first** que unifica ventas, inventario, clientes con crédito y caja en una sola herramienta, funcionando sin conexión.
- **Capacidades clave**:
  - Registro de ventas en segundos.
  - Control de inventario y stock.
  - Cuentas por cobrar y cobro a crédito.
  - Cierres de caja y conciliación por canal.
- **Arquitectura**: **Drizzle + SQLite** en el dispositivo; sincronización opcional con la nube.
- **Interconexiones**: alimenta a Finance con la operación real y comparte catálogo/inventario con Store.

### 2.3 Foundly Book

**Rol en el ecosistema:** gestión de agendas y servicios profesionales.

- **Problema**: los profesionales y estudios gestionan citas de forma dispersa (libretas, chats, agendas aisladas).
- **Propuesta**: módulo SaaS de **agendas, servicios, profesionales y citas** con reserva y administración centralizadas.
- **Capacidades clave**:
  - Agenda por profesional y por servicio.
  - Catálogo de servicios y duración.
  - Gestión de profesionales y disponibilidad.
  - Ciclo de vida de la cita (reserva, confirmación, recordatorio, historial).
  - Cobros y vínculo con la operación (POS/Store).
- **Arquitectura**: React 19 + Vite como SPA de cliente puro (módulo SaaS interactivo); consume la API GraphQL directamente desde el navegador.
- **Interconexiones**: sincroniza ingresos con Finance; puede cobrar servicios vía POS/Store.

### 2.4 Foundly Store

**Rol en el ecosistema:** comercio electrónico y logística de entrega.

- **Problema**: llevar el catálogo a internet y gestionar inventario y delivery requiere herramientas separadas y costosas.
- **Propuesta**: **e-commerce cloud** con gestión de productos, inventario y delivery integrados.
- **Capacidades clave**:
  - Catálogo y gestión de productos.
  - Inventario y stock sincronizado.
  - Pedidos y flujo de compra.
  - Delivery y seguimiento de entregas.
- **Arquitectura**: React 19 + Vite como SPA de cliente puro (misma arquitectura que Book); consume la API GraphQL desde el navegador. Almacenamiento no definido (pendiente de ratificar).
- **Interconexiones**: comparte inventario con POS y consolida ingresos en Finance.

### 2.5 Módulos complementarios del ecosistema

Además de los módulos comerciales principales, el ecosistema incluye herramientas especializadas que refuerzan la marca local-first:

- **Foundly Maker**: estudio local de sincronización de letras (karaoke) con exportación `.lrc` / `.ass`.
- **Mixbit**: motor de grid trading local-first con stop loss infranqueable.

> Estos módulos no forman parte del bundle comercial principal de Foundly Pass salvo decisión posterior documentada en este archivo.

---

## 3. Esquema de Licenciamiento — Foundly Pass

**Foundly Pass** es el sistema unificado de licenciamiento que gobierna el acceso a los módulos del ecosistema. Se apoya en dos ejes: **compra por módulo** y **acceso total a la suite**.

### 3.1 Compra / Suscripción por módulo individual

El cliente adquiere únicamente los módulos que necesita.

- **Modalidad**: suscripción (mensual / anual) y/o licencia perpetua por módulo, según lo defina cada spec local.
- **Acceso**: la licencia habilita el módulo y sus capacidades en la cuenta del usuario.
- **Independencia**: un módulo funciona de forma autónoma sin requerir otros módulos.
- **Escalabilidad**: el cliente puede añadir módulos en cualquier momento sin migraciones destructivas.

| Módulo          | Métrica de licencia       | Ciclo           | Precio | Estado      |
| --------------- | ------------------------- | --------------- | ------ | ----------- |
| Foundly Finance | Por cuenta                | Mensual / Anual | TBD    | A ratificar |
| Foundly POS     | Por negocio / dispositivo | Mensual / Anual | TBD    | A ratificar |
| Foundly Book    | Por profesional / agenda  | Mensual / Anual | TBD    | A ratificar |
| Foundly Store   | Por tienda / volumen      | Mensual / Anual | TBD    | A ratificar |

> Los importes concretos se documentan y ratifican aquí antes de publicarse en la landing (`apps/landing`). Ninguna UI puede mostrar precios no ratificados en este documento.

### 3.2 Foundly Suite — Acceso total

El **Foundly Suite** otorga acceso a **todos los módulos del ecosistema** mediante un **pago unificado**, con mejor relación valor-precio que la suma de módulos individuales.

- **Pago unificado**: una sola suscripción cubre Finance, POS, Book y Store.
- **Ventaja**: precio combinado inferior a la suma de licencias individuales.
- **Identidad centralizada (SSO)**: una única cuenta Foundly da acceso a todos los módulos incluidos, eliminando logins y cuentas duplicadas.
- **Experiencia integrada**: los módulos comparten perfil, organización y flujos cuando están en la suite.

### 3.3 SSO centralizado

Foundly Pass actúa como **proveedor de identidad único** del ecosistema.

- Una cuenta Foundly = acceso a todos los módulos licenciados.
- La autenticación es transversal; las apps consumen la identidad sin gestionar credenciales propias.
- El estado de licencia (qué módulos posee el usuario) se resuelve de forma central y se propaga a cada app.
- Local-first en los datos, **identidad centralizada en el acceso**.

### 3.4 Reglas de licenciamiento

1. Todo acceso a un módulo se rige por una licencia válida emitida por Foundly Pass.
2. La compra por módulo y la suite son **compatibles**: un cliente puede empezar con un módulo y migrar a la suite.
3. Los módulos incluidos en la suite DEBEN poder usarse de forma independiente entre sí.
4. Los precios y bundles solo son válidos si están ratificados en este documento y reflejados en la landing.
5. Ningún módulo puede imponer dependencia obligatoria de otro para su función principal (coherente con "Modulares por diseño").

---

## 4. Modelo de Ingresos & Bundles

### 4.1 Fuentes de ingreso

- **Suscripciones por módulo** (recurrente).
- **Foundly Suite** (recurrente, precio unificado).
- **Licencias perpetuas por módulo** (donde aplique).
- **Servicios y add-ons** (onboarding, integraciones, soporte), a definir por spec local.

### 4.2 Bundles

| Bundle        | Incluye                                          | Modelo         |
| ------------- | ------------------------------------------------ | -------------- |
| Módulo único  | 1 módulo a elección                              | Suscripción    |
| Foundly Suite | Finance + POS + Book + Store                     | Pago unificado |
| Add-ons       | Integraciones, delivery, servicios profesionales | A ratificar    |

### 4.3 Criterios de precio

- **Por valor de dominio**: el precio refleja el retorno operativo del módulo.
- **Progresión sin castigo**: ampliar módulos nunca penaliza al cliente; migrar a la suite debe ser atractivo.
- **Transparencia**: precios claros y ratificados, sin cargos ocultos.

---

## 5. Relación con la Arquitectura y las Specs

Este documento determina y condiciona:

- **La landing (`apps/landing`)**: toda sección de precios, bundles o Foundly Pass deriva de esta visión; ningún precio se inventa en la UI.
- **Las apps SaaS (`apps/book`, `apps/store`)**: sus flujos comerciales y de licencia respetan el esquema Foundly Pass.
- **Los paquetes (`packages/ui`, `packages/config`)**: el design system y la configuración compartida soportan la identidad centralizada (SSO) y los módulos del ecosistema.
- **Toda spec** (global o local) DEBE referenciar este documento y declarar qué decisiones de negocio respeta, según `constitution.md`.

---

## 6. Glosario

- **Módulo**: aplicación SaaS o herramienta del ecosistema con dominio propio.
- **Foundly Pass**: sistema unificado de licenciamiento e identidad.
- **Foundly Suite**: bundle de acceso total con pago unificado.
- **SSO centralizado**: autenticación única transversal a todos los módulos.
- **Local-First**: los datos y la operación priman en el dispositivo; el cloud es extensión opcional.
- **Bundle**: agrupación comercial de módulos y/o add-ons.

---

Foundly Labs Business Model — "Local-First, Agile Commerce, Zero Compromise."

**Version**: 1.1.0 | **Ratified**: 2026-10-08 | **Last Amended**: 2026-11-08

_Enmienda 2026-11-08 (MINOR 1.0.0 → 1.1.0): actualización de la arquitectura ratificada de Foundly Book
y Foundly Store de Next.js / React 19 a SPA React 19 + Vite (cliente puro). No cambian visión, módulos,
pricing ni licenciamiento. Plan de migración: `specs/book/024-react-spa-migration/`._
