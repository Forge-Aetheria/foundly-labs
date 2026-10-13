import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
};

export type Appointment = {
  __typename?: 'Appointment';
  appliedAmountCents: Scalars['Int']['output'];
  appliedCurrency: Scalars['String']['output'];
  appliedDurationMinutes: Scalars['Int']['output'];
  cancellationReason?: Maybe<Scalars['String']['output']>;
  clientContact?: Maybe<Scalars['String']['output']>;
  clientName: Scalars['String']['output'];
  endAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  origin: Scalars['String']['output'];
  service: AppointmentService;
  serviceId: Scalars['String']['output'];
  specialist: AppointmentSpecialist;
  specialistId: Scalars['String']['output'];
  startAt: Scalars['DateTime']['output'];
  status: AppointmentStatus;
  tenantId: Scalars['String']['output'];
};

export type AppointmentService = {
  __typename?: 'AppointmentService';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type AppointmentSpecialist = {
  __typename?: 'AppointmentSpecialist';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export enum AppointmentStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Confirmed = 'CONFIRMED',
  Pending = 'PENDING'
}

export type Availability = {
  __typename?: 'Availability';
  bookingHorizonDays: Scalars['Int']['output'];
  breaks?: Maybe<Scalars['String']['output']>;
  endTime: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  minLeadTimeMinutes: Scalars['Int']['output'];
  slotGranularityMinutes: Scalars['Int']['output'];
  specialistId?: Maybe<Scalars['String']['output']>;
  startTime: Scalars['String']['output'];
  tenantId: Scalars['String']['output'];
  weekday: Scalars['Int']['output'];
};

export type BookCapability = {
  __typename?: 'BookCapability';
  enabled: Scalars['Boolean']['output'];
  tenantId: Scalars['ID']['output'];
};

export type BusinessProfileInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  brandColors?: InputMaybe<Scalars['String']['input']>;
  cover?: InputMaybe<Scalars['String']['input']>;
  instagram?: InputMaybe<Scalars['String']['input']>;
  logo?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  policies?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  whatsapp?: InputMaybe<Scalars['String']['input']>;
};

export type BusinessProfileObject = {
  __typename?: 'BusinessProfileObject';
  address?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  brandColors?: Maybe<Scalars['String']['output']>;
  cover?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  instagram?: Maybe<Scalars['String']['output']>;
  logo?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  policies?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
  whatsapp?: Maybe<Scalars['String']['output']>;
};

export type CreateAppointmentInput = {
  clientContact?: InputMaybe<Scalars['String']['input']>;
  clientName: Scalars['String']['input'];
  endAt: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  origin?: InputMaybe<Scalars['String']['input']>;
  serviceId: Scalars['ID']['input'];
  specialistId: Scalars['ID']['input'];
  startAt: Scalars['String']['input'];
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAvailabilityInput = {
  bookingHorizonDays?: InputMaybe<Scalars['Int']['input']>;
  breaks?: InputMaybe<Scalars['String']['input']>;
  endTime: Scalars['String']['input'];
  minLeadTimeMinutes?: InputMaybe<Scalars['Int']['input']>;
  slotGranularityMinutes?: InputMaybe<Scalars['Int']['input']>;
  specialistId?: InputMaybe<Scalars['String']['input']>;
  startTime: Scalars['String']['input'];
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
  weekday: Scalars['Int']['input'];
};

export type CreateMyServiceInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  durationMinutes?: Scalars['Int']['input'];
  name?: Scalars['String']['input'];
  priceCents?: Scalars['Int']['input'];
};

export type CreateMySpecialistInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  avatar?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  name?: Scalars['String']['input'];
  role?: InputMaybe<Scalars['String']['input']>;
};

export type CreateServiceInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  bufferMinutes?: InputMaybe<Scalars['Int']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  durationMinutes: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  priceCents: Scalars['Int']['input'];
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
};

export type CreateSpecialistInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  avatar?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  role?: InputMaybe<Scalars['String']['input']>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
};

