import {
  DRAWER_HOME_ROUTE,
  NAVIGATION_MODULES,
  PRIMARY_MODULES,
  SECONDARY_MODULES,
  findModuleByPathname,
  getModuleById,
  isModuleActive,
} from '../modules';

const EXPECTED = [
  ['agenda', 'Agenda', '/agenda', 'calendar-outline', 'primary'],
  ['servicios', 'Servicios', '/servicios', 'cut-outline', 'primary'],
  ['equipo', 'Equipo', '/equipo', 'people-outline', 'primary'],
  ['galeria', 'Galería', '/galeria', 'images-outline', 'primary'],
  ['resenas', 'Reseñas', '/resenas', 'star-outline', 'primary'],
  ['disponibilidad', 'Disponibilidad', '/disponibilidad', 'time-outline', 'primary'],
  ['notificaciones', 'Notificaciones', '/notificaciones', 'notifications-outline', 'secondary'],
  ['configuracion', 'Configuración', '/configuracion', 'settings-outline', 'secondary'],
  ['soporte', 'Ayuda y Soporte', '/soporte', 'help-circle-outline', 'secondary'],
  ['about', 'Acerca de Foundly', '/about', 'information-circle-outline', 'secondary'],
] as const;

describe('navigation module registry', () => {
  it('contains the ten modules in the web-parity order', () => {
    expect(NAVIGATION_MODULES).toHaveLength(10);
    expect(
      NAVIGATION_MODULES.map(({ id, label, route, icon, group }) => [
        id,
        label,
        route,
        icon,
        group,
      ]),
    ).toEqual(EXPECTED);
  });

  it('splits primary and secondary modules', () => {
    expect(PRIMARY_MODULES).toHaveLength(6);
    expect(SECONDARY_MODULES).toHaveLength(4);
    expect(PRIMARY_MODULES.every((module) => module.group === 'primary')).toBe(true);
    expect(SECONDARY_MODULES.every((module) => module.group === 'secondary')).toBe(true);
  });

  it('exposes agenda as the drawer home', () => {
    expect(DRAWER_HOME_ROUTE).toBe('/agenda');
    expect(getModuleById('agenda').route).toBe(DRAWER_HOME_ROUTE);
  });

  it('resolves modules by pathname and active prefixes', () => {
    expect(findModuleByPathname('/resenas')?.id).toBe('resenas');
    expect(findModuleByPathname('/configuracion/perfil')?.id).toBe('configuracion');
    expect(findModuleByPathname('/login')).toBeUndefined();
    expect(isModuleActive('/agenda', '/agenda')).toBe(true);
    expect(isModuleActive('/agenda/hoy', '/agenda')).toBe(true);
    expect(isModuleActive('/agenda', '/resenas')).toBe(false);
  });

  it('throws for unknown module ids', () => {
    expect(() => getModuleById('unknown')).toThrow('Módulo de navegación desconocido');
  });
});
