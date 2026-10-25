import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/shared/auth/session-context';
import { changePassword, signIn, signOut, type ChangePasswordValues } from './services';
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


export function useChangePassword() {
  return useMutation<true, Error, ChangePasswordValues>({
    mutationFn: async (values) => {
      const result = await changePassword(values);
      if (!result.ok) throw new Error(result.message);
      return true;
    },
  });
}
