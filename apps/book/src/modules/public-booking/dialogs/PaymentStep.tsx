'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Chip, Stack, TextField, Typography } from '@foundly/ui';
import { PRIMARY_BUTTON_SX, SECONDARY_BUTTON_SX } from '../../../shared/utils/landingCanon';
import { formatPrice } from '../../../shared/utils/format';
import {
  expectedAdvance,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ORDER,
  type PaymentMethod,
} from '../../../shared/types/payments';
import { useFetchPublicPaymentMethods, useUploadPaymentProof } from '../hooks';
import { validateProofFile } from '../utils/uploadProof';
import { advancePaymentSchema, type AdvancePaymentDraft } from '../utils/schemas';
import type { PublicService } from '../utils/types';

/** Step 4 (when required) — mandatory advance: method, amount, reference and uploaded proof (FR-006). */
export function PaymentStep({
  tenantSlug,
  service,
  value,
  onContinue,
  onBack,
}: {
  tenantSlug: string;
  service: PublicService;
  value: AdvancePaymentDraft | null;
  onContinue: (draft: AdvancePaymentDraft) => void;
  onBack: () => void;
}) {
  const fetchMethods = useFetchPublicPaymentMethods();
  const uploadProof = useUploadPaymentProof();
  const expected = useMemo(
    () => expectedAdvance(service.priceCents, service.advanceKind, service.advanceValue),
    [service.priceCents, service.advanceKind, service.advanceValue],
  );

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [methodType, setMethodType] = useState<AdvancePaymentDraft['methodType'] | null>(
    value?.methodType ?? null,
  );
  const [amount, setAmount] = useState<string>(
    value ? String(value.amountCents / 100) : expected ? String(expected / 100) : '',
  );
  const [reference, setReference] = useState(value?.reference ?? '');
  const [proofUrl, setProofUrl] = useState(value?.proofUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchMethods(tenantSlug);
      if (cancelled) return;
      setMethods(result.ok ? result.data.filter((method) => method.active) : []);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const selectedMethod = methods.find((method) => method.type === methodType) ?? null;

  async function onFileChange(file: File | undefined) {
    setError(null);
    if (!file) return;
    const valid = validateProofFile(file);
    if (!valid.ok) {
      setError(valid.message);
      return;
    }
    setUploading(true);
    const result = await uploadProof(file, tenantSlug);
    setUploading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setProofUrl(result.data.url);
  }

  function submit() {
    setError(null);
    setFieldErrors(null);
    const cents = Math.round(Number(amount.replace(',', '.')) * 100);
    const parsed = advancePaymentSchema.safeParse({
      methodType,
      amountCents: Number.isFinite(cents) ? cents : 0,
      reference,
      proofUrl,
    });
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '_');
        if (!(key in fields)) fields[key] = issue.message;
      }
      setFieldErrors(fields);
      setError('Completa los datos del adelanto para continuar.');
      return;
    }
    onContinue(parsed.data);
  }

  if (loaded && methods.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="error" role="alert">
          Este servicio requiere un adelanto, pero el negocio no tiene métodos de pago activos. Inténtalo
          más tarde.
        </Typography>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="secondary" sx={SECONDARY_BUTTON_SX} onClick={onBack}>
            Atrás
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Este servicio requiere un adelanto. Elige cómo pagar y adjunta el comprobante.
      </Typography>

      {expected ? (
        <Card sx={{ p: 2 }}>
          <Typography variant="body2">
            Adelanto requerido:{' '}
            <strong>{formatPrice(expected, service.currency)}</strong>
            {service.advanceKind === 'percent' ? ` (${service.advanceValue}% del servicio)` : ''}
          </Typography>
        </Card>
      ) : null}

      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Método de pago
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} aria-label="Métodos de pago">
        {PAYMENT_METHOD_ORDER.filter((type) => methods.some((method) => method.type === type)).map((type) => (
          <Chip
            key={type}
            label={PAYMENT_METHOD_LABELS[type]}
            selectable
            selected={methodType === type}
            onClick={() => setMethodType(type)}
          />
        ))}
      </Stack>

      {selectedMethod?.details ? (
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            Datos de recepción: {selectedMethod.details}
          </Typography>
          {selectedMethod.instructions ? (
            <Typography variant="caption" color="text.secondary">
              {selectedMethod.instructions}
            </Typography>
          ) : null}
        </Stack>
      ) : null}

      <TextField
        label={`Monto (${service.currency})`}
        type="number"
        value={amount}
        onChange={setAmount}
        error={Boolean(fieldErrors?.amountCents)}
        helperText={fieldErrors?.amountCents}
        fullWidth
      />

      <TextField
        label="Número de referencia"
        value={reference}
        onChange={setReference}
        error={Boolean(fieldErrors?.reference)}
        helperText={fieldErrors?.reference}
        fullWidth
      />

      <Stack spacing={0.5}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Comprobante (captura)
        </Typography>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Comprobante de pago"
          onChange={(event) => void onFileChange(event.target.files?.[0])}
        />
        {uploading ? (
          <Typography variant="caption" color="text.secondary">
            Subiendo comprobante…
          </Typography>
        ) : null}
        {proofUrl ? (
          <a href={proofUrl} target="_blank" rel="noreferrer">
            Comprobante adjunto
          </a>
        ) : null}
        {fieldErrors?.proofUrl ? (
          <Typography variant="caption" color="error">
            {fieldErrors.proofUrl}
          </Typography>
        ) : null}
      </Stack>

      {error ? (
        <Typography variant="body2" color="error" role="alert">
          {error}
        </Typography>
      ) : null}

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button variant="secondary" sx={SECONDARY_BUTTON_SX} onClick={onBack} disabled={uploading}>
          Atrás
        </Button>
        <Button
          variant="primary"
          sx={PRIMARY_BUTTON_SX}
          onClick={submit}
          loading={uploading}
          disabled={uploading}
        >
          Continuar
        </Button>
      </Stack>
    </Stack>
  );
}
