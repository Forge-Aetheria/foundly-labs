import type { SvgIconComponent } from '@mui/icons-material';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupsIcon from '@mui/icons-material/Groups';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ReviewsIcon from '@mui/icons-material/Reviews';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: SvgIconComponent;
}

/**
 * Primary module navigation for the Foundly Book admin panel.
 *
 * Mirrors the public provider landing (`/book/[tenantSlug]`): agenda and
 * services plus the storefront content sections (Equipo, Galería, Perfil) and
 * availability.
 */
export const PRIMARY_NAV: AdminNavItem[] = [
  { href: '/admin/agenda', label: 'Agenda', icon: EventNoteIcon },
  { href: '/admin/services', label: 'Servicios', icon: DesignServicesIcon },
  { href: '/admin/staff', label: 'Equipo', icon: GroupsIcon },
  { href: '/admin/gallery', label: 'Galería', icon: PhotoLibraryIcon },
  { href: '/admin/profile', label: 'Perfil', icon: StorefrontIcon },
  { href: '/admin/reviews', label: 'Reseñas', icon: ReviewsIcon },
  { href: '/admin/availability', label: 'Disponibilidad', icon: ScheduleIcon },
];

/** Secondary, non-core options (placeholder sections for this version). */
export const SECONDARY_NAV: AdminNavItem[] = [
  { href: '/admin/seguridad', label: 'Seguridad', icon: LockIcon },
  { href: '/admin/configuracion', label: 'Configuración', icon: SettingsIcon },
  { href: '/admin/soporte', label: 'Ayuda y soporte', icon: SupportAgentIcon },
  { href: '/admin/acerca', label: 'Acerca de Foundly', icon: InfoOutlinedIcon },
];
