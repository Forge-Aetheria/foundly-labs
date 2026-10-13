import { apiRequest } from './apiClient';
import type { ActionResult } from './result';

/**
 * Remote availability repository (feature 010 — remove local store).
 * Public query by tenant/specialist; mutations are public on the API
 * (`availability.resolver.ts`).
 */

export interface AvailabilityDto {
  id: string;
  tenantId: string;
  specialistId: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  slotGranularityMinutes: number;
  minLeadTimeMinutes: number;
  bookingHorizonDays: number;
  breaks: string | null;
}

export interface AvailabilityFilter {
  tenantId?: string | null;
  tenantSlug?: string | null;
  specialistId?: string | null;
}

export interface CreateAvailabilityInput {
  tenantId?: string | null;
  tenantSlug?: string | null;
  specialistId?: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  slotGranularityMinutes?: number | null;
  minLeadTimeMinutes?: number | null;
  bookingHorizonDays?: number | null;
  breaks?: string | null;
}

export type UpdateAvailabilityInput = Partial<
  Omit<CreateAvailabilityInput, 'tenantId' | 'tenantSlug'>
>;

const AVAILABILITY_FIELDS = /* GraphQL */ `
  id
  tenantId
  specialistId
  weekday
  startTime
  endTime
  slotGranularityMinutes
  minLeadTimeMinutes
  bookingHorizonDays
  breaks
`;

const LIST_AVAILABILITY = /* GraphQL */ `
  query Availability($tenantId: String, $tenantSlug: String, $specialistId: String) {
    availability(tenantId: $tenantId, tenantSlug: $tenantSlug, specialistId: $specialistId) {
      ${AVAILABILITY_FIELDS}
    }
  }
`;

const CREATE_AVAILABILITY = /* GraphQL */ `
  mutation CreateAvailability($input: CreateAvailabilityInput!) {
    createAvailability(input: $input) {
      ${AVAILABILITY_FIELDS}
    }
  }
`;

const UPDATE_AVAILABILITY = /* GraphQL */ `
  mutation UpdateAvailability($id: String!, $input: UpdateAvailabilityInput!) {
    updateAvailability(id: $id, input: $input) {
      ${AVAILABILITY_FIELDS}
    }
  }
`;

const REMOVE_AVAILABILITY = /* GraphQL */ `
  mutation RemoveAvailability($id: String!) {
    removeAvailability(id: $id)
  }
`;

export async function listRemoteAvailability(
  filter: AvailabilityFilter,
): Promise<ActionResult<AvailabilityDto[]>> {
  const result = await apiRequest<{ availability: AvailabilityDto[] }, AvailabilityFilter>(
    LIST_AVAILABILITY,
    {
      tenantId: filter.tenantId ?? null,
      tenantSlug: filter.tenantSlug ?? null,
      specialistId: filter.specialistId ?? null,
    },
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.availability };
}

export async function createRemoteAvailability(
  input: CreateAvailabilityInput,
): Promise<ActionResult<AvailabilityDto>> {
  const result = await apiRequest<
    { createAvailability: AvailabilityDto },
    { input: CreateAvailabilityInput }
  >(CREATE_AVAILABILITY, { input });
  if (!result.ok) return result;
  return { ok: true, data: result.data.createAvailability };
}

export async function updateRemoteAvailability(
  id: string,
  input: UpdateAvailabilityInput,
): Promise<ActionResult<AvailabilityDto>> {
  const result = await apiRequest<
    { updateAvailability: AvailabilityDto },
    { id: string; input: UpdateAvailabilityInput }
  >(UPDATE_AVAILABILITY, { id, input });
  if (!result.ok) return result;
  return { ok: true, data: result.data.updateAvailability };
}

export async function removeRemoteAvailability(id: string): Promise<ActionResult<{ id: string }>> {
  const result = await apiRequest<{ removeAvailability: boolean }, { id: string }>(
    REMOVE_AVAILABILITY,
    {
      id,
    },
  );
  if (!result.ok) return result;
  return { ok: true, data: { id } };
}
