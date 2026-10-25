<!--
Sync Impact Report
==================
Version change: 5.2.0 -> 5.3.0
Bump rationale: Enmienda 5.3.0 (MINOR): adición material de un principio no negociable. Se
  incorpora el Principio 5.VII "Reutilización Obligatoria de Componentes y Lógica", que exige buscar y
  reutilizar o extender artefactos existentes antes de crear componentes, hooks, funciones, tipos,
  constantes o archivos nuevos, y prohíbe la duplicación entre apps. Este documento es un ESPEJO de la
  constitución canónica de la raíz (`constitution.md` v5.3.0) y debe mantenerse sincronizado con ella.

Modified principles: N/A
Renamed principles: N/A
Added sections: 5.VII Reutilización Obligatoria de Componentes y Lógica
Removed sections: N/A

Deferred TODOs:
  - TODO(PERSISTENCE): definir y ratificar la estrategia de almacenamiento en specs/architecture.md.
  - TODO(RATIFICATION_DATE): confirmar la fecha real de ratificación.
-->

# Foundly Labs — Constitución de Desarrollo

**Versión:** 5.3.0
**Estado:** Binding
**Ámbito:** Monorepo del ecosistema Foundly Labs (landing, book, store)
**Stack Base:** Astro 5 (SSG, Server-First Islands) · Next.js / React 19 (SaaS) · Tailwind CSS v4 · TypeScript estricto
**Metodología:** Spec-Driven Development (SDD)

## 1. Jerarquía de Autoridad (Rule of Law)

En caso de cualquier ambigüedad, contradicción o conflicto técnico o funcional durante el desarrollo, se aplica estrictamente el siguiente orden de jerarquía de autoridad:

$$
\text{specs/business-model.md} \gt \text{constitution.md} \gt \text{specs/architecture.md} \gt \text{code-rules.md} \gt \text{specs de dominio}
$$

- **`specs/business-model.md`**: define el pricing, bundles, propuesta de valor de la marca y las reglas del ecosistema Foundly Labs. Es de referencia **obligatoria** para cualquier spec, plan o implementación.
- **`constitution.md`** (este documento): define los principios no negociables de arquitectura, calidad, diseño y flujo de trabajo.
- **`specs/architecture.md`**: define la topología del monorepo, límites entre apps y paquetes, y las decisiones de arquitectura vigentes.
- **`code-rules.md`**: define las normas de código TypeScript, Astro, React/Next.js, CSS y estructura de componentes.
- **`specs de dominio`** (`/specs/<dominio>/<nnn>-<feature>/`): especifican el comportamiento detallado de cada vista, isla interactiva, flujo o servicio, **acotadas a un único dominio** (`shared-ui`, `landing`, `book`, `store`, `mobile` o `api`).

Ninguna decisión de implementación puede violar un nivel superior de esta jerarquía. Ante conflicto entre dos documentos, prevalece el de mayor autoridad.

## 2. Estructura de Especificaciones por Dominio

Todas las especificaciones del proyecto residen **exclusivamente** en la carpeta raíz `/specs`, organizadas en subdirectorios por dominio. **No existen specs locales bajo `apps/*` ni `packages/*`.**

### I. Dominios de especificación

| Dominio     | Ruta                | Alcance                                                                 |
| ----------- | ------------------- | ----------------------------------------------------------------------- |
| `shared-ui` | `/specs/shared-ui/` | Design system y paquetes compartidos (`packages/ui`, `packages/config`) |
| `landing`   | `/specs/landing/`   | Vitrina pública `apps/landing` (Astro 5, SSG)                           |
| `book`      | `/specs/book/`      | Módulo SaaS interactivo `apps/book` (Next.js / React 19)                |
| `store`     | `/specs/store/`     | Módulo de comercio `apps/store` (Next.js / React 19)                    |
| `mobile`    | `/specs/mobile/`    | App móvil `apps/mobile` (Expo / React Native, Expo Router)              |
| `api`       | `/specs/api/`       | Backend / API `apps/api` (NestJS, Node.js)                              |

Cada especificación de dominio vive en `/specs/<dominio>/<nnn>-<feature>/` y usa numeración secuencial **dentro de su propio dominio**.

