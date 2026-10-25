import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactChannel {
  id: string;
  label: string;
  description: string;
  url: string;
  icon: IconName;
}

export const SUPPORT_INTRO =
  'Encuentra respuestas rápidas y contacta con el equipo de Foundly si necesitas ayuda con tu negocio.';

export const SUPPORT_FAQS: FaqItem[] = [
  {
    id: 'appointments',
    question: '¿Cómo gestiono mis citas?',
    answer:
      'Desde Agenda puedes consultar las citas próximas de tu negocio y refrescar la información. Para cambios de servicios o equipo, usa los módulos correspondientes del menú.',
  },
  {
    id: 'public-page',
    question: '¿Cómo activo o desactivo mi página pública?',
    answer:
      'Entra en Configuración → Perfil del Negocio y usa el interruptor de Página pública. Necesitas un enlace público (slug) válido para publicarla.',
  },
  {
    id: 'logo',
    question: '¿Cómo actualizo el logo de mi negocio?',
    answer:
      'En Configuración → Perfil del Negocio puedes subir una imagen cuadrada desde tu dispositivo o indicar una URL. Recuerda guardar los cambios.',
  },
  {
    id: 'account',
    question: '¿Cómo cambio mi contraseña?',
    answer:
      'Abre Configuración → Seguridad, introduce tu contraseña actual y la nueva. Por seguridad, la nueva debe tener al menos 8 caracteres e incluir letras y números.',
  },
  {
    id: 'support',
    question: '¿Cómo contacto con soporte?',
    answer:
      'Usa el correo de soporte o visita la web de Foundly desde los accesos de esta página. Incluye el nombre de tu negocio y una descripción del problema.',
  },
];

const SUPPORT_EMAIL = 'soporte@foundlylabs.com';

export const SUPPORT_CHANNELS: ContactChannel[] = [
  {
    id: 'email',
    label: 'Escríbenos',
    description: SUPPORT_EMAIL,
    url: `mailto:${SUPPORT_EMAIL}?subject=Ayuda%20Foundly%20Book`,
    icon: 'mail-outline',
  },
  {
    id: 'website',
    label: 'Web de Foundly',
    description: 'Información y recursos del ecosistema',
    url: 'https://foundlylabs.com',
    icon: 'globe-outline',
  },
];
