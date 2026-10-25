import {
  AssignServiceToSpecialistDocument,
  CreateMySpecialistDocument,
  DeleteMySpecialistDocument,
  TeamSpecialistsDocument,
  UnassignServiceFromSpecialistDocument,
  UpdateMySpecialistDocument,
  type AssignServiceToSpecialistMutation,
  type CreateMySpecialistInput,
  type CreateMySpecialistMutation,
  type DeleteMySpecialistMutation,
  type TeamSpecialistsQuery,
  type UnassignServiceFromSpecialistMutation,
  type UpdateMySpecialistInput,
  type UpdateMySpecialistMutation,
} from '@/shared/api/generated';
import { apiRequest } from '@/shared/api/client';
import { getAccessToken } from '@/shared/auth/supabase';
import { fail, ok, type ActionResult } from '@/shared/api/result';

export type TeamMember = TeamSpecialistsQuery['specialists'][number];

export async function fetchTeam(tenantId: string): Promise<ActionResult<TeamMember[]>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<TeamSpecialistsQuery>(
    TeamSpecialistsDocument,
    { tenantId },
    { token },
  );
  return result.ok ? ok(result.data.specialists) : result;
}

export async function createTeamMember(
  input: CreateMySpecialistInput,
): Promise<ActionResult<CreateMySpecialistMutation['createMySpecialist']>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<CreateMySpecialistMutation>(
    CreateMySpecialistDocument,
    { input },
    { token },
  );
  return result.ok ? ok(result.data.createMySpecialist) : result;
}

export async function updateTeamMember(
  id: string,
  input: UpdateMySpecialistInput,
): Promise<ActionResult<UpdateMySpecialistMutation['updateMySpecialist']>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<UpdateMySpecialistMutation>(
    UpdateMySpecialistDocument,
    { id, input },
    { token },
  );
  return result.ok ? ok(result.data.updateMySpecialist) : result;
}

export async function deleteTeamMember(id: string): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<DeleteMySpecialistMutation>(
    DeleteMySpecialistDocument,
    { id },
    { token },
  );
  return result.ok ? ok(true) : result;
}

export async function assignServiceToTeamMember(
  specialistId: string,
  serviceId: string,
): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<AssignServiceToSpecialistMutation>(
    AssignServiceToSpecialistDocument,
    { specialistId, serviceId },
    { token },
  );
  return result.ok ? ok(true) : result;
}

export async function unassignServiceFromTeamMember(
  specialistId: string,
  serviceId: string,
): Promise<ActionResult<true>> {
  const token = await getAccessToken();
  if (!token) return fail('UNAUTHENTICATED', 'Tu sesión ha expirado.');
  const result = await apiRequest<UnassignServiceFromSpecialistMutation>(
    UnassignServiceFromSpecialistDocument,
    { specialistId, serviceId },
    { token },
  );
  return result.ok ? ok(true) : result;
}
