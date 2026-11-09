import { useMutation } from '@tanstack/react-query';
import type { ActionResult } from '../../shared/types/result';
import { changePassword } from './services';

/** Security client hooks (feature 024; constitution §5.VI). */
export function useChangePassword(): (input: unknown) => Promise<ActionResult<{ updated: true }>> {
  const mutation = useMutation({ mutationFn: (input: unknown) => changePassword(input) });
  return mutation.mutateAsync;
}
