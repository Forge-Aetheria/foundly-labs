import '@foundly/ui/tokens.css';
import '@fontsource-variable/inter';
import './globals.css';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { FoundlyThemeProvider } from '@foundly/ui';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ToastProvider } from '../shared/components/Toaster';

export const metadata: Metadata = {
  title: 'Foundly Book — Administración',
  description: 'Panel de administración de agendas, servicios y disponibilidad.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="book-app-canvas">
        <AppRouterCacheProvider options={{ key: 'foundly' }}>
          <FoundlyThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </FoundlyThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
