import { useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../shared/api/query-client';
import { useSession } from '../../shared/auth/session-context';
import type { ActionResult } from '../../shared/types/result';
import {
  createBinanceOrder,
  createPaypalOrder,
  getBillingInstructions,
  getSubscription,
  listPaymentTransactions,
  submitManualPayment,
} from './services';
import type {
  BillingInstructionsView,
  CheckoutSessionView,
  PaymentTransactionView,
  SubscriptionSummaryView,
} from './utils/types';

export function useSubscription() {
  const { tenantId } = useSession();
  return useQuery({
    queryKey: queryKeys.subscription(tenantId),
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<SubscriptionSummaryView> => {
      const result = await getSubscription();
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });
}

export function useBillingInstructions() {
  return useQuery({
    queryKey: queryKeys.billingInstructions(),
    queryFn: async (): Promise<BillingInstructionsView> => {
      const result = await getBillingInstructions();
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });
}

export function usePaymentTransactions(limit = 10) {
  const { tenantId } = useSession();
  const query = useInfiniteQuery({
    queryKey: queryKeys.paymentTransactions(tenantId, limit),
    enabled: Boolean(tenantId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<PaymentTransactionView[]> => {
      const result = await listPaymentTransactions(limit, pageParam);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < limit ? undefined : allPages.length * limit,
  });
  return {
    ...query,
    items: query.data?.pages.flat() ?? [],
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}

function useCheckoutMutation(
  mutationFn: () => Promise<ActionResult<CheckoutSessionView>>,
) {
  const queryClient = useQueryClient();
  const { tenantId } = useSession();
  return useMutation({
    mutationFn,
    onSuccess: async (result) => {
      if (!result.ok) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.subscription(tenantId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.paymentTransactions(tenantId, 10),
        }),
      ]);
    },
  });
}

export function useCreatePaypalOrder() {
  return useCheckoutMutation(createPaypalOrder);
}

export function useCreateBinanceOrder() {
  return useCheckoutMutation(createBinanceOrder);
}

export function useSubmitManualPayment() {
  const queryClient = useQueryClient();
  const { tenantId } = useSession();
  return useMutation({
    mutationFn: (input: unknown) => submitManualPayment(input),
    onSuccess: async (result) => {
      if (!result.ok) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.subscription(tenantId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.paymentTransactions(tenantId, 10),
        }),
      ]);
    },
  });
}

export function useBillingRefresh() {
  const queryClient = useQueryClient();
  const { tenantId } = useSession();
  return useCallback(async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription(tenantId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.billingInstructions() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentTransactions(tenantId, 10) }),
    ]);
  }, [queryClient, tenantId]);
}
