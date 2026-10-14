/** Directory (feature 019) view-model types — codegen-independent UI shapes. */

/** One weekday opening range shown on a business card. */
export interface DirectoryHoursRange {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /** `HH:mm`. */
  startTime: string;
  /** `HH:mm`. */
  endTime: string;
}

/** A business as rendered in the public directory. */
export interface DirectoryBusiness {
  tenantId: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  logo: string | null;
  cover: string | null;
  hours: DirectoryHoursRange[];
}

/** Search state resolved from the URL. */
export interface DirectorySearchParams {
  q: string;
}

/** View state machine for the directory. */
export type DirectoryState = 'loading' | 'ready' | 'empty' | 'noResults' | 'error';
