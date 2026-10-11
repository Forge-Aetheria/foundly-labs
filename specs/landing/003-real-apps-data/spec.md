# Feature Specification: Production Copy & Branded Assets for the Apps Dataset

**Feature Branch**: `003-real-apps-data`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Integrar el copy final de producción en src/shared/data/apps.ts y la spec del proyecto (specs/landing/003-real-apps-data/): actualizar el dataset canónico con el contenido de copy, headlines, qué resuelve y features detalladas de las 4 aplicaciones principales del ecosistema Foundly Labs, manteniendo la arquitectura de tipos estricta y Zero-JS. Asegurar que AppCard.astro / AppsGrid.astro consuman limpiamente el headline o subheadline sin desbordar el diseño Clean Light UI. Validación: npm run check, npm run lint, npm run build."

**Input addendum**: "Actualización de Assets y Renderizado de Tarjetas (src/shared/data/apps.ts y src/shared/components/ui/AppCard.astro): integrar las rutas de assets por proyecto (incluyendo Mixbit) en el dataset canónico y actualizar AppCard.astro para renderizar el logo/isotipo de cada aplicación en su tarjeta del grid. Cada app debe incluir logo e icon apuntando a su carpeta en public/: Foundly (Finance) '/foundly-finance/branding-logo.png' y '/foundly-finance/icon.png'; Foundly POS '/foundly-pos/branding-logo.png' y '/foundly-pos/icon.png'; Foundly Maker '/foundly-maker/branding-logo.png' y '/foundly-maker/icon.png'; Mixbit '/mixbit/branding-logo.png' y '/mixbit/icon.png'. Renderizar con <img src={app.icon || app.logo}>, dimensiones controladas (h-10 w-auto / h-12 w-12 object-contain), integración fluida sobre fondo claro con transparencias, y alt='Logo de {app.name}'. Verificar que las 4 tarjetas carguen sus assets en dist/index.html."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Canonical production copy for the ecosystem (Priority: P1)

As a visitor, when I open the ecosystem section I read the final production copy for each of the four Foundly Labs products — a headline that states the value proposition, a supporting subheadline, a full description of what it solves, and its key features — so I understand precisely what each product does and why it matters.

**Why this priority**: The copy is the core deliverable; without the enriched canonical content there is nothing for the presentation layer to render.

**Independent Test**: Inspect the canonical apps dataset and confirm each of the four products exposes headline, subheadline, copy (what it solves), key feature, category, status, and target exactly as specified; confirm the ecosystem section renders that content.

**Acceptance Scenarios**:

1. **Given** the canonical apps dataset, **When** it is loaded, **Then** it contains exactly four products: Foundly (Mobile Finance), Foundly POS, Mixbit, and Foundly Maker (LRC-Maker).
2. **Given** any product in the dataset, **When** I inspect it, **Then** it exposes a headline, a subheadline, a full description, a key-feature statement, a category, a status, and a target.
3. **Given** the ecosystem section, **When** it renders, **Then** each product card presents its final production headline, subheadline, description, and key feature.
4. **Given** the dataset, **When** the four products are read, **Then** their category, status and target labels match the production values in FR-002 through FR-005.

---

### User Story 2 - Strictly typed, canonical dataset (Priority: P2)

As a maintainer, I want the app data to be the single source of truth with a strict, explicit type contract, so every consumer renders from the same well-typed fields and no product copy is duplicated or drifts.

**Why this priority**: The dataset only delivers value if it is the canonical, typed source that the presentation layer reads; this protects future changes from hidden field assumptions.

**Independent Test**: Confirm the application type declares every enriched field explicitly, there are no `any` casts, no field is missing on any entry, and type checking and linting pass with no issues.

**Acceptance Scenarios**:

1. **Given** the app type contract, **When** it is reviewed, **Then** it declares every field used by the four products (including headline, subheadline, description and key feature).
2. **Given** a product entry missing a required field, **When** the project is type-checked, **Then** the check fails instead of silently rendering an empty value.
3. **Given** the project, **When** the type check and linter are run, **Then** both report zero errors and zero warnings/problems.

---

### User Story 3 - Branded logo/icon per application card (Priority: P3)

As a visitor, I want each product card to display that product's own logo or isotipo in the card header, so I can visually identify each application in the ecosystem at a glance.

**Why this priority**: The visual identity of each product is part of the production presentation; without per-product assets the cards look generic, and the assets depend on the canonical dataset exposing the paths first.

**Independent Test**: Confirm the canonical dataset exposes a logo and icon path for each of the four products, and that every card in the ecosystem grid renders the corresponding image with accessible alternative text and without layout shift.

**Acceptance Scenarios**:

