'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import { Card, Container, Stack, Typography } from '@foundly/ui';
import { useCreateBusiness } from '../hooks';
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

/** Three-step onboarding wizard (FR-003, FR-013): local-first draft + one submit. */
export function WizardShell() {
  const router = useRouter();
  const createBusiness = useCreateBusiness();
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      <OnboardingHeader />

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

      <OnboardingFooter />
    </Box>
  );
}

function OnboardingHeader() {
  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{ width: '100%' }}
    >
      <Link href="/" aria-label="Foundly Book — inicio" style={{ display: 'flex' }}>
        <Image src="/branding-logo.png" alt="Foundly Book" width={132} height={66} priority />
      </Link>

      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: { xs: 'none', sm: 'inline' } }}
        >
          ¿Ya tienes cuenta?
        </Typography>
        <MuiLink
          component={Link}
          href="/login"
          underline="none"
          aria-label="¿Ya tienes cuenta? Iniciar sesión"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            fontSize: '0.875rem',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            '&:visited': { color: 'primary.main' },
            '&:hover': { backgroundColor: 'surface.badgePill' },
          }}
        >
          Iniciar sesión
        </MuiLink>
      </Stack>
    </Stack>
  );
}

function OnboardingFooter() {
  const linkSx = {
    color: 'text.secondary',
    fontSize: '0.75rem',
    '&:visited': { color: 'text.secondary' },
    '&:hover': { color: 'primary.main' },
  } as const;

  return (
    <Stack component="footer" spacing={1} alignItems="center" sx={{ width: '100%', pt: 2 }}>
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        sx={{ flexWrap: 'wrap', justifyContent: 'center', rowGap: 0.5 }}
      >
        <MuiLink component={Link} href="/terms" underline="none" sx={linkSx}>
          Términos de Servicio
        </MuiLink>
        <MuiLink component={Link} href="/privacy" underline="none" sx={linkSx}>
          Política de Privacidad
        </MuiLink>
      </Stack>
      <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
        © 2026 Foundly Labs. Todos los derechos reservados.
      </Typography>
    </Stack>
  );
}
