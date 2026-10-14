import type { ReactNode } from 'react';
import { Stack } from '@foundly/ui';
import { PublicHeader } from '../../shared/components/PublicHeader';

/** Public discovery layout: keeps the global header/navbar visible on `/negocios`. */
export default function NegociosLayout({ children }: { children: ReactNode }) {
  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <PublicHeader />
      {children}
    </Stack>
  );
}
