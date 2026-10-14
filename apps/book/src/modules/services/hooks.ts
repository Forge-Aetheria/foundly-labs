'use client';

import type { ActionResult } from '../../shared/types/result';
import type { Service } from '../../shared/types/appointments';
import {
  createService,
  deleteService,
  listServices,
  updateService,
  type ServiceCatalogResult,
} from './actions';

/**
 * Services client hooks (feature 016, US5; constitution §5.VI).
 */
export function useFetchServices(): (tenantId: string) => Promise<ActionResult<ServiceCatalogResult>> {
  return (tenantId) => listServices(tenantId);
}

export function useCreateService(): (input: unknown) => Promise<ActionResult<Service>> {
  return (input) => createService(input);
}

export function useUpdateService(): (input: unknown) => Promise<ActionResult<Service>> {
  return (input) => updateService(input);
}

export function useDeleteService(): (input: unknown) => Promise<ActionResult<{ id: string }>> {
  return (input) => deleteService(input);
}
