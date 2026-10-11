# Contract: Apps Grid & Hero CTAs

**Feature**: `002-branding-apps-grid` | **Type**: Section UI contract

## AppsGrid (`src/modules/home/components/AppsGrid.astro`)

**Obligations**

- Root element MUST carry `id="apps"` so `/#apps` resolves.
- MUST render a responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`.
- MUST render one `AppCard` per entry in `src/shared/data/apps.ts`.
- Section MUST include a heading (e.g. the ecosystem title) and no client-side JavaScript.

## AppCard (`src/shared/components/ui/AppCard.astro`)

```ts
interface Props {
  app: Application;
}
```

**Obligations**

- MUST display `name`, `category`, `status`, `target`, and `description` for the given application.
- MUST use Clean Light UI tokens: `bg-card-light/60`, `backdrop-blur-md`,
  `border border-border-subtle`, `rounded-2xl`, `shadow-card`.
- MUST NOT contain literal brand hex values.

## Hero (`src/modules/home/components/Hero.astro`) — extended

```ts
interface Props {
  title: string;
  description: string;
  badge?: string;
}
```

**Obligations**

- MUST keep the tagline and subtitle supplied by `src/pages/index.astro`.
- MUST render two centered call-to-action buttons:
  - Primary "Explorar Ecosistema" → `#apps`.
  - Secondary "¿Por qué Local-First?" → `#manifesto`.
- Buttons MUST be keyboard focusable with a visible focus state and rendered as links.

## Button (`src/shared/components/ui/Button.astro`) — new

```ts
interface Props {
  href: string;
  variant?: 'primary' | 'secondary';
}
```

**Obligations**

- `primary` uses the accent token as background with readable contrast; `secondary` uses a token
  surface/border.
- Renders an anchor (`<a>`) so it works without JavaScript.

## Manifesto (`src/modules/home/components/Manifesto.astro`) — new

**Obligations**

- Root element MUST carry `id="manifesto"` so `/#manifesto` resolves.
- MUST present the local-first rationale in brand voice, using tokens for all colors.

## Verification

- Built page contains `id="apps"` and `id="manifesto"`.
- All four cards render the exact data-model values.
- Both CTAs are present, centered, and link to the correct anchors; keyboard focus is visible.
