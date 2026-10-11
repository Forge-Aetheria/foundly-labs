# Foundly Labs — Arquitectura del Monorepo & Despliegue

**Versión:** 1.0.0
**Estado:** Binding
**Ámbito:** Monorepo Foundly Labs (`apps/*`, `packages/*`) y su despliegue en Vercel.
**Autoridad:** Subordinado a `specs/business-model.md` y `constitution.md`; por encima de `code-rules.md` y de las specs de dominio, según la jerarquía del Principio 1 de la constitución.

---

## 1. Topología del Monorepo

El repositorio es un **monorepo npm workspaces** con dos espacios:

```text
/
├── apps/                       # Aplicaciones desplegables (zonas)
│   ├── landing/                # Astro 5 — SSG (vitrina, SEO)      → zona raíz
│   ├── book/                   # Next.js / React 19 — SaaS        → zona /book
│   ├── store/                  # Next.js / React 19 — e-commerce  → zona /store
│   └── api/                    # NestJS — servidor HTTP/API       → backend
├── packages/                   # Código compartido
│   └── ui/                     # Design system Clean Light UI (MUI v6)
├── specs/                      # Especificaciones por dominio (shared-ui, landing, book, store, api)
├── vercel.json                 # Configuración del gateway de ruteo unificado
├── constitution.md
├── code-rules.md
└── package.json                # Raíz del workspace
```

Reglas de dependencias (constitución §3.II):

- `packages/*` **nunca** importa desde `apps/*`.
- Las dependencias entre paquetes son **acíclicas**.
- El código compartido vive solo en `packages/` (sin duplicación entre apps).
- **Persistencia ratificada (resolución del TODO(PERSISTENCE))**: la estrategia de almacenamiento es **Prisma + PostgreSQL** (Supabase o Postgres local vía Docker), expuesta únicamente a través del paquete compartido `@foundly/database` (`prisma/schema.prisma` DB-First + cliente generado). Las apps `apps/api` (y futuras) consumen el cliente desde ese seam; `apps/book`/`apps/store` siguen desacopladas de la tecnología mientras continúen usando su store en memoria.

### I. Estructura interna de las apps (rutas delgadas + `modules/` + `shared/`)

Todas las apps comparten el mismo patrón de organización interna (detalle canónico en `constitution.md` §3 y §7):

- **Rutas delgadas**: `apps/landing/src/pages/` y `apps/{book,store}/src/app/` solo renderizan una vista de módulo (`<Modulo>View.astro` / `<Modulo>View.tsx`).
- **`modules/<modulo>/`**: la lógica de dominio de cada app — componentes, islas/dialogs, utils, tests y su `<Modulo>View`.
- **`shared/`**: lo reutilizable dentro de la app — componentes, datos, tipos y utils; en las apps Next también `infra/` (seam de sesión/store) y `tenancy/`.

`apps/store` (**aún no generada**) deberá nacer con esta misma estructura.

---

## 2. Dominio Único, Múltiples Zonas (Single Domain Multi-Zone)

Las tres aplicaciones se exponen bajo **un solo dominio** mediante el patrón _Multi-Zone_ de Vercel: un proyecto **gateway** recibe todo el tráfico y reescribe cada prefijo hacia el proyecto (zona) correspondiente.

```text
                    ┌─────────────────────────────┐
  dominio público → │  foundly-router (gateway)   │
                    │  Root Directory: repo root  │
                    │  vercel.json (rewrites)     │
                    └──────────────┬──────────────┘
            /book/*               │                /store/*
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
 foundly-book              foundly-landing              foundly-store
 (Next.js, /)              (Astro, /)                   (Next.js, /)
```

