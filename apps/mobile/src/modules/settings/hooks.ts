import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/shared/auth/session-context';
import type { ErrorCode } from '@/shared/api/result';
import type {
  UpdateBusinessProfileInput,
  UpsertPaymentMethodInput,
} from '@/shared/api/generated';
import {
  deletePaymentMethod,
  fetchMyBusiness,
  fetchPaymentMethods,
  updateBusinessProfile,
  updatePublicPage,
  upsertPaymentMethod,
  type BusinessProfile,
  type PaymentMethod,
} from './services';

export class SettingsError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SettingsError';
  }
}

function businessKey(tenantId: string | null) {
  return ['business', tenantId] as const;
}

function paymentsKey(tenantId: string | null) {
  return ['payment-methods', tenantId] as const;
}

export function useMyBusiness() {
  const { tenantId } = useSession();

  return useQuery<BusinessProfile, SettingsError>({
    queryKey: businessKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const result = await fetchMyBusiness();
      if (!result.ok) throw new SettingsError(result.code, result.message);
      return result.data;
    },
  });
}

export function useUpdateBusinessProfile() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, SettingsError, UpdateBusinessProfileInput>({
    mutationFn: async (input) => {
      const result = await updateBusinessProfile(input);
      if (!result.ok) throw new SettingsError(result.code, result.message);
      return true;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: businessKey(tenantId) });
    },
  });
}

export function useUpdatePublicPage() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, SettingsError, boolean, { previous?: BusinessProfile }>({
    mutationFn: async (isPublic) => {
      const result = await updatePublicPage(isPublic);
      if (!result.ok) throw new SettingsError(result.code, result.message);
      return true;
    },
    onMutate: async (isPublic) => {
      await queryClient.cancelQueries({ queryKey: businessKey(tenantId) });
      const previous = queryClient.getQueryData<BusinessProfile>(businessKey(tenantId));
      if (previous) {
        queryClient.setQueryData<BusinessProfile>(businessKey(tenantId), {
          ...previous,
          isPublic,
        });
      }
      return { previous };
    },
    onError: (_error, _isPublic, context) => {
      if (context?.previous) {
        queryClient.setQueryData(businessKey(tenantId), context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: businessKey(tenantId) });
    },
  });
}

export function usePaymentMethods() {
  const { tenantId } = useSession();

  return useQuery<PaymentMethod[], SettingsError>({
    queryKey: paymentsKey(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const result = await fetchPaymentMethods();
      if (!result.ok) throw new SettingsError(result.code, result.message);
      return result.data;
    },
  });
}

export function useUpsertPaymentMethod() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<PaymentMethod, SettingsError, UpsertPaymentMethodInput>({
    mutationFn: async (input) => {
      const result = await upsertPaymentMethod(input);
      if (!result.ok) throw new SettingsError(result.code, result.message);
      return result.data;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: paymentsKey(tenantId) });
    },
  });
}

export function useDeletePaymentMethod() {
  const { tenantId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<true, SettingsError, string>({
    mutationFn: async (id) => {
      const result = await deletePaymentMethod(id);
      if (!result.ok) throw new SettingsError(result.code, result.message);
      return true;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: paymentsKey(tenantId) });
    },
  });
}
