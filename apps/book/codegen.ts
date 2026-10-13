import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * GraphQL Codegen config (feature 011 — module-data-layer).
 * The schema is the API's code-first SDL (`apps/api/src/schema.gql`); the
 * documents live per area under `src/shared/api/operations/`. The generated
 * artifact (`src/shared/api/generated.ts`) is COMMITTED so `typecheck`/`build`
 * pass without a running API:
 *
 *   npm run codegen -w @foundly/book
 */
const config: CodegenConfig = {
  schema: '../api/src/schema.gql',
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