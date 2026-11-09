import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Compatibility shim for the old `next/navigation` API (feature 024).
 * `refresh()` invalidates the TanStack cache instead of revalidating a server
 * route, so the existing views keep working without a full rewrite.
 */
export function useRouter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return {
    push: (to: string) => {
      void navigate(to);
    },
    replace: (to: string) => {
      void navigate(to, { replace: true });
    },
    refresh: () => {
      void queryClient.invalidateQueries();
    },
  };
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(useLocation().search);
}
