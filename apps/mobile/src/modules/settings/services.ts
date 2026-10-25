import {
  DeletePaymentMethodDocument,
  MyBusinessDocument,
  MyPaymentMethodsDocument,
  UpdateMyBusinessProfileDocument,
  UpsertPaymentMethodDocument,
  type DeletePaymentMethodMutation,
  type MyBusinessQuery,
  type MyPaymentMethodsQuery,
  type UpdateBusinessProfileInput,
  type UpdateMyBusinessProfileMutation,
  type UpsertPaymentMethodInput,
  type UpsertPaymentMethodMutation,
} from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, ok, type ActionResult } from '@/shared/api/result';

export type BusinessProfile = MyBusinessQuery['myBusiness'];
export type PaymentMethod = MyPaymentMethodsQuery['myPaymentMethods'][number];

export async function fetchMyBusiness(): Promise<ActionResult<BusinessProfile>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<MyBusinessQuery>(MyBusinessDocument, {}, { token });
  return result.ok ? ok(result.data.myBusiness) : result;
}

export async function updateBusinessProfile(
  input: UpdateBusinessProfileInput,
): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<UpdateMyBusinessProfileMutation>(
    UpdateMyBusinessProfileDocument,
    { input },
    { token },
  );
  return result.ok ? ok(true) : result;
}

export async function updatePublicPage(isPublic: boolean): Promise<ActionResult<true>> {
  return updateBusinessProfile({ isPublic });
}

export async function fetchPaymentMethods(): Promise<ActionResult<PaymentMethod[]>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<MyPaymentMethodsQuery>(MyPaymentMethodsDocument, {}, { token });
  return result.ok ? ok(result.data.myPaymentMethods) : result;
}

export async function upsertPaymentMethod(
  input: UpsertPaymentMethodInput,
): Promise<ActionResult<PaymentMethod>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<UpsertPaymentMethodMutation>(
    UpsertPaymentMethodDocument,
    { input },
    { token },
  );
  return result.ok ? ok(result.data.upsertPaymentMethod) : result;
}

export async function deletePaymentMethod(id: string): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<DeletePaymentMethodMutation>(
    DeletePaymentMethodDocument,
    { id },
    { token },
  );
  return result.ok ? ok(true) : result;
}
