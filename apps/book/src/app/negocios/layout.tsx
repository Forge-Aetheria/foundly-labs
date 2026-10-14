import type { ReactNode } from 'react';
import { Stack } from '@foundly/ui';
import { PublicHeader } from '../../shared/components/PublicHeader';
import { PublicFooter } from '../../shared/components/PublicFooter';

/** Public discovery layout: keeps the global header/navbar and the platform footer on `/negocios`. */
export default function NegociosLayout({ children }: { children: ReactNode }) {
  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <PublicHeader />
      <Stack sx={{ flexGrow: 1 }}>{children}</Stack>
      <PublicFooter />
    </Stack>
  );
}
