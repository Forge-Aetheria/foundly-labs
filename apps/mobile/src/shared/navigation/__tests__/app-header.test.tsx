import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppHeader } from '../AppHeader';
import type { WorkspaceIdentity } from '../session-identity';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const identity: WorkspaceIdentity = {
  displayName: 'Ana Pérez',
  email: 'ana@foundly.dev',
  avatarUrl: null,
  initials: 'AP',
  tenantName: 'Estudio Ana',
  tenantLogoUrl: null,
};

describe('AppHeader', () => {
  it('shows the tenant avatar, brand and notifications action', async () => {
    await render(<AppHeader identity={identity} onOpenDrawer={jest.fn()} onOpenNotifications={jest.fn()} />);

    expect(screen.getByLabelText('Avatar de Estudio Ana')).toBeTruthy();
    expect(screen.getByLabelText('Foundly Book')).toBeTruthy();
    expect(screen.getByLabelText('Notificaciones')).toBeTruthy();
  });

  it('opens the drawer when the tenant icon is pressed', async () => {
    const onOpenDrawer = jest.fn();
    await render(
      <AppHeader identity={identity} onOpenDrawer={onOpenDrawer} onOpenNotifications={jest.fn()} />,
    );

    fireEvent.press(screen.getByLabelText('Abrir menú de Estudio Ana'));
    expect(onOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it('does not use the user avatar as the drawer trigger', async () => {
    await render(
      <AppHeader identity={identity} onOpenDrawer={jest.fn()} onOpenNotifications={jest.fn()} />,
    );

    expect(screen.queryByLabelText('Avatar de Ana Pérez')).toBeNull();
    expect(screen.queryByLabelText('Foundly Book — abrir menú')).toBeNull();
  });

  it('opens notifications from the right action', async () => {
    const onOpenNotifications = jest.fn();
    await render(
      <AppHeader
        identity={identity}
        onOpenDrawer={jest.fn()}
        onOpenNotifications={onOpenNotifications}
      />,
    );

    fireEvent.press(screen.getByLabelText('Notificaciones'));
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
  });
});
