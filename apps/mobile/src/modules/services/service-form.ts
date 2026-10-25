import { AdvanceKind } from '@/shared/api/generated';
import type { CreateMyServiceInput } from '@/shared/api/generated';
import type { Service } from './services';

export type ServiceAdvanceKind = 'fixed' | 'percent';

export interface ServiceDraft {
  name: string;
  description: string;
  category: string;
  duration: string;
  price: string;
  active: boolean;
  requiresAdvance: boolean;
  advanceKind: ServiceAdvanceKind | '';
  advanceValue: string;
}

export const EMPTY_SERVICE_DRAFT: ServiceDraft = {
  name: '',
  description: '',
  category: '',
  duration: '',
  price: '',
  active: true,
  requiresAdvance: false,
  advanceKind: '',
  advanceValue: '',
};

export function draftFromService(service: Service): ServiceDraft {
  return {
    name: service.name,
    description: service.description ?? '',
    category: service.category ?? '',
    duration: String(service.durationMinutes),
    price: String(service.priceCents / 100),
    active: service.active,
    requiresAdvance: service.requiresAdvance,
    advanceKind: service.advanceKind ?? '',
    advanceValue:
      service.advanceValue != null
        ? String(
            service.advanceKind === 'percent' ? service.advanceValue : service.advanceValue / 100,
          )
        : '',
  };
}

export function validateServiceDraft(draft: ServiceDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.name.trim()) errors.name = 'El nombre es obligatorio.';

  const duration = Number(draft.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    errors.duration = 'Indica una duración mayor que cero.';
  }

  const price = Number(draft.price);
  if (!Number.isFinite(price) || price < 0) {
    errors.price = 'Indica un precio válido.';
  }

  if (draft.requiresAdvance) {
    if (!draft.advanceKind) errors.advanceKind = 'Selecciona el tipo de adelanto.';
    const value = Number(draft.advanceValue);
    if (!Number.isFinite(value) || value <= 0) {
      errors.advanceValue = 'Indica el importe o porcentaje del adelanto.';
    } else if (draft.advanceKind === 'percent' && value > 100) {
      errors.advanceValue = 'El porcentaje no puede superar 100.';
    }
  }

  return errors;
}

export function buildServiceInput(draft: ServiceDraft): CreateMyServiceInput {
  const advanceValue = draft.requiresAdvance ? Number(draft.advanceValue) : null;
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    category: draft.category.trim() || null,
    durationMinutes: Number(draft.duration),
    priceCents: Math.round(Number(draft.price) * 100),
    active: draft.active,
    requiresAdvance: draft.requiresAdvance,
    advanceKind:
      draft.requiresAdvance && draft.advanceKind ? (draft.advanceKind as AdvanceKind) : null,
    advanceValue:
      draft.requiresAdvance && advanceValue != null
        ? draft.advanceKind === 'fixed'
          ? Math.round(advanceValue * 100)
          : advanceValue
        : null,
  };
}

export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100);
}

export function advanceLabel(service: Service): string {
  if (!service.requiresAdvance || service.advanceValue == null) return 'Sin adelanto';
  return service.advanceKind === 'percent'
    ? `${service.advanceValue}%`
    : formatPrice(service.advanceValue);
}
