import {
  MyBusinessDocument,
  UpdateMyBusinessProfileDocument,
  type MyBusinessQuery,
  type UpdateMyBusinessProfileMutation,
} from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, ok, type ActionResult } from '@/shared/api/result';

export type BusinessProfile = MyBusinessQuery['myBusiness'];

export async function fetchMyBusiness(): Promise<ActionResult<BusinessProfile>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<MyBusinessQuery>(MyBusinessDocument, {}, { token });
  return result.ok ? ok(result.data.myBusiness) : result;
}

export async function updatePublicPage(isPublic: boolean): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<UpdateMyBusinessProfileMutation>(
    UpdateMyBusinessProfileDocument,
    { input: { isPublic } },
    { token },
  );
  return result.ok ? ok(true) : result;
}
