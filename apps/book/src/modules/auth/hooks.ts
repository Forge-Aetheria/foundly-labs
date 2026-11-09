import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LOGIN_ROUTE } from '../../shared/auth/authConstants';
import type { ActionResult } from '../../shared/types/result';
import { signIn, signOut } from './services';

/** Auth client hooks (feature 024; constitution §5.VI). */
export function useSignIn(): (input: unknown) => Promise<ActionResult<{ redirectTo: string }>> {
  const mutation = useMutation({ mutationFn: (input: unknown) => signIn(input) });
  return mutation.mutateAsync;
}

export function useSignOut(): () => Promise<void> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      await signOut();
      queryClient.clear();
    },
  });
  return async () => {
    await mutation.mutateAsync();
    navigate(LOGIN_ROUTE, { replace: true });
  };
}
