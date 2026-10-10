'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Container, Stack, Typography } from '@foundly/ui';
import { createBusiness } from '../../../features/onboarding/actions';
import {
  clearActiveDraftId,
  clearDraft,
  loadActiveDraftId,
  loadDraft,
  saveActiveDraftId,
  saveDraft,
} from '../../../features/onboarding/draft';
import type { BookingDraft } from '../../../domain/tenancy/types';
import { AccountStep } from './AccountStep';
import { BrandPanel } from './BrandPanel';
import { BusinessStep } from './BusinessStep';
import { SetupStep } from './SetupStep';

const STEP_LABELS = ['Cuenta', 'Negocio', 'Configuración'] as const;

function emptyDraft(draftId: string): BookingDraft {
  return { draftId, step: 1, account: null, business: null, setup: null };
}

/** Three-step onboarding wizard (FR-003, FR-013): local-first draft + one submit. */
export function WizardShell() {
  const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft>(() => {
    const draftId = loadActiveDraftId() ?? crypto.randomUUID();
    saveActiveDraftId(draftId);
    return loadDraft(draftId) ?? emptyDraft(draftId);
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step = draft.step;

  function advance(patch: Partial<BookingDraft>, nextStep: number) {
    setError(null);
    const updated = { ...draft, ...patch, step: nextStep };
    setDraft(updated);
    saveDraft(updated);
  }

  async function submitSetup(setup: BookingDraft['setup']) {
    const { account, business } = draft;
    if (!account || !business || !setup) {
      setError('Faltan datos del onboarding.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await createBusiness({ draftId: draft.draftId, account, business, setup });
    if (result.ok) {
      clearDraft(draft.draftId);
      clearActiveDraftId();
      router.push(result.data.redirectTo);
      return;
    }
    setError(result.error.message);
    setSubmitting(false);
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 4 }}>
        <Stack sx={{ flex: { md: '0 0 360px' } }}>
          <BrandPanel draft={draft} />
        </Stack>

        <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
          <Card
            header={
              <Stack spacing={0.5}>
                <Typography variant="h5" component="h1">
                  Crea tu negocio
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Paso {step} de 3 — {STEP_LABELS[step - 1]}
                </Typography>
              </Stack>
            }
          >
            {step === 1 ? (
              <AccountStep initial={draft.account} onComplete={(account) => advance({ account }, 2)} />
            ) : null}
            {step === 2 ? (
              <BusinessStep
                initial={draft.business}
                onComplete={(business) => advance({ business }, 3)}
              />
            ) : null}
            {step === 3 ? (
              <SetupStep
                initial={draft.setup}
                error={error}
                submitting={submitting}
                onSubmit={submitSetup}
              />
            ) : null}
          </Card>
        </Stack>
      </Stack>
    </Container>
  );
}