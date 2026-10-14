import type { MetadataRoute } from 'next';

/** Web app manifest for Foundly Book (favicons prepared in feature 022 follow-up). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Foundly Book — Administración',
    short_name: 'Foundly Book',
    description: 'Panel de administración de agendas, servicios y disponibilidad.',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#faf8ff',
    theme_color: '#6c5ce7',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
