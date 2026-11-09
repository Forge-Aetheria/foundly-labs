'use client';

import { useState } from 'react';
import { useRouter } from '@/shared/compat/useAppRouter';
import { Badge, Button, Card, Stack, Typography } from '@foundly/ui';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ORDER,
  paymentDetailSummary,
  type PaymentMethod,
  type PaymentMethodDetails,
  type PaymentMethodType,
} from '../../../shared/types/payments';
import { useDeletePaymentMethod, useUpsertPaymentMethod } from '../hooks';
import { PaymentMethodDialog, type PaymentMethodDraft } from './dialogs/PaymentMethodDialog';
import { DeletePaymentMethodDialog } from './dialogs/DeletePaymentMethodDialog';

const EMPTY_DRAFT = (type: PaymentMethodType): PaymentMethodDraft => ({
  type,
  title: '',
  details: {},
  instructions: '',
  active: true,
});

function draftFrom(method: PaymentMethod): PaymentMethodDraft {
  return {
    type: method.type,
    title: method.title ?? '',
    details: method.details ?? {},
    instructions: method.instructions ?? '',
    active: method.active,
  };
}

/**
 * Configuration view (features 017/022): a card per payment method with a structured
 * create/edit modal. Each type exposes its own detail fields (Pago Móvil, Binance Pay,
 * Zelle, Transferencia, Efectivo); the structured object is persisted via the API.
 */
export function PaymentsConfig({
  methods,
  error,
  embedded = false,
}: {
  methods: PaymentMethod[];
  error?: string | null;
  /** Renders the title as `h2` when embedded in the Configuración tabs. */
  embedded?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const upsert = useUpsertPaymentMethod();
  const remove = useDeletePaymentMethod();
  const { pending, run } = useAsyncAction();

  const [items, setItems] = useState<PaymentMethod[]>(methods);
  const [draft, setDraft] = useState<{
    open: boolean;
    editing: PaymentMethod | null;
    value: PaymentMethodDraft;
  }>({
    open: false,
    editing: null,
    value: EMPTY_DRAFT('pago_movil'),
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);

  const configuredTypes = new Set(items.map((item) => item.type));
  const availableTypes = PAYMENT_METHOD_ORDER.filter(
    (type) => !configuredTypes.has(type) || draft.editing?.type === type,
  );

  function firstAvailableType(): PaymentMethodType {
    return PAYMENT_METHOD_ORDER.find((type) => !configuredTypes.has(type)) ?? 'pago_movil';
  }

  function openCreate() {
    setFieldErrors(null);
    setDraft({ open: true, editing: null, value: EMPTY_DRAFT(firstAvailableType()) });
  }

  function openEdit(method: PaymentMethod) {
    setFieldErrors(null);
    setDraft({ open: true, editing: method, value: draftFrom(method) });
  }

  function close() {
    setDraft((prev) => ({ ...prev, open: false }));
  }

  function patch(value: Partial<PaymentMethodDraft>) {
    setDraft((prev) => ({ ...prev, value: { ...prev.value, ...value } }));
  }

  function patchDetail(key: keyof PaymentMethodDetails, value: string) {
    setDraft((prev) => ({
      ...prev,
      value: { ...prev.value, details: { ...prev.value.details, [key]: value } },
    }));
  }

  async function submit() {
    setActionError(null);
    setFieldErrors(null);
    const value = draft.value;
    const result = await run(() =>
      upsert({
        type: value.type,
        title: value.title,
        details: value.details,
        instructions: value.instructions,
        active: value.active,
      }),
    );
    if (!result) return;
    if (!result.ok) {
      if (result.error.fields) setFieldErrors(result.error.fields);
      else setActionError(result.error.message);
      return;
    }
    const saved = result.data;
    setItems((prev) =>
      prev.some((item) => item.type === saved.type)
        ? prev.map((item) => (item.type === saved.type ? saved : item))
        : [...prev, saved],
    );
    toast.success(`${PAYMENT_METHOD_LABELS[saved.type]} guardado.`);
    close();
    router.refresh();
  }

  async function toggleActive(method: PaymentMethod) {
    setActionError(null);
    const result = await run(() =>
      upsert({
        type: method.type,
        title: method.title ?? '',
        details: method.details ?? {},
        instructions: method.instructions ?? '',
        active: !method.active,
      }),
    );
    if (!result) return;
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    setItems((prev) => prev.map((item) => (item.type === result.data.type ? result.data : item)));
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const result = await run(() => remove({ id: target.id }));
    setDeleteTarget(null);
    if (!result) return;
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== target.id));
    toast.success(`${PAYMENT_METHOD_LABELS[target.type]} eliminado.`);
    router.refresh();
  }

  const allConfigured = items.length >= PAYMENT_METHOD_ORDER.length;

  return (
    <Stack spacing={3}>
      <ApiErrorDialog title="No se pudo cargar la configuración" message={error} />
      <ApiErrorDialog title="No se pudo completar la acción" message={actionError} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack spacing={0.25}>
          <Typography variant="h5" component={embedded ? 'h2' : 'h1'}>
            Métodos de pago
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configura los métodos con los que tus clientes pueden abonar un adelanto.
          </Typography>
        </Stack>
        <Button variant="primary" onClick={openCreate} disabled={allConfigured}>
          + Nuevo Método de Pago
        </Button>
      </Stack>

      {items.length > 0 ? (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
          {items.map((method) => (
            <Card
              key={method.id}
              sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' }, p: 2 }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="h6" component="h3" noWrap>
                      {method.title ?? PAYMENT_METHOD_LABELS[method.type]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {PAYMENT_METHOD_LABELS[method.type]}
                    </Typography>
                  </Stack>
                  <Badge pill status={method.active ? 'positive' : 'neutral'}>
                    {method.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </Stack>

                {paymentDetailSummary(method.details) ? (
                  <Typography variant="body2" color="text.secondary">
                    {paymentDetailSummary(method.details)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sin datos configurados.
                  </Typography>
                )}

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Button variant="secondary" onClick={() => openEdit(method)}>
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void toggleActive(method)}
                    disabled={pending}
                  >
                    {method.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button variant="destructive" onClick={() => setDeleteTarget(method)}>
                    Eliminar
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card sx={{ p: 4 }}>
          <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
            <Typography variant="h6" component="h2">
              Todavía no hay métodos de pago
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Añade el primero con «+ Nuevo Método de Pago».
            </Typography>
          </Stack>
        </Card>
      )}

      <PaymentMethodDialog
        open={draft.open}
        editing={Boolean(draft.editing)}
        value={draft.value}
        availableTypes={availableTypes}
        fieldErrors={fieldErrors}
        pending={pending}
        onClose={close}
        onPatch={patch}
        onPatchDetail={patchDetail}
        onSubmit={() => void submit()}
      />

      <DeletePaymentMethodDialog
        open={Boolean(deleteTarget)}
        description={
          deleteTarget
            ? `¿Seguro que quieres eliminar «${
                deleteTarget.title ?? PAYMENT_METHOD_LABELS[deleteTarget.type]
              }»? Los clientes dejarán de verlo al pagar un adelanto.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Stack>
  );
}
