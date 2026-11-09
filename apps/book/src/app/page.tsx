import { LandingView } from '../modules/landing/LandingView';
import { PageMeta } from '../shared/components/PageMeta';
import {
  BOOK_BENEFITS,
  BOOK_CTA,
  BOOK_FINAL_CTA,
  BOOK_HERO,
  BOOK_HERO_CAPTURE,
  BOOK_INDUSTRIES,
  BOOK_PRICING,
  BOOK_SPOTLIGHT,
  BOOK_STEPS,
} from '../modules/landing/book-product';

/** Product page (public `/book`): thin route that renders the landing view. */
export default function HomePage() {
  return (
    <>
      <PageMeta title="Foundly Book" description={BOOK_HERO.subtitle} />
      <LandingView
        hero={BOOK_HERO}
        heroCapture={BOOK_HERO_CAPTURE}
        cta={BOOK_CTA}
        spotlight={BOOK_SPOTLIGHT}
        steps={BOOK_STEPS}
        benefits={BOOK_BENEFITS}
        industries={BOOK_INDUSTRIES}
        pricing={BOOK_PRICING}
        finalCta={BOOK_FINAL_CTA}
      />
    </>
  );
}
