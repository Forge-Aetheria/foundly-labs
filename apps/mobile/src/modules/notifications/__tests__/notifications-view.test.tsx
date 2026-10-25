jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

import { fireEvent, render, screen } from '@testing-library/react-native';
import { NotificationsView } from '../NotificationsView';
import { useMarkNotificationRead, useNotifications } from '../hooks';

jest.mock('../hooks', () => ({
  useNotifications: jest.fn(),
  useMarkNotificationRead: jest.fn(),
}));

jest.mock('@/shared/auth/session-context', () => ({
  useSession: () => ({ tenantId: 'tenant-1' }),
}));

const mockedUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockedUseMarkRead = useMarkNotificationRead as jest.MockedFunction<
  typeof useMarkNotificationRead
>;

function state(overrides: Record<string, unknown>) {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useNotifications>;
}

describe('NotificationsView', () => {
  const mutate = jest.fn();

  beforeEach(() => {
    mockedUseMarkRead.mockReturnValue({ mutate } as unknown as ReturnType<
      typeof useMarkNotificationRead
    >);
  });

  it('shows the empty state', async () => {
    mockedUseNotifications.mockReturnValue(state({ data: [] }));
    await render(<NotificationsView />);
    expect(screen.getByText('Sin notificaciones')).toBeTruthy();
  });

  it('renders unread notifications and marks them read on press', async () => {
    mockedUseNotifications.mockReturnValue(
      state({
        data: [
          {
            id: 'n1',
            type: 'NEW_BOOKING',
            title: 'Nueva reserva online',
            message: 'Ana reservó Corte.',
            read: false,
            createdAt: '2026-10-24T10:00:00.000Z',
          },
        ],
      }),
    );
    await render(<NotificationsView />);
    expect(screen.getByText('Nueva reserva online')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('No leída: Nueva reserva online'));
    expect(mutate).toHaveBeenCalledWith('n1');
  });

  it('shows the error state', async () => {
    mockedUseNotifications.mockReturnValue(
      state({ isError: true, error: new Error('Sin conexión') }),
    );
    await render(<NotificationsView />);
    expect(screen.getByText('Sin conexión')).toBeTruthy();
  });
});
