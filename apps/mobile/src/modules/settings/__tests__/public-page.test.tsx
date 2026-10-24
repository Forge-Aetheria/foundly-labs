import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useUpdatePublicPage } from '../hooks';
import { updatePublicPage } from '../services';

jest.mock('../services', () => ({
  fetchMyBusiness: jest.fn(),
  updatePublicPage: jest.fn(),
}));

jest.mock('@/shared/auth/session-context', () => ({
  useSession: () => ({ tenantId: 'tenant-1' }),
}));

const mockedUpdate = updatePublicPage as jest.MockedFunction<typeof updatePublicPage>;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useUpdatePublicPage', () => {
  it('confirms a successful publication change', async () => {
    mockedUpdate.mockResolvedValue({ ok: true, data: true });
    const { result } = await renderHook(() => useUpdatePublicPage(), { wrapper });
    result.current.mutate(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedUpdate).toHaveBeenCalledWith(true);
  });

  it('exposes a typed error when the API rejects the change', async () => {
    mockedUpdate.mockResolvedValue({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Falta el enlace público.',
    });
    const { result } = await renderHook(() => useUpdatePublicPage(), { wrapper });
    result.current.mutate(true);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.code).toBe('VALIDATION_ERROR');
  });
});
