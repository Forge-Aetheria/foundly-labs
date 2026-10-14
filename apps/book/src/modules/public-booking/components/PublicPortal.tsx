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
 * Desktop amount (in `theme.spacing` units, 8px each) the content grid rises over the
 * hero banner so both columns' cards overlap it (FR-021). Reduced on mobile (FR-022).
 */
export const CONTENT_OVERLAP = { xs: -2, md: -8 } as const;

/**
 * Provider landing (`/[tenantSlug]`): internal nav + a contained rounded hero banner +
 * a two-column content grid (main sections left, summary card right) that is pulled up
 * with a negative top margin so both columns' cards overlap the lower edge of the banner.
 * The overlap is reduced on mobile so no critical content is covered; the guided booking
 * checkout modal closes over the canvas.
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
          sx={{
            // Slide the whole grid up over the banner and lift it onto a higher layer.
            mt: CONTENT_OVERLAP,
            position: 'relative',
            zIndex: 1,
          }}
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
              position: { md: 'sticky' },
              top: { md: 88 },
              zIndex: 2,
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