### II. Documentos globales

Los documentos de gobernanza transversal (no ligados a un dominio) residen en la raíz de `/specs`:

- `specs/business-model.md` — pricing, bundles, licencias y propuesta de valor.
- `specs/architecture.md` — topología del monorepo y límites entre apps/paquetes.
- `specs/system-design.md` — sistema de diseño y paleta canónica.
- `constitution.md` y `code-rules.md` — en la raíz del repositorio.

### III. Reglas de las specs de dominio

- **Ubicación única**: ninguna spec puede residir fuera de `/specs/<dominio>/`.
- **Regla previa a `/speckit.specify`**: antes de ejecutar cualquier comando `/speckit.specify`, la IA DEBE identificar el dominio de la nueva especificación. Si el usuario no lo especificó, la IA DEBE preguntarlo explícitamente antes de crear nada. Dominios válidos: `shared-ui`, `landing`, `book`, `store`, `mobile`, `api`. La spec DEBE crearse con `SPECIFY_FEATURE_DIRECTORY=specs/<dominio>/<nnn>-<feature>`.
- **Acotadas a un dominio**: solo aplican al dominio que las contiene.
- **Subordinadas**: NUNCA pueden contradecir `specs/business-model.md`, `constitution.md`, `specs/architecture.md` ni `code-rules.md`.
- **Sin duplicación normativa**: si una regla aplica a más de un dominio, DEBE promoverse a un documento global en `/specs` o a `shared-ui`, nunca duplicarse.
- **Referencia obligatoria**: toda spec DEBE referenciar explícitamente `specs/business-model.md` y declarar qué decisiones de esa jerarquía superior respeta.
- **Resolución de conflictos**: ante contradicción, prevalece siempre el documento de mayor autoridad según el Principio 1.

## 3. Estructura del Monorepo

El repositorio se organiza como **monorepo** con dos espacios: `apps/` (aplicaciones desplegables) y `packages/` (código compartido).

```text
/
├── apps/                                  # Aplicaciones desplegables
│   ├── landing/                           # Astro 5 + Tailwind v4 (SSG)
│   │   ├── public/                        # Assets de branding, favicons, robots
│   │   ├── src/
│   │   │   ├── pages/                     # Rutas delgadas: solo renderiza <Modulo>View
│   │   │   ├── modules/<modulo>/          # Secciones/UI por dominio (home, legal) + <Modulo>View.astro
│   │   │   ├── shared/                    # Reutilizable (components/, data/, types/, utils/)
│   │   │   ├── content/                   # Content collections (pricing, faqs, features)
│   │   │   ├── styles/                    # tokens.css + global.css
│   │   │   ├── assets/                    # Assets locales procesados por Astro
│   │   │   └── env.d.ts
│   │   └── astro.config.mjs
│   │
│   ├── book/                              # Next.js / React 19 (SaaS interactivo)
│   │   ├── src/
│   │   │   ├── app/                       # Capa de rutas App Router (delgada): solo renderiza <Modulo>View
│   │   │   ├── modules/<modulo>/          # Lógica de negocio por dominio (components/, dialogs/, hooks/, utils/, tests/, <Modulo>View.tsx)
│   │   │   └── shared/                    # Reutilizable cross-app (components/, utils/, types/, infra/, tenancy/)
│   │   ├── public/
│   │   └── next.config.mjs
│   │
│   ├── store/                             # Next.js / React 19 (SaaS interactivo)
│   │   ├── src/
│   │   │   ├── app/                       # Capa de rutas App Router (delgada): solo renderiza <Modulo>View
│   │   │   ├── modules/<modulo>/          # Lógica de negocio por dominio (components/, dialogs/, hooks/, utils/, tests/, <Modulo>View.tsx)
│   │   │   └── shared/                    # Reutilizable cross-app (components/, utils/, types/, infra/)
│   │   ├── public/
│   │   └── next.config.mjs
│   │
│   ├── mobile/                            # Expo / React Native (Expo Router)
│   └── api/                               # Backend / API (NestJS, Node.js)
│       ├── src/
│       ├── nest-cli.json
│       └── tsconfig.json
│
├── packages/                              # Código compartido del monorepo
│   ├── ui/                                # Design system Clean Light UI (componentes reutilizables)
│   └── config/                            # Configuración compartida (eslint, tsconfig, prettier, tailwind)
│
├── specs/                                 # TODAS las specs, organizadas por dominio
│   ├── business-model.md                  # Gobernanza global
│   ├── architecture.md                    # Gobernanza global
│   ├── system-design.md                   # Gobernanza global
│   ├── shared-ui/                         # Specs de paquetes compartidos / design system
│   ├── landing/                           # Specs de apps/landing
│   ├── book/                              # Specs de apps/book
│   ├── store/                             # Specs de apps/store
│   ├── mobile/                            # Specs de apps/mobile (Expo)
│   └── api/                               # Specs de apps/api (backend)
├── constitution.md                        # Documento raíz (este archivo)
├── code-rules.md
└── package.json                           # Raíz del workspace
```

