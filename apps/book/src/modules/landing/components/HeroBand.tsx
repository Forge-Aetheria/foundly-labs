'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BoltIcon from '@mui/icons-material/Bolt';
import CreditCardOffIcon from '@mui/icons-material/CreditCardOff';
import StarIcon from '@mui/icons-material/Star';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import { Button, Container, Stack, TextField, Typography } from '@foundly/ui';
import { PILL_SX, PRIMARY_BUTTON_SX } from '../../../shared/utils/landingCanon';
import { heroCaptureHref } from '../utils/heroCapture';
import { BookingAppMockup } from './BookingAppMockup';

export interface HeroCopy {
  title: string;
  subtitle: string;
  badge: string;
}

export interface HeroCapture {
  placeholder: string;
  button: string;
}

export interface HeroBandProps {
  hero: HeroCopy;
  heroCapture: HeroCapture;
  cta: { href: string; label: string };
}

const TRUST_ITEMS = [
  { icon: CreditCardOffIcon, label: 'Sin tarjeta de crédito' },
  { icon: BoltIcon, label: 'Listo en 5 minutos' },
  { icon: SupportAgentIcon, label: 'Soporte en español' },
] as const;

/**
 * Split hero: conversion copy + a single email-capture form on the left, and a
 * floating Foundly Book app mockup on the right. The business-directory search
 * now lives in the top navigation so the hero keeps one conversion goal.
 */
export function HeroBand({ hero, heroCapture, cta }: HeroBandProps) {
  const [email, setEmail] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = heroCaptureHref(email);
  }

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 5, md: 9 },
        pb: { xs: 8, md: 12 },
      }}
    >
      {/* Soft lavender atmosphere behind both columns */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: (theme) =>
            `radial-gradient(60% 55% at 12% 18%, ${alpha(theme.palette.primary.main, 0.16)} 0%, transparent 70%), radial-gradient(45% 45% at 88% 26%, ${alpha(
              theme.palette.brand.book,
              0.14,
            )} 0%, transparent 70%)`,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) minmax(0, 0.95fr)' },
            alignItems: 'center',
            columnGap: { md: 5, lg: 7 },
            rowGap: { xs: 6, md: 0 },
          }}
        >
          {/* Left: copy + single conversion form */}
          <Stack spacing={{ xs: 2.5, md: 3 }} alignItems="flex-start" sx={{ maxWidth: 620 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={[
                PILL_SX,
                {
                  py: 0.75,
                  backgroundColor: 'var(--book-glass-card)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid',
                  borderColor: 'divider',
                },
              ]}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'success.main',
                  boxShadow: (theme) => `0 0 0 4px ${alpha(theme.palette.success.main, 0.16)}`,
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                {hero.badge}
              </Typography>
            </Stack>

            <Typography variant="h1" sx={{ maxWidth: 580 }}>
              {hero.title}
            </Typography>

            <Typography
              variant="h5"
              component="p"
              color="text.secondary"
              sx={{ fontWeight: 400, lineHeight: 1.55, maxWidth: 560 }}
            >
              {hero.subtitle}
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ width: '100%', maxWidth: 560 }}
              aria-label="Empieza gratis con Foundly Book"
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <TextField
                  label={heroCapture.placeholder}
                  type="email"
                  name="email"
                  value={email}
                  onChange={setEmail}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper',
                      borderRadius: '9999px',
                      minHeight: 54,
                    },
                  }}
                />
                <Button
                  variant="primary"
                  type="submit"
                  endIcon={<ArrowForwardIcon />}
                  sx={[PRIMARY_BUTTON_SX, { minHeight: 54, px: 3.5, whiteSpace: 'nowrap' }]}
                >
                  {heroCapture.button}
                </Button>
              </Stack>
            </Box>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ flexWrap: 'wrap', rowGap: 0.75 }}
            >
              <Stack
                direction="row"
                spacing={0.25}
                role="img"
                aria-label="Valoración media 4,8 sobre 5"
              >
                {[0, 1, 2, 3, 4].map((star) => (
                  <StarIcon key={star} sx={{ fontSize: 18, color: 'warning.main' }} />
                ))}
              </Stack>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                4,8/5
              </Typography>
              <Typography variant="body2" color="text.secondary">
                · Negocios que ya reservan online con Foundly Book
              </Typography>
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              spacing={{ xs: 1.25, sm: 2 }}
              sx={{ flexWrap: 'wrap', rowGap: 1 }}
            >
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <Stack key={label} direction="row" alignItems="center" spacing={0.6}>
                  <Icon sx={{ fontSize: 17, color: 'primary.main' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {label}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Typography variant="body2" color="text.secondary">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" style={{ color: 'inherit', fontWeight: 600 }}>
                Inicia sesión
              </Link>{' '}
              o{' '}
              <Link href={cta.href} style={{ color: 'inherit', fontWeight: 600 }}>
                registra tu negocio
              </Link>
              .
            </Typography>
          </Stack>

          {/* Right: floating app preview (stacks below on mobile) */}
          <BookingAppMockup />
        </Box>
      </Container>
    </Box>
  );
}
