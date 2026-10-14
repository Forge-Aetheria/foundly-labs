'use client';

import { useState } from 'react';
import { Card, Modal, Stack, Typography } from '@foundly/ui';
import { GLASS_CARD_SX } from '../../../shared/utils/landingCanon';
import { useBookAppointment } from '../hooks';
import { formatPrice } from '../../../shared/utils/format';
import type { ClientDetails, AdvancePaymentDraft } from '../utils/schemas';
import type { PublicService, PublicSpecialist } from '../utils/types';
import { CalendarStep } from './CalendarStep';
import { ClientStep } from './ClientStep';
import { ConfirmStep } from './ConfirmStep';
import { PaymentStep } from './PaymentStep';
import { SpecialistStep } from './SpecialistStep';

type StepKey = 'specialist' | 'slot' | 'client' | 'payment' | 'confirm';

const STEP_LABELS: Record<StepKey, string> = {
  specialist: 'Especialista',
  slot: 'Fecha y hora',
  client: 'Tus datos',
  payment: 'Adelanto',
  confirm: 'Confirmación',
};

export interface BookingFlowProps {
  service: PublicService;
  tenantSlug: string;
  specialists: PublicSpecialist[];
  onClose: () => void;
}

/** Guided booking flow in an `@foundly/ui` Modal (FR-009…FR-015); +advance step (017). */
export function BookingFlow({ service, tenantSlug, specialists, onClose }: BookingFlowProps) {
  const bookAppointment = useBookAppointment();
  const skipSpecialist = specialists.length <= 1;
  const steps: StepKey[] = [
    ...(skipSpecialist ? [] : (['specialist'] as StepKey[])),
    'slot',
    'client',
    ...(service.requiresAdvance ? (['payment'] as StepKey[]) : []),
    'confirm',
  ];

  const [index, setIndex] = useState(0);
  const [specialistId, setSpecialistId] = useState<string | null>(
    skipSpecialist ? (specialists[0]?.id ?? null) : null,
  );
  const [slot, setSlot] = useState<{ startAt: string; endAt: string } | null>(null);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [payment, setPayment] = useState<AdvancePaymentDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const step = steps[index] ?? 'confirm';
  const specialistName =
    specialists.find((specialist) => specialist.id === specialistId)?.name ?? null;

  function back() {
    if (index === 0) {
      onClose();
      return;
    }
    setError(null);
    setIndex((prev) => prev - 1);
  }

  async function confirm() {
    if (!slot || !client) return;
    setSubmitting(true);
    setError(null);
    const result = await bookAppointment({
      tenantSlug,
      serviceId: service.id,
      resourceId: specialistId ?? undefined,
      startAt: slot.startAt,
      clientName: client.clientName,
      clientEmail: client.clientEmail,
      clientPhone: client.clientPhone,
      notes: client.notes,
      paymentMethodType: payment?.methodType,
      advanceAmountCents: payment?.amountCents,
      paymentReference: payment?.reference,
      paymentProofUrl: payment?.proofUrl,
    });
    if (result.ok) {
      setMessage('Cita solicitada correctamente.');
      return;
    }
    setError(result.error.message);
    setSubmitting(false);
  }

  return (
    <Modal
      glass
      open
      onClose={onClose}
      title={`Reserva · Paso ${index + 1} de ${steps.length} · ${STEP_LABELS[step]}`}
    >
      <Stack spacing={2}>
        <Card sx={GLASS_CARD_SX}>
          <Typography variant="body2" color="text.secondary">
            {service.name} · {service.durationMinutes} min ·{' '}
            {formatPrice(service.priceCents, service.currency)}
          </Typography>
        </Card>

        {step === 'specialist' ? (
          <SpecialistStep
            specialists={specialists}
            onContinue={(id) => {
              setSpecialistId(id);
              setIndex((prev) => prev + 1);
            }}
          />
        ) : null}

        {step === 'slot' ? (
          <CalendarStep
            tenantSlug={tenantSlug}
            serviceId={service.id}
            resourceId={specialistId ?? undefined}
            value={slot}
            onSelect={setSlot}
            onContinue={() => setIndex((prev) => prev + 1)}
            onBack={back}
          />
        ) : null}

        {step === 'client' ? (
          <ClientStep
            value={client}
            onSubmit={(details) => {
              setClient(details);
              setError(null);
              setIndex((prev) => prev + 1);
            }}
            onBack={back}
          />
        ) : null}

        {step === 'payment' ? (
          <PaymentStep
            tenantSlug={tenantSlug}
            service={service}
            value={payment}
            onContinue={(draft) => {
              setPayment(draft);
              setError(null);
              setIndex((prev) => prev + 1);
            }}
            onBack={back}
          />
        ) : null}

        {step === 'confirm' ? (
          <ConfirmStep
            service={service}
            specialistName={specialistName}
            slot={slot}
            client={client}
            payment={payment}
            submitting={submitting}
            message={message}
            error={error}
            onConfirm={confirm}
            onBack={back}
            onClose={onClose}
          />
        ) : null}
      </Stack>
    </Modal>
  );
}
