import { Stack } from '@foundly/ui';
import { Outlet } from 'react-router-dom';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

/** Public discovery layout: global header/navbar + platform footer. */
export function PublicLayout() {
  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <PublicHeader />
      <Stack sx={{ flexGrow: 1 }}>
        <Outlet />
      </Stack>
      <PublicFooter />
    </Stack>
  );
}
