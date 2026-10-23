export type BenefitIcon = 'reminders' | 'payments' | 'no-shows' | 'integrations';

export interface ProductFeature {
  title: string;
  description: string;
  icon: BenefitIcon;
}

export interface ProductStep {
  step: string;
  title: string;
  description: string;
}

export interface ProductSpotlight {
  eyebrow: string;
  title: string;
  description: string;
  cta?: { href: string; label: string };
  preview: {
    name: string;
    rating: string;
    tagline: string;
    services: readonly { name: string; meta: string }[];
    slots: readonly string[];
  };
}

export interface ProductPricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  cta: { href: string; label: string };
  highlighted?: boolean;
}

/** Sector showcase card backed by a looping demo video. */
export interface ProductIndustry {
  id: string;
  title: string;
  /** Public path under `apps/book/public`. */
  video: string;
  /** Directory search term used by the card's link. */
  searchQuery: string;
}

export const BOOK_HERO = {
  title: 'Tu agenda en piloto automático',
  subtitle:
    'Gestiona citas, servicios y profesionales desde un solo panel, y deja que tus clientes reserven online a cualquier hora, incluso cuando estás cerrado.',
  badge: 'Reservas online 24/7',
} as const;

export const BOOK_HERO_CAPTURE = {
  placeholder: 'Tu email',
  button: 'Empezar gratis',
} as const;

export const BOOK_CTA = {
  href: '/onboarding',
  label: 'Registrar mi negocio',
} as const;

/** Spotlight / showcase: featured booking-page preview (Setmore-inspired). */
export const BOOK_SPOTLIGHT: ProductSpotlight = {
  eyebrow: 'Booking Page',
  title: 'Tu Booking Page personalizada',
  description:
    'Comparte tu enlace y deja que tus clientes elijan servicio, profesional y hora en una página a tu marca. Sin instalaciones ni código.',
  preview: {
    name: 'Estudio Ana',
    rating: '4.8',
    tagline: 'Peluquería y estética · Reservas abiertas',
    services: [
      { name: 'Corte de cabello', meta: '30 min · 20,00 €' },
      { name: 'Manicura', meta: '45 min · 25,00 €' },
      { name: 'Asesoría de imagen', meta: '60 min · 30,00 €' },
    ],
    slots: ['09:00', '10:30', '12:00', '16:00'],
  },
};

/** 3 steps to success. */
export const BOOK_STEPS: ProductStep[] = [
  {
    step: '1',
    title: 'Crea tu página',
    description: 'Activa tu Booking Page pública en minutos, sin instalar nada.',
  },
  {
    step: '2',
    title: 'Personaliza tu marca',
    description: 'Sube tu logo, define tu agenda y elige tus servicios y tarifas.',
  },
  {
    step: '3',
    title: 'Comparte y agenda',
    description: 'Comparte tu enlace y recibe reservas online 24/7.',
  },
];

/** Benefits grid with icons. */
export const BOOK_BENEFITS: ProductFeature[] = [
  {
    title: 'Recordatorios',
    description: 'Reduce ausencias con avisos automáticos antes de cada cita.',
    icon: 'reminders',
  },
  {
    title: 'Pagos por adelantado',
    description: 'Cobra el pago inicial al reservar y protege tu agenda.',
    icon: 'payments',
  },
  {
    title: 'Sin no-shows',
    description: 'Políticas de cancelación claras que minimizan las citas perdidas.',
    icon: 'no-shows',
  },
  {
    title: 'Integraciones',
    description: 'Sincroniza tu calendario, pagos y mensajería con tus herramientas.',
    icon: 'integrations',
  },
];

/** Pricing (ilustrativo — pendiente de ratificar en specs/business-model.md). */
export const BOOK_PRICING: ProductPricingPlan[] = [
  {
    id: 'free',
    name: 'Plan Gratis',
    price: '$0',
    period: '/mes',
    description: 'Para empezar a recibir reservas hoy mismo.',
    features: ['Booking Page pública', 'Hasta 1 servicio', 'Recordatorios por email'],
    cta: { href: '/onboarding', label: 'Empezar gratis' },
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    price: '$5',
    period: '/mes',
    description: 'Para negocios que quieren crecer sin fricción.',
    features: [
      'Número de servicios ilimitado',
      'Recordatorios por SMS',
      'Pagos por adelantado',
      'Protección frente a no-shows',
      'Integraciones',
    ],
    cta: { href: '/onboarding', label: 'Probar Pro gratis' },
    highlighted: true,
  },
];

export const BOOK_INDUSTRIES: ProductIndustry[] = [
  {
    id: 'barber-shop',
    title: 'Barberías y Peluquerías',
    video: '/videos/barber_shop.mp4',
    searchQuery: 'Peluquería',
  },
  {
    id: 'wellness',
    title: 'Salud y Bienestar / Masajes',
    video: '/videos/massage.mp4',
    searchQuery: 'Salud',
  },
  {
    id: 'training',
    title: 'Deportes y Entrenamiento',
    video: '/videos/training.mp4',
    searchQuery: 'Deportes',
  },
  {
    id: 'consulting',
    title: 'Consultoría y Servicios',
    video: '/videos/consulting.mp4',
    searchQuery: 'Consultoría',
  },
];

export const BOOK_FINAL_CTA = {
  eyebrow: 'Empieza en 3 pasos',
  title: 'Crea tu negocio en minutos',
  subtitle: 'Cuenta · Negocio · Configuración — y listo para recibir citas.',
  cta: { href: '/onboarding', label: 'Crear mi negocio gratis' },
} as const;
