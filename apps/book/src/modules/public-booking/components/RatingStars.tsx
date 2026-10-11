'use client';

import StarIcon from '@mui/icons-material/Star';
import { Stack } from '@foundly/ui';
import { formatRating } from '../../../shared/utils/format';

/** Read-only five-star rating rendered with the primary accent (tokens). */
export function RatingStars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <Stack
      direction="row"
      spacing={0.5}
      role="img"
      aria-label={`${formatRating(value)} de 5 estrellas`}
      sx={{ alignItems: 'center' }}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <StarIcon
          key={index}
          aria-hidden="true"
          sx={{ fontSize: 18, color: index <= filled ? 'primary.main' : 'border.lavender' }}
        />
      ))}
    </Stack>
  );
}
