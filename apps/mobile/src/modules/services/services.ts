import {
  CreateMyServiceDocument,
  DeleteMyServiceDocument,
  MyServicesDocument,
  UpdateMyServiceDocument,
  type CreateMyServiceInput,
  type CreateMyServiceMutation,
  type DeleteMyServiceMutation,
  type MyServicesQuery,
  type UpdateMyServiceInput,
  type UpdateMyServiceMutation,
} from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, ok, type ActionResult } from '@/shared/api/result';

export type Service = MyServicesQuery['myServices'][number];

export async function fetchServices(): Promise<ActionResult<Service[]>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<MyServicesQuery>(MyServicesDocument, { active: null }, { token });
  return result.ok ? ok(result.data.myServices) : result;
}

export async function createService(input: CreateMyServiceInput): Promise<ActionResult<Service>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<CreateMyServiceMutation>(
    CreateMyServiceDocument,
    { input },
    { token },
  );
  return result.ok ? ok(result.data.createMyService) : result;
}

export async function updateService(
  id: string,
  input: UpdateMyServiceInput,
): Promise<ActionResult<Service>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<UpdateMyServiceMutation>(
    UpdateMyServiceDocument,
    { id, input },
    { token },
  );
  return result.ok ? ok(result.data.updateMyService) : result;
}

export async function deleteService(id: string): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<DeleteMyServiceMutation>(
    DeleteMyServiceDocument,
    { id },
    { token },
  );
  return result.ok ? ok(true) : result;
}
