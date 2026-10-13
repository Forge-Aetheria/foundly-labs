'use client';

import type { ActionResult } from '../../shared/types/result';
import { createBusiness, validateSlug, type CreateBusinessResult, type SlugAvailability } from './actions';

/** Onboarding client hooks (feature 011; constitution §5.VI). */
export function useCreateBusiness(): (input: unknown) => Promise<ActionResult<CreateBusinessResult>> {
  return (input) => createBusiness(input);
}

export function useValidateSlug(): (slug: string) => Promise<SlugAvailability> {
  return (slug) => validateSlug(slug);
}