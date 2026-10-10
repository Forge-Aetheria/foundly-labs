'use client';

import { useState } from 'react';
import { Container, Stack } from '@foundly/ui';
import type { PublicBusinessProfile, PublicService } from '../types';
import { BookingFlow } from './booking/BookingFlow';
import { ProviderNav } from './provider/ProviderNav';
import { ProviderSections } from './provider/ProviderSections';
import { ProviderSidebar } from './provider/ProviderSidebar';

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
      <ProviderNav />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 2, md: 4 }}
          alignItems="flex-start"
        >
          <Stack sx={{ flexGrow: 1, minWidth: 0, order: { xs: 2, md: 1 } }}>
            <ProviderSections profile={profile} onReserve={setBookService} />
          </Stack>
          <Stack
            sx={{
              order: { xs: 1, md: 2 },
              width: { xs: '100%', md: 340 },
              flexShrink: 0,
            }}
          >
            <Stack sx={{ position: { md: 'sticky' }, top: { md: 88 }, width: '100%' }}>
              <ProviderSidebar profile={profile} onReserve={reserveFirstService} />
            </Stack>
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