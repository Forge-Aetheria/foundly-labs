import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type NavigationIconName = ComponentProps<typeof Ionicons>['name'];
export type NavigationGroup = 'primary' | 'secondary';

export interface NavigationModule {
  id: string;
  label: string;
  route: string;
  icon: NavigationIconName;
  group: NavigationGroup;
  description?: string;
}

export const DRAWER_HOME_ROUTE = '/agenda';

export const NAVIGATION_MODULES: readonly NavigationModule[] = [
  {
    id: 'agenda',
    label: 'Agenda',
    route: '/agenda',
    icon: 'calendar-outline',
    group: 'primary',
    description: 'Consulta y gestiona las citas de tu negocio.',
  },
  {
    id: 'servicios',
    label: 'Servicios',
    route: '/servicios',
    icon: 'cut-outline',
    group: 'primary',
    description: 'Administra el catálogo de servicios que ofreces.',
  },
  {
    id: 'equipo',
    label: 'Equipo',
    route: '/equipo',
    icon: 'people-outline',
    group: 'primary',
    description: 'Gestiona especialistas y miembros de tu equipo.',
  },
  {
    id: 'galeria',
    label: 'Galería',
    route: '/galeria',
    icon: 'images-outline',
    group: 'primary',
    description: 'Organiza las fotos que muestran tu trabajo.',
  },
  {
    id: 'resenas',
    label: 'Reseñas',
    route: '/resenas',
    icon: 'star-outline',
    group: 'primary',
    description: 'Revisa y modera las valoraciones de tus clientes.',
  },
  {
    id: 'disponibilidad',
    label: 'Disponibilidad',
    route: '/disponibilidad',
    icon: 'time-outline',
    group: 'primary',
    description: 'Configura horarios, descansos y bloqueos de agenda.',
  },
  {
    id: 'notificaciones',
    label: 'Notificaciones',
    route: '/notificaciones',
    icon: 'notifications-outline',
    group: 'secondary',
    description: 'Consulta los avisos de tu negocio.',
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    route: '/configuracion',
    icon: 'settings-outline',
    group: 'secondary',
    description: 'Ajusta el perfil, la visibilidad y las preferencias del negocio.',
  },
  {
    id: 'soporte',
    label: 'Ayuda y Soporte',
    route: '/soporte',
    icon: 'help-circle-outline',
    group: 'secondary',
    description: 'Encuentra ayuda o contacta con el equipo de Foundly.',
  },
  {
    id: 'about',
    label: 'Acerca de Foundly',
    route: '/about',
    icon: 'information-circle-outline',
    group: 'secondary',
    description: 'Conoce más sobre Foundly y esta aplicación.',
  },
];

export const PRIMARY_MODULES = NAVIGATION_MODULES.filter(
  (module) => module.group === 'primary',
);

export const SECONDARY_MODULES = NAVIGATION_MODULES.filter(
  (module) => module.group === 'secondary',
);

export function findModuleByPathname(pathname: string): NavigationModule | undefined {
  return NAVIGATION_MODULES.find((module) => isModuleActive(pathname, module.route));
}

export function getModuleById(id: string): NavigationModule {
  const module = NAVIGATION_MODULES.find((item) => item.id === id);
  if (!module) {
    throw new Error(`Módulo de navegación desconocido: ${id}`);
  }
  return module;
}

export function isModuleActive(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}
