'use client';

import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import MuiTextField from '@mui/material/TextField';
import { Card, Chip, Stack, Typography } from '@foundly/ui';

export const ALL_CATEGORIES = 'Todos';

export interface DirectoryFiltersProps {
  term: string;
  onTermChange: (term: string) => void;
  categories: readonly string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  resultCount: number;
}

/**
 * Directory filter bar: an integrated search field plus category pills restricted to the master
 * categories present in the loaded businesses. Filtering happens on the client, so every
 * keystroke and pill selection updates the grid immediately.
 */
export function DirectoryFilters({
  term,
  onTermChange,
  categories,
  selectedCategory,
  onSelectCategory,
  resultCount,
}: DirectoryFiltersProps) {
  return (
    <Card elevated sx={{ bgcolor: '#ffffff' }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <MuiTextField
            placeholder="Nombre, categoría, etiqueta o ciudad"
            value={term}
            onChange={(event) => onTermChange(event.target.value)}
            fullWidth
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar negocios' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '9999px',
                  backgroundColor: 'background.paper',
                },
              },
            }}
            sx={{ maxWidth: { md: 460 } }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {resultCount} {resultCount === 1 ? 'negocio' : 'negocios'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Chip
            label={ALL_CATEGORIES}
            selectable
            selected={selectedCategory === ALL_CATEGORIES}
            onClick={() => onSelectCategory(ALL_CATEGORIES)}
          />
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              selectable
              selected={selectedCategory === category}
              onClick={() => onSelectCategory(category)}
            />
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
