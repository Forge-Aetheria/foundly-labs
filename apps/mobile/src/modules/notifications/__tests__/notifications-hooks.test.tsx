import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useNotifications } from '../hooks';
import { NotificationType } from '@/shared/api/generated';
import { fetchNotifications } from '../services';

jest.mock('../services', () => ({
  fetchNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
}));

jest.mock('@/shared/auth/session-context', () => ({
  useSession: () => ({ tenantId: 'tenant-1' }),
}));

const mockedFetch = fetchNotifications as jest.MockedFunction<typeof fetchNotifications>;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useNotifications', () => {
  it('returns notifications on success', async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      data: [
        {
          id: 'n1',
          type: NotificationType.SystemInfo,
          title: 'Hola',
          message: 'Mensaje',
          read: false,
          createdAt: '2026-10-24T10:00:00.000Z',
        },
      ],
    });
    const { result } = await renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.title).toBe('Hola');
  });

  it('maps API failures to a typed error', async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'Sin conexión',
    });
    const { result } = await renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Sin conexión');
  });
});
