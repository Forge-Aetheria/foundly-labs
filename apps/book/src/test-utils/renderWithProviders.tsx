import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { FoundlyThemeProvider } from '@foundly/ui';
import { createQueryClient } from '../shared/api/query-client';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  router?: MemoryRouterProps;
}

/**
 * Standard test harness for the SPA (feature 024): query cache, metadata, theme
 * and a memory router. Retries are disabled so failure tests stay fast.
 */
export function renderWithProviders(
  ui: ReactElement,
  { queryClient, router, ...options }: RenderWithProvidersOptions = {},
) {
  const client = queryClient ?? createQueryClient();
  client.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <HelmetProvider>
        <QueryClientProvider client={client}>
          <FoundlyThemeProvider>
            <MemoryRouter {...router}>{children}</MemoryRouter>
          </FoundlyThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
