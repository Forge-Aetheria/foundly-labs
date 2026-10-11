import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStore } from '../../shared/infra/store';

const redirectMock = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  usePathname: () => '/admin/agenda',
}));
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt?: string }) => <img src={src} alt={alt ?? ''} />,
}));

import AdminLayout from './layout';

describe('admin layout guard (FR-016, contracts/routes.contract.md)', () => {
  beforeEach(() => {
    redirectMock.mockClear();
    resetStore({ seed: false });
  });

  it('redirects to /onboarding without a session', () => {
    render(<AdminLayout>contenido</AdminLayout>);
    expect(redirectMock).toHaveBeenCalledWith('/onboarding');
  });

  it('renders the shell when a tenant session exists', () => {
    resetStore();
    render(<AdminLayout>contenido</AdminLayout>);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
