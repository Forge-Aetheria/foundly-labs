import type { Metadata } from 'next';
import { ProductLanding } from './components/ProductLanding';
import {
  BOOK_BENEFITS,
  BOOK_CTA,
  BOOK_DEMO,
  BOOK_FINAL_CTA,
  BOOK_HERO,
  BOOK_HERO_CAPTURE,
  BOOK_INDUSTRIES,
  BOOK_PRICING,
  BOOK_SPOTLIGHT,
  BOOK_STEPS,
} from './book-product';

export const metadata: Metadata = {
  title: 'Foundly Book',
  description: BOOK_HERO.subtitle,
};

/** Product page (public `/book`): module capabilities + register CTA (FR-001/FR-002). */
export default function HomePage() {
  return (
    <ProductLanding
      hero={BOOK_HERO}
      heroCapture={BOOK_HERO_CAPTURE}
      cta={BOOK_CTA}
      demo={BOOK_DEMO}
      spotlight={BOOK_SPOTLIGHT}
      steps={BOOK_STEPS}
      benefits={BOOK_BENEFITS}
      industries={BOOK_INDUSTRIES}
      pricing={BOOK_PRICING}
      finalCta={BOOK_FINAL_CTA}
    />
  );
}