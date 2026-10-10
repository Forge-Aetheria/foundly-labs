'use client';

import Box from '@mui/material/Box';
import { Card, Stack, Typography } from '@foundly/ui';
import { GLASS_CARD_SX } from '../../../../app/components/landingCanon';
import { WEEKDAY_LABELS, formatRating, formatReviewDate } from '../../format';
import type { PublicBusinessProfile, PublicReview, PublicService, PublicSpecialist } from '../../types';
import { ServiceCard } from '../ServiceCard';
import { RatingStars } from './RatingStars';

interface ProviderSectionsProps {
  profile: PublicBusinessProfile;
  onReserve: (service: PublicService) => void;
}

const SECTION_OFFSET = {
  scrollMarginTop: { xs: 88, md: 112 },
} as const;

/** Main (left) column of the provider landing: gallery, policies, services, team, about, gallery, reviews, direction. */
export function ProviderSections({ profile, onReserve }: ProviderSectionsProps) {
  const byCategory = groupByCategory(profile.services);
  return (
    <Stack spacing={5}>
      <GalleryBanner cover={profile.cover} gallery={profile.gallery ?? []} name={profile.name} />
      <PoliciesCard policies={profile.policies} />
      <ServiceCatalog categories={byCategory} onReserve={onReserve} />
      <TeamSection specialists={profile.specialists} />
      <AboutSection bio={profile.bio} />
      <GallerySection gallery={profile.gallery ?? []} />
      <ReviewsSection
        name={profile.name}
        rating={profile.rating ?? null}
        reviewCount={profile.reviewCount ?? 0}
        reviews={profile.reviews ?? []}
      />
      <DirectionSection profile={profile} />
    </Stack>
  );
}

function groupByCategory(services: PublicService[]): Map<string, PublicService[]> {
  const categories = new Map<string, PublicService[]>();
  for (const service of services) {
    const key = service.category?.trim() || 'Servicios';
    categories.set(key, [...(categories.get(key) ?? []), service]);
  }
  return categories;
}

