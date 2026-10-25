# UI Contract: Navigation Registry

**Feature**: `specs/mobile/002-mobile-drawer-navigation`
**Consumers**: drawer layout, custom drawer content, placeholder screens, tests.

## Module

```ts
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type NavigationIconName = ComponentProps<typeof Ionicons>['name'];
export type NavigationGroup = 'primary' | 'secondary';

export interface NavigationModule {
  id: string;
  label: string;
  route: string;
  icon: NavigationIconName;
  group: NavigationGroup;
  description?: string;
}
```

## Required exports

```ts
export const NAVIGATION_MODULES: readonly NavigationModule[];
export const PRIMARY_MODULES: readonly NavigationModule[];
export const SECONDARY_MODULES: readonly NavigationModule[];
export const DRAWER_HOME_ROUTE = '/agenda';
export function findModuleByPathname(pathname: string): NavigationModule | undefined;
export function isModuleActive(pathname: string, route: string): boolean;
```

## Guarantees

- `NAVIGATION_MODULES` contains exactly the ten modules and order from `data-model.md`.
- `PRIMARY_MODULES` contains the first six; `SECONDARY_MODULES` the last four.
- `findModuleByPathname('/resenas')` returns the Reseñas module; unknown paths return `undefined`.
- `isModuleActive('/configuracion', '/configuracion') === true`; nested paths such as `/configuracion/perfil` also match.
- `DRAWER_HOME_ROUTE` is used by the root redirect, auth redirect and drawer index redirect.
- Icon names must exist in the Ionicons glyph map; an invalid name fails TypeScript compilation.

## Route contract

| File under `apps/mobile/app/(drawer)/` | URL |
| ------------------------------------- | --- |
| `agenda.tsx` | `/agenda` |
| `servicios.tsx` | `/servicios` |
| `equipo.tsx` | `/equipo` |
| `galeria.tsx` | `/galeria` |
| `resenas.tsx` | `/resenas` |
| `disponibilidad.tsx` | `/disponibilidad` |
| `notificaciones.tsx` | `/notificaciones` |
| `configuracion.tsx` | `/configuracion` |
| `soporte.tsx` | `/soporte` |
| `about.tsx` | `/about` |
| `index.tsx` | redirect to `/agenda` |

Every route file renders only its view/placeholder (thin route rule from `constitution.md` §7).
