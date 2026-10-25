// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
  // Static (SSG) output is Astro's default; no adapter is required.
  site: 'https://foundlylabs.com',
  integrations: [react(), sitemap()],
  vite: {
    // @ts-expect-error -- @tailwindcss/vite resolves a different Vite build than Astro in this monorepo.
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
