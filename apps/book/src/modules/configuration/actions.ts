'use server';

import { apiRequestAdmin } from '../../shared/api/admin-request';
import {
  DeletePaymentMethodDocument,
  MyPaymentMethodsDocument,
  UpsertPaymentMethodDocument,
  type MyPaymentMethodsQuery,
  type PaymentMethodType as ApiPaymentMethodType,
} from '../../shared/api/generated';
import { getEffectiveSession } from '../../shared/auth/authServer';
import { fail, ok, zodFields, type ActionResult } from '../../shared/types/result';
import { parsePaymentDetails, serializePaymentDetails, type PaymentMethod } from '../../shared/types/payments';
import { deletePaymentMethodSchema, paymentMethodSchema } from './utils/schemas';

/**
 * Configuration module — server data access for payment methods (feature 017; constitution §5.VI).
 * Codegen documents/types only; reads/writes go through the session-aware transport.
 */

type ApiPaymentMethod = MyPaymentMethodsQuery['myPaymentMethods'][number];

function toNullableText(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

function mapPaymentMethod(dto: ApiPaymentMethod, tenantId: string): PaymentMethod {
  return {
    id: dto.id,
    tenantId: dto.tenantId || tenantId,
    type: dto.type,
    title: dto.title ?? null,
    details: parsePaymentDetails(dto.details),
    instructions: dto.instructions ?? null,
    active: dto.active,
  };
}

/** The tenant's payment methods. SERVER-ONLY. */
export async function listPaymentMethods(): Promise<ActionResult<PaymentMethod[]>> {
  const session = await getEffectiveSession();
  const result = await apiRequestAdmin(MyPaymentMethodsDocument, {});
  if (!result.ok) return result;
  return ok(result.data.myPaymentMethods.map((dto) => mapPaymentMethod(dto, session?.tenantId ?? '')));
}

/** Create or replace one method (by type) for the authenticated owner. */
export async function upsertPaymentMethod(input: unknown): Promise<ActionResult<PaymentMethod>> {
  const session = await getEffectiveSession();
  if (!session?.tenantId) {
    return fail('UNAUTHENTICATED', 'Se requiere una sesión de Foundly Pass.');
  }
  const parsed = paymentMethodSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Datos del método de pago inválidos.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(UpsertPaymentMethodDocument, {
    input: {
      type: parsed.data.type as ApiPaymentMethodType,
      title: toNullableText(parsed.data.title),
      details: serializePaymentDetails(parsed.data.details),
      instructions: toNullableText(parsed.data.instructions),
      active: parsed.data.active,
    },
  });
  if (!result.ok) return result;
  return ok(mapPaymentMethod(result.data.upsertPaymentMethod, session.tenantId));
}

/** Delete one of the authenticated owner's methods. */
export async function deletePaymentMethod(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = deletePaymentMethodSchema.safeParse(input);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Método de pago inválido.', zodFields(parsed.error));
  }
  const result = await apiRequestAdmin(DeletePaymentMethodDocument, { id: parsed.data.id });
  if (!result.ok) return result;
  return ok({ id: parsed.data.id });
}
