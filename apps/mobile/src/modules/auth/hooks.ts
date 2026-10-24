import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/shared/auth/session-context';
import { signIn, signOut } from './services';
import type { LoginValues } from './schemas';

export function useSignIn() {
  const { refresh } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LoginValues) => signIn(values),
    onSuccess: async (result) => {
      if (result.ok) {
        queryClient.clear();
        await refresh();
      }
    },
  });
}

export function useSignOut() {
  const { signOut: clearSession } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await signOut();
      queryClient.clear();
      await clearSession();
    },
  });
}
