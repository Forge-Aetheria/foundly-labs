/** Super Admin console (feature 020) view-model types — plain, serializable shapes. */

export type PlanValue = 'FREE' | 'PRO';
export type StatusValue = 'active' | 'past_due' | 'expired' | 'canceled';

/** Global platform metrics rendered on the dashboard. */
export interface PlatformMetricsView {
  businessesTotal: number;
  businessesActive: number;
  usersTotal: number | null;
  usersActive: number | null;
  usersAvailable: boolean;
  plansFree: number;
  plansPro: number;
  proConversion: number;
}

/** A business row in the management table. */
export interface ManagedBusinessView {
  tenantId: string;
  slug: string;
  name: string;
  plan: PlanValue;
  status: StatusValue;
  expiresAt: string | null;
}

/** Partial override payload built by the dialog (only changed fields are present). */
export interface OverrideInput {
  tenantId: string;
  plan?: PlanValue;
  status?: StatusValue;
  /** ISO-8601 to set, or `null` to clear. Omitted means "leave unchanged". */
  expiresAt?: string | null;
}
