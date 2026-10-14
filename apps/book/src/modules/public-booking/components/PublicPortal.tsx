'use client';

import { useState } from 'react';
import { Container, Stack } from '@foundly/ui';
import type { PublicBusinessProfile, PublicService } from '../utils/types';
import { BookingFlow } from '../dialogs/BookingFlow';
import { CoverBanner } from './CoverBanner';
import { ProviderNav } from './ProviderNav';
import { ProviderSections } from './ProviderSections';
import { ProviderSidebar } from './ProviderSidebar';

/**
 * Desktop amount (in `theme.spacing` units) the info card rises over the hero banner,
 * producing the floating-card overlap of the reference layout (FR-021).
 */
export const SIDEBAR_OVERLAP = 10;

/**
 * Provider landing (`/[tenantSlug]`): internal nav + a contained rounded hero banner +
 * two-column layout (main sections left, solid info card right) where the card overlaps
 * the lower edge of the banner on desktop and stacks cleanly without overlap on mobile.
 * The guided booking checkout modal closes over the canvas.
 */
export function PublicPortal({ profile }: { profile: PublicBusinessProfile }) {
  const [bookService, setBookService] = useState<PublicService | null>(null);

  function reserveFirstService() {
    const first = profile.services[0];
    if (first) setBookService(first);
  }

  return (
    <Stack>
      <ProviderNav profile={profile} />
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, pb: { xs: 4, md: 6 } }}>
        <CoverBanner
          cover={profile.cover}
          fallback={profile.gallery?.[0]?.url ?? null}
          name={profile.name}
        />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 2, md: 4 }}
          alignItems="flex-start"
          sx={{ mt: { xs: 2, md: 2 } }}
        >
          <Stack sx={{ flexGrow: 1, minWidth: 0, width: '100%', order: { xs: 2, md: 1 } }}>
            <ProviderSections profile={profile} onReserve={setBookService} />
          </Stack>
          <Stack
            data-testid="provider-sidebar"
            sx={{
              order: { xs: 1, md: 2 },
              width: { xs: '100%', md: 340 },
              flexShrink: 0,
              // Float the info card over the banner on desktop; stack it (no overlap) on mobile.
              mt: { xs: 0, md: -SIDEBAR_OVERLAP },
              position: { md: 'sticky' },
              top: { md: 88 },
              zIndex: 10,
            }}
          >
            <ProviderSidebar profile={profile} onReserve={reserveFirstService} />
          </Stack>
        </Stack>
      </Container>

      {bookService ? (
        <BookingFlow
          service={bookService}
          tenantSlug={profile.slug}
          specialists={profile.specialists}
          onClose={() => setBookService(null)}
        />
      ) : null}
    </Stack>
  );
}
