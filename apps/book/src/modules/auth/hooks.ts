'use client';

import type { ActionResult } from '../../shared/types/result';
import { signIn, signOut } from './actions';

/** Auth client hooks (feature 011; constitution §5.VI). */
export function useSignIn(): (input: unknown) => Promise<ActionResult<{ redirectTo: string }>> {
  return (input) => signIn(input);
}

export function useSignOut(): () => Promise<void> {
  return () => signOut();
}