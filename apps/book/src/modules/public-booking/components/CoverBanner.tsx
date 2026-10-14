import Box from '@mui/material/Box';

export interface CoverBannerProps {
  cover: string | null;
  name: string;
}

/** Full-width hero banner for the business cover, below the header and above the profile. */
export function CoverBanner({ cover, name }: CoverBannerProps) {
  if (!cover) {
    return null;
  }
  return (
    <Box
      component="img"
      src={cover}
      alt={`Portada de ${name}`}
      sx={{
        display: 'block',
        width: '100%',
        height: { xs: 200, md: 360 },
        objectFit: 'cover',
      }}
    />
  );
}
