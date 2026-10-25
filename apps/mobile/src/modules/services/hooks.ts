import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMyServiceInput, UpdateMyServiceInput } from '@/shared/api/generated';
import type { ErrorCode } from '@/shared/api/result';
import { useSession } from '@/shared/auth/session-context';
import {
  createService,
  deleteService,
  fetchServices,
  updateService,
  type Service,
} from './services';

export class ServicesError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ServicesError';
  }
}

function servicesKey(tenantId: string | null) {
  return ['services', tenantId] as const;
}

export function useServices() {
  const { tenantId } = useSession();

  return useQuery<Service[], ServicesError>({
    queryKey: servicesKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const result = await fetchServices();
      if (!result.ok) throw new ServicesError(result.code, result.message);
      return result.data;
    },
  });
}

export function useCreateService() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<Service, ServicesError, CreateMyServiceInput>({
    mutationFn: async (input) => {
      const result = await createService(input);
      if (!result.ok) throw new ServicesError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: servicesKey(tenantId) });
    },
  });
}

export function useUpdateService() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<Service, ServicesError, { id: string; input: UpdateMyServiceInput }>({
    mutationFn: async ({ id, input }) => {
      const result = await updateService(id, input);
      if (!result.ok) throw new ServicesError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: servicesKey(tenantId) });
    },
  });
}

export function useDeleteService() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, ServicesError, string>({
    mutationFn: async (id) => {
      const result = await deleteService(id);
      if (!result.ok) throw new ServicesError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: servicesKey(tenantId) });
    },
  });
}
