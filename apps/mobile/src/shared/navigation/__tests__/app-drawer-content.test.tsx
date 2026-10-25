import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { AppDrawerContent, type AppDrawerContentProps } from '../AppDrawerContent';
import type { WorkspaceIdentity } from '../session-identity';

jest.mock('expo-router', () => ({
  usePathname: () => '/agenda',
}));

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

async function renderDrawer(overrides: Partial<AppDrawerContentProps> = {}) {
  const navigation = {
    closeDrawer: jest.fn(),
    navigate: jest.fn(),
  };
  const props = {
    identity,
    publicPageHref: 'https://book.foundlylabs.com/estudio-ana',
    onLogout: jest.fn(),
    isLoggingOut: false,
    navigation,
    state: { index: 0, routes: [] },
    descriptors: {},
    ...overrides,
  } as unknown as AppDrawerContentProps;

  const view = await render(<AppDrawerContent {...props} />);
  return { navigation, props, view };
}

describe('AppDrawerContent', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the ten modules and profile identity', async () => {
    await renderDrawer();

    for (const label of [
      'Agenda',
      'Servicios',
      'Equipo',
      'Galería',
      'Reseñas',
      'Disponibilidad',
      'Notificaciones',
      'Configuración',
      'Ayuda y Soporte',
      'Acerca de Foundly',
    ]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getByText('Ana Pérez')).toBeTruthy();
    expect(screen.getByText('ana@foundly.dev')).toBeTruthy();
    expect(screen.getAllByText('Estudio Ana').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Avatar de Estudio Ana')).toBeTruthy();
  });

  it('navigates and closes the drawer when a module is pressed', async () => {
    const { navigation } = await renderDrawer();

    fireEvent.press(screen.getByLabelText('Reseñas'));

    expect(navigation.closeDrawer).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).toHaveBeenCalledWith('resenas');
  });

  it('opens the public page and logout actions', async () => {
    const onLogout = jest.fn();
    await renderDrawer({ onLogout });

    fireEvent.press(screen.getByLabelText('Ver página pública de reservas'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://book.foundlylabs.com/estudio-ana');

    fireEvent.press(screen.getByLabelText('Cerrar sesión'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('hides the public page action when no URL is available', async () => {
    await renderDrawer({ publicPageHref: null });

    expect(screen.queryByLabelText('Ver página pública de reservas')).toBeNull();
  });
});
