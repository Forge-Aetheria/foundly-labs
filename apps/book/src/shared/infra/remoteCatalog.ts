import type { Rate, Resource, Service } from '../types/appointments';
import { apiRequest } from './apiClient';
import type { ActionResult } from './result';

/**
 * Remote Admin Catalog repository (feature 008 — admin-catalog.contract.md).
 * Tenant scope derives from the bearer token on the API side; the client never
 * sends `tenantId`. Fields not served by the API surface (`bufferMinutes`,
 * `serviceIds`, `timezone`) are held locally (data-model.md §5 known gaps).
 */

export interface MyServiceDto {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  category: string | null;
  active: boolean;
}

export interface MySpecialistDto {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar: string | null;
  active: boolean;
}

export interface CreateServiceInput {
  name: string;
  priceCents: number;
  durationMinutes: number;
  description?: string | null;
  category?: string | null;
  active?: boolean | null;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

export interface CreateSpecialistInput {
  name: string;
  role?: string | null;
  bio?: string | null;
  avatar?: string | null;
  active?: boolean | null;
}

export type UpdateSpecialistInput = Partial<CreateSpecialistInput>;

/** Default timezone for locally-held fields while the API does not serve it. */
const LOCAL_TIMEZONE = 'Europe/Madrid';
const LOCAL_CURRENCY = 'EUR';

/** Map API `MyService` → book `Service` + derived active `Rate` (data-model §2.2). */
export function mapMyService(dto: MyServiceDto, tenantId: string): { service: Service; rate: Rate } {
  const service: Service = {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    durationMinutes: dto.durationMinutes,
    bufferMinutes: 0, // local hold — not served by the API surface
    category: dto.category,
    active: dto.active,
    tenantId,
  };
  const rate: Rate = {
    id: dto.id,
    serviceId: dto.id,
    amountCents: dto.priceCents,
    currency: LOCAL_CURRENCY,
    effectiveFrom: new Date().toISOString(),
    effectiveTo: null,
  };
  return { service, rate };
}

/** Map API `MySpecialist` → book `Resource` (type `professional`) (data-model §3.1). */
export function mapMySpecialist(dto: MySpecialistDto, tenantId: string): Resource {
  return {
    id: dto.id,
    name: dto.name,
    type: 'professional',
    active: dto.active,
    timezone: LOCAL_TIMEZONE, // local hold — not served by the API surface
    tenantId,
    role: dto.role,
    avatar: dto.avatar,
    bio: dto.bio,
  };
}

const MY_SERVICES = /* GraphQL */ `
  query MyServices($active: Boolean) {
    myServices(active: $active) {
      id
      name
      description
      priceCents
      durationMinutes
      category
      active
    }
  }
`;

const CREATE_MY_SERVICE = /* GraphQL */ `
  mutation CreateMyService($input: CreateMyServiceInput!) {
    createMyService(input: $input) {
      id
      name
      description
      priceCents
      durationMinutes
      category
      active
    }
  }
`;

const UPDATE_MY_SERVICE = /* GraphQL */ `
  mutation UpdateMyService($id: ID!, $input: UpdateMyServiceInput!) {
    updateMyService(id: $id, input: $input) {
      id
      name
      description
      priceCents
      durationMinutes
      category
      active
    }
  }
`;

const DELETE_MY_SERVICE = /* GraphQL */ `
  mutation DeleteMyService($id: ID!) {
    deleteMyService(id: $id)
  }
`;

const MY_SPECIALISTS = /* GraphQL */ `
  query MySpecialists($active: Boolean) {
    mySpecialists(active: $active) {
      id
      name
      role
      bio
      avatar
      active
    }
  }
`;

const CREATE_MY_SPECIALIST = /* GraphQL */ `
  mutation CreateMySpecialist($input: CreateMySpecialistInput!) {
    createMySpecialist(input: $input) {
      id
      name
      role
      bio
      avatar
      active
    }
  }
`;

const UPDATE_MY_SPECIALIST = /* GraphQL */ `
  mutation UpdateMySpecialist($id: ID!, $input: UpdateMySpecialistInput!) {
    updateMySpecialist(id: $id, input: $input) {
      id
      name
      role
      bio
      avatar
      active
    }
  }
`;

const DELETE_MY_SPECIALIST = /* GraphQL */ `
  mutation DeleteMySpecialist($id: ID!) {
    deleteMySpecialist(id: $id)
  }
`;

export interface RemoteServiceList {
  services: Service[];
  rates: Rate[];
}

/** List the tenant's services with derived rates (US1). */
export async function listRemoteServices(
  token: string | null,
  tenantId: string,
): Promise<ActionResult<RemoteServiceList>> {
  const result = await apiRequest<{ myServices: MyServiceDto[] }, { active?: boolean | null }>(
    MY_SERVICES,
    { active: null },
    { token },
  );
  if (!result.ok) return result;
  const mapped = result.data.myServices.map((dto) => mapMyService(dto, tenantId));
  return {
    ok: true,
    data: {
      services: mapped.map((entry) => entry.service),
      rates: mapped.map((entry) => entry.rate),
    },
  };
}

/** Create a service (US1 write adapter — wired from server actions). */
export async function createRemoteService(
  token: string | null,
  tenantId: string,
  input: CreateServiceInput,
): Promise<ActionResult<Service>> {
  const result = await apiRequest<{ createMyService: MyServiceDto }, { input: CreateServiceInput }>(
    CREATE_MY_SERVICE,
    { input },
    { token },
  );
  if (!result.ok) return result;
  return { ok: true, data: mapMyService(result.data.createMyService, tenantId).service };
}

/** Update a service (US1 write adapter). */
export async function updateRemoteService(
  token: string | null,
  tenantId: string,
  id: string,
  input: UpdateServiceInput,
): Promise<ActionResult<Service>> {
  const result = await apiRequest<
    { updateMyService: MyServiceDto },
    { id: string; input: UpdateServiceInput }
  >(UPDATE_MY_SERVICE, { id, input }, { token });
  if (!result.ok) return result;
  return { ok: true, data: mapMyService(result.data.updateMyService, tenantId).service };
}

/** Delete a service (US1 write adapter). */
export async function deleteRemoteService(
  token: string | null,
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await apiRequest<{ deleteMyService: boolean }, { id: string }>(
    DELETE_MY_SERVICE,
    { id },
    { token },
  );
  if (!result.ok) return result;
  return { ok: true, data: { id } };
}

/** List the tenant's team members (US1). */
export async function listRemoteSpecialists(
  token: string | null,
  tenantId: string,
): Promise<ActionResult<Resource[]>> {
  const result = await apiRequest<{ mySpecialists: MySpecialistDto[] }, { active?: boolean | null }>(
    MY_SPECIALISTS,
    { active: null },
    { token },
  );
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data.mySpecialists.map((dto) => mapMySpecialist(dto, tenantId)),
  };
}