### 2.1 `vercel.json` (raíz del repo)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/book/:path*", "destination": "https://foundly-book.vercel.app/:path*" },
    { "source": "/store/:path*", "destination": "https://foundly-store.vercel.app/:path*" },
    { "source": "/:path*", "destination": "https://foundly-landing.vercel.app/:path*" }
  ]
}
```

> **Regla anti-bucle**: el `destination` del catch-all apunta al **proyecto landing**, nunca al propio gateway (`foundly-router`). Si el gateway y la landing fueran el mismo proyecto, el catch-all debería eliminarse y la landing servirse directamente.

### 2.2 Dominios / subdominios por zona

| Proyecto Vercel   | Rol               | Dominio (vercel.app)         | Dominio personalizado sugerido |
| ----------------- | ----------------- | ---------------------------- | ------------------------------ |
| `foundly-router`  | Gateway / apex    | `foundly-labs.vercel.app`    | `foundlylabs.com`              |
| `foundly-landing` | Zona raíz (Astro) | `foundly-landing.vercel.app` | `www.foundlylabs.com`          |
| `foundly-book`    | Zona `/book`      | `foundly-book.vercel.app`    | `book.foundlylabs.com`         |
| `foundly-store`   | Zona `/store`     | `foundly-store.vercel.app`   | `store.foundlylabs.com`        |

Los nombres de proyecto pueden variar; si cambian, deben actualizarse los `destination` de `vercel.json` y esta tabla.

---

## 3. Build Settings recomendados por proyecto (Vercel)

Todos los proyectos usan **npm** y resuelven los workspaces desde la raíz del repo (`npm install` en el monorepo).

| Proyecto          | Root Directory | Framework Preset | Install Command | Build Command   | Output Directory    |
| ----------------- | -------------- | ---------------- | --------------- | --------------- | ------------------- |
| `foundly-router`  | `./`           | Other            | `npm install`   | `npm run build` | `apps/landing/dist` |
| `foundly-landing` | `apps/landing` | Astro            | `npm install`   | `npm run build` | `dist`              |
| `foundly-book`    | `apps/book`    | Next.js          | `npm install`   | `npm run build` | `.next`             |
| `foundly-store`   | `apps/store`   | Next.js          | `npm install`   | `npm run build` | `.next`             |
| `foundly-api`     | `apps/api`     | Other            | `npm install`   | `npm run build` | `dist`              |

Notas:

- **Install Command**: al ser workspaces, Vercel instala desde la raíz del monorepo; `npm install` en la raíz enlaza `@foundly/ui` a las apps. **Cada app debe declarar `@foundly/ui` en sus `dependencies`** para que el enlace exista (`apps/landing` importa `@foundly/ui/tokens.css` desde su CSS, por lo que sin la dependencia la resolución de Vite/Tailwind falla).
- **Gateway**: el proyecto `foundly-router` con Root Directory `./` es el único que lee el `vercel.json` raíz. Su build no es crítico para el ruteo (las zonas sirven el contenido); se recomienda un build mínimo/estático o reutilizar el de la landing.
- **Book**: requiere `transpilePackages: ['@foundly/ui']` (ya configurado en `apps/book/next.config.mjs`).
- **Astro**: la landing genera salida estática en `apps/landing/dist`.
- **Node**: usar la misma versión que local (Node ≥ 20). Fijar `engines.node` o la variable de proyecto si es necesario.

### 3.1 Variables de entorno

| Variable                  | Proyecto(s) | Uso                                            |
| ------------------------- | ----------- | ---------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`    | landing     | URL canónica para metadatos/SEO                |
| `FOUNDLY_PASS_*` (futuro) | book, store | Integración con Foundly Pass (SSO / licencias) |

> Ninguna variable debe contener secretos en el repositorio; se configuran por proyecto en Vercel.

---

## 4. Desarrollo local

| App / paquete | Comando                           | Puerto |
| ------------- | --------------------------------- | ------ |
| landing       | `npm run dev -w @foundly/landing` | 4321   |
| book          | `npm run dev -w @foundly/book`    | 3001   |
| store         | `npm run dev -w @foundly/store`   | 3002   |

El enrutado Multi-Zone solo se reproduce en Vercel; en local cada app se ejecuta en su puerto.

---

## 5. Gobernanza

Este documento se subordina a `specs/business-model.md` y `constitution.md`. Todo cambio de topología, dominios o Build Settings debe reflejarse aquí y, si afecta al flujo SDD, actualizar la constitución según su procedimiento de enmienda.

**Version**: 1.0.0 | **Ratified**: 2026-10-08 | **Last Amended**: 2026-10-08
