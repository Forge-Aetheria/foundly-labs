import type {
  Appointment,
  AppointmentAuditEntry,
  AvailabilityRule,
  Rate,
  Resource,
  Service,
  TimeBlock,
} from '../types/appointments';
import type {
  BusinessHours,
  OnboardingProvision,
  PortalPolicy,
  Review,
  Tenant,
  User,
} from '../types/tenancy';
import type { Session } from './auth';

/**
 * In-memory store for the admin panel (mock state).
 * The persistence technology is intentionally left undefined — this module is the
 * single seam that must be replaced when the architecture decides on storage.
 */
export interface BookStore {
  resources: Resource[];
  services: Service[];
  rates: Rate[];
  availabilityRules: AvailabilityRule[];
  timeBlocks: TimeBlock[];
  appointments: Appointment[];
  audit: AppointmentAuditEntry[];
  tenants: Tenant[];
  users: User[];
  onboardingProvisions: OnboardingProvision[];
  sessions: Session[];
  portalPolicies: PortalPolicy[];
  reviews: Review[];
}

const TIMEZONE = 'Europe/Madrid';
const NOW = '2026-10-08T00:00:00.000Z';

function seedBusinessHours(): BusinessHours[] {
  const days: number[] = [1, 2, 3, 4, 5, 6]; // Mon–Sat open
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    days.includes(weekday)
      ? { weekday, isOpen: true, startTime: '09:00', endTime: '18:00' }
      : { weekday, isOpen: false, startTime: '', endTime: '' },
  );
}

