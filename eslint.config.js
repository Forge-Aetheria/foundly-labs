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
  prettier,
];
