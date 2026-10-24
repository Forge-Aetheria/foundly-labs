import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'codegen.schema.gql',
  documents: ['src/modules/**/*.graphql', 'src/shared/**/*.graphql'],
  generates: {
    'src/shared/api/generated.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        strictScalars: true,
        scalars: { ID: 'string', DateTime: 'string' },
      },
    },
  },
};

export default config;
