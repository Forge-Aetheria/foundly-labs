'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  Badge,
  Button,
  Card,
  Chip,
  Modal,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@foundly/ui';
import { ApiErrorDialog } from '../../../shared/components/ApiErrorDialog';
import { useToast } from '../../../shared/components/Toaster';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import {
  PAYMENT_DETAIL_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ORDER,
  PAYMENT_TYPE_FIELDS,
  paymentDetailSummary,
  type PaymentMethod,
  type PaymentMethodDetails,
  type PaymentMethodType,
} from '../../../shared/types/payments';
import { useDeletePaymentMethod, useUpsertPaymentMethod } from '../hooks';

interface Draft {
  type: PaymentMethodType;
  title: string;
  details: PaymentMethodDetails;
  instructions: string;
  active: boolean;
}

const EMPTY_DRAFT = (type: PaymentMethodType): Draft => ({
  type,
  title: '',
  details: {},
  instructions: '',
  active: true,
});

function draftFrom(method: PaymentMethod): Draft {
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
export function PaymentsConfig({ methods, error }: { methods: PaymentMethod[]; error?: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const upsert = useUpsertPaymentMethod();
  const remove = useDeletePaymentMethod();
  const { pending, run } = useAsyncAction();

  const [items, setItems] = useState<PaymentMethod[]>(methods);
  const [draft, setDraft] = useState<{ open: boolean; editing: PaymentMethod | null; value: Draft }>({
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

  function patch(value: Partial<Draft>) {
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
          <Typography variant="h5" component="h1">
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
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
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
                  <Button variant="secondary" onClick={() => void toggleActive(method)} disabled={pending}>
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

      {draft.open ? (
        <Modal
          open
          onClose={close}
          title={draft.editing ? 'Editar método de pago' : 'Nuevo Método de Pago'}
        >
          <Stack spacing={2} sx={{ pt: 1, minWidth: { xs: 0, sm: 460 } }}>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Tipo de pago
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {availableTypes.map((type) => (
                  <Chip
                    key={type}
                    label={PAYMENT_METHOD_LABELS[type]}
                    selectable
                    selected={draft.value.type === type}
                    onClick={() => patch({ type, details: {} })}
                  />
                ))}
              </Stack>
            </Stack>

            <TextField
              label="Título"
              placeholder="P. ej. Pago Móvil Banesco"
              value={draft.value.title}
              onChange={(value) => patch({ title: value })}
              error={Boolean(fieldErrors?.title)}
              helperText={fieldErrors?.title}
              fullWidth
            />

            {PAYMENT_TYPE_FIELDS[draft.value.type].map((key) => (
              <TextField
                key={key}
                label={PAYMENT_DETAIL_LABELS[key]}
                value={draft.value.details[key] ?? ''}
                onChange={(value) => patchDetail(key, value)}
                error={Boolean(fieldErrors?.[`details.${key}`])}
                helperText={fieldErrors?.[`details.${key}`]}
                fullWidth
              />
            ))}

            <TextField
              label="Instrucciones (opcional)"
              value={draft.value.instructions}
              onChange={(value) => patch({ instructions: value })}
              multiline
              rows={2}
              maxLength={2000}
              fullWidth
            />

            <Switch
              checked={draft.value.active}
              onChange={(checked) => patch({ active: checked })}
              label={draft.value.active ? 'Activo' : 'Inactivo'}
            />

            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
              <Button variant="secondary" onClick={close} disabled={pending}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => void submit()} loading={pending}>
                Guardar método
              </Button>
            </Stack>
          </Stack>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <AlertDialog
          open
          title="Eliminar método de pago"
          description={`¿Seguro que quieres eliminar «${
            deleteTarget.title ?? PAYMENT_METHOD_LABELS[deleteTarget.type]
          }»? Los clientes dejarán de verlo al pagar un adelanto.`}
          confirmLabel="Sí, eliminar"
          cancelLabel="Cancelar"
          tone="destructive"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </Stack>
  );
}