### I. Stack por aplicación

| App            | Framework          | Render                  | Rol                                                         |
| -------------- | ------------------ | ----------------------- | ----------------------------------------------------------- |
| `apps/landing` | Astro 5            | SSG (estático)          | Vitrina pública del ecosistema, SEO y performance           |
| `apps/book`    | Next.js / React 19 | Módulo SaaS interactivo | Flujos de producto con estado y datos en tiempo de petición |
| `apps/store`   | Next.js / React 19 | Módulo SaaS interactivo | Comercio/licencias y flujos transaccionales                 |
| `apps/mobile`  | Expo / RN 0.88     | App nativa (iOS/Android) | App móvil de administración de tenant                      |
| `apps/api`     | NestJS (Node.js)   | API (servidor HTTP)    | Backend de servicios/API del ecosistema                    |

- **`apps/landing`**: Astro 5 + Tailwind CSS v4, salida estática (SSG), cero JS por defecto y islas React solo cuando son estrictamente necesarias.
- **`apps/book` y `apps/store`**: Next.js con React 19, orientadas a módulos SaaS interactivos; pueden usar Server Components y Server Actions.
- **`apps/mobile`**: Expo SDK 58 + React Native + Expo Router, app nativa iOS/Android para administradores de tenant; su código se especifica bajo `/specs/mobile/`.
- **`apps/api`**: NestJS (Node.js), servidor HTTP del ecosistema; su código se especifica bajo `/specs/api/`.

**Gates de verificación por app**:

| App           | Build                                   | Test                                    |
| ------------- | --------------------------------------- | --------------------------------------- |
| `apps/book`   | `npm run build -w @foundly/book`        | `npm run test -w @foundly/book`         |
| `apps/store`  | `npm run build -w @foundly/store`       | `npm run test -w @foundly/store`        |
| `apps/mobile` | `pnpm --filter @foundly/mobile build`   | `pnpm --filter @foundly/mobile test`    |
| `apps/api`    | `npm run build -w @foundly/api`         | `npm run test -w @foundly/api`          |

### II. Paquetes compartidos (`packages/`)

- **`packages/ui`**: componentes y tokens del design system Clean Light UI reutilizables entre apps.
- **`packages/config`**: configuración base compartida (ESLint, TypeScript, Prettier, Tailwind).

Reglas de los paquetes:

- El código compartido vive únicamente en `packages/`; se prohíbe duplicar la misma lógica entre apps.
- Los paquetes NO pueden depender de una app concreta (`packages/*` nunca importa desde `apps/*`).
- Las dependencias entre paquetes DEBEN ser acíclicas.

## 4. Gobernanza del Código (`code-rules.md`)

`code-rules.md` es el archivo de gobernanza y la referencia normativa obligatoria para la escritura de código en todo el monorepo. Toda contribución debe cumplirlo estrictamente.

- **Ámbito**: tipado estricto, arquitectura por app (Astro islas / Next.js), convenciones de nombres y ubicación, sistema de diseño/Tailwind, separación de contenido y componentes, desempeño y formularios.
- **Carácter**: inviolable. Dentro de la jerarquía se subordina únicamente a `specs/business-model.md`, a `constitution.md` y a `specs/architecture.md`.
- **Obligación**: antes de escribir o modificar código de producción, consulta `code-rules.md` y verifica que la implementación cumple cada regla aplicable.

