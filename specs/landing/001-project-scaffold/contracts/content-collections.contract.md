# Contract: Content Collections

**Feature**: `001-project-scaffold` | **Type**: Data contract (build-time)

Defined in `src/content.config.ts` using the Astro 5 Content Layer `glob()` loader and Zod. Types
are inferred with `z.infer`; no `any` is permitted.

## `pricing`

```ts
const pricing = defineCollection({
  loader: glob({ pattern: '**/*.{md,json}', base: './src/content/pricing' }),
  schema: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    monthlyPriceCents: z.number().int().nonnegative(),
    annualPriceCents: z.number().int().nonnegative(),
    features: z.array(z.string()),
    badge: z.string().optional(),
    highlighted: z.boolean().default(false),
  }),
});
```

## `faqs`

```ts
const faqs = defineCollection({
  loader: glob({ pattern: '**/*.{md,json}', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
  }),
});
```

## `features`

```ts
const features = defineCollection({
  loader: glob({ pattern: '**/*.{md,json}', base: './src/content/features' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().optional(),
    order: z.number().int().nonnegative().optional(),
  }),
});
```

**Obligations**

- Schema validation MUST fail the build on invalid entries (Zod error).
- Collections MAY be empty; an empty collection MUST NOT break the build.
- Prices are stored as integer cents to avoid floating-point errors; presentation formatting lives
  in `src/shared/utils/formatters.ts`.

## Verification

- `astro check` passes with inferred collection types.
- Adding an entry that violates a schema fails the build with a clear Zod error.
- With zero entries, `astro build` succeeds.
