'use client';

import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stack, Typography } from '@foundly/ui';
import { useSearchParams } from '../../shared/compat/useAppRouter';
import { ModuleSkeleton } from '../../shared/components/ModuleSkeleton';
import {
  useBillingInstructions,
  useBillingRefresh,
  useCreateBinanceOrder,
  useCreatePaypalOrder,
  usePaymentTransactions,
  useSubmitManualPayment,
  useSubscription,
} from './hooks';
import { ManualPaymentForm } from './components/ManualPaymentForm';
import { ManualPaymentInstructions } from './components/ManualPaymentInstructions';
import { PaymentHistoryList } from './components/PaymentHistoryList';
import { PaymentMethodSelector, type ManualGateway } from './components/PaymentMethodSelector';
import { PlanBenefits } from './components/PlanBenefits';
import { PlanSummaryCard } from './components/PlanSummaryCard';
import type { ManualPaymentValues } from './utils/types';

/** Subscription tab: plan, checkout methods and payment history. */
export function SubscriptionView({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const returnedFromCheckout = searchParams.get('checkout') === 'return';
  const subscription = useSubscription();
  const instructions = useBillingInstructions();
  const transactions = usePaymentTransactions();
  const paypal = useCreatePaypalOrder();
  const binance = useCreateBinanceOrder();
  const manual = useSubmitManualPayment();
  const refresh = useBillingRefresh();

  const [manualGateway, setManualGateway] = useState<ManualGateway | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualFields, setManualFields] = useState<Record<string, string>>({});
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (returnedFromCheckout) void refresh();
  }, [returnedFromCheckout, refresh]);

  async function startProvider(kind: 'paypal' | 'binance') {
    setCheckoutError(null);
    const result = kind === 'paypal' ? await paypal.mutateAsync() : await binance.mutateAsync();
    if (!result.ok) {
      setCheckoutError(result.error.message);
      return;
    }
    if (!result.data.checkoutUrl) {
      setCheckoutError('No pudimos obtener la URL de pago. Inténtalo de nuevo.');
      return;
    }
    window.location.assign(result.data.checkoutUrl);
  }

  async function submitManual(values: ManualPaymentValues) {
    setManualError(null);
    setManualFields({});
    setManualSuccess(null);
    const result = await manual.mutateAsync(values);
    if (!result.ok) {
      setManualError(result.error.message);
      setManualFields(result.error.fields ?? {});
      return;
    }
    setManualSuccess('Pago reportado. Quedará pendiente hasta que el equipo lo apruebe.');
    setManualGateway(null);
    await refresh();
  }

  if (subscription.isLoading || instructions.isLoading) {
    return <ModuleSkeleton rows={4} />;
  }

  if (subscription.isError || !subscription.data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void subscription.refetch()}>
            Reintentar
          </Button>
        }
      >
        No pudimos cargar tu suscripción.
      </Alert>
    );
  }

  const instructionsUnavailable = instructions.isError || !instructions.data;
  const busy = paypal.isPending || binance.isPending;

  return (
    <Stack spacing={embedded ? 2 : 3}>
      {!embedded ? (
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Suscripción
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta tu plan, renueva o reporta un pago.
          </Typography>
        </Stack>
      ) : null}

      {returnedFromCheckout ? (
        <Alert severity="info">
          Estamos confirmando tu pago con el proveedor. El plan se actualizará cuando la
          confirmación sea recibida.
        </Alert>
      ) : null}

      {checkoutError ? <Alert severity="error">{checkoutError}</Alert> : null}
      {manualSuccess ? <Alert severity="success">{manualSuccess}</Alert> : null}

      <PlanSummaryCard subscription={subscription.data} />
      <PlanBenefits effectivePlan={subscription.data.effectivePlan} />

      <PaymentMethodSelector
        onPaypal={() => void startProvider('paypal')}
        onBinance={() => void startProvider('binance')}
        onSelectManual={(gateway) => {
          setManualGateway(gateway);
          setManualSuccess(null);
          setManualError(null);
        }}
        busy={busy}
      />

      {instructionsUnavailable ? (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => void instructions.refetch()}>
              Reintentar
            </Button>
          }
        >
          Los datos de pago manual no están disponibles en este momento.
        </Alert>
      ) : null}

      {manualGateway ? (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {instructions.data ? (
            <ManualPaymentInstructions instructions={instructions.data.manual} />
          ) : null}
          <ManualPaymentForm
            submitting={manual.isPending}
            serverError={manualError}
            fieldErrors={manualFields}
            onSubmit={submitManual}
          />
        </Box>
      ) : null}

      <PaymentHistoryList
        items={transactions.items}
        loading={transactions.isLoading || transactions.isFetchingNextPage}
        error={transactions.isError ? 'No pudimos cargar el historial de pagos.' : null}
        hasMore={transactions.hasNextPage}
        onLoadMore={transactions.loadMore}
      />
    </Stack>
  );
}
