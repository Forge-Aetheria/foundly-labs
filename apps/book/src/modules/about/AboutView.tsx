'use client';

import Image from 'next/image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Card } from '@foundly/ui';
import {
  ABOUT_DESCRIPTION,
  ABOUT_LEGAL_LINKS,
  ABOUT_TAGLINE,
  BOOK_APP_VERSION,
} from './about-content';

/** About Foundly page: branding, version, description and legal links. */
export function AboutView() {
  return (
    <Stack spacing={3}>
      <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center', py: 2 }}>
        <Image src="/branding-logo.png" alt="Foundly Book" width={168} height={126} priority />
        <Typography variant="h4" component="h1">
          Foundly
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {ABOUT_TAGLINE}
        </Typography>
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            backgroundColor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Foundly Book v{BOOK_APP_VERSION}
          </Typography>
        </Box>
      </Stack>

      <Card
        header={
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Sobre el producto
          </Typography>
        }
      >
        <Typography variant="body2" color="text.secondary">
          {ABOUT_DESCRIPTION}
        </Typography>
      </Card>

      <Card
        header={
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Enlaces
          </Typography>
        }
      >
        <Stack spacing={2}>
          {ABOUT_LEGAL_LINKS.map((link) => (
            <Box key={link.id}>
              <Typography sx={{ fontWeight: 600 }}>{link.label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {link.description}
              </Typography>
              <Button href={link.href} target="_blank" rel="noopener noreferrer" variant="outlined">
                Abrir enlace
              </Button>
            </Box>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
