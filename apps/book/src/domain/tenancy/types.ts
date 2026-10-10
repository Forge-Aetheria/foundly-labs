/**
 * Domain types for the Foundly Book tenancy layer.
 * Pure TypeScript — no persistence technology is defined or implied here.
 */

import type { AvailabilityRule, Resource, Service } from '../appointments/types';

export type TenantStatus = 'draft' | 'active' | 'suspended';

export type UserRole = 'owner' | 'professional';

/** General opening schedule for a tenant (one entry per weekday, 0 = Sunday). */
export interface BusinessHours {
  weekday: number;
  isOpen: boolean;
  /** `HH:mm`; required when `isOpen` is true. */
  startTime: string;
  /** `HH:mm`; required when `isOpen` is true and strictly after `startTime`. */
  endTime: string;
}

/** Foundly Pass license reference (future integration). */
export interface TenantLicense {
  module: 'book';
  status: 'active' | 'inactive' | 'trialing';
  validUntil: string | null;
}

/** A registered business that owns an agenda and a public booking portal. */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: TenantStatus;
  ownerUserId: string;
  defaultAppointmentDurationMinutes: number;
  businessHours: BusinessHours[];
  currency: string;
  timezone: string;
  onlineBookingEnabled: boolean;
  license: TenantLicense | null;
  /** Portal profile (003): identity, about and contact. */
  avatar: string | null;
  cover: string | null;
  bio: string | null;
  address: string | null;
  phone: string | null;
  social: { instagram?: string; whatsapp?: string } | null;
  /** Photo gallery (Unsplash URLs) shown on the provider landing. */
  gallery?: string[];
  createdAt: string;
  updatedAt: string;
}

/** A free-form booking/cancellation policy shown on the public portal. */
export interface PortalPolicy {
  id: string;
  tenantId: string;
  title: string;
  body: string;
}

/** A client review of the business shown on the provider landing (mock content). */
export interface Review {
  id: string;
  tenantId: string;
  author: string;
  /** 1–5 star rating. */
  rating: number;
  comment: string;
  /** ISO-8601 date of the review. */
  date: string;
}

/** An account able to sign in and administer a business. */
export interface User {
  id: string;
  fullName: string;
  email: string;
  credential: string;
  role: UserRole;
  tenantId: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

/** Local-first wizard draft persisted on the client. */
export interface BookingDraft {
  draftId: string;
  step: number;
  account: { fullName: string; email: string; password: string } | null;
  business: { name: string; slug: string; category: string } | null;
  setup: { defaultAppointmentDurationMinutes: number; businessHours: BusinessHours[] } | null;
}

/** Idempotency record: a draftId that already provisioned a business. */
export interface OnboardingProvision {
  draftId: string;
  tenantId: string;
  userId: string;
}

/** Defaults produced by the pure provisioning module (research R7). */
export interface ProvisionedDefaults {
  resource: Resource;
  rules: AvailabilityRule[];
  service: Service;
}