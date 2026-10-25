# UI Contract: Support and About Pages

**Feature**: `specs/mobile/009-support-about-pages`

## Routes

- `apps/mobile/app/(drawer)/soporte.tsx` renders `SupportView`.
- `apps/mobile/app/(drawer)/about.tsx` renders `AboutView`.
- No data queries or mutations.

## SupportView

- Title “Ayuda y Soporte” and intro copy.
- FAQ list with expandable answers.
- At least one contact channel (email or public support URL).
- Link presses use the shared external-link helper.
- Link errors show an inline message without crashing.
- ScrollView for long content.

## AboutView

- Foundly branding/name and app version.
- Product/ecosystem description.
- Legal/institutional links (site, privacy, terms).
- Link presses use the shared external-link helper.
- Version falls back to `0.1.0` when unavailable.
- ScrollView for long content.

## Shared external-link helper

```ts
export async function openExternalLink(url: string): Promise<{ ok: boolean; message?: string }>;
```

Guarantees:

- Accepts only `mailto:` and `https:` URLs.
- Wraps `Linking.openURL` errors.
- Returns a user-facing message on failure.

## Reuse guarantees

- `Screen`, `AppText`, `Button`, `@expo/vector-icons` and tokens.
- No new design primitives or duplicated link handling.
