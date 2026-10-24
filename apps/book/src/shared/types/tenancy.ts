/**
 * Domain types for the Foundly Book tenancy layer.
 * Pure TypeScript — no persistence technology is defined or implied here.
 */

import type { AvailabilityRule, Resource, Service } from './appointments';

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
  isPublic: boolean;
  license: TenantLicense | null;
  /** Portal profile (003): identity, about and contact. */
  avatar: string | null;
  cover: string | null;
  bio: string | null;
  address: string | null;
  phone: string | null;
  social: { instagram?: string; whatsapp?: string } | null;
  /** Photo gallery (annotated photos) shown on the provider landing (006). */
  gallery?: GalleryPhoto[];
  /** Reservation/cancellation policies shown on the public profile (014). */
  policies?: PortalPolicy[];
  createdAt: string;
  updatedAt: string;
}

/** Closed set of gallery photo categories (admin tag + public badge). */
export const GALLERY_CATEGORIES = ['local', 'trabajos', 'equipo'] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

/** Display labels for gallery categories (public + admin surfaces). */
export const GALLERY_CATEGORY_LABELS: Record<GalleryCategory, string> = {
  local: 'Local',
  trabajos: 'Trabajos',
  equipo: 'Equipo',
};

/** A free-form booking/cancellation policy shown on the public portal. */
export interface PortalPolicy {
  id: string;
  tenantId: string;
  title: string;
  body: string;
}

/** Moderation state of a review (feature 015/016). */
export type ReviewState = 'pending' | 'approved' | 'rejected';

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
  /** Moderation state (feature 015): only `approved` are public. */
  state: ReviewState;
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

/** A photo in the business gallery catalog, with optional metadata (006). */
export interface GalleryPhoto {
  id: string;
  /** Absolute http(s) image URL. */
  url: string;
  /** Short optional title shown on the card/caption. */
  title?: string;
  /** Short optional description. */
  description?: string;
  /** Optional tag: local | trabajos | equipo. */
  category?: GalleryCategory;
}

/** Defaults produced by the pure provisioning module (research R7). */
export interface ProvisionedDefaults {
  resource: Resource;
  rules: AvailabilityRule[];
  service: Service;
}
