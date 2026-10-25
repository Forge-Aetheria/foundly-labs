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

export function tenantCategoryLabel(value: string): string {
  return value in TENANT_CATEGORY_LABELS
    ? TENANT_CATEGORY_LABELS[value as TenantCategory]
    : value;
}
