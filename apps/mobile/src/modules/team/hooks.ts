import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateMySpecialistInput,
  CreateMySpecialistMutation,
  UpdateMySpecialistInput,
  UpdateMySpecialistMutation,
} from '@/shared/api/generated';
import type { ErrorCode } from '@/shared/api/result';
import { useSession } from '@/shared/auth/session-context';
import {
  assignServiceToTeamMember,
  createTeamMember,
  deleteTeamMember,
  fetchTeam,
  unassignServiceFromTeamMember,
  updateTeamMember,
  type TeamMember,
} from './services';

export class TeamError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'TeamError';
  }
}

function teamKey(tenantId: string | null) {
  return ['team', tenantId] as const;
}

export function useTeam() {
  const { tenantId } = useSession();

  return useQuery<TeamMember[], TeamError>({
    queryKey: teamKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await fetchTeam(tenantId);
      if (!result.ok) throw new TeamError(result.code, result.message);
      return result.data;
    },
  });
}

export function useCreateTeamMember() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<
    CreateMySpecialistMutation['createMySpecialist'],
    TeamError,
    CreateMySpecialistInput
  >({
    mutationFn: async (input) => {
      const result = await createTeamMember(input);
      if (!result.ok) throw new TeamError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: teamKey(tenantId) });
    },
  });
}

export function useUpdateTeamMember() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<
    UpdateMySpecialistMutation['updateMySpecialist'],
    TeamError,
    { id: string; input: UpdateMySpecialistInput }
  >({
    mutationFn: async ({ id, input }) => {
      const result = await updateTeamMember(id, input);
      if (!result.ok) throw new TeamError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: teamKey(tenantId) });
    },
  });
}

export function useDeleteTeamMember() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, TeamError, string>({
    mutationFn: async (id) => {
      const result = await deleteTeamMember(id);
      if (!result.ok) throw new TeamError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: teamKey(tenantId) });
    },
  });
}

export interface SyncTeamServicesInput {
  specialistId: string;
  addServiceIds: string[];
  removeServiceIds: string[];
}

export function useSyncTeamMemberServices() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, TeamError, SyncTeamServicesInput>({
    mutationFn: async ({ specialistId, addServiceIds, removeServiceIds }) => {
      for (const serviceId of removeServiceIds) {
        const result = await unassignServiceFromTeamMember(specialistId, serviceId);
        if (!result.ok) throw new TeamError(result.code, result.message);
      }
      for (const serviceId of addServiceIds) {
        const result = await assignServiceToTeamMember(specialistId, serviceId);
        if (!result.ok) throw new TeamError(result.code, result.message);
      }
      return true;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: teamKey(tenantId) });
    },
  });
}