function GalleryBanner({
  cover,
  gallery,
  name,
}: {
  cover: string | null;
  gallery: string[];
  name: string;
}) {
  const strips = [...(cover ? [cover] : []), ...gallery].slice(1, 4);
  return (
    <Stack spacing={1.5}>
      {cover ? (
        <Box
          component="img"
          src={cover}
          alt={`Local de ${name}`}
          sx={{
            width: '100%',
            height: { xs: 220, md: 340 },
            objectFit: 'cover',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
          }}
        />
      ) : null}
      {strips.length > 0 ? (
        <Stack direction="row" spacing={1.5}>
          {strips.map((src) => (
            <Box
              key={src}
              component="img"
              src={src}
              alt=""
              sx={{
                flex: 1,
                height: { xs: 96, md: 140 },
                objectFit: 'cover',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
              }}
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

function PoliciesCard({ policies }: { policies: PublicBusinessProfile['policies'] }) {
  if (policies.length === 0) return null;
  return (
    <Card
      sx={GLASS_CARD_SX}
      header={
        <Typography variant="h6" component="h2">
          Políticas de reserva
        </Typography>
      }
    >
      <Stack spacing={1.5}>
        {policies.map((policy) => (
          <Stack key={policy.title} spacing={0.25}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {policy.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {policy.body}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

function ServiceCatalog({
  categories,
  onReserve,
}: {
  categories: Map<string, PublicService[]>;
  onReserve: (service: PublicService) => void;
}) {
  if (categories.size === 0) return null;
  return (
    <Stack component="section" id="servicios" spacing={3} sx={SECTION_OFFSET}>
      <Typography variant="h4" component="h2">
        Servicios
      </Typography>
      {[...categories.entries()].map(([category, services]) => (
        <Stack key={category} spacing={1.5}>
          <Typography variant="h6" component="h3">
            {category}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
            {services.map((service) => (
              <Stack
                key={service.id}
                sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}
              >
                <ServiceCard service={service} onReserve={onReserve} />
              </Stack>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

function TeamSection({ specialists }: { specialists: PublicSpecialist[] }) {
  if (specialists.length === 0) return null;
  return (
    <Stack component="section" id="equipo" spacing={2} sx={SECTION_OFFSET}>
      <Typography variant="h4" component="h2">
        Equipo
      </Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
        {specialists.map((specialist) => (
          <Card
            key={specialist.id}
            sx={[GLASS_CARD_SX, { flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 12px)' } }]}
          >
            <Stack spacing={1.5}>
              {specialist.avatar ? (
                <img
                  src={specialist.avatar}
                  alt={specialist.name}
                  width={80}
                  height={80}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <Stack
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'background.paper',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h5" component="span" sx={{ fontWeight: 700 }}>
                    {initials(specialist.name)}
                  </Typography>
                </Stack>
              )}
              <Stack spacing={0.25}>
                <Typography variant="h6" component="h3">
                  {specialist.name}
                </Typography>
                {specialist.role ? (
                  <Typography variant="body2" color="text.secondary">
                    {specialist.role}
                  </Typography>
                ) : null}
                {specialist.bio ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {specialist.bio}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

function AboutSection({ bio }: { bio: string | null }) {
  if (!bio) return null;
  return (
    <Stack component="section" id="acerca" spacing={2} sx={SECTION_OFFSET}>
      <Typography variant="h4" component="h2">
        Acerca de
      </Typography>
      <Card sx={GLASS_CARD_SX}>
        <Typography variant="body1" color="text.secondary">
          {bio}
        </Typography>
      </Card>
    </Stack>
  );
}

function GallerySection({ gallery }: { gallery: string[] }) {
  if (gallery.length === 0) return null;
  return (
    <Stack component="section" id="galeria" spacing={2} sx={SECTION_OFFSET}>
      <Typography variant="h4" component="h2">
        Galería
      </Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
        {gallery.map((src, index) => (
          <Box
            key={src}
            component="img"
            src={src}
            alt={`Foto ${index + 1}`}
            sx={{
              flex: '1 1 calc(33.333% - 12px)',
              minWidth: { xs: '45%', md: '30%' },
              aspectRatio: '4 / 3',
              objectFit: 'cover',
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function ReviewsSection({
  name,
  rating,
  reviewCount,
  reviews,
}: {
  name: string;
  rating: number | null;
  reviewCount: number;
  reviews: PublicReview[];
}) {
  if (rating == null && reviews.length === 0) return null;
  return (
    <Stack component="section" id="resenas" spacing={2} sx={SECTION_OFFSET}>
      <Typography variant="h4" component="h2">
        Reseñas de {name}
      </Typography>
      {rating != null ? (
        <Card sx={GLASS_CARD_SX}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {formatRating(rating)}
            </Typography>
            <RatingStars value={rating} />
            <Typography variant="body2" color="text.secondary">
              {reviewCount} reseñas
            </Typography>
          </Stack>
        </Card>
      ) : null}
      {reviews.map((review) => (
        <Card key={review.id} sx={GLASS_CARD_SX}>
          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {review.author}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatReviewDate(review.date)}
              </Typography>
            </Stack>
            <RatingStars value={review.rating} />
            <Typography variant="body2" color="text.secondary">
              {review.comment}
            </Typography>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

function DirectionSection({ profile }: { profile: PublicBusinessProfile }) {
  return (
    <Stack component="section" id="direccion" spacing={2} sx={SECTION_OFFSET}>
      <Typography variant="h4" component="h2">
        Dirección y horarios
      </Typography>
      <Card sx={GLASS_CARD_SX}>
        <Stack spacing={1.5}>
          {profile.address ? (
            <Typography variant="body1">{profile.address}</Typography>
          ) : null}
          {profile.phone ? (
            <a href={`tel:${profile.phone}`} style={{ textDecoration: 'none' }}>
              <Typography variant="body1" color="primary">
                {profile.phone}
              </Typography>
            </a>
          ) : null}
          {profile.weeklyHours.length > 0 ? (
            <>
              <Typography variant="h6" component="h3" sx={{ mt: 1 }}>
                Horario de atención
              </Typography>
              {profile.weeklyHours.map((hours) => (
                <Stack key={hours.weekday} direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {WEEKDAY_LABELS[hours.weekday]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {hours.isOpen ? `${hours.startTime} – ${hours.endTime}` : 'Cerrado'}
                  </Typography>
                </Stack>
              ))}
            </>
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
}