## 5. Principios Técnicos & Arquitectura

### I. Spec-Driven Development (SDD) Obligatorio

- "No spec, no code": ninguna línea de código de producción o refactorización mayor debe escribirse sin una especificación previa aprobada.
- Toda spec DEBE **referenciar explícitamente `specs/business-model.md`**, ya que es la máxima autoridad del ecosistema.
- El flujo es secuencial: **Spec (EARS) → Plan de Arquitectura → Tareas → Implementación**.
- Todas las specs residen exclusivamente en `/specs/<dominio>/` (`shared-ui`, `landing`, `book`, `store`, `mobile`, `api`); los documentos transversales viven en la raíz de `/specs`. Antes de `/speckit.specify` la IA DEBE identificar o preguntar el dominio.

### II. Server-First & Zero-JS Default

- **`apps/landing`**: todo el maquetado, estructura, textos, ventajas SEO y activos estáticos se renderizan como HTML en build time. La interactividad se limita a islas (`client:*`).
- Directivas de hidratación (mínima necesaria):
  - `client:load`: reservado únicamente para el Hero principal.
  - `client:visible`: componentes interactivos fuera del viewport inicial (calculadoras, modales, demos).
  - `client:idle`: widgets secundarios o analíticas.
  - `client:media`: elementos condicionales según el viewport.
- **`apps/book` y `apps/store`**: priorizar Server Components; el JavaScript de cliente se justifica por interacción real (formularios, tablas, gráficos, tiempo real).

### III. Desempeño & Core Web Vitals

- **Objetivo**: 100/100 en Google Lighthouse Desktop y ≥ 98 en Mobile para Performance, Accessibility y SEO en toda app pública.
- Los lienzos 3D / WebGL deben encapsularse en componentes aislados y destruir explícitamente sus contextos (`dispose()`) al desmontar para evitar fugas de memoria.

### IV. Tipado Estricto

- La configuración de TypeScript debe mantener `strict: true` y `noImplicitAny: true` en todo el monorepo.
- Se prohíbe el uso de `any` y los casteos implícitos (`as targetType`); todo prop, estado o contrato de datos debe estar tipado mediante interfaces o schemas de Zod.
- Los tipos globales compartidos viven en `packages/*` o en `src/shared/types/` según su alcance.

### V. Frontera Server/Client (React Server Components)

Aplica a `apps/book` y `apps/store` (Next.js App Router, React 19).

- Un archivo **sin** `'use client'` es un Server Component. Los Server Components **NUNCA** pueden pasar valores no serializables a Client Components: las **funciones** (`sx`-función, `onClick`/`onChange`/`onClose`, render props, etc.) cruzan la frontera RSC y provocan el error `Functions cannot be passed directly to Client Components`.
- Los primitivos de `packages/ui` DEBEN permanecer serializables y renderizables desde servidor; solo `FoundlyThemeProvider` es `'use client'`. Su JSX interno no puede contener funciones.
- Los estilos dependientes del tema en un Server Component se expresan con **rutas de token** (p. ej. `sx={{ backgroundColor: 'surface.badgePill' }}`) o valores resueltos desde el tema, nunca con callbacks.
- Si se requiere interacción o un `sx` dinámico con callback, el componente que lo declara DEBE ser `'use client'` y consumirse desde otro cliente.
- Detalle operativo, ejemplos y verificación: `code-rules.md` §8.

### VI. Capa de Datos por Módulo y Hooks de Cliente (apps/book, apps/store)

Aplica a `apps/book`, `apps/store` y `apps/mobile`. La lógica de datos de cada módulo de dominio DEBE vivir dentro de su propio módulo (`src/modules/<modulo>/`), nunca dispersa en la UI ni en `shared/infra`.

**Estructura canónica de un módulo con datos:**

