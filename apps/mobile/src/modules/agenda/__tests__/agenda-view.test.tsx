jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

import { render, screen } from '@testing-library/react-native';
import { AgendaView } from '../AgendaView';
import { useAgenda } from '../hooks';

jest.mock('../hooks', () => ({
  useAgenda: jest.fn(),
}));

jest.mock('@/shared/auth/session-context', () => ({
  useSession: () => ({ tenantId: 'tenant-1' }),
}));

const mockedUseAgenda = useAgenda as jest.MockedFunction<typeof useAgenda>;

function queryState(overrides: Record<string, unknown>) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAgenda>;
}

describe('AgendaView', () => {
  it('shows the empty state', async () => {
    mockedUseAgenda.mockReturnValue(queryState({ data: [] }));
    await render(<AgendaView />);
    expect(screen.getByText('Sin citas para hoy')).toBeTruthy();
  });

  it('shows the error state with retry', async () => {
    const refetch = jest.fn();
    mockedUseAgenda.mockReturnValue(
      queryState({ isError: true, error: new Error('Sin conexión'), refetch }),
    );
    await render(<AgendaView />);
    expect(screen.getByText('Sin conexión')).toBeTruthy();
    expect(screen.getByText('Reintentar')).toBeTruthy();
  });

  it('renders appointments ordered by the hook output', async () => {
    mockedUseAgenda.mockReturnValue(
      queryState({
        data: [
          {
            id: 'a1',
            startAt: '2026-10-24T09:00:00.000Z',
            endAt: '2026-10-24T09:30:00.000Z',
            status: 'CONFIRMED',
            clientName: 'Ana',
            notes: null,
            service: { id: 's1', name: 'Corte' },
            specialist: { id: 'p1', name: 'Luis' },
          },
        ],
      }),
    );
    await render(<AgendaView />);
    expect(screen.getByText('Ana')).toBeTruthy();
    expect(screen.getByText('Corte')).toBeTruthy();
  });
});
