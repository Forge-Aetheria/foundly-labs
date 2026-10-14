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
 * Provider landing (`/book/[tenantSlug]`): internal nav + two-column layout
 * (main sections left, sticky sidebar right) + guided booking checkout modal.
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
      <CoverBanner cover={profile.cover} name={profile.name} />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 2, md: 4 }}
          alignItems="flex-start"
        >
          <Stack sx={{ flexGrow: 1, minWidth: 0, width: '100%', order: { xs: 2, md: 1 } }}>
            <ProviderSections profile={profile} onReserve={setBookService} />
          </Stack>
          <Stack
            sx={{
              order: { xs: 1, md: 2 },
              width: { xs: '100%', md: 340 },
              flexShrink: 0,
              position: { md: 'sticky' },
              top: { md: 80 },
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