1. **Given** the canonical apps dataset, **When** I inspect each product, **Then** it exposes a `logo` and an `icon` path pointing to its own asset folder.
2. **Given** an application card, **When** it renders, **Then** its header shows the product icon (falling back to the logo when no icon is available) at a fixed footprint.
3. **Given** an application logo/icon with a transparent background, **When** it renders over the card surface, **Then** it integrates smoothly without a visible box or halo.
4. **Given** an application card image, **When** it is rendered, **Then** it carries alternative text identifying the product for assistive technology.
5. **Given** the built site, **When** the home page is inspected, **Then** all four cards reference their own asset paths that resolve to files served from the public assets.

---

### User Story 4 - Card layout stays within Clean Light UI (Priority: P4)

As a visitor, I want each product card to render the richer copy without overflow, clipping or layout breakage, so the ecosystem grid keeps its clean, high-contrast look across a single column on small screens and up to four columns on large screens.

**Why this priority**: The enriched copy is longer than before; without layout safeguards the grid would visually break, so this is required for the copy and assets to be usable but depends on them existing first.

**Independent Test**: Render the ecosystem grid at narrow and wide viewports and confirm the longer headline/subheadline/description wrap cleanly, cards keep a consistent height behavior, and no text overflows or overlaps adjacent cards.

**Acceptance Scenarios**:

1. **Given** a product card with the longest headline and subheadline, **When** it renders in the four-column layout, **Then** the text wraps without clipping or overflowing its card.
2. **Given** the ecosystem grid on a small screen, **When** it renders, **Then** cards stack in a single column and each card's copy remains fully readable.
3. **Given** the ecosystem section, **When** JavaScript is disabled, **Then** all product copy still renders.

---

### Edge Cases

- When a product has no key-feature statement, the card renders cleanly without an empty label or broken spacing.
- When a headline is very long (multiple lines), the card grows vertically without breaking the grid row rhythm or overlapping neighbors.
- When a subheadline is empty, the card falls back to the headline and remains visually balanced.
- When an existing consumer (e.g., the apps grid) reads only the legacy fields, the enriched dataset still satisfies it without changes to that consumer's contract.
- When a product has no icon, the card falls back to its logo so the header is never empty.
- When a product asset path points to a missing file, the card degrades gracefully (alt text remains) without breaking the grid layout.
- When a logo/icon has transparent areas, it composites cleanly over the card surface without an opaque box.
- When the image fails to provide intrinsic dimensions, the controlled footprint prevents layout shift.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The canonical apps dataset MUST contain exactly four products: Foundly (Mobile Finance), Foundly POS, Mixbit, and Foundly Maker (LRC-Maker).
- **FR-002**: Foundly MUST expose:
  - Headline: "No es solo cuánto tienes. Es cuánto te queda después de tus planes."
  - Subheadline: "La app que calcula tu Saldo Disponible real: ingresos, gastos, ahorros, deudas y dinero bloqueado, en una sola cifra."
  - Category: "Finanzas Personales"; Status: "En Desarrollo"; Target: "iOS / Android (Expo)".
  - Description (what it solves): "La mayoría de las apps te muestran un saldo que ignora lo que ya tienes comprometido. Foundly parte de una premisa distinta: tu liquidez real es la única cifra útil para decidir. Integra tu flujo de caja completo y descuenta compromisos, metas de ahorro y deudas. Todo local, privado y sin conectar tu banco."
  - Key feature: "Calculadora de Saldo Disponible real & Simulador What-If."
- **FR-003**: Foundly POS MUST expose:
  - Headline: "Vende, controla tu stock y cuadra tu caja sin complicaciones."
  - Subheadline: "El punto de venta para pequeños negocios que quiere saber, al minuto, qué vendió, qué le deben y cuánto ganó de verdad."
  - Category: "Comercio & Ventas"; Status: "Beta Activa"; Target: "Mobile / Tablet (SQLite + Drizzle)".
  - Description (what it solves): "Unifica ventas, inventario, clientes con crédito y caja en una sola herramienta. Registra una venta en segundos, controla tu stock, cobra a crédito y concilia cada cobro por canal sin depender de internet."
  - Key feature: "Gestión de cuentas por cobrar, inventario y cierres de caja en 100% offline."
- **FR-004**: Mixbit MUST expose:
  - Headline: "Deja que el grid trabaje por ti. Tú decides hasta dónde arriesgar."
  - Subheadline: "Motor de grid trading local-first con stop loss infranqueable, dashboard en tiempo real y señales de mercado."
  - Category: "Trading Engine"; Status: "En Desarrollo"; Target: "Full-Stack (FastAPI + Next.js)".
  - Description (what it solves): "Grid trading automatizado dentro de un rango definido con stop loss inviolable y recuperación exacta del estado tras reinicios. Python en el backend (FastAPI + CCXT) e interfaz web en Next.js con gráficos en vivo, modo simulador y Market Scanner."
  - Key feature: "Stop Loss infranqueable, Market Scanner (ATR, Bollinger, EMAs) y simulador."
