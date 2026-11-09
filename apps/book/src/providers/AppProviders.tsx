import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { FoundlyThemeProvider } from '@foundly/ui';
import { createQueryClient } from '../shared/api/query-client';

/**
 * Application-wide providers for the SPA (feature 024): query cache, document
 * metadata and the Clean Light UI theme (which also installs MUI CssBaseline).
 * `SessionProvider` is mounted by `<App />` once the active session exists.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <FoundlyThemeProvider>{children}</FoundlyThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