```text
src/modules/<modulo>/
├── actions.ts     # Funciones de servidor: lecturas (fetches) y Server Actions
├── hooks.ts       # Hooks de cliente que envuelven las interacciones
├── <modulo>.graphql  # Operaciones GraphQL del módulo (input de codegen)
├── components/    # Vistas y componentes de UI
├── dialogs/       # (cuando aplique) flujos modales
├── utils/         # Helpers puros, schemas, mappers
├── tests/
└── <Modulo>View.tsx
```

- **`actions.ts`**: única puerta de acceso a la API para el módulo. Contiene las funciones de servidor (lecturas y Server Actions). Los Server Components las consumen para el render inicial.
- **`<modulo>.graphql`**: las operaciones GraphQL (queries/mutations) del módulo viven dentro del módulo; el `codegen` las recolecta (`src/modules/**/*.graphql`). Las operaciones transversales viven en su carpeta `shared/<área>/` (p. ej. `shared/tenancy/`).
- **`hooks.ts`**: hooks de cliente (`'use client'`), único punto desde el que los componentes interactivos disparan acciones. Envuelven las Server Actions de `actions.ts`.
- **Prohibición en UI**: los componentes/vistas (cualquier `components/`, `dialogs/` o `<Modulo>View`) NO pueden llamar directamente a `useQuery`, `useMutation`, `apiRequest` ni a Server Actions. Toda interacción pasa por un hook de `hooks.ts`.
- **Nomenclatura obligatoria**: `use<Acción><Entidad|Módulo>` (p. ej. `useFetchProfile`, `useCreateService`, `useUpdateAvailability`, `useCancelAppointment`).
- **Tipado por codegen**: `actions.ts`/`hooks.ts` DEBEN usar exclusivamente los documentos y tipos autogenerados por `graphql-codegen` (`generated.ts`). Se prohíbe declarar DTOs o tipos manuales del contrato GraphQL.
- **Coherencia con Server-First (§5.II)**: las lecturas de render se resuelven en Server Components a través de `actions.ts`; `hooks.ts` existe para la interacción real de cliente (formularios, tablas, modales), nunca para reemplazar el render en servidor.
- **`shared/infra` deprecada y en disolución**: no puede alojar lógica de dominio ni acciones de servidor. Todo archivo de acciones/fetch de un dominio DEBE residir en el `actions.ts` de su módulo. Su contenido transversal se reubica en carpetas de propósito claro (`shared/api/`, `shared/types/`, `shared/auth/`) y `shared/infra/` DEBE eliminarse. Plan de migración: `specs/book/011-module-data-layer/`.

### VII. Reutilización Obligatoria de Componentes y Lógica

Antes de crear cualquier componente, hook, función, tipo, constante o archivo, se DEBE buscar una implementación existente en `packages/ui`, en `src/shared/` y en el módulo de dominio correspondiente.

- **Reutilizar primero**: si existe un artefacto que cubre el caso, DEBE reutilizarse o extenderse mediante props/variantes. Crear un duplicado está prohibido.
- **Creación justificada**: solo se permite un artefacto nuevo cuando no exista uno reutilizable; la justificación DEBE quedar en el PR o commit.
- **Componentes canónicos**: los elementos visuales compartidos (avatares, badges, botones, cards, iconos, inputs) viven en un único componente canónico y se adaptan por variantes, no por copias.
- **Promoción, no duplicación**: la lógica o UI repetida entre apps se promueve a `packages/ui` o `src/shared/`; nunca se copia de una app a otra.
- **Alcance**: aplica a todo el monorepo y a cualquier iteración de implementación.

## 6. Guía de Diseño, Estética & Sistema de Tokens (Clean Light UI)

La interfaz hereda la línea de diseño limpia, clara y de alto contraste de Foundly POS, proyectando una marca unificada (Lavender-to-White Body) en todas las apps.

### I. Paleta de Colores & Tokens

La paleta canónica del ecosistema es la de **`specs/system-design.md` v3.0.0** y su fuente de verdad ejecutable es **`packages/ui/src/styles/tokens.css`**. Ningún componente puede declarar colores fuera de estos tokens.