- **FR-005**: Foundly Maker (LRC-Maker) MUST expose:
  - Headline: "De letra suelta a karaoke sincronizado. Sin subir nada a la nube."
  - Subheadline: "Estudio local-first en el navegador para marcar tiempos de letras sobre audio o video y exportar .lrc, .ass o .json."
  - Category: "Multimedia & Tools"; Status: "Producción / Disponible"; Target: "Web / Desktop (Vite + React)".
  - Description (what it solves): "Estudio local en navegador para sincronizar audio/video con letras de canciones. Marca tiempos línea por línea o a nivel de palabra, ajusta con precisión al milisegundo, previsualiza con estilo Spotify y exporta archivos .lrc / .ass."
  - Key feature: "Tipografía cinética a nivel de palabra, stamping táctil/teclado y exportación .lrc/.ass."
- **FR-006**: The application data contract MUST declare every enriched field explicitly (headline, subheadline, description, key feature, logo and icon, in addition to category, status and target) so no field is implicit or untyped.
- **FR-007**: The canonical dataset MUST remain the single source of truth consumed by the ecosystem section; product copy MUST NOT be duplicated in the presentation layer.
- **FR-008**: The presentation of a product card MUST render the enriched copy without text overflowing, clipping or overlapping adjacent cards, in both the single-column and multi-column grid layouts.
- **FR-009**: All product copy and layout MUST render as static content without requiring client-side JavaScript.
- **FR-010**: The project MUST pass type checking, linting and a static production build with zero errors, zero lint problems, and a clean static output.
- **FR-011**: Each product in the canonical dataset MUST expose a `logo` and an `icon` path pointing to its own assets folder under the public assets, with these exact values:
  - Foundly (Finance): `logo: "/foundly-finance/branding-logo.png"`, `icon: "/foundly-finance/icon.png"`.
  - Foundly POS: `logo: "/foundly-pos/branding-logo.png"`, `icon: "/foundly-pos/icon.png"`.
  - Foundly Maker: `logo: "/foundly-maker/branding-logo.png"`, `icon: "/foundly-maker/icon.png"`.
  - Mixbit: `logo: "/mixbit/branding-logo.png"`, `icon: "/mixbit/icon.png"`.
- **FR-012**: Each application card MUST render its product image (the icon, falling back to the logo when no icon is present) in the card header.
- **FR-013**: The rendered product image MUST use a controlled footprint (fixed height and contained aspect) so that it does not cause layout shift or "jumps" in the grid.
- **FR-014**: When a product image has transparent areas, it MUST composite smoothly over the card surface without an opaque box or halo.
- **FR-015**: The rendered product image MUST carry alternative text that identifies the product (e.g., "Logo de {product name}") for accessibility.
- **FR-016**: The static build output MUST reference each product's own asset path so that all four cards load their corresponding files served from the public assets.

### Key Entities _(include if feature involves data)_

- **Application**: A Foundly Labs product in the ecosystem. Enriched attributes: name, category, status, target, headline, subheadline, description (what it solves), key feature, logo path, icon path. The dataset holds exactly four instances.
- **Product Card**: The presentation of a single application in the ecosystem grid, consuming the canonical fields (copy and logo/icon) and preserving the Clean Light UI layout.
- **Product Asset**: A per-product image (logo or icon) served from the product's folder under the public assets; referenced by the Application and rendered by the Product Card.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of the four products expose all enriched fields (headline, subheadline, description, key feature, category, status, target) with the exact production values.
- **SC-002**: The ecosystem section renders exactly 4 cards, each displaying its production headline, subheadline, description and key feature.
- **SC-003**: At the narrowest supported viewport, 0 cards show clipped, overflowing or overlapping text.
- **SC-004**: With JavaScript disabled, 100% of product copy is still visible.
- **SC-005**: Type check, lint and static build complete with 0 errors and 0 lint problems, producing a clean static output directory.
- **SC-006**: 100% of the four cards display their own logo/icon with accessible alternative text and no layout shift from the image.
- **SC-007**: In the built home page, all 4 cards reference their own asset paths, and 0 references point to a non-existent or wrong product folder.

## Assumptions

- The four products and their copy as provided are authoritative production content and are displayed verbatim.
- "Copy" and "what it solves" refer to the same full descriptive field per product; "key feature" is a short highlight statement.
- The existing application data contract will be extended (rather than replaced) so existing consumers keep working with their current fields.
- AppCard/AppsGrid will adopt the headline (and/or subheadline) in place of, or alongside, the prior short description, while keeping the Clean Light UI card style.
- The per-product asset folders (`/foundly-finance`, `/foundly-pos`, `/foundly-maker`, `/mixbit`) and their `branding-logo.png` / `icon.png` files are provided and served from the public assets; if absent, they are added as part of this feature.
- The application card component referenced as `src/shared/components/ui/AppCard.astro` in the request corresponds to the project's existing card component location (`src/shared/components/ui/AppCard.astro`); the canonical project location is authoritative.
- For the card header image, the icon is preferred and the logo is the fallback; the exact selection is finalized during planning.
- Copy is Spanish-only; no additional localization or taxonomy is introduced.
- The concrete implementation approach (component structure, CSS technique) is decided during planning.
