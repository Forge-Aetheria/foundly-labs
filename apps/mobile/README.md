# @foundly/mobile — Foundly Tenant

Expo SDK 58 (React Native 0.88) + Expo Router app for tenant administrators. It provides login,
daily agenda, the notification inbox, business profile settings and the public-page toggle.

## Requirements

- Node.js ≥ 22.13 (repository tested with 24.11)
- pnpm 10 via Corepack (`corepack enable`)
- Expo Go for UI-only work, or an Expo development build for remote push

## Environment

Copy `.env.example` to `.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3002
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_EAS_PROJECT_ID=
```

`EXPO_PUBLIC_*` values are embedded in the app bundle. Never place secrets there.

## Scripts

```bash
pnpm --filter @foundly/mobile dev
pnpm --filter @foundly/mobile build
pnpm --filter @foundly/mobile typecheck
pnpm --filter @foundly/mobile lint
pnpm --filter @foundly/mobile test
pnpm --filter @foundly/mobile codegen
```

## Structure

```text
app/                       # Thin Expo Router routes
  (auth)/login.tsx         # renders <LoginView />
  (tabs)/index.tsx         # renders <AgendaView />
  (tabs)/notificaciones.tsx
  (tabs)/configuracion.tsx
src/modules/               # auth, agenda, notifications, settings (services + hooks + UI)
src/shared/                # api transport, auth session, push, theme, UI primitives
```

Data access follows the module boundary: UI → `hooks.ts` → `services.ts` → GraphQL transport.
Generated GraphQL types are not committed; `codegen.schema.gql` is the versioned API snapshot.

## Auth and push notes

- Auth uses the same Supabase project as `apps/book`; the API resolves the tenant from verified JWT
  claims (`app_metadata.tenant_id`).
- Sessions are stored in chunked `expo-secure-store` storage.
- Remote push requires an Expo development build. Expo Go cannot receive remote push since SDK 53.
- Push tokens are registered after login and unregistered before logout.

## Monorepo notes

pnpm uses `node-linker=hoisted` for Metro compatibility. If Metro cannot resolve a workspace
package, rerun `pnpm install` and clear the Expo cache:

```bash
pnpm --filter @foundly/mobile exec expo start -c
```
