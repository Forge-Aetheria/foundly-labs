'use client';

import { Card, Container, Typography } from '@foundly/ui';

export interface UnavailablePanelProps {
  title?: string;
  message: string;
}

/** Public "not available" state for unknown/draft/suspended/disabled tenants (FR-017). */
export function UnavailablePanel({ title = 'No disponible', message }: UnavailablePanelProps) {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card
        header={
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
        }
      >
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Card>
    </Container>
  );
}
