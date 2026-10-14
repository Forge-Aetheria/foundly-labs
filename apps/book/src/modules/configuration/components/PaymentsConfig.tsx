'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Stack, Switch, TextField, Typography } from '@foundly/ui';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ORDER,
  type PaymentMethod,
  type PaymentMethodType,
} from '../../../shared/types/payments';
import { useUpsertPaymentMethod } from '../hooks';

interface Draft {
  active: boolean;
  details: string;
  instructions: string;
}

const EMPTY_DRAFT: Draft = { active: false, details: '', instructions: '' };

function draftFrom(method: PaymentMethod | undefined): Draft {
  return method
    ? {
        active: method.active,
        details: method.details ?? '',
        instructions: method.instructions ?? '',
      }
    : EMPTY_DRAFT;
}

const HINTS: Record<PaymentMethodType, string> = {
  mobile_payment: 'Banco, teléfono y cédula del titular, por ejemplo.',
  bank_transfer: 'Banco, número de cuenta y titular, por ejemplo.',
  binance: 'Correo o Pay ID de Binance, por ejemplo.',
};

/** Configuration view: edit and enable the business payment methods (feature 017, US1). */
export function PaymentsConfig({ methods, error }: { methods: PaymentMethod[]; error?: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const upsert = useUpsertPaymentMethod();
  const { pending, run } = useAsyncAction();
  const [drafts, setDrafts] = useState<Record<PaymentMethodType, Draft>>(() => ({
    mobile_payment: draftFrom(methods.find((method) => method.type === 'mobile_payment')),
    bank_transfer: draftFrom(methods.find((method) => method.type === 'bank_transfer')),
    binance: draftFrom(methods.find((method) => method.type === 'binance')),
  }));
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<PaymentMethodType | null>(null);

  function patch(type: PaymentMethodType, value: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [type]: { ...prev[type], ...value } }));
  }

  async function save(type: PaymentMethodType) {
    setActionError(null);
    setSavingType(type);
    const result = await run(() => upsert({ type, ...drafts[type] }));
    setSavingType(null);
    if (!result) return;
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    toast.success(`${PAYMENT_METHOD_LABELS[type]} guardado.`);
    router.refresh();
  }

  return (
    <Card
      header={
        <Stack spacing={0.5}>
          <Typography variant="h5" component="h1">
            Configuración
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configura los métodos de pago con los que tus clientes pueden abonar un adelanto.
          </Typography>
        </Stack>
      }
    >
      <ApiErrorDialog title="No se pudo completar la acción" message={actionError} />
      <ApiErrorDialog title="No se pudo cargar la configuración" message={error} />
      <Stack spacing={2}>
        {PAYMENT_METHOD_ORDER.map((type) => {
          const draft = drafts[type];
          const saving = pending && savingType === type;
          return (
            <Card key={type} sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">{PAYMENT_METHOD_LABELS[type]}</Typography>
                  <Switch
                    checked={draft.active}
                    onChange={(checked) => patch(type, { active: checked })}
                    label={draft.active ? 'Activo' : 'Inactivo'}
                  />
                </Stack>
                <TextField
                  label="Datos de recepción"
                  placeholder={HINTS[type]}
                  value={draft.details}
                  onChange={(value) => patch(type, { details: value })}
                  multiline
                  rows={2}
                  maxLength={2000}
                  fullWidth
                />
                <TextField
                  label="Instrucciones (opcional)"
                  value={draft.instructions}
                  onChange={(value) => patch(type, { instructions: value })}
                  multiline
                  rows={2}
                  maxLength={2000}
                  fullWidth
                />
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="primary" onClick={() => void save(type)} loading={saving}>
                    Guardar
                  </Button>
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </Card>
  );
}
