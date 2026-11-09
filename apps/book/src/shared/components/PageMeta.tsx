import { Helmet } from 'react-helmet-async';

export interface PageMetaProps {
  title: string;
  description?: string;
}

const SUFFIX = 'Foundly Book';

/** Per-route document title/description for the SPA (feature 024). */
export function PageMeta({ title, description }: PageMetaProps) {
  const fullTitle = title.includes(SUFFIX) ? title : `${title} — ${SUFFIX}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
    </Helmet>
  );
}
