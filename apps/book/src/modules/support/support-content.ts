export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactChannel {
  id: string;
  label: string;
  description: string;
  href: string;
}

export const SUPPORT_INTRO =
  'Encuentra respuestas rápidas y contacta con el equipo de Foundly si necesitas ayuda con tu negocio.';

export const SUPPORT_FAQS: FaqItem[] = [
  {
    id: 'appointments',
    question: '¿Cómo gestiono mis citas?',
    answer:
      'Desde Agenda puedes consultar las citas próximas de tu negocio. Para cambios de servicios o equipo, usa los módulos correspondientes del panel.',
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
      'En Configuración → Perfil del Negocio puedes subir una imagen cuadrada o indicar una URL. Recuerda guardar los cambios.',
  },
  {
    id: 'account',
    question: '¿Cómo cambio mi contraseña?',
    answer:
      'Abre Configuración → Seguridad, introduce tu contraseña actual y la nueva. La nueva debe tener al menos 8 caracteres e incluir letras y números.',
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
    href: `mailto:${SUPPORT_EMAIL}?subject=Ayuda%20Foundly%20Book`,
  },
  {
    id: 'website',
    label: 'Web de Foundly',
    description: 'Información y recursos del ecosistema',
    href: 'https://foundlylabs.com',
  },
];
