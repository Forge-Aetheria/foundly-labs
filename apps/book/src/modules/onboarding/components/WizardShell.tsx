'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import { Card, Container, Stack, Typography } from '@foundly/ui';
import { useCreateBusiness } from '../hooks';
import { PublicHeader } from '../../../shared/components/PublicHeader';
import { PublicFooter } from '../../../shared/components/PublicFooter';
import {
  clearActiveDraftId,
  clearDraft,
  loadActiveDraftId,
  loadDraft,
  saveActiveDraftId,
  saveDraft,
} from '../utils/draft';
import type { BookingDraft } from '../../../shared/types/tenancy';
import type { BusinessFields } from '../utils/schemas';
import { AccountStep } from './AccountStep';
import { BrandPanel } from './BrandPanel';
import { BusinessStep } from './BusinessStep';
import { SetupStep } from './SetupStep';
import { WizardStepper } from './WizardStepper';

const STEP_HEADINGS = [
  'Crea tu cuenta',
  'Cuéntanos sobre tu negocio',
  'Configura tu primer servicio',
] as const;

const STEP_DESCRIPTIONS = [
  'Empieza con tus datos de acceso. Solo tardarás unos segundos.',
  'Así se verá tu página pública. Puedes cambiarlo más adelante.',
  'Define la duración y el horario con el que empezarás a recibir reservas.',
] as const;

function emptyDraft(draftId: string): BookingDraft {
  return { draftId, step: 1, account: null, business: null, setup: null };
}

function withInitialEmail(draft: BookingDraft, email?: string): BookingDraft {
  if (!email || draft.account?.email) return draft;
  return { ...draft, account: { fullName: draft.account?.fullName ?? '', email, password: draft.account?.password ?? '' } };
}

export interface WizardShellProps {
  /** Email captured in the landing hero (`?email=`), pre-filled in step 1. */
  initialEmail?: string;
}

/** Three-step onboarding wizard (FR-003, FR-013): local-first draft + one submit. */
export function WizardShell({ initialEmail }: WizardShellProps) {
  const router = useRouter();
  const createBusiness = useCreateBusiness();
  const [draft, setDraft] = useState<BookingDraft>(() => {
    const draftId = loadActiveDraftId() ?? crypto.randomUUID();
    saveActiveDraftId(draftId);
    const loaded = loadDraft(draftId) ?? emptyDraft(draftId);
    return withInitialEmail(loaded, initialEmail);
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

  /** Mirror step-2 typing into the draft so the phone preview updates live. */
  function updateBusinessPreview(business: BusinessFields) {
    setDraft((current) => ({ ...current, business }));
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
    <Stack sx={{ minHeight: '100vh' }}>
      <PublicHeader variant="auth" />

      <Container
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          py: { xs: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              md: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
            },
            gap: { xs: 4, md: 6 },
            alignItems: 'center',
            width: '100%',
          }}
        >
          <BrandPanel draft={draft} />

          <Box sx={{ width: '100%', maxWidth: 620, justifySelf: { md: 'end' } }}>
            <Card
              sx={{
                width: '100%',
                boxShadow: (theme) => theme.palette.shadow.card,
                transition: 'box-shadow 200ms ease',
                '& .MuiOutlinedInput-root': { transition: 'box-shadow 150ms ease' },
                '& .MuiOutlinedInput-root.Mui-focused': {
                  boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              }}
              header={
                <Stack spacing={2.5}>
                  <WizardStepper step={step} />
                  <Stack spacing={0.5}>
                    <Typography variant="h5" component="h1">
                      {STEP_HEADINGS[step - 1]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {STEP_DESCRIPTIONS[step - 1]}
                    </Typography>
                  </Stack>
                </Stack>
              }
            >
              {step === 1 ? (
                <AccountStep
                  initial={draft.account}
                  onComplete={(account) => advance({ account }, 2)}
                />
              ) : null}
              {step === 2 ? (
                <BusinessStep
                  initial={draft.business}
                  onChange={updateBusinessPreview}
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
          </Box>
        </Box>
      </Container>

      <PublicFooter />
    </Stack>
  );
}
