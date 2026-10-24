/**
 * Master tenant categories (shared by the API, Book admin and public directory).
 * The values match the Prisma `TenantCategory` enum; labels are user-facing.
 */
export const TENANT_CATEGORIES = [
  'BARBERIAS_PELUQUERIAS',
  'SALUD_BIENESTAR',
  'DEPORTES_ENTRENAMIENTO',
  'CONSULTORIA_SERVICIOS',
  'OTROS',
] as const;

export type TenantCategory = (typeof TENANT_CATEGORIES)[number];

export const TENANT_CATEGORY_LABELS: Record<TenantCategory, string> = {
  BARBERIAS_PELUQUERIAS: 'Barberías y Peluquerías',
  SALUD_BIENESTAR: 'Salud y Bienestar',
  DEPORTES_ENTRENAMIENTO: 'Deportes y Entrenamiento',
  CONSULTORIA_SERVICIOS: 'Consultoría y Servicios',
  OTROS: 'Otros',
};

export function isTenantCategory(value: string): value is TenantCategory {
  return (TENANT_CATEGORIES as readonly string[]).includes(value);
}

export function tenantCategoryLabel(value: string): string {
  return isTenantCategory(value) ? TENANT_CATEGORY_LABELS[value] : value;
}

export function tenantCategoryOption(value: TenantCategory): {
  value: TenantCategory;
  label: string;
} {
  return { value, label: TENANT_CATEGORY_LABELS[value] };
}

const CATEGORY_ALIASES: Record<TenantCategory, string[]> = {
  BARBERIAS_PELUQUERIAS: ['barberia', 'barberias', 'peluqueria', 'peluquerias', 'estetica'],
  SALUD_BIENESTAR: ['salud', 'bienestar', 'masaje', 'masajes', 'spa'],
  DEPORTES_ENTRENAMIENTO: ['deporte', 'deportes', 'entrenamiento', 'gimnasio', 'fitness'],
  CONSULTORIA_SERVICIOS: ['consultoria', 'consultor', 'servicios', 'asesoria'],
  OTROS: ['otros', 'otras'],
};

export function tenantCategoryFromLabel(value: string): TenantCategory | null {
  const normalized = value.trim().toLocaleLowerCase('es');
  if (!normalized) return null;
  for (const category of TENANT_CATEGORIES) {
    const key = category.toLocaleLowerCase('es');
    const label = TENANT_CATEGORY_LABELS[category].toLocaleLowerCase('es');
    if (key === normalized || label === normalized) {
      return category;
    }
    if (normalized.length >= 3 && label.includes(normalized)) {
      return category;
    }
    if (
      normalized.length >= 3 &&
      CATEGORY_ALIASES[category].some(
        (alias) => alias.includes(normalized) || normalized.includes(alias),
      )
    ) {
      return category;
    }
  }
  return null;
}