function seed(): BookStore {
  const unsplash = (id: string, w: number) => `https://images.unsplash.com/${id}?w=${w}&q=80`;

  const resource: Resource = {
    id: 'res-ana',
    name: 'Ana Profesional',
    type: 'professional',
    active: true,
    timezone: TIMEZONE,
    tenantId: 'ten-ana',
    role: 'Peluquera senior',
    avatar: null,
    bio: 'Especialista en cortes, color y acabados.',
    serviceIds: ['svc-corte'],
  };
  const secondResource: Resource = {
    id: 'res-luis',
    name: 'Luis Estilista',
    type: 'professional',
    active: true,
    timezone: TIMEZONE,
    tenantId: 'ten-ana',
    role: 'Barbero',
    avatar: null,
    bio: 'Cortes de caballero, degradados y arreglo de barba.',
  };
  const service: Service = {
    id: 'svc-corte',
    name: 'Corte de cabello',
    description: 'Corte y peinado',
    durationMinutes: 30,
    bufferMinutes: 10,
    category: 'Peluquería',
    active: true,
    tenantId: 'ten-ana',
  };
  const rate: Rate = {
    id: 'rate-corte',
    serviceId: service.id,
    amountCents: 2000,
    currency: 'EUR',
    effectiveFrom: '2020-01-01T00:00:00.000Z',
    effectiveTo: null,
  };
  const availabilityRules: AvailabilityRule[] = [1, 2, 3, 4, 5].map((weekday) => ({
    id: `rule-${weekday}`,
    resourceId: resource.id,
    weekday,
    startTime: '09:00',
    endTime: '18:00',
    slotGranularityMinutes: 30,
    minLeadTimeMinutes: 0,
    bookingHorizonDays: 60,
  }));

  const tenant: Tenant = {
    id: 'ten-ana',
    name: 'Estudio Ana',
    slug: 'estudio-ana',
    category: 'Peluquería',
    status: 'active',
    ownerUserId: 'u-owner-ana',
    defaultAppointmentDurationMinutes: 30,
    businessHours: seedBusinessHours(),
    currency: 'EUR',
    timezone: TIMEZONE,
    onlineBookingEnabled: true,
    license: null,
    avatar: unsplash('photo-1580618672591-eb180b1a973f', 240),
    cover: unsplash('photo-1560066984-138dadb4c035', 1200),
    gallery: [
      {
        id: 'gallery-ana-local',
        url: unsplash('photo-1560066984-138dadb4c035', 900),
        title: 'Nuestro espacio',
        category: 'local',
      },
      {
        id: 'gallery-ana-trabajos-1',
        url: unsplash('photo-1522337360788-8b13dee7a37e', 900),
        title: 'Color y cortes',
        category: 'trabajos',
      },
      {
        id: 'gallery-ana-trabajos-2',
        url: unsplash('photo-1562322140-8baeececf3df', 900),
        title: 'Recogidos y eventos',
        category: 'trabajos',
      },
      {
        id: 'gallery-ana-local-2',
        url: unsplash('photo-1521590832167-7bcbfaa6381f', 900),
        title: 'Zona de trabajo',
        category: 'local',
      },
      {
        id: 'gallery-ana-equipo',
        url: unsplash('photo-1633681926022-84c23e8cb2d6', 900),
        title: 'Nuestro equipo',
        category: 'equipo',
      },
      {
        id: 'gallery-ana-trabajos-3',
        url: unsplash('photo-1580618672591-eb180b1a973f', 900),
        title: 'Detalle de acabado',
        category: 'trabajos',
      },
    ],
    bio: 'Estudio de peluquería y estética que combina técnica, tiempo y trato cercano en pleno centro de Madrid.',
    address: 'Calle Mayor 7, 28013 Madrid',
    phone: '+34 612 345 678',
    social: {
      instagram: 'https://instagram.com/estudioana',
      whatsapp: 'https://wa.me/34612345678',
    },
    createdAt: NOW,
    updatedAt: NOW,
  };
  const owner: User = {
    id: 'u-owner-ana',
    fullName: 'Ana Profesional',
    email: 'ana@foundly.dev',
    credential: 'mock-credential',
    role: 'owner',
    tenantId: tenant.id,
    status: 'active',
    createdAt: NOW,
  };
  const ownerSession: Session = {
    userId: owner.id,
    role: 'admin',
    tenantId: tenant.id,
  };
  const portalPolicies: PortalPolicy[] = [
    {
      id: 'pol-booking',
      tenantId: tenant.id,
      title: 'Cómo reservar',
      body: 'Elige servicio, especialista y franja; confirma tus datos y recibirás tu cita en estado pendiente.',
    },
    {
      id: 'pol-cancellation',
      tenantId: tenant.id,
      title: 'Política de cancelación',
      body: 'Puedes cancelar o reprogramar sin coste hasta 24 horas antes de tu cita.',
    },
  ];

  /* ------------------------------------------------------------------ *
   * Seeded provider landing for `rona-piercing` (003 — rona-piercing). *
   *                                                                     *
   * Test business used to visualise the full two-column provider        *
   * landing: gallery, categories/services, team, policies and reviews.  *
   * ------------------------------------------------------------------ */

  const ronaHours: BusinessHours[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const isOpen = weekday >= 1 && weekday <= 6; // Mon–Sat
    return { weekday, isOpen, startTime: isOpen ? '10:00' : '', endTime: isOpen ? '19:30' : '' };
  });

  const ronaTenant: Tenant = {
    id: 'ten-rona',
    name: 'Rona Piercing',
    slug: 'rona-piercing',
    category: 'Piercing & Body Art',
    status: 'active',
    ownerUserId: 'u-owner-rona',
    defaultAppointmentDurationMinutes: 20,
    businessHours: ronaHours,
    currency: 'EUR',
    timezone: TIMEZONE,
    onlineBookingEnabled: true,
    license: null,
    avatar: unsplash('photo-1596462502278-27bfdc403348', 240),
    cover: unsplash('photo-1519671482749-fd09be7ccebf', 1200),
    bio: 'Estudio de piercing y body art en el corazón de Madrid: joyería de titanio, higiene estricta y un trato cercano que convierte cada perforación en una experiencia cuidada.',
    address: 'Calle de la Estrella 12, 28004 Madrid',
    phone: '+34 655 210 987',
    social: {
      instagram: 'https://instagram.com/ronapiercing',
      whatsapp: 'https://wa.me/34655210987',
    },
    gallery: [
      {
        id: 'gallery-rona-local',
        url: unsplash('photo-1507525428034-b723cf961d3e', 900),
        title: 'El estudio',
        category: 'local',
      },
      {
        id: 'gallery-rona-trabajos-1',
        url: unsplash('photo-1449824913935-59a10b8d2000', 900),
        title: 'Joyería anatómica',
        category: 'trabajos',
      },
      {
        id: 'gallery-rona-equipo',
        url: unsplash('photo-1507003211169-0a1dd7228f2d', 900),
        title: 'El equipo',
        category: 'equipo',
      },
      {
        id: 'gallery-rona-trabajos-2',
        url: unsplash('photo-1461988320302-91bde64fc8e4', 900),
        title: 'Perforaciones',
        category: 'trabajos',
      },
      {
        id: 'gallery-rona-equipo-2',
        url: unsplash('photo-1517841905240-472988babdf9', 900),
        title: 'Cuidado y seguimiento',
        category: 'equipo',
      },
      {
        id: 'gallery-rona-local-2',
        url: unsplash('photo-1506794778202-cad84cf45f1d', 900),
        title: 'Zona de trabajo',
        category: 'local',
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  };

  const ronaResources: Resource[] = [
    {
      id: 'res-rona',
      name: 'Rona',
      type: 'professional',
      active: true,
      timezone: TIMEZONE,
      tenantId: ronaTenant.id,
      role: 'Piercer principal',
      avatar: unsplash('photo-1595950653106-6c9ebd614d3a', 240),
      bio: 'Piercer certificada con 8 años de experiencia en perforaciones de oreja, nariz y cuerpo.',
    },
    {
      id: 'res-leo',
      name: 'Leo',
      type: 'professional',
      active: true,
      timezone: TIMEZONE,
      tenantId: ronaTenant.id,
      role: 'Piercer',
      avatar: unsplash('photo-1507003211169-0a1dd7228f2d', 240),
      bio: 'Especialista en hélix, tragus y joyería anatómica para un ajuste perfecto.',
    },
    {
      id: 'res-mara',
      name: 'Mara',
      type: 'professional',
      active: true,
      timezone: TIMEZONE,
      tenantId: ronaTenant.id,
      role: 'Body art & tatuajes',
      avatar: unsplash('photo-1529626455594-4ff0802cfb7e', 240),
      bio: 'Body piercing avanzado y acompañamiento en el cuidado post-perforación.',
    },
  ];

  const ronaServices: Service[] = [
    {
      id: 'svc-lobulo',
      name: 'Perforación de lóbulo',
      description: 'Perforación única en el lóbulo con joyería de titanio incluida.',
      durationMinutes: 15,
      bufferMinutes: 5,
      category: 'Piercing',
      active: true,
      tenantId: ronaTenant.id,
    },
    {
      id: 'svc-helix',
      name: 'Hélix',
      description: 'Perforación en el cartílago superior de la oreja.',
      durationMinutes: 20,
      bufferMinutes: 5,
      category: 'Piercing',
      active: true,
      tenantId: ronaTenant.id,
    },
    {
      id: 'svc-tragus',
      name: 'Tragus',
      description: 'Perforación del pequeño cartílago que protege el canal auditivo.',
      durationMinutes: 20,
      bufferMinutes: 5,
      category: 'Piercing',
      active: true,
      tenantId: ronaTenant.id,
    },
    {
      id: 'svc-septum',
      name: 'Septum',
      description: 'Perforación del tabique nasal con joyería a tu elección.',
      durationMinutes: 25,
      bufferMinutes: 5,
      category: 'Piercing',
      active: true,
      tenantId: ronaTenant.id,
    },
    {
      id: 'svc-jewelry',
      name: 'Cambio de joyería',
      description: 'Sustitución de tu joyería actual por una pieza nueva y esterilizada.',
      durationMinutes: 15,
      bufferMinutes: 5,
      category: 'Joyería',
      active: true,
      tenantId: ronaTenant.id,
    },
    {
      id: 'svc-clean',
      name: 'Limpieza y revisión',
      description: 'Revisión de la perforación y limpieza profesional con suero y antiséptico.',
      durationMinutes: 10,
      bufferMinutes: 5,
      category: 'Cuidado',
      active: true,
      tenantId: ronaTenant.id,
    },
  ];

  const ronaRates: Rate[] = ronaServices.map((ronaService, index) => ({
    id: `rate-rona-${index}`,
    serviceId: ronaService.id,
    amountCents: [2500, 3000, 3500, 4000, 1500, 1000][index] ?? 2000,
    currency: 'EUR',
    effectiveFrom: '2020-01-01T00:00:00.000Z',
    effectiveTo: null,
  }));

  const ronaAvailabilityRules: AvailabilityRule[] = ronaResources.flatMap((ronaResource) =>
    [1, 2, 3, 4, 5, 6].map((weekday) => ({
      id: `rona-rule-${ronaResource.id}-${weekday}`,
      resourceId: ronaResource.id,
      weekday,
      startTime: '10:00',
      endTime: '19:30',
      slotGranularityMinutes: 30,
      minLeadTimeMinutes: 0,
      bookingHorizonDays: 60,
    })),
  );

  const ronaPolicies: PortalPolicy[] = [
    {
      id: 'pol-rona-booking',
      tenantId: ronaTenant.id,
      title: 'Cómo reservar',
      body: 'Elige tu servicio y especialista, selecciona día y hora y confirma tus datos. Recibirás la confirmación por correo.',
    },
    {
      id: 'pol-rona-cancellation',
      tenantId: ronaTenant.id,
      title: 'Política de cancelación',
      body: 'Puedes cancelar o reprogramar sin coste hasta 24 horas antes. Pasado ese plazo la joyería asignada puede perder la reserva.',
    },
    {
      id: 'pol-rona-aftercare',
      tenantId: ronaTenant.id,
      title: 'Cuidados post-perforación',
      body: 'Incluimos instrucciones de limpieza y te ofrecemos una revisión gratuita a los 30 días.',
    },
  ];

  const anaReviews: Review[] = [
    {
      id: 'rev-ana-1',
      tenantId: tenant.id,
      author: 'Marta Ruiz',
      rating: 5,
      comment: 'Corte impecable y trato cercano. Ana entiende a la perfección lo que buscas.',
      date: '2026-09-30T00:00:00.000Z',
    },
    {
      id: 'rev-ana-2',
      tenantId: tenant.id,
      author: 'Javier Melgar',
      rating: 5,
      comment: 'Ambiente tranquilo y resultado de diez. Repetiré sin dudarlo.',
      date: '2026-09-22T00:00:00.000Z',
    },
    {
      id: 'rev-ana-3',
      tenantId: tenant.id,
      author: 'Lucía Torres',
      rating: 4,
      comment: 'Muy buen color y acabado. Cita puntual y precio justo.',
      date: '2026-09-05T00:00:00.000Z',
    },
    {
      id: 'rev-ana-4',
      tenantId: tenant.id,
      author: 'Andrés Vega',
      rating: 5,
      comment: 'El mejor estudio de la zona. Profesionales y muy detallistas.',
      date: '2026-08-18T00:00:00.000Z',
    },
  ];

  const ronaReviews: Review[] = [
    {
      id: 'rev-rona-1',
      tenantId: ronaTenant.id,
      author: 'Ana García',
      rating: 5,
      comment:
        'Rona fue súper profesional y cuidadosa. La joyería es preciosa y el estudio impecable. Repetiré sin duda.',
      date: '2026-09-28T00:00:00.000Z',
    },
    {
      id: 'rev-rona-2',
      tenantId: ronaTenant.id,
      author: 'Marc Vila',
      rating: 5,
      comment:
        'Me explicaron cada paso antes de perforar. Hélix perfecto, sin dolor y con muy buena higiene.',
      date: '2026-09-15T00:00:00.000Z',
    },
    {
      id: 'rev-rona-3',
      tenantId: ronaTenant.id,
      author: 'Lucía Ferre',
      rating: 4,
      comment:
        'Gran trato y asesoramiento. El septum quedó genial; solo me habría gustado más elección de pendientes.',
      date: '2026-08-30T00:00:00.000Z',
    },
    {
      id: 'rev-rona-4',
      tenantId: ronaTenant.id,
      author: 'David Soriano',
      rating: 5,
      comment:
        'Perforación del trago sin apenas molestia. Muy profesional, rápido y con una higiene impecable.',
      date: '2026-08-12T00:00:00.000Z',
    },
    {
      id: 'rev-rona-5',
      tenantId: ronaTenant.id,
      author: 'Nuria Pons',
      rating: 4,
      comment:
        'Muy buen estudio para cambiarse la joyería. Resolvieron dudas y el seguimiento post perforación fue un plus.',
      date: '2026-07-20T00:00:00.000Z',
    },
  ];

  return {
    resources: [resource, secondResource, ...ronaResources],
    services: [service, ...ronaServices],
    rates: [rate, ...ronaRates],
    availabilityRules: [...availabilityRules, ...ronaAvailabilityRules],
    timeBlocks: [],
    appointments: [],
    audit: [],
    tenants: [tenant, ronaTenant],
    users: [owner],
    onboardingProvisions: [],
    sessions: [ownerSession],
    portalPolicies: [...portalPolicies, ...ronaPolicies],
    reviews: [...anaReviews, ...ronaReviews],
  };
}

let store: BookStore = seed();

/** Access the current in-memory store. */
export function getStore(): BookStore {
  return store;
}

/** Reset the store to a fresh seeded (or empty) state. Used by tests. */
export function resetStore(options: { seed?: boolean } = {}): void {
  store =
    options.seed === false
      ? {
          resources: [],
          services: [],
          rates: [],
          availabilityRules: [],
          timeBlocks: [],
          appointments: [],
          audit: [],
          tenants: [],
          users: [],
          onboardingProvisions: [],
          sessions: [],
          portalPolicies: [],
          reviews: [],
        }
      : seed();
}
