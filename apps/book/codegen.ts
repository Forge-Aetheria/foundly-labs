import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * GraphQL Codegen config (feature 008 — research decision: graphql-request +
 * typed-document-node). The schema is downloaded via introspection from the
 * running API (quickstart scenario 1) into `codegen.schema.gql`, then:
 *
 *   npm run codegen -w @foundly/book
 *
 * Generated artifacts are gitignored (regenerate per environment).
 */
const config: CodegenConfig = {
  schema: 'codegen.schema.gql',
  documents: ['src/shared/infra/graphql/**/*.graphql'],
  generates: {
    'src/shared/infra/graphql/generated.ts': {
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