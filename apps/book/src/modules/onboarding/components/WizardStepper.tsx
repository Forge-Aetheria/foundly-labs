'use client';

import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import { Stack, Typography } from '@foundly/ui';

export const ONBOARDING_STEPS = ['Tu cuenta', 'Tu negocio', 'Tu primer servicio'] as const;

/** Visual progress stepper for the three onboarding steps. */
export function WizardStepper({ step }: { step: number }) {
  return (
    <Box component="nav" aria-label="Progreso del registro">
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {ONBOARDING_STEPS.map((label, index) => {
          const number = index + 1;
          const complete = step > number;
          const active = step === number;

          return (
            <Box key={label} sx={{ minWidth: 0, pr: index < 2 ? 1 : 0 }}>
              <Stack direction="row" alignItems="center">
                <Box
                  aria-current={active ? 'step' : undefined}
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: complete || active ? 'primary.main' : 'divider',
                    backgroundColor: complete || active ? 'primary.main' : 'background.paper',
                    color: complete || active ? 'background.paper' : 'text.disabled',
                    transition: 'background-color 250ms ease, border-color 250ms ease',
                  }}
                >
                  {complete ? <CheckIcon sx={{ fontSize: 16 }} /> : number}
                </Box>

                {index < ONBOARDING_STEPS.length - 1 ? (
                  <Box
                    aria-hidden="true"
                    sx={{
                      flex: 1,
                      height: 2,
                      ml: 1,
                      borderRadius: 9999,
                      backgroundColor: complete ? 'primary.main' : 'divider',
                      transition: 'background-color 300ms ease',
                    }}
                  />
                ) : null}
              </Stack>

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.75,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'text.primary' : complete ? 'text.secondary' : 'text.disabled',
                }}
                noWrap
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