export type CreateTenantInput = {
  category: Scalars['String']['input'];
  currency?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  profile: BusinessProfileInput;
  timezone: Scalars['String']['input'];
};

export type CurrentTenant = {
  __typename?: 'CurrentTenant';
  id: Scalars['ID']['output'];
  plan?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type CurrentUser = {
  __typename?: 'CurrentUser';
  role: Scalars['String']['output'];
  tenant: CurrentTenant;
  userId: Scalars['ID']['output'];
};

export type HealthPayload = {
  __typename?: 'HealthPayload';
  checkedAt: Scalars['String']['output'];
  database: Scalars['String']['output'];
  service: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  assignServiceToSpecialist: Specialist;
  cancelAppointment: Appointment;
  createAppointment: Appointment;
  createAvailability: Availability;
  createMyService: MyService;
  createMySpecialist: MySpecialist;
  createService: Service;
  createSpecialist: Specialist;
  createTenant: TenantObject;
  deleteMyService: Scalars['Boolean']['output'];
  deleteMySpecialist: Scalars['Boolean']['output'];
  removeAvailability: Scalars['Boolean']['output'];
  removeService: Scalars['Boolean']['output'];
  removeSpecialist: Scalars['Boolean']['output'];
  unassignServiceFromSpecialist: Specialist;
  updateAppointmentStatus: Appointment;
  updateAvailability: Availability;
  updateMyService: MyService;
  updateMySpecialist: MySpecialist;
  updateService: Service;
  updateSpecialist: Specialist;
};


export type MutationAssignServiceToSpecialistArgs = {
  serviceId: Scalars['String']['input'];
  specialistId: Scalars['String']['input'];
};


export type MutationCancelAppointmentArgs = {
  id: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateAppointmentArgs = {
  input: CreateAppointmentInput;
};


export type MutationCreateAvailabilityArgs = {
  input: CreateAvailabilityInput;
};


export type MutationCreateMyServiceArgs = {
  input: CreateMyServiceInput;
};


export type MutationCreateMySpecialistArgs = {
  input: CreateMySpecialistInput;
};


export type MutationCreateServiceArgs = {
  input: CreateServiceInput;
};


export type MutationCreateSpecialistArgs = {
  input: CreateSpecialistInput;
};


export type MutationCreateTenantArgs = {
  input: CreateTenantInput;
};


export type MutationDeleteMyServiceArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMySpecialistArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveAvailabilityArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveServiceArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveSpecialistArgs = {
  id: Scalars['String']['input'];
};


export type MutationUnassignServiceFromSpecialistArgs = {
  serviceId: Scalars['String']['input'];
  specialistId: Scalars['String']['input'];
};


export type MutationUpdateAppointmentStatusArgs = {
  id: Scalars['String']['input'];
  status: AppointmentStatus;
};


export type MutationUpdateAvailabilityArgs = {
  id: Scalars['String']['input'];
  input: UpdateAvailabilityInput;
};


export type MutationUpdateMyServiceArgs = {
  id: Scalars['ID']['input'];
  input: UpdateMyServiceInput;
};


export type MutationUpdateMySpecialistArgs = {
  id: Scalars['ID']['input'];
  input: UpdateMySpecialistInput;
};


export type MutationUpdateServiceArgs = {
  id: Scalars['String']['input'];
  input: UpdateServiceInput;
};


export type MutationUpdateSpecialistArgs = {
  id: Scalars['String']['input'];
  input: UpdateSpecialistInput;
};

export type MyService = {
  __typename?: 'MyService';
  active: Scalars['Boolean']['output'];
  category?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  durationMinutes: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  priceCents: Scalars['Int']['output'];
};

export type MySpecialist = {
  __typename?: 'MySpecialist';
  active: Scalars['Boolean']['output'];
  avatar?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  appointment?: Maybe<Appointment>;
  appointments: Array<Appointment>;
  availability: Array<Availability>;
  bookCapability: BookCapability;
  currentTenant: CurrentTenant;
  health: HealthPayload;
  me: CurrentUser;
  myService?: Maybe<MyService>;
  myServices: Array<MyService>;
  mySpecialist?: Maybe<MySpecialist>;
  mySpecialists: Array<MySpecialist>;
  service?: Maybe<Service>;
  serviceSpecialists: Array<Specialist>;
  services: Array<Service>;
  specialist?: Maybe<Specialist>;
  specialists: Array<Specialist>;
  tenant?: Maybe<TenantObject>;
  tenants: Array<TenantObject>;
  viewer: ViewerObject;
};


export type QueryAppointmentArgs = {
  id: Scalars['String']['input'];
};


export type QueryAppointmentsArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  specialistId?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AppointmentStatus>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAvailabilityArgs = {
  specialistId?: InputMaybe<Scalars['String']['input']>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyServiceArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMyServicesArgs = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryMySpecialistArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMySpecialistsArgs = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryServiceArgs = {
  id: Scalars['String']['input'];
};


export type QueryServiceSpecialistsArgs = {
  serviceId: Scalars['String']['input'];
};


export type QueryServicesArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  maxDuration?: InputMaybe<Scalars['Int']['input']>;
  minDuration?: InputMaybe<Scalars['Int']['input']>;
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySpecialistArgs = {
  id: Scalars['String']['input'];
};


export type QuerySpecialistsArgs = {
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTenantArgs = {
  slug: Scalars['String']['input'];
};

export type Service = {
  __typename?: 'Service';
  active: Scalars['Boolean']['output'];
  bufferMinutes: Scalars['Int']['output'];
  category?: Maybe<Scalars['String']['output']>;
  currency: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  durationMinutes: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  priceCents: Scalars['Int']['output'];
  specialists: Array<SpecialistRef>;
  tenantId: Scalars['String']['output'];
};

export type ServiceObject = {
  __typename?: 'ServiceObject';
  active: Scalars['Boolean']['output'];
  category?: Maybe<Scalars['String']['output']>;
  currency: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  durationMinutes: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  priceCents: Scalars['Int']['output'];
};

export type ServiceRef = {
  __typename?: 'ServiceRef';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Specialist = {
  __typename?: 'Specialist';
  active: Scalars['Boolean']['output'];
  avatar?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role?: Maybe<Scalars['String']['output']>;
  services: Array<ServiceRef>;
  tenantId: Scalars['String']['output'];
};

export type SpecialistRef = {
  __typename?: 'SpecialistRef';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type TenantObject = {
  __typename?: 'TenantObject';
  category: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  profile?: Maybe<BusinessProfileObject>;
  services: Array<ServiceObject>;
  status: Scalars['String']['output'];
  timezone: Scalars['String']['output'];
};

export type UpdateAvailabilityInput = {
  bookingHorizonDays?: InputMaybe<Scalars['Int']['input']>;
  breaks?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  minLeadTimeMinutes?: InputMaybe<Scalars['Int']['input']>;
  slotGranularityMinutes?: InputMaybe<Scalars['Int']['input']>;
  specialistId?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
  weekday?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateMyServiceInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  priceCents?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateMySpecialistInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  avatar?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateServiceInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  bufferMinutes?: InputMaybe<Scalars['Int']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  priceCents?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateSpecialistInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  avatar?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type ViewerObject = {
  __typename?: 'ViewerObject';
  aud: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  sub: Scalars['ID']['output'];
};

export type AppointmentsQueryVariables = Exact<{
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  specialistId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AppointmentStatus>;
}>;


export type AppointmentsQuery = { __typename?: 'Query', appointments: Array<{ __typename?: 'Appointment', id: string, tenantId: string, serviceId: string, specialistId: string, clientName: string, clientContact?: string | null, startAt: string, endAt: string, status: AppointmentStatus, appliedDurationMinutes: number, appliedAmountCents: number, appliedCurrency: string, origin: string, notes?: string | null, cancellationReason?: string | null, service: { __typename?: 'AppointmentService', id: string, name: string }, specialist: { __typename?: 'AppointmentSpecialist', id: string, name: string } }> };

export type AppointmentQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AppointmentQuery = { __typename?: 'Query', appointment?: { __typename?: 'Appointment', id: string, tenantId: string, serviceId: string, specialistId: string, clientName: string, clientContact?: string | null, startAt: string, endAt: string, status: AppointmentStatus, appliedDurationMinutes: number, appliedAmountCents: number, appliedCurrency: string, origin: string, notes?: string | null, cancellationReason?: string | null, service: { __typename?: 'AppointmentService', id: string, name: string }, specialist: { __typename?: 'AppointmentSpecialist', id: string, name: string } } | null };

export type CreateAppointmentMutationVariables = Exact<{
  input: CreateAppointmentInput;
}>;


export type CreateAppointmentMutation = { __typename?: 'Mutation', createAppointment: { __typename?: 'Appointment', id: string, tenantId: string, serviceId: string, specialistId: string, clientName: string, clientContact?: string | null, startAt: string, endAt: string, status: AppointmentStatus, appliedDurationMinutes: number, appliedAmountCents: number, appliedCurrency: string, origin: string, notes?: string | null, cancellationReason?: string | null, service: { __typename?: 'AppointmentService', id: string, name: string }, specialist: { __typename?: 'AppointmentSpecialist', id: string, name: string } } };

export type UpdateAppointmentStatusMutationVariables = Exact<{
  id: Scalars['String']['input'];
  status: AppointmentStatus;
}>;


export type UpdateAppointmentStatusMutation = { __typename?: 'Mutation', updateAppointmentStatus: { __typename?: 'Appointment', id: string, tenantId: string, serviceId: string, specialistId: string, clientName: string, clientContact?: string | null, startAt: string, endAt: string, status: AppointmentStatus, appliedDurationMinutes: number, appliedAmountCents: number, appliedCurrency: string, origin: string, notes?: string | null, cancellationReason?: string | null, service: { __typename?: 'AppointmentService', id: string, name: string }, specialist: { __typename?: 'AppointmentSpecialist', id: string, name: string } } };

export type CancelAppointmentMutationVariables = Exact<{
  id: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type CancelAppointmentMutation = { __typename?: 'Mutation', cancelAppointment: { __typename?: 'Appointment', id: string, tenantId: string, serviceId: string, specialistId: string, clientName: string, clientContact?: string | null, startAt: string, endAt: string, status: AppointmentStatus, appliedDurationMinutes: number, appliedAmountCents: number, appliedCurrency: string, origin: string, notes?: string | null, cancellationReason?: string | null, service: { __typename?: 'AppointmentService', id: string, name: string }, specialist: { __typename?: 'AppointmentSpecialist', id: string, name: string } } };

export type AvailabilityQueryVariables = Exact<{
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
  specialistId?: InputMaybe<Scalars['String']['input']>;
}>;


export type AvailabilityQuery = { __typename?: 'Query', availability: Array<{ __typename?: 'Availability', id: string, tenantId: string, specialistId?: string | null, weekday: number, startTime: string, endTime: string, slotGranularityMinutes: number, minLeadTimeMinutes: number, bookingHorizonDays: number, breaks?: string | null }> };

export type CreateAvailabilityMutationVariables = Exact<{
  input: CreateAvailabilityInput;
}>;


export type CreateAvailabilityMutation = { __typename?: 'Mutation', createAvailability: { __typename?: 'Availability', id: string, tenantId: string, specialistId?: string | null, weekday: number, startTime: string, endTime: string, slotGranularityMinutes: number, minLeadTimeMinutes: number, bookingHorizonDays: number, breaks?: string | null } };

export type UpdateAvailabilityMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: UpdateAvailabilityInput;
}>;


export type UpdateAvailabilityMutation = { __typename?: 'Mutation', updateAvailability: { __typename?: 'Availability', id: string, tenantId: string, specialistId?: string | null, weekday: number, startTime: string, endTime: string, slotGranularityMinutes: number, minLeadTimeMinutes: number, bookingHorizonDays: number, breaks?: string | null } };

export type RemoveAvailabilityMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RemoveAvailabilityMutation = { __typename?: 'Mutation', removeAvailability: boolean };

export type MyServicesQueryVariables = Exact<{
  active?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type MyServicesQuery = { __typename?: 'Query', myServices: Array<{ __typename?: 'MyService', id: string, name: string, description?: string | null, priceCents: number, durationMinutes: number, category?: string | null, active: boolean }> };

export type MyServiceQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type MyServiceQuery = { __typename?: 'Query', myService?: { __typename?: 'MyService', id: string, name: string, description?: string | null, priceCents: number, durationMinutes: number, category?: string | null, active: boolean } | null };

export type CreateMyServiceMutationVariables = Exact<{
  input: CreateMyServiceInput;
}>;


export type CreateMyServiceMutation = { __typename?: 'Mutation', createMyService: { __typename?: 'MyService', id: string, name: string, description?: string | null, priceCents: number, durationMinutes: number, category?: string | null, active: boolean } };

export type UpdateMyServiceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateMyServiceInput;
}>;


export type UpdateMyServiceMutation = { __typename?: 'Mutation', updateMyService: { __typename?: 'MyService', id: string, name: string, description?: string | null, priceCents: number, durationMinutes: number, category?: string | null, active: boolean } };

export type DeleteMyServiceMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteMyServiceMutation = { __typename?: 'Mutation', deleteMyService: boolean };

export type MySpecialistsQueryVariables = Exact<{
  active?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type MySpecialistsQuery = { __typename?: 'Query', mySpecialists: Array<{ __typename?: 'MySpecialist', id: string, name: string, role?: string | null, bio?: string | null, avatar?: string | null, active: boolean }> };

export type MySpecialistQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type MySpecialistQuery = { __typename?: 'Query', mySpecialist?: { __typename?: 'MySpecialist', id: string, name: string, role?: string | null, bio?: string | null, avatar?: string | null, active: boolean } | null };

export type CreateMySpecialistMutationVariables = Exact<{
  input: CreateMySpecialistInput;
}>;


export type CreateMySpecialistMutation = { __typename?: 'Mutation', createMySpecialist: { __typename?: 'MySpecialist', id: string, name: string, role?: string | null, bio?: string | null, avatar?: string | null, active: boolean } };

export type UpdateMySpecialistMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateMySpecialistInput;
}>;


export type UpdateMySpecialistMutation = { __typename?: 'Mutation', updateMySpecialist: { __typename?: 'MySpecialist', id: string, name: string, role?: string | null, bio?: string | null, avatar?: string | null, active: boolean } };

export type DeleteMySpecialistMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteMySpecialistMutation = { __typename?: 'Mutation', deleteMySpecialist: boolean };

export type SpecialistsQueryVariables = Exact<{
  tenantId?: InputMaybe<Scalars['String']['input']>;
  tenantSlug?: InputMaybe<Scalars['String']['input']>;
}>;


export type SpecialistsQuery = { __typename?: 'Query', specialists: Array<{ __typename?: 'Specialist', id: string, tenantId: string, name: string, role?: string | null, avatar?: string | null, bio?: string | null, active: boolean, services: Array<{ __typename?: 'ServiceRef', id: string, name: string }> }> };

export type ServiceSpecialistsQueryVariables = Exact<{
  serviceId: Scalars['String']['input'];
}>;


export type ServiceSpecialistsQuery = { __typename?: 'Query', serviceSpecialists: Array<{ __typename?: 'Specialist', id: string, tenantId: string, name: string, role?: string | null, avatar?: string | null, bio?: string | null, active: boolean, services: Array<{ __typename?: 'ServiceRef', id: string, name: string }> }> };

export type TenantBySlugQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type TenantBySlugQuery = { __typename?: 'Query', tenant?: { __typename?: 'TenantObject', id: string, name: string, category: string, status: string, timezone: string, currency: string, profile?: { __typename?: 'BusinessProfileObject', slug: string, bio?: string | null, address?: string | null, phone?: string | null, instagram?: string | null, whatsapp?: string | null, logo?: string | null, cover?: string | null } | null, services: Array<{ __typename?: 'ServiceObject', id: string, name: string, description?: string | null, durationMinutes: number, priceCents: number, currency: string, category?: string | null, active: boolean }> } | null };

export type TenantsQueryVariables = Exact<{ [key: string]: never; }>;


export type TenantsQuery = { __typename?: 'Query', tenants: Array<{ __typename?: 'TenantObject', id: string, name: string, category: string, status: string, timezone: string, currency: string, profile?: { __typename?: 'BusinessProfileObject', slug: string, bio?: string | null, address?: string | null, phone?: string | null, instagram?: string | null, whatsapp?: string | null, logo?: string | null, cover?: string | null } | null, services: Array<{ __typename?: 'ServiceObject', id: string, name: string, description?: string | null, durationMinutes: number, priceCents: number, currency: string, category?: string | null, active: boolean }> }> };

export type CreateTenantMutationVariables = Exact<{
  input: CreateTenantInput;
}>;


export type CreateTenantMutation = { __typename?: 'Mutation', createTenant: { __typename?: 'TenantObject', id: string, status: string, profile?: { __typename?: 'BusinessProfileObject', slug: string } | null } };


export const AppointmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Appointments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tenantSlug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"specialistId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AppointmentStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appointments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tenantId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}}},{"kind":"Argument","name":{"kind":"Name","value":"tenantSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tenantSlug"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"specialistId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"specialistId"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"specialistId"}},{"kind":"Field","name":{"kind":"Name","value":"clientName"}},{"kind":"Field","name":{"kind":"Name","value":"clientContact"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"appliedDurationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAmountCents"}},{"kind":"Field","name":{"kind":"Name","value":"appliedCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationReason"}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"specialist"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AppointmentsQuery, AppointmentsQueryVariables>;
export const AppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Appointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"appointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"specialistId"}},{"kind":"Field","name":{"kind":"Name","value":"clientName"}},{"kind":"Field","name":{"kind":"Name","value":"clientContact"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"appliedDurationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAmountCents"}},{"kind":"Field","name":{"kind":"Name","value":"appliedCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationReason"}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"specialist"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AppointmentQuery, AppointmentQueryVariables>;
export const CreateAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAppointmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"specialistId"}},{"kind":"Field","name":{"kind":"Name","value":"clientName"}},{"kind":"Field","name":{"kind":"Name","value":"clientContact"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"appliedDurationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAmountCents"}},{"kind":"Field","name":{"kind":"Name","value":"appliedCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationReason"}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"specialist"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAppointmentMutation, CreateAppointmentMutationVariables>;
export const UpdateAppointmentStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAppointmentStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AppointmentStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAppointmentStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"specialistId"}},{"kind":"Field","name":{"kind":"Name","value":"clientName"}},{"kind":"Field","name":{"kind":"Name","value":"clientContact"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"appliedDurationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAmountCents"}},{"kind":"Field","name":{"kind":"Name","value":"appliedCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationReason"}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"specialist"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAppointmentStatusMutation, UpdateAppointmentStatusMutationVariables>;
export const CancelAppointmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelAppointment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelAppointment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"serviceId"}},{"kind":"Field","name":{"kind":"Name","value":"specialistId"}},{"kind":"Field","name":{"kind":"Name","value":"clientName"}},{"kind":"Field","name":{"kind":"Name","value":"clientContact"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"appliedDurationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAmountCents"}},{"kind":"Field","name":{"kind":"Name","value":"appliedCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"cancellationReason"}},{"kind":"Field","name":{"kind":"Name","value":"service"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"specialist"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CancelAppointmentMutation, CancelAppointmentMutationVariables>;
export const AvailabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Availability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tenantSlug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"specialistId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tenantId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}}},{"kind":"Argument","name":{"kind":"Name","value":"tenantSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tenantSlug"}}},{"kind":"Argument","name":{"kind":"Name","value":"specialistId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"specialistId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"specialistId"}},{"kind":"Field","name":{"kind":"Name","value":"weekday"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"slotGranularityMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minLeadTimeMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"bookingHorizonDays"}},{"kind":"Field","name":{"kind":"Name","value":"breaks"}}]}}]}}]} as unknown as DocumentNode<AvailabilityQuery, AvailabilityQueryVariables>;
export const CreateAvailabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAvailability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAvailabilityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAvailability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"specialistId"}},{"kind":"Field","name":{"kind":"Name","value":"weekday"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"slotGranularityMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minLeadTimeMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"bookingHorizonDays"}},{"kind":"Field","name":{"kind":"Name","value":"breaks"}}]}}]}}]} as unknown as DocumentNode<CreateAvailabilityMutation, CreateAvailabilityMutationVariables>;
export const UpdateAvailabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAvailability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAvailabilityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAvailability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"specialistId"}},{"kind":"Field","name":{"kind":"Name","value":"weekday"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"slotGranularityMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"minLeadTimeMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"bookingHorizonDays"}},{"kind":"Field","name":{"kind":"Name","value":"breaks"}}]}}]}}]} as unknown as DocumentNode<UpdateAvailabilityMutation, UpdateAvailabilityMutationVariables>;
export const RemoveAvailabilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveAvailability"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeAvailability"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<RemoveAvailabilityMutation, RemoveAvailabilityMutationVariables>;
export const MyServicesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyServices"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myServices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priceCents"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<MyServicesQuery, MyServicesQueryVariables>;
export const MyServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyService"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myService"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priceCents"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<MyServiceQuery, MyServiceQueryVariables>;
export const CreateMyServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMyService"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateMyServiceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMyService"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priceCents"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<CreateMyServiceMutation, CreateMyServiceMutationVariables>;
export const UpdateMyServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMyService"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMyServiceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMyService"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"priceCents"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<UpdateMyServiceMutation, UpdateMyServiceMutationVariables>;
export const DeleteMyServiceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMyService"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMyService"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteMyServiceMutation, DeleteMyServiceMutationVariables>;
export const MySpecialistsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MySpecialists"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"active"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mySpecialists"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"active"},"value":{"kind":"Variable","name":{"kind":"Name","value":"active"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<MySpecialistsQuery, MySpecialistsQueryVariables>;
export const MySpecialistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MySpecialist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mySpecialist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<MySpecialistQuery, MySpecialistQueryVariables>;
export const CreateMySpecialistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateMySpecialist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateMySpecialistInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMySpecialist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<CreateMySpecialistMutation, CreateMySpecialistMutationVariables>;
export const UpdateMySpecialistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMySpecialist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMySpecialistInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMySpecialist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]} as unknown as DocumentNode<UpdateMySpecialistMutation, UpdateMySpecialistMutationVariables>;
export const DeleteMySpecialistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMySpecialist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMySpecialist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteMySpecialistMutation, DeleteMySpecialistMutationVariables>;
export const SpecialistsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Specialists"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tenantSlug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"specialists"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tenantId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tenantId"}}},{"kind":"Argument","name":{"kind":"Name","value":"tenantSlug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tenantSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"services"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<SpecialistsQuery, SpecialistsQueryVariables>;
export const ServiceSpecialistsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServiceSpecialists"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serviceSpecialists"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"serviceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"serviceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tenantId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"services"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ServiceSpecialistsQuery, ServiceSpecialistsQueryVariables>;
export const TenantBySlugDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TenantBySlug"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tenant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"instagram"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"cover"}}]}},{"kind":"Field","name":{"kind":"Name","value":"services"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"priceCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]}}]} as unknown as DocumentNode<TenantBySlugQuery, TenantBySlugQueryVariables>;
export const TenantsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Tenants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tenants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"instagram"}},{"kind":"Field","name":{"kind":"Name","value":"whatsapp"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"cover"}}]}},{"kind":"Field","name":{"kind":"Name","value":"services"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"priceCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"active"}}]}}]}}]}}]} as unknown as DocumentNode<TenantsQuery, TenantsQueryVariables>;
export const CreateTenantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTenant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTenantInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTenant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"profile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTenantMutation, CreateTenantMutationVariables>;