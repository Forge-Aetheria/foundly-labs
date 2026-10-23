import type { ReactNode } from 'react';
import { Stack } from '@foundly/ui';
import { PublicHeader } from '../../shared/components/PublicHeader';
import { PublicFooter } from '../../shared/components/PublicFooter';

/** Public discovery layout (alias `/businesses`): same chrome as `/negocios`. */
export default function BusinessesLayout({ children }: { children: ReactNode }) {
  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <PublicHeader />
      <Stack sx={{ flexGrow: 1 }}>{children}</Stack>
      <PublicFooter />
    </Stack>
  );
}
