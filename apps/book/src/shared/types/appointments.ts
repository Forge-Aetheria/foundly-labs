/**
 * Domain types for the Foundly Book admin panel.
 * Pure TypeScript — no persistence technology is defined or implied here.
 */

import type { AdvanceKind, AdvancePayment } from './payments';

export type AppointmentStatus =
  'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';

export type ResourceType = 'professional' | 'room' | 'asset';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  active: boolean;
  timezone: string;
  /** The tenant (business) that owns this resource. */
  tenantId: string;
  /** Specialist metadata shown on the public portal (role, avatar, bio). */
  role: string | null;
  avatar: string | null;
  bio: string | null;
  /** Catalog services this professional performs (admin multi-select, public badges). */
  serviceIds?: string[];
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  category: string | null;
  active: boolean;
  /** The tenant (business) that owns this service. */
  tenantId: string;
  /** Whether the service requires an advance before confirming (feature 017). */
  requiresAdvance: boolean;
  /** How the advance is expressed when required. */
  advanceKind: AdvanceKind | null;
  /** Cents when `advanceKind` is `fixed`; 1–100 when `percent`. */
  advanceValue: number | null;
}

export interface Rate {
  id: string;
  serviceId: string;
  amountCents: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface AvailabilityRule {
  id: string;
  resourceId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotGranularityMinutes: number;
  minLeadTimeMinutes: number;
  bookingHorizonDays: number;
}

export interface TimeBlock {
  id: string;
  resourceId: string;
  startAt: string;
  endAt: string;
  kind: 'break' | 'block';
  recurrence: 'none' | 'daily' | 'weekly';
  recurrenceUntil: string | null;
  reason: string | null;
}

export interface Appointment {
  id: string;
  resourceId: string;
  serviceId: string;
  clientName: string;
  clientContact: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  notes: string | null;
  appliedDurationMinutes: number;
  appliedAmountCents: number;
  appliedCurrency: string;
  origin: 'admin' | 'online';
  cancellationReason: string | null;
  /** Advance payment submitted with the booking, when the service required one (017). */
  payment: AdvancePayment | null;
  /** Recorded client notifications (simulated) for status changes/reschedules (017). */
  notifications: AppointmentNotification[];
  createdAt: string;
  updatedAt: string;
}

/** A recorded, simulated message for the client produced by a status change or reschedule (017). */
export interface AppointmentNotification {
  id: string;
  kind: string;
  message: string;
  channel: string;
  createdAt: string;
}

export interface AppointmentAuditEntry {
  id: string;
  appointmentId: string;
  action: 'created' | 'rescheduled' | 'cancelled' | 'status-changed' | 'updated';
  fromValue: string | null;
  toValue: string | null;
  reason: string | null;
  actorId: string;
  createdAt: string;
}
