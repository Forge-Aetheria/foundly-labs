import { TenantCategory as PrismaTenantCategory } from '@foundly/database';

export const TENANT_CATEGORIES = Object.values(PrismaTenantCategory);

const CATEGORY_LABELS: Record<PrismaTenantCategory, string> = {
  [PrismaTenantCategory.BARBERIAS_PELUQUERIAS]: 'Barberías y Peluquerías',
  [PrismaTenantCategory.SALUD_BIENESTAR]: 'Salud y Bienestar',
  [PrismaTenantCategory.DEPORTES_ENTRENAMIENTO]: 'Deportes y Entrenamiento',
  [PrismaTenantCategory.CONSULTORIA_SERVICIOS]: 'Consultoría y Servicios',
  [PrismaTenantCategory.OTROS]: 'Otros',
};

const CATEGORY_ALIASES: Record<PrismaTenantCategory, string[]> = {
  [PrismaTenantCategory.BARBERIAS_PELUQUERIAS]: [
    'barberia',
    'barberias',
    'peluqueria',
    'peluquerias',
    'estetica',
  ],
  [PrismaTenantCategory.SALUD_BIENESTAR]: ['salud', 'bienestar', 'masaje', 'masajes', 'spa'],
  [PrismaTenantCategory.DEPORTES_ENTRENAMIENTO]: [
    'deporte',
    'deportes',
    'entrenamiento',
    'gimnasio',
    'fitness',
  ],
  [PrismaTenantCategory.CONSULTORIA_SERVICIOS]: [
    'consultoria',
    'consultor',
    'servicios',
    'asesoria',
  ],
  [PrismaTenantCategory.OTROS]: ['otros', 'otras'],
};

export function categoryFromSearchTerm(value: string): PrismaTenantCategory | null {
  const normalized = value.trim().toLocaleLowerCase('es');
  if (!normalized) return null;
  for (const category of TENANT_CATEGORIES) {
    const key = category.toLocaleLowerCase('es');
    const label = CATEGORY_LABELS[category].toLocaleLowerCase('es');
    if (key === normalized || label === normalized) return category;
    if (normalized.length >= 3 && label.includes(normalized)) return category;
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