```css
:root {
  /* Backgrounds & Surfaces */
  --bg-app-body: #faf8ff;
  --bg-header: #ffffff;
  --bg-footer: #f1f5f9;
  --bg-card-light: #ffffff;
  --bg-card-hover: #f8fafc;
  --bg-badge-pill: #f1f5f9;
  --border-subtle: #e2e8f0;
  --border-lavender: #cbd5e1;
  --surface-glass: rgba(255, 255, 255, 0.85);

  /* Brand Primary (Master Accent) */
  --accent-primary: #6c5ce7;
  --accent-primary-hover: #5a4ad1;
  --accent-primary-soft: #eeecfe;

  /* Core Semantics */
  --accent-positive: #10b981;
  --accent-positive-soft: #d1fae5;
  --accent-negative: #ef4444;
  --accent-negative-soft: #fee2e2;
  --accent-warning: #f59e0b;
  --accent-warning-soft: #fef3c7;
  --accent-info: #3b82f6;
  --accent-info-soft: #dbeafe;

  /* Domain-Specific Accents (App Identity) */
  --brand-book: #7c3aed;
  --brand-store: #059669;
  --brand-pos: #2563eb;

  /* Typography & Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  /* Borders & Shadows */
  --shadow-card: 0px 8px 16px rgba(108, 92, 231, 0.05);
  --shadow-fab: 0px 10px 20px rgba(108, 92, 231, 0.35);
}
```

> Las extensiones propias de una app (p. ej. el degradado superior de la landing) NO se declaran aquí; viven en los tokens locales de esa app, siempre derivadas de estos valores.

### II. Normas de Composición Visual & Cards