/** Create a team member (US1 write adapter). */
export async function createRemoteSpecialist(
  token: string | null,
  tenantId: string,
  input: CreateSpecialistInput,
): Promise<ActionResult<Resource>> {
  const result = await apiRequest<
    { createMySpecialist: MySpecialistDto },
    { input: CreateSpecialistInput }
  >(CREATE_MY_SPECIALIST, { input }, { token });
  if (!result.ok) return result;
  return { ok: true, data: mapMySpecialist(result.data.createMySpecialist, tenantId) };
}

/** Update a team member (US1 write adapter). */
export async function updateRemoteSpecialist(
  token: string | null,
  tenantId: string,
  id: string,
  input: UpdateSpecialistInput,
): Promise<ActionResult<Resource>> {
  const result = await apiRequest<
    { updateMySpecialist: MySpecialistDto },
    { id: string; input: UpdateSpecialistInput }
  >(UPDATE_MY_SPECIALIST, { id, input }, { token });
  if (!result.ok) return result;
  return { ok: true, data: mapMySpecialist(result.data.updateMySpecialist, tenantId) };
}

/** Delete a team member (US1 write adapter). */
export async function deleteRemoteSpecialist(
  token: string | null,
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const result = await apiRequest<{ deleteMySpecialist: boolean }, { id: string }>(
    DELETE_MY_SPECIALIST,
    { id },
    { token },
  );
  if (!result.ok) return result;
  return { ok: true, data: { id } };
}