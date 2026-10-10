'use client';

import { Button, Card, Stack, Typography } from '@foundly/ui';
import {
  GLASS_CARD_SX,
  PRIMARY_BUTTON_SX,
  SECONDARY_BUTTON_SX,
} from '../../../../app/components/landingCanon';
import { WEEKDAY_LABELS, formatRating } from '../../format';
import type { PublicBusinessProfile } from '../../types';
import { RatingStars } from './RatingStars';

function openStatusLabel(weeklyHours: PublicBusinessProfile['weeklyHours'], now: Date): string {
  const weekday = now.getDay();
  const today = weeklyHours.find((hours) => hours.weekday === weekday);
  if (today?.isOpen) {
    return `Abierto · Cierra a las ${today.endTime}`;
  }
  return 'Cerrado hoy';
}

/** Sticky provider sidebar: brand, rating, Reservar CTA, hours disclosure and contact. */
export function ProviderSidebar({
  profile,
  onReserve,
}: {
  profile: PublicBusinessProfile;
  onReserve: () => void;
}) {
  return (
    <Card sx={GLASS_CARD_SX}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt=""
              width={56}
              height={56}
              style={{ borderRadius: 16, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : null}
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="p" sx={{ fontWeight: 700 }} noWrap>
              {profile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile.category}
            </Typography>
          </Stack>
        </Stack>

        {profile.rating != null ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <RatingStars value={profile.rating} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatRating(profile.rating)}
            </Typography>
            {profile.reviewCount && profile.reviewCount > 0 ? (
              <Typography variant="body2" color="text.secondary">
                ({profile.reviewCount} reseñas)
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        <Button
          variant="primary"
          sx={PRIMARY_BUTTON_SX}
          fullWidth
          onClick={onReserve}
          aria-label={`Reservar en ${profile.name}`}
        >
          Reservar
        </Button>

        <Stack component="details">
          <Stack component="summary" direction="row" sx={{ cursor: 'pointer' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {openStatusLabel(profile.weeklyHours, new Date())}
            </Typography>
          </Stack>
          <Stack spacing={0.5} sx={{ pt: 1 }}>
            {profile.weeklyHours.map((hours) => (
              <Stack key={hours.weekday} direction="row" justifyContent="space-between">
                <Typography variant="body2">{WEEKDAY_LABELS[hours.weekday]}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {hours.isOpen ? `${hours.startTime} – ${hours.endTime}` : 'Cerrado'}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Stack spacing={0.5}>
          {profile.address ? (
            <Typography variant="body2" color="text.secondary">
              {profile.address}
            </Typography>
          ) : null}
          {profile.phone ? (
            <a href={`tel:${profile.phone}`} style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                {profile.phone}
              </Typography>
            </a>
          ) : null}
          {profile.social?.instagram || profile.social?.whatsapp ? (
            <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
              {profile.social.instagram ? (
                <a href={profile.social.instagram} target="_blank" rel="noreferrer">
                  <Button variant="secondary" sx={SECONDARY_BUTTON_SX}>
                    Instagram
                  </Button>
                </a>
              ) : null}
              {profile.social.whatsapp ? (
                <a href={profile.social.whatsapp} target="_blank" rel="noreferrer">
                  <Button variant="secondary" sx={SECONDARY_BUTTON_SX}>
                    WhatsApp
                  </Button>
                </a>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}