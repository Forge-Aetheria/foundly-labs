'use client';

import { useState } from 'react';
import { Card, Modal, Stack, Typography } from '@foundly/ui';
import { GLASS_CARD_SX } from '../../../shared/utils/landingCanon';
import { bookPublicAppointment } from '../utils/actions';
import { formatPrice } from '../../../shared/utils/format';
import type { ClientDetails } from '../utils/schemas';
import type { PublicService, PublicSpecialist } from '../utils/types';
import { ClientStep } from './ClientStep';
import { ConfirmStep } from './ConfirmStep';
import { SlotStep } from './SlotStep';
import { SpecialistStep } from './SpecialistStep';

const STEP_LABELS = ['Especialista', 'Fecha y hora', 'Tus datos', 'Confirmación'] as const;

export interface BookingFlowProps {
  service: PublicService;
  tenantSlug: string;
  specialists: PublicSpecialist[];
  onClose: () => void;
}

/** Guided 4-step booking flow in an `@foundly/ui` Modal (FR-009…FR-015). */
export function BookingFlow({ service, tenantSlug, specialists, onClose }: BookingFlowProps) {
  const skipSpecialist = specialists.length <= 1;
  const [step, setStep] = useState(skipSpecialist ? 1 : 0);
  const [specialistId, setSpecialistId] = useState<string | null>(
    skipSpecialist ? (specialists[0]?.id ?? null) : null,
  );
  const [slot, setSlot] = useState<{ startAt: string; endAt: string } | null>(null);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const specialistName =
    specialists.find((specialist) => specialist.id === specialistId)?.name ?? null;

  async function confirm() {
    if (!slot || !client) return;
    setSubmitting(true);
    setError(null);
    const result = await bookPublicAppointment({
      tenantSlug,
      serviceId: service.id,
      resourceId: specialistId ?? undefined,
      startAt: slot.startAt,
      clientName: client.clientName,
      clientEmail: client.clientEmail,
      clientPhone: client.clientPhone,
      notes: client.notes,
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
      title={`Reserva · Paso ${step + 1} de 4 · ${STEP_LABELS[step]}`}
    >
      <Stack spacing={2}>
        <Card sx={GLASS_CARD_SX}>
          <Typography variant="body2" color="text.secondary">
            {service.name} · {service.durationMinutes} min ·{' '}
            {formatPrice(service.priceCents, service.currency)}
          </Typography>
        </Card>

        {step === 0 ? (
          <SpecialistStep
            specialists={specialists}
            onContinue={(id) => {
              setSpecialistId(id);
              setStep(1);
            }}
          />
        ) : null}

        {step === 1 ? (
          <SlotStep
            tenantSlug={tenantSlug}
            serviceId={service.id}
            resourceId={specialistId ?? undefined}
            value={slot}
            onSelect={setSlot}
            onContinue={() => setStep(2)}
            onBack={() => (skipSpecialist ? onClose() : setStep(0))}
          />
        ) : null}

        {step === 2 ? (
          <ClientStep
            value={client}
            onSubmit={(details) => {
              setClient(details);
              setError(null);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        ) : null}

        {step === 3 ? (
          <ConfirmStep
            service={service}
            specialistName={specialistName}
            slot={slot}
            client={client}
            submitting={submitting}
            message={message}
            error={error}
            onConfirm={confirm}
            onBack={() => setStep(2)}
            onClose={onClose}
          />
        ) : null}
      </Stack>
    </Modal>
  );
}
