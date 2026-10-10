import type { BusinessHours } from '../../domain/tenancy/types';

/** Public-facing service card data (current rate resolved server-side). */
export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  /** Catalog category used to group services on the provider landing. */
  category?: string;
}

/** A specialist shown on the portal (an active resource of the tenant). */
export interface PublicSpecialist {
  id: string;
  name: string;
  role: string | null;
  avatar: string | null;
  bio: string | null;
}

export interface PublicSocial {
  instagram?: string;
  whatsapp?: string;
}

export interface PublicPolicyView {
  title: string;
  body: string;
}

/** A client review rendered on the reviews section (mock content). */
export interface PublicReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

/** Complete read surface of the public provider landing (contracts/portal-profile.contract.md). */
export interface PublicBusinessProfile {
  slug: string;
  name: string;
  category: string;
  avatar: string | null;
  cover: string | null;
  bio: string | null;
  address: string | null;
  phone: string | null;
  social: PublicSocial | null;
  timezone: string;
  services: PublicService[];
  specialists: PublicSpecialist[];
  weeklyHours: BusinessHours[];
  policies: PublicPolicyView[];
  /** Provider-landing extras (003/river landing): rating, gallery and reviews. */
  gallery?: string[];
  rating?: number | null;
  reviewCount?: number;
  reviews?: PublicReview[];
}