import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * GraphQL Codegen config (feature 011 — module-data-layer).
 * The schema is a versioned snapshot of the API's code-first SDL
 * (`apps/book/codegen.schema.gql`, a copy of `apps/api/src/schema.gql`) so codegen
 * runs offline. The generated artifact (`src/shared/api/generated.ts`) is NOT
 * versioned; it is produced by `npm run codegen` (auto-run by pretypecheck/prebuild):
 *
 *   npm run codegen -w @foundly/book
 */
const config: CodegenConfig = {
  schema: 'codegen.schema.gql',
  documents: ['src/shared/api/operations/**/*.graphql'],
  generates: {
    'src/shared/api/generated.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        strictScalars: true,
        scalars: {
          ID: 'string',
          DateTime: 'string',
        },
      },
    },
  },
};

export default config;