- **Superficie de tarjetas**: fondo blanco puro (#FFFFFF), bordes ultra-finos lavanda (1px solid #E6E4F0), radio 20px (`rounded-3xl`) y sombras suaves suspendidas.
- **Pills & Badges**: radio completo (`rounded-full`), fondo lavanda claro (#F0EEF9) y texto acentuado en púrpura (#6C5CE7).
- **Icon Containers**: contenedores circulares con fondo lavanda claro (#F0EEF9) e iconos en púrpura de marca (#6C5CE7).
- **Cifras y Números**: alineación tabular (`tabular-nums`) y peso tipográfico 700 (Bold).
- **Tokens**: los colores deben mapear estrictamente al sistema de diseño (`packages/ui` / `tailwind.config.mjs`); se prohíben los colores mágicos inline.

## 7. Convenciones de Rutas y Nombres (Normalizado)

Estas rutas son las canónicas; cualquier documento que use otras rutas debe corregirse.

| Elemento                      | Ruta canónica                                                        | Convención              |
| ----------------------------- | -------------------------------------------------------------------- | ----------------------- |
| Rutas (Astro)                 | `apps/landing/src/pages/`                                            | kebab-case (`.astro`)   |
| Vistas de módulo (Astro)      | `apps/landing/src/modules/<modulo>/<Modulo>View.astro`               | PascalCase (`.astro`)   |
| Secciones (Astro)             | `apps/landing/src/modules/<modulo>/components/`                      | PascalCase (`.astro`)   |
| Islas interactivas (Astro)    | `apps/landing/src/modules/<modulo>/islands/`                         | PascalCase (`.tsx`)     |
| UI reutilizable (Astro)       | `apps/landing/src/shared/components/ui/`                             | PascalCase (`.astro`)   |
| SEO / layout / chrome (Astro) | `apps/landing/src/shared/components/`                                | PascalCase (`.astro`)   |
| Datos / content (Astro)       | `apps/landing/src/shared/data/` y `apps/landing/src/content/`        | kebab-case              |
| Tipos / utils (Astro)         | `apps/landing/src/shared/types/` y `apps/landing/src/shared/utils/`  | kebab-case / camelCase  |
| Rutas App Router (Next)       | `apps/{book,store}/src/app/`                                         | kebab-case (`.tsx`)     |
| Vistas de módulo (Next)       | `apps/{book,store}/src/modules/<modulo>/<Modulo>View.tsx`            | PascalCase (`.tsx`)     |
| Módulos de dominio (Next)     | `apps/{book,store}/src/modules/<modulo>/`                            | kebab-case              |
| Acciones de servidor (Next)   | `apps/{book,store}/src/modules/<modulo>/actions.ts`                  | camelCase (`.ts`)       |
| Hooks de cliente (Next)       | `apps/{book,store}/src/modules/<modulo>/hooks.ts`                    | `use*` (`.ts`)          |
| Operaciones GraphQL (Next)    | `apps/{book,store}/src/modules/<modulo>/<modulo>.graphql`            | kebab-case (`.graphql`) |
| Tests (Next)                  | `apps/{book,store}/src/**/tests/`                                    | `*.test.ts(x)`          |
| Código compartido (Next)      | `apps/{book,store}/src/shared/`                                      | kebab-case / PascalCase |
| Componentes compartidos       | `packages/ui/`                                                       | PascalCase              |
| Configuración compartida      | `packages/config/`                                                   | kebab-case              |
| Specs de dominio              | `/specs/<dominio>/` (`shared-ui`, `landing`, `book`, `store`, `mobile`, `api`) | `nnn-feature`           |
| Documentos globales           | `/specs/` (raíz)                                                     | kebab-case              |

> **Corrección explícita**: todas las apps comparten el patrón **rutas delgadas + `modules/` + `shared/`**. En `apps/landing` las rutas (`src/pages/`) solo renderizan su `<Modulo>View`; las secciones viven en `src/modules/<modulo>/components/`, las islas en `src/modules/<modulo>/islands/` y lo reutilizable (UI, SEO, layout, datos, tipos, utils) en `src/shared/`. En `apps/book` y `apps/store` las rutas (`src/app/`) también son delgadas y la lógica vive en `src/modules/` y `src/shared/`. Se elimina cualquier referencia previa a `src/components/`, `src/data/`, `src/layouts/`, `src/types/` o `src/utils/`.

> **TODO(monorepo) — ubicación de tests.** La regla de tests (`code-rules.md` §10) ya se cumple en `apps/book`; está pendiente extenderla a `packages/*` y `apps/api`. **CUANDO LEAS ESTO, PARA UN MOMENTO TU PROCESO Y CONFIRMA CON EL USUARIO SI DEBEMOS HACERLO AHORA.** Detalle y lista de pendientes en `code-rules.md` §10.

## 8. Convención de Commits y Flujo de Trabajo

### Convención de Commits

- `feat(scope)`: implementación de nuevas vistas o islas descritas en specs.
- `fix(scope)`: corrección de fallas o estilos.
- `spec(scope)`: creación o modificación de especificaciones en `/specs/<dominio>/`.
- `style(scope)`: ajustes puramente estéticos o de tokens CSS.
- `chore(scope)`: cambios de workspace, paquetes o tooling del monorepo.

### Validación Pre-Commit

- Todo commit debe pasar exitosamente el linter (ESLint), la verificación de tipos (`astro check` / `tsc`) y compilar sin advertencias.
- La validación se ejecuta por app afectada y sobre los paquetes compartidos modificados.

## 9. Gobernanza y Cumplimiento

- Esta constitución SUPERA cualquier otra práctica que no provenga de `specs/business-model.md`; `code-rules.md` y las specs de dominio se subordinan a ella según la jerarquía del Principio 1.
- Las specs de dominio NUNCA pueden contradecir la constitución ni los documentos globales de `/specs`; ante conflicto, prevalece el documento de mayor autoridad.
- Toda decisión de implementación DEBE referenciar `specs/business-model.md`.
- **Enmiendas**: toda enmienda debe documentarse, aprobarse por el responsable del proyecto e incluir un plan de migración cuando afecte código existente.
- **Versionado**: semántico. MAJOR por eliminación o redefinición incompatible de principios; MINOR por adición o expansión material; PATCH por aclaraciones o correcciones no semánticas.
- **Cumplimiento**: toda revisión (PR) debe verificar el cumplimiento de esta constitución, `code-rules.md`, `specs/architecture.md` y `specs/business-model.md`.

---

Foundly Labs Constitution — "Local-First, Agile Commerce, Zero Compromise."

**Version**: 5.3.0 | **Ratified**: 2026-10-05 | **Last Amended**: 2026-10-24

*Enmienda 2026-10-24 (MINOR 5.2.0 → 5.3.0): Principio 5.VII "Reutilización Obligatoria de Componentes
y Lógica".*
