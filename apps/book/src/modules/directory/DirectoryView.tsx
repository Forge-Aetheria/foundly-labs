'use client';

import { useMemo, useState } from 'react';
import { Container, Stack, Typography } from '@foundly/ui';
import { BusinessCardGrid } from './components/BusinessCardGrid';
import { DirectoryError, DirectorySkeleton } from './components/DirectoryStates';
import { ALL_CATEGORIES, DirectoryFilters } from './components/DirectoryFilters';
import { TENANT_CATEGORIES, TENANT_CATEGORY_LABELS } from '@foundly/database/categories';
import type { DirectoryBusiness } from './utils/types';

export interface DirectoryViewProps {
  query: string;
  businesses: DirectoryBusiness[];
  error: boolean;
  /** Shows the skeleton grid (used by the Suspense boundary while the read resolves). */
  loading?: boolean;
}

function matchesTerm(business: DirectoryBusiness, term: string): boolean {
  if (!term) {
    return true;
  }
  const haystack = [
    business.name,
    business.category,
    business.address ?? '',
    business.description ?? '',
    ...business.tags,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(term);
}

/** Public directory view (client): instant text/category filtering over the loaded businesses. */
export function DirectoryView({ query, businesses, error, loading = false }: DirectoryViewProps) {
  const [term, setTerm] = useState(query);
  const [category, setCategory] = useState(ALL_CATEGORIES);

  const normalizedTerm = term.trim().toLowerCase();

  const categories = useMemo(() => {
    const present = new Set(businesses.map((business) => business.category.trim()));
    return TENANT_CATEGORIES.map((category) => TENANT_CATEGORY_LABELS[category]).filter((label) =>
      present.has(label),
    );
  }, [businesses]);

  const filtered = useMemo(
    () =>
      businesses.filter(
        (business) =>
          (category === ALL_CATEGORIES || business.category === category) &&
          matchesTerm(business, normalizedTerm),
      ),
    [businesses, category, normalizedTerm],
  );

  const hasFilters = normalizedTerm.length > 0 || category !== ALL_CATEGORIES;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3.5}>
        <Stack spacing={1} sx={{ maxWidth: 680 }}>
          <Typography variant="h3" component="h1">
            Negocios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Descubre negocios, compara servicios y reserva tu cita en segundos.
          </Typography>
        </Stack>

        <DirectoryFilters
          term={term}
          onTermChange={setTerm}
          categories={categories}
          selectedCategory={category}
          onSelectCategory={setCategory}
          resultCount={filtered.length}
        />

        {error ? (
          <DirectoryError />
        ) : loading ? (
          <DirectorySkeleton />
        ) : (
          <BusinessCardGrid
            businesses={filtered}
            query={term}
            hasFilters={hasFilters}
            onClearFilters={() => {
              setTerm('');
              setCategory(ALL_CATEGORIES);
            }}
          />
        )}
      </Stack>
    </Container>
  );
}
