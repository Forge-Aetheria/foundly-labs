import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/dist/',
      '**/.astro/',
      '**/node_modules/',
      '**/coverage/',
      '**/build/',
      '**/.next/',
      '**/next-env.d.ts',
      '**/src/shared/api/generated.ts',
      '**/.expo/',
      'apps/mobile/src/shared/api/generated.ts',
      'apps/mobile/dist/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: [
      'apps/*/src/components/**/*.{astro,jsx,tsx,ts,js}',
      'apps/mobile/src/**/components/**/*.{tsx,ts,jsx,ts}',
      'apps/mobile/app/**/*.{tsx,ts,jsx,ts}',
      'packages/ui/src/**/*.{tsx,ts,jsx,js}',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3,8}/]',
          message:
            'No uses colores hex literales en componentes; usa los tokens de diseno del sistema (@foundly/ui / tokens.css).',
        },
        {
          selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}/]',
          message:
            'No uses colores hex literales en componentes; usa los tokens de diseno del sistema (@foundly/ui / tokens.css).',
        },
      ],
    },
  },
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@foundly/database',
              allowTypeImports: true,
              message:
                'Solo se permiten importaciones de tipo desde @foundly/database en la app móvil.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/mobile/app/**/*.{ts,tsx}', 'apps/mobile/src/**/components/**/*.{ts,tsx}'],
    ignores: ['apps/mobile/app/_layout.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'graphql-request',
              message: 'La UI no llama a GraphQL; usa el hook del módulo.',
            },
            {
              name: '@tanstack/react-query',
              message: 'La UI no llama a datos; usa el hook del módulo.',
            },
            {
              name: '@/shared/api/client',
              message: 'La UI no llama al transporte; usa el hook del módulo.',
            },
          ],
        },
      ],
    },
  },
  prettier,
